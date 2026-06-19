package cerebro.gateway

import cats.syntax.all.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import java.util.UUID

/** Reproduz a plumbing de RLS de tenant do gateway .NET (ADR-042 / ADR-067).
  *
  * Diferença deliberada vs .NET: lá a GUC é de SESSÃO (`set_config(..., false)`)
  * com reset manual no fim do request; aqui é TRANSACTION-LOCAL
  * (`set_config(..., true)`), então auto-reseta no commit/rollback e não pode
  * vazar entre requests pelo pool. Mesma semântica de RLS — `set_config` e a query
  * rodam na MESMA transação, então `current_setting('app.current_medico')` enxerga
  * o tenant. Rode sempre o resultado de `withMedico` com `.transact(xa)`.
  */
object TenantSession:

  /** Pitfall: JWT `sub` = `usuario_id`, NÃO `medicos.id`. Resolve o medico_id. */
  def resolveMedicoId(usuarioId: UUID): ConnectionIO[Option[UUID]] =
    sql"SELECT id FROM medicos WHERE usuario_id = $usuarioId".query[UUID].option

  /** Executa `query` com `app.current_medico` setada transaction-local. */
  def withMedico[A](medicoId: UUID)(query: ConnectionIO[A]): ConnectionIO[A] =
    sql"SELECT set_config('app.current_medico', ${medicoId.toString}, true)"
      .query[String]
      .unique *> query
