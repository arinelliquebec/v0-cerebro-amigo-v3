package cerebro.gateway

import cats.effect.{IO, Resource}
import doobie.hikari.HikariTransactor
import com.zaxxer.hikari.HikariConfig

/** Transactor Doobie (HikariCP). Conecta como `cerebro_gateway` (NOBYPASSRLS) —
  * a RLS de tenant (ADR-042) vale por baixo. As credenciais do `DbConfig` definem
  * o role; nunca usar um role com BYPASSRLS aqui.
  */
object Database:
  def transactor(cfg: DbConfig): Resource[IO, HikariTransactor[IO]] =
    val hikari = new HikariConfig()
    hikari.setJdbcUrl(cfg.jdbcUrl)
    hikari.setUsername(cfg.user)
    hikari.setPassword(cfg.password)
    hikari.setDriverClassName("org.postgresql.Driver")
    // /me é read-only leve; pool enxuto p/ caber no mem_limit do container (review #2).
    // Subir junto com o mem_limit quando assumir endpoints de escrita/tráfego real.
    hikari.setMaximumPoolSize(10)
    hikari.setPoolName("cerebro-gateway-scala")
    HikariTransactor.fromHikariConfig[IO](hikari)
