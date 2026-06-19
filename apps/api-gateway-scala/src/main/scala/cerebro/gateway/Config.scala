package cerebro.gateway

/** Config por env, alinhada ao gateway .NET (ADR-067).
  *
  * Banco: o serviço Scala precisa de URL **JDBC**, mas o `POSTGRES_DSN` do .NET é
  * formato Npgsql (key-value). Prioridade: `POSTGRES_JDBC_URL`/`POSTGRES_USER`/
  * `POSTGRES_PASSWORD` explícitos; na falta, converte o `POSTGRES_DSN`.
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
          .flatMap(fromNpgsql)

  /** Converte um DSN Npgsql (key-value) em DbConfig JDBC. Tolerante a chaves comuns. */
  private[gateway] def fromNpgsql(dsn: String): Either[String, DbConfig] =
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
      // (prefer/allow) — forçar require quebrava DSN dev sem TLS (review #8). verify-ca/
      // verify-full caem p/ require até a CA do RDS entrar no truststore (review #1).
      // RDS sem sslmode → require (rds.force_ssl=1).
      val sslParam = get("ssl mode", "sslmode").map(_.toLowerCase.replace(" ", "")) match
        case Some("disable")                       => "?sslmode=disable"
        case Some("allow")                         => "?sslmode=allow"
        case Some("prefer")                        => "?sslmode=prefer"
        case Some("verifyca") | Some("verifyfull") => "?sslmode=require" // TODO #1: verify-full c/ sslrootcert
        case Some(_)                               => "?sslmode=require"
        case None if host.contains("rds.amazonaws.com") => "?sslmode=require"
        case None                                  => ""
      DbConfig(s"jdbc:postgresql://$host:$port/$db$sslParam", user, pass)
