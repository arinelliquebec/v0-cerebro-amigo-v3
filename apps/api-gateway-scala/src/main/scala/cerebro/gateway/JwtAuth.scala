package cerebro.gateway

import io.circe.parser
import pdi.jwt.{JwtAlgorithm, JwtCirce, JwtClaim}
import java.util.UUID
import scala.util.Try

/** Principal do médico autenticado. `usuarioId` = JWT `sub` (NÃO é medicos.id —
  * pitfall: resolver via TenantSession.resolveMedicoId).
  */
final case class MedicoPrincipal(usuarioId: UUID, role: String)

/** Validação de JWT espelhando o gateway .NET (Program.cs): HS256, mesmo
  * `JWT_SECRET`, `issuer = cerebro-amigo`, audiences ["dashboard","portal-paciente"],
  * claims `sub` + `role`. A assinatura e a expiração são validadas no decode.
  */
final class JwtAuth(cfg: JwtConfig):

  def validate(token: String): Either[String, MedicoPrincipal] =
    for
      claim <- JwtCirce.decode(token, cfg.secret, Seq(JwtAlgorithm.HS256)).toEither.left.map(_ => "token inválido")
      _     <- Either.cond(claim.issuer.contains(cfg.issuer), (), "issuer inválido")
      _     <- Either.cond(audienceOk(claim), (), "audience inválida")
      sub   <- claim.subject.toRight("sub ausente")
      uid   <- Try(UUID.fromString(sub)).toEither.left.map(_ => "sub não é UUID")
      role  <- extractRole(claim.content).toRight("role ausente")
    yield MedicoPrincipal(uid, role)

  private def audienceOk(claim: JwtClaim): Boolean =
    claim.audience.exists(aud => aud.exists(cfg.audiences.contains))

  // `role` é claim customizado → vive no content JSON do claim.
  private def extractRole(content: String): Option[String] =
    parser.parse(content).toOption.flatMap(_.hcursor.get[String]("role").toOption)
