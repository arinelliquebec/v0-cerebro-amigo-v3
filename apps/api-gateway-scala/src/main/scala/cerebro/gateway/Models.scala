package cerebro.gateway

import cats.effect.IO
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import java.time.{Instant, OffsetDateTime}
import java.util.UUID

/** Erros de API mapeados para status HTTP (espelha Results.Forbid/Unauthorized do .NET). */
enum ApiError:
  case Unauthorized, Forbidden

/** Linha crua do SELECT do /me. Colunas TIMESTAMPTZ (assinaturas) lidas como
  * OffsetDateTime (doobie-postgres) e convertidas p/ Instant na borda.
  */
final case class MeRow(
    medicoId: UUID,
    nome: String,
    crm: Option[String],
    especialidade: Option[String],
    usuarioId: UUID,
    email: String,
    role: String,
    assinaturaStatus: Option[String],
    prazoPagamentoAte: Option[OffsetDateTime],
    trialAte: Option[OffsetDateTime],
    plano: Option[String],
    fotoS3Key: Option[String],
)

/** Resposta do GET /api/v1/auth/me — MESMO contrato do gateway .NET (AuthEndpoints.cs).
  * Campos camelCase consumidos pelo BFF (`apps/web/app/api/me/route.ts`).
  */
final case class MeResponse(
    medicoId: UUID,
    nome: String,
    crm: Option[String],
    especialidade: Option[String],
    usuarioId: UUID,
    email: String,
    role: String,
    assinaturaStatus: Option[String],
    liberado: Boolean,
    bloqueado: Boolean,
    emPrazo: Boolean,
    readOnly: Boolean,
    diasRestantes: Option[Int],
    motivo: String,
    prazoPagamentoAte: Option[Instant],
    plano: Option[String],
    features: List[String],
    fotoUrl: Option[String],
)

object MeResponse:
  given Encoder[MeResponse] = deriveEncoder
  // Tapir jsonBody exige Codec bidirecional → precisa de Decoder mesmo sendo só output.
  given Decoder[MeResponse] = deriveDecoder

/** Lógica do /me: lê perfil + assinatura, deriva situação (AssinaturaGate) e features
  * (PlanCatalog). Naturalmente tenant-scopado por `usuario_id` (mesma estratégia do .NET).
  */
final class MeService(xa: Transactor[IO]):

  def me(p: MedicoPrincipal): IO[Either[ApiError, MeResponse]] =
    fetch(p.usuarioId).transact(xa).map {
      case None => Left(ApiError.Forbidden) // sem médico p/ esse usuário → Forbid (igual .NET)
      case Some(row) =>
        val now = Instant.now()
        val sit = AssinaturaGate.avaliar(
          row.assinaturaStatus,
          row.prazoPagamentoAte.map(_.toInstant),
          row.trialAte.map(_.toInstant),
          now,
          row.plano,
        )
        Right(
          MeResponse(
            medicoId = row.medicoId,
            nome = row.nome,
            crm = row.crm,
            especialidade = row.especialidade,
            usuarioId = row.usuarioId,
            email = row.email,
            role = row.role,
            assinaturaStatus = row.assinaturaStatus,
            liberado = sit.liberado,
            bloqueado = !sit.liberado,
            emPrazo = sit.emPrazo,
            readOnly = sit.trialReadOnly,
            diasRestantes = sit.diasRestantes,
            motivo = sit.motivo,
            prazoPagamentoAte = row.prazoPagamentoAte.map(_.toInstant),
            plano = row.plano,
            features = PlanCatalog.featuresDe(row.plano),
            // TODO ADR-067: avatar via presigned S3 (cerebro-amigo-medico-docs) antes do
            // flip do BFF. Enquanto o BFF aponta pro /me do .NET, manter None não regride nada.
            fotoUrl = None,
          )
        )
    }

  private def fetch(usuarioId: UUID): ConnectionIO[Option[MeRow]] =
    sql"""SELECT m.id, m.nome, m.crm, m.especialidade, u.id, u.email, u.role,
                 a.status, a.prazo_pagamento_ate, a.trial_ate, a.plano, m.foto_s3key
          FROM medicos m
          JOIN usuarios u ON u.id = m.usuario_id
          LEFT JOIN assinaturas a ON a.medico_id = m.id
          WHERE m.usuario_id = $usuarioId""".query[MeRow].option
