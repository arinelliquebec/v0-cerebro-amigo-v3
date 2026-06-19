package cerebro.gateway

/** Cobre `Config.fromNpgsql` (Npgsql DSN → JDBC + mapeamento de sslmode). Puro, sem
  * container — trava as regras do review #8 (prefer preservado) e #1 (verify-full com
  * a CA do RDS / require sem ela).
  */
class ConfigSpec extends munit.FunSuite:

  private def jdbc(dsn: String, ca: Option[String] = None): String =
    Config.fromNpgsql(dsn, ca).fold(e => fail(s"esperava Right, veio Left($e)"), _.jdbcUrl)

  test("DSN Npgsql → host/port/db/user/pass") {
    val r = Config.fromNpgsql("Host=db.example.com;Port=5433;Database=cerebro_v3;Username=u;Password=p")
    val c = r.fold(e => fail(e), identity)
    assertEquals(c.jdbcUrl, "jdbc:postgresql://db.example.com:5433/cerebro_v3")
    assertEquals(c.user, "u")
    assertEquals(c.password, "p")
  }

  test("port default 5432 quando ausente") {
    assert(jdbc("Host=h;Database=d;Username=u;Password=p").startsWith("jdbc:postgresql://h:5432/d"))
  }

  test("SSL Mode=Prefer é preservado, NÃO vira require (review #8)") {
    assertEquals(jdbc("Host=localhost;Database=d;Username=u;Password=p;SSL Mode=Prefer"),
      "jdbc:postgresql://localhost:5432/d?sslmode=prefer")
  }

  test("local sem sslmode → sem param") {
    assert(!jdbc("Host=localhost;Database=d;Username=u;Password=p").contains("sslmode"))
  }

  test("host RDS sem CA → require (rds.force_ssl)") {
    assert(jdbc("Host=x.abc.sa-east-1.rds.amazonaws.com;Database=d;Username=u;Password=p")
      .endsWith("?sslmode=require"))
  }

  test("host RDS COM RDS_CA_PATH → verify-full + sslrootcert (review #1)") {
    assertEquals(
      jdbc("Host=x.abc.sa-east-1.rds.amazonaws.com;Database=d;Username=u;Password=p", Some("/ca.pem")),
      "jdbc:postgresql://x.abc.sa-east-1.rds.amazonaws.com:5432/d?sslmode=verify-full&sslrootcert=/ca.pem",
    )
  }

  test("SSL Mode=VerifyFull: com CA → verify-full; sem CA → require (não quebra sem truststore)") {
    assert(jdbc("Host=h;Database=d;Username=u;Password=p;SSL Mode=VerifyFull", Some("/ca.pem"))
      .contains("sslmode=verify-full&sslrootcert=/ca.pem"))
    assert(jdbc("Host=h;Database=d;Username=u;Password=p;SSL Mode=VerifyFull").endsWith("?sslmode=require"))
  }

  test("DSN sem host/database → Left") {
    assert(Config.fromNpgsql("Username=u;Password=p").isLeft)
  }
