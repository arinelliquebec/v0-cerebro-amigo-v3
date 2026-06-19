package cerebro.gateway

import cats.effect.{ExitCode, IO, IOApp}
import cats.syntax.all.*
import com.comcast.ip4s.*
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.implicits.*

/** Entry point do api-gateway-scala (ADR-067). Sobe ao lado do gateway .NET;
  * o BFF só aponta pra cá por endpoint, após paridade + testes verdes.
  */
object Server extends IOApp:

  def run(args: List[String]): IO[ExitCode] =
    Config.load(sys.env) match
      case Left(err) =>
        IO.println(s"[api-gateway-scala] config inválida: $err").as(ExitCode.Error)
      case Right(cfg) =>
        Database.transactor(cfg.db).use { xa =>
          val auth = JwtAuth(cfg.jwt)
          val svc  = MeService(xa)
          val app  = (MeEndpoint.routes(auth, svc) <+> HealthRoutes.routes(xa)).orNotFound
          EmberServerBuilder
            .default[IO]
            .withHost(ipv4"0.0.0.0")
            .withPort(Port.fromInt(cfg.port).getOrElse(port"5001"))
            .withHttpApp(app)
            .build
            .use(_ => IO.println(s"[api-gateway-scala] ouvindo em :${cfg.port}") *> IO.never)
            .as(ExitCode.Success)
        }
