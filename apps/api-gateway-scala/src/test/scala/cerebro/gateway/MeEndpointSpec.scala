package cerebro.gateway

import cats.effect.IO
import com.dimafeng.testcontainers.PostgreSQLContainer
import com.dimafeng.testcontainers.munit.TestContainerForAll
import io.circe.Json
import io.circe.parser.parse
import org.http4s.*
import org.http4s.implicits.*
import org.typelevel.ci.CIString
import pdi.jwt.{JwtAlgorithm, JwtCirce, JwtClaim}
import java.sql.{DriverManager, Statement}
import java.time.Instant
import java.util.UUID

/** E2E do GET /api/v1/auth/me (ADR-067): minta um JWT de médico, roda o request
  * IN-PROCESS contra as rotas http4s (sem Ember) e valida shape + auth. Prova a
  * fatia 1 ponta-a-ponta (JWT → resolução → Doobie → contrato), além do gate de
  * RLS que o TenantIsolationSpec já cobre no nível DB.
  *
  * /me NÃO precisa de GUC de tenant: lê medicos/usuarios/assinaturas, que estão
  * FORA da RLS (0037 exclui as tabelas que definem tenant + auth/cobrança), e
  * self-scopa por usuario_id — igual ao gateway .NET.
  */
class MeEndpointSpec extends munit.CatsEffectSuite with TestContainerForAll:

  override val containerDef: PostgreSQLContainer.Def = PgTestSetup.containerDef

  private val jwtSecret = "test-secret-me-e2e-0123456789-abcdefghij"
  private val jwtCfg    = JwtConfig(jwtSecret, "cerebro-amigo", Set("dashboard", "portal-paciente"))

  // médico com plano "pro" + assinatura ativa
  private val usuarioPro = UUID.randomUUID()
  private val medicoPro  = UUID.randomUUID()
  // usuário SEM registro em medicos → /me deve dar 403
  private val usuarioOrfao = UUID.randomUUID()

  override def afterContainersStart(pg: PostgreSQLContainer): Unit =
    val conn = DriverManager.getConnection(pg.jdbcUrl, pg.username, pg.password)
    try
      val st = conn.createStatement()
      PgTestSetup.stubRoles(st)
      PgTestSetup.applyMigrations(st)
      seed(st)
      PgTestSetup.createGatewayRole(st)
    finally conn.close()

  private def seed(st: Statement): Unit =
    st.execute(s"""
      INSERT INTO usuarios (id, email, senha_hash, nome, role) VALUES
        ('$usuarioPro','pro@example.com','x','Dra Pro','medico'),
        ('$usuarioOrfao','orfao@example.com','x','Sem Medico','medico');
      INSERT INTO medicos (id, usuario_id, nome, crm, especialidade) VALUES
        ('$medicoPro','$usuarioPro','Dra Pro','CRM-PRO','Psiquiatria');
      INSERT INTO assinaturas (medico_id, plano, status) VALUES
        ('$medicoPro','pro','ativa');
    """)

  // App http4s só com a rota /me — request roda in-process (sem servidor Ember).
  private def appFor(pg: PostgreSQLContainer): cats.effect.Resource[IO, HttpApp[IO]] =
    Database
      .transactor(DbConfig(pg.jdbcUrl, "gw_test", PgTestSetup.gwPassword))
      .map(xa => MeEndpoint.routes(JwtAuth(jwtCfg), MeService(xa)).orNotFound)

  private def mintToken(usuarioId: UUID, role: String = "medico"): String =
    val now = Instant.now().getEpochSecond
    val claim = JwtClaim(
      content = s"""{"role":"$role"}""",
      issuer = Some("cerebro-amigo"),
      subject = Some(usuarioId.toString),
      audience = Some(Set("dashboard")),
      expiration = Some(now + 3600),
      issuedAt = Some(now),
    )
    JwtCirce.encode(claim, jwtSecret, JwtAlgorithm.HS256)

  private def call(app: HttpApp[IO], token: Option[String]): IO[(Status, Json)] =
    val headers = token.fold(Headers.empty)(t => Headers(Header.Raw(CIString("Authorization"), s"Bearer $t")))
    val req     = Request[IO](Method.GET, uri"/api/v1/auth/me", headers = headers)
    app.run(req).flatMap(r => r.as[String].map(b => (r.status, parse(b).getOrElse(Json.Null))))

  test("GET /me com JWT de médico → 200 + contrato fiel") {
    withContainers { pg =>
      appFor(pg).use { app =>
        call(app, Some(mintToken(usuarioPro))).map { (status, json) =>
          assertEquals(status, Status.Ok)
          val c = json.hcursor
          assertEquals(c.get[String]("nome").toOption, Some("Dra Pro"))
          assertEquals(c.get[String]("role").toOption, Some("medico"))
          assertEquals(c.get[String]("especialidade").toOption, Some("Psiquiatria"))
          assertEquals(c.get[String]("plano").toOption, Some("pro"))
          assertEquals(c.get[String]("assinaturaStatus").toOption, Some("ativa"))
          assertEquals(c.get[Boolean]("liberado").toOption, Some(true))   // status ativa → liberado
          assertEquals(c.get[Boolean]("bloqueado").toOption, Some(false))
          assertEquals(c.get[Boolean]("readOnly").toOption, Some(false))
          assertEquals(c.get[String]("motivo").toOption, Some("ativa"))
          // Pro = briefing + insights + rag (sem escriba)
          assertEquals(
            c.get[List[String]]("features").toOption.map(_.toSet),
            Some(Set("briefing_ia", "ia_insights", "rag")),
          )
          // medicoId é o UUID do médico (não o usuario_id)
          assertEquals(c.get[String]("medicoId").toOption, Some(medicoPro.toString))
          assertEquals(c.get[String]("usuarioId").toOption, Some(usuarioPro.toString))
          assert(json.hcursor.downField("fotoUrl").as[Option[String]].toOption.flatten.isEmpty) // TODO S3
        }
      }
    }
  }

  test("GET /me sem token → 4xx (não autenticado)") {
    withContainers { pg =>
      appFor(pg).use { app =>
        call(app, None).map((status, _) => assertEquals(status.responseClass, Status.ClientError))
      }
    }
  }

  test("GET /me com token inválido → 401") {
    withContainers { pg =>
      appFor(pg).use { app =>
        call(app, Some("nonsense.token.xxx")).map((status, _) => assertEquals(status, Status.Unauthorized))
      }
    }
  }

  test("GET /me de usuário sem médico → 403") {
    withContainers { pg =>
      appFor(pg).use { app =>
        call(app, Some(mintToken(usuarioOrfao))).map((status, _) => assertEquals(status, Status.Forbidden))
      }
    }
  }
