package cerebro.gateway

/** Config por env, alinhada ao gateway .NET (ADR-067).
  *
  * Banco: o serviço Scala precisa de URL **JDBC**. Prioridade: `POSTGRES_JDBC_URL`
  * (+ `POSTGRES_USER`/`POSTGRES_PASSWORD`); na falta, converte o `POSTGRES_DSN`
  * (formato Npgsql key-value) — **best-effort**: o parser não trata `;`/`=` dentro de
  * valores (ex.: senha com special chars) nem aspas do Npgsql (review #4).
  * **Em PROD prefira `POSTGRES_JDBC_URL`** (à prova de qualquer senha).
  *
  * TLS: com a CA do RDS no container (`RDS_CA_PATH`, setada no Dockerfile), host RDS
  * usa `verify-full` (valida CA+hostname, paridade com o `RdsCa` do .NET — review #1);
  * sem a CA, cai p/ `require` (cifra, sem verificar CA).
  *
  * JWT: MESMO `JWT_SECRET`, issuer e audiences do gateway .NET — tokens emitidos
  * pelo fluxo atual valem nos dois gateways durante a coexistência.
  */
final case class DbConfig(jdbcUrl: String, user: String, password: String)

final case class JwtConfig(secret: String, issuer: String, audiences: Set[String])

final case class AppConfig(db: DbConfig, jwt: JwtConfig, port: Int)

object Config:
  def load(env: Map[String, String]): Either[String, AppConfig] =
    for
      db   <- loadDb(env)
      jwt  <- loadJwt(env)
      port  = env.get("PORT").flatMap(_.toIntOption).getOrElse(5001) // :5050→:5000 é o .NET; Scala em :5001 no dev
    yield AppConfig(db, jwt, port)

  private def loadJwt(env: Map[String, String]): Either[String, JwtConfig] =
    env.get("JWT_SECRET").orElse(env.get("Jwt__Secret")).filter(_.nonEmpty)
      .toRight("JWT_SECRET obrigatório")
      .map { secret =>
        val issuer = env.getOrElse("Jwt__Issuer", env.getOrElse("JWT_ISSUER", "cerebro-amigo"))
        // mesmas audiences do Program.cs do .NET
        val auds = env.get("JWT_AUDIENCES").map(_.split(",").map(_.trim).filter(_.nonEmpty).toSet)
          .getOrElse(Set("dashboard", "portal-paciente"))
        JwtConfig(secret, issuer, auds)
      }

  private def loadDb(env: Map[String, String]): Either[String, DbConfig] =
    env.get("POSTGRES_JDBC_URL").filter(_.nonEmpty) match
      case Some(url) =>
        Right(DbConfig(url, env.getOrElse("POSTGRES_USER", ""), env.getOrElse("POSTGRES_PASSWORD", "")))
      case None =>
        env.get("POSTGRES_DSN").orElse(env.get("ConnectionStrings__Postgres")).filter(_.nonEmpty)
          .toRight("Defina POSTGRES_JDBC_URL (+ POSTGRES_USER/PASSWORD) ou POSTGRES_DSN.")
          .flatMap(dsn => fromNpgsql(dsn, env.get("RDS_CA_PATH")))

  /** Converte um DSN Npgsql (key-value) em DbConfig JDBC. Best-effort (review #4): não
    * trata `;`/`=` dentro de valores — em PROD prefira POSTGRES_JDBC_URL. `caPath`
    * (RDS_CA_PATH) habilita verify-full em host RDS (review #1).
    */
  private[gateway] def fromNpgsql(dsn: String, caPath: Option[String] = None): Either[String, DbConfig] =
    val kv = dsn.split(';').toList.flatMap { part =>
      part.split("=", 2) match
        case Array(k, v) => Some(k.trim.toLowerCase -> v.trim)
        case _           => None
    }.toMap
    def get(keys: String*): Option[String] = keys.iterator.flatMap(kv.get).find(_.nonEmpty)
    for
      host <- get("host", "server", "data source").toRight("DSN sem host")
      db   <- get("database", "initial catalog").toRight("DSN sem database")
    yield
      val port = get("port").getOrElse("5432")
      val user = get("username", "user id", "uid").getOrElse("")
      val pass = get("password", "pwd").getOrElse("")
      // Mapeia o "SSL Mode" do Npgsql p/ o sslmode do JDBC preservando modos OPCIONAIS
      // (prefer/allow) — forçar require quebrava DSN dev sem TLS (review #8). Com a CA do
      // RDS presente (RDS_CA_PATH), host RDS e modos verify-* viram verify-full (valida
      // CA+hostname = paridade com .NET RdsCa, review #1); sem a CA, caem p/ require.
      // RDS sem sslmode → SSL obrigatório (rds.force_ssl=1).
      val ca = caPath.filter(_.nonEmpty)
      val verifyOrRequire = ca.map(p => s"?sslmode=verify-full&sslrootcert=$p").getOrElse("?sslmode=require")
      val sslParam = get("ssl mode", "sslmode").map(_.toLowerCase.replace(" ", "")) match
        case Some("disable")                       => "?sslmode=disable"
        case Some("allow")                         => "?sslmode=allow"
        case Some("prefer")                        => "?sslmode=prefer"
        case Some("require")                       => "?sslmode=require"
        case Some("verifyca") | Some("verifyfull") => verifyOrRequire
        case Some(_)                               => "?sslmode=require"
        case None if host.contains("rds.amazonaws.com") => verifyOrRequire
        case None                                  => ""
      DbConfig(s"jdbc:postgresql://$host:$port/$db$sslParam", user, pass)
