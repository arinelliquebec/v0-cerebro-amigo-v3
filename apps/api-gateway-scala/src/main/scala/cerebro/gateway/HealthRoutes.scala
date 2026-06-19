package cerebro.gateway

import cats.effect.IO
import cats.syntax.all.*
import doobie.*
import doobie.implicits.*
import io.circe.Json
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityEncoder.*
import org.http4s.dsl.io.*

/** GET /health (liveness) e GET /ready (checa o banco) — espelha Program.cs do .NET. */
object HealthRoutes:

  def routes(xa: Transactor[IO]): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case GET -> Root / "health" =>
        Ok(Json.obj("status" -> Json.fromString("ok")))

      case GET -> Root / "ready" =>
        sql"SELECT 1".query[Int].unique.transact(xa).attempt.flatMap {
          case Right(_) => Ok(Json.obj("status" -> Json.fromString("ready")))
          case Left(_)  => ServiceUnavailable(Json.obj("status" -> Json.fromString("unready")))
        }
    }
