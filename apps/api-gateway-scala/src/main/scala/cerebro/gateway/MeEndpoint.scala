package cerebro.gateway

import cats.effect.IO
import org.http4s.HttpRoutes
import sttp.model.StatusCode
import sttp.tapir.*
import sttp.tapir.generic.auto.*
import sttp.tapir.json.circe.*
import sttp.tapir.server.http4s.Http4sServerInterpreter

/** GET /api/v1/auth/me — endpoint tipado (Tapir). Primeira fatia strangler (ADR-067).
  * Segurança em duas camadas: `serverSecurityLogic` valida o JWT → MedicoPrincipal;
  * `serverLogic` resolve o perfil. Erro vira status HTTP (401/403) como no .NET.
  */
object MeEndpoint:

  private val base: Endpoint[String, Unit, StatusCode, MeResponse, Any] =
    endpoint.get
      .in("api" / "v1" / "auth" / "me")
      .securityIn(auth.bearer[String]())
      .errorOut(statusCode)
      .out(jsonBody[MeResponse])
      .summary("Perfil do médico logado (health-check de sessão)")

  def routes(auth: JwtAuth, svc: MeService): HttpRoutes[IO] =
    val server =
      base
        .serverSecurityLogic[MedicoPrincipal, IO] { token =>
          IO.pure(auth.validate(token).left.map(_ => StatusCode.Unauthorized))
        }
        .serverLogic { principal => _ =>
          svc.me(principal).map(_.left.map {
            case ApiError.Forbidden    => StatusCode.Forbidden
            case ApiError.Unauthorized => StatusCode.Unauthorized
          })
        }
    Http4sServerInterpreter[IO]().toRoutes(server)
