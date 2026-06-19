package cerebro.gateway

import com.dimafeng.testcontainers.PostgreSQLContainer
import org.testcontainers.utility.DockerImageName
import java.sql.Statement
import scala.io.Source

/** Infra compartilhada dos specs com Postgres real (Testcontainers) — espelha o
  * `TenantIsolationFixture.cs` do gateway .NET: imagem pgvector, aplicação de
  * TODAS as `infra/migrations/0*.sql` (exceto least_privilege_roles, com roles
  * stubadas) e role `gw_test` (NOSUPERUSER NOBYPASSRLS) p/ a RLS valer.
  * Fonte única do apply de migrations — fix de migration (ex.: stub 0050) mora aqui.
  */
object PgTestSetup:

  val gwPassword = "gw_test_pw"

  def containerDef: PostgreSQLContainer.Def =
    PostgreSQLContainer.Def(
      dockerImageName = DockerImageName.parse("pgvector/pgvector:pg16").asCompatibleSubstituteFor("postgres"),
      databaseName = "cerebro_v3_test",
    )

  /** Stub das roles que migrations recentes referenciam em GRANT (0050+). */
  def stubRoles(st: Statement): Unit =
    st.execute("""
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='cerebro_gateway') THEN CREATE ROLE cerebro_gateway NOLOGIN; END IF;
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='cerebro_workers') THEN CREATE ROLE cerebro_workers NOLOGIN; END IF;
      END $$;""")

  /** Aplica infra/migrations/0*.sql em ordem (pula least_privilege_roles=0036). */
  def applyMigrations(st: Statement): Unit =
    val dir = findMigrationsDir()
    val files = dir
      .listFiles((_, n) => n.matches("0.*\\.sql") && !n.contains("least_privilege_roles"))
      .sortBy(_.getName)
    for f <- files do
      val sql = Source.fromFile(f, "UTF-8").mkString
      try st.execute(sql)
      catch case e: Exception => throw new RuntimeException(s"falha ao aplicar ${f.getName}: ${e.getMessage}", e)

  /** gw_test: NOSUPERUSER NOBYPASSRLS — espelha cerebro_gateway de prod (0036). */
  def createGatewayRole(st: Statement, password: String = gwPassword): Unit =
    st.execute(s"""
      DROP ROLE IF EXISTS gw_test;
      CREATE ROLE gw_test LOGIN PASSWORD '$password' NOSUPERUSER NOBYPASSRLS;
      GRANT USAGE ON SCHEMA public TO gw_test;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gw_test;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gw_test;""")

  def findMigrationsDir(): java.io.File =
    var d = new java.io.File(System.getProperty("user.dir")).getAbsoluteFile
    while d != null do
      val cand = new java.io.File(d, "infra/migrations")
      if cand.isDirectory then return cand
      d = d.getParentFile
    throw new RuntimeException("infra/migrations não encontrado a partir de " + System.getProperty("user.dir"))
