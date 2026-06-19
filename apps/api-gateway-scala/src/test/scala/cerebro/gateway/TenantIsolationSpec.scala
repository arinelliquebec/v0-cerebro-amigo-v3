package cerebro.gateway

import com.dimafeng.testcontainers.PostgreSQLContainer
import com.dimafeng.testcontainers.munit.TestContainerForAll
import doobie.*
import doobie.implicits.*
import java.sql.{DriverManager, Statement}
import java.util.UUID

/** Gate de isolamento de tenant do api-gateway-scala (ADR-067) — porte do
  * `apps/api-gateway-tests/RlsTests.cs`. Prova, no MESMO caminho de produção
  * (HikariTransactor como `gw_test` NOBYPASSRLS + `TenantSession.withMedico`), que:
  *   1. médico A não enxerga prescrição do paciente do médico B (RLS barra);
  *   2. médico B só vê a sua;
  *   3. SEM tenant setado, o role do gateway não vê nada (fail-closed).
  *
  * Infra (container, migrations, gw_test) vem de [[PgTestSetup]]. É a barreira que
  * tem de estar VERDE antes de o BFF flipar qualquer endpoint que leia tabela RLS.
  */
class TenantIsolationSpec extends munit.CatsEffectSuite with TestContainerForAll:

  override val containerDef: PostgreSQLContainer.Def = PgTestSetup.containerDef

  // ── Dois tenants ──
  private val usuarioA  = UUID.randomUUID()
  private val usuarioB  = UUID.randomUUID()
  private val medicoA   = UUID.randomUUID()
  private val medicoB   = UUID.randomUUID()
  private val pacienteA = UUID.randomUUID()
  private val pacienteB = UUID.randomUUID()

  // Setup roda uma vez, com a conexão admin (superuser do container).
  override def afterContainersStart(pg: PostgreSQLContainer): Unit =
    val conn = DriverManager.getConnection(pg.jdbcUrl, pg.username, pg.password)
    try
      val st = conn.createStatement()
      PgTestSetup.stubRoles(st)
      PgTestSetup.applyMigrations(st)
      seed(st)
      PgTestSetup.createGatewayRole(st)
    finally conn.close()

  // Transactor como gw_test (NOBYPASSRLS) — a RLS da 0037/0038 VALE aqui.
  private def gwXa(pg: PostgreSQLContainer) =
    Database.transactor(DbConfig(pg.jdbcUrl, "gw_test", PgTestSetup.gwPassword))

  test("médico A não vê prescrição do paciente de B (RLS barra cross-tenant)") {
    withContainers { pg =>
      gwXa(pg).use { xa =>
        TenantSession
          .withMedico(medicoA)(
            sql"SELECT COALESCE(string_agg(medicamento, ','), '') FROM prescricoes".query[String].unique
          )
          .transact(xa)
          .map { meds =>
            assert(meds.contains("Escitalopram"), s"deveria ver a própria prescrição; veio: '$meds'")
            assert(!meds.contains("Sertralina"), s"VAZOU prescrição do tenant B: '$meds'")
          }
      }
    }
  }

  test("médico B vê só a própria prescrição") {
    withContainers { pg =>
      gwXa(pg).use { xa =>
        TenantSession
          .withMedico(medicoB)(
            sql"SELECT COALESCE(string_agg(medicamento, ','), '') FROM prescricoes".query[String].unique
          )
          .transact(xa)
          .map { meds =>
            assert(meds.contains("Sertralina"), s"deveria ver a própria prescrição; veio: '$meds'")
            assert(!meds.contains("Escitalopram"), s"VAZOU prescrição do tenant A: '$meds'")
          }
      }
    }
  }

  test("sem tenant setado, o role do gateway não vê prescrição nenhuma (fail-closed)") {
    withContainers { pg =>
      gwXa(pg).use { xa =>
        sql"SELECT COUNT(*) FROM prescricoes"
          .query[Long]
          .unique
          .transact(xa)
          .map(c => assertEquals(c, 0L, "RLS deveria barrar tudo sem app.current_medico"))
      }
    }
  }

  private def seed(st: Statement): Unit =
    st.execute(s"""
      INSERT INTO usuarios (id, email, senha_hash, nome, role) VALUES
        ('$usuarioA','medico.a@example.com','x','Médico A','medico'),
        ('$usuarioB','medico.b@example.com','x','Médico B','medico');
      INSERT INTO medicos (id, usuario_id, nome, crm) VALUES
        ('$medicoA','$usuarioA','Médico A','CRM-A'),
        ('$medicoB','$usuarioB','Médico B','CRM-B');
      INSERT INTO clientes (id, email, nome) VALUES
        ('$pacienteA','paciente.a@example.com','Paciente A'),
        ('$pacienteB','paciente.b@example.com','Paciente B');
      INSERT INTO pacientes (cliente_id, medico_responsavel_id) VALUES
        ('$pacienteA','$medicoA'),('$pacienteB','$medicoB');
      INSERT INTO prescricoes (id, paciente_id, medico_id, medicamento, dose_descricao, ativa) VALUES
        ('${UUID.randomUUID()}','$pacienteB','$medicoB','Sertralina 50mg','1x ao dia',TRUE),
        ('${UUID.randomUUID()}','$pacienteA','$medicoA','Escitalopram 10mg','1x ao dia',TRUE);
    """)
