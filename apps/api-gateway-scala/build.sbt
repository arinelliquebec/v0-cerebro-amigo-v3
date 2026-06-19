// api-gateway-scala — fatia strangler do gateway (ADR-067).
// Coexiste com o gateway .NET; BFF só aponta pra cá após paridade + testes verdes.

ThisBuild / scalaVersion := "3.3.3" // LTS
ThisBuild / organization := "br.com.cerebroamigo"
ThisBuild / version      := "0.1.0-SNAPSHOT"

val http4sV  = "0.23.27"
val tapirV   = "1.10.8"
val doobieV  = "1.0.0-RC5"
val circeV   = "0.14.7"
val ceV      = "3.5.4"

lazy val root = (project in file("."))
  .enablePlugins(JavaAppPackaging) // `sbt stage` p/ o Dockerfile
  .settings(
    name := "api-gateway-scala",
    Compile / mainClass := Some("cerebro.gateway.Server"),
    libraryDependencies ++= Seq(
      // efeito + servidor
      "org.typelevel"               %% "cats-effect"            % ceV,
      "org.http4s"                  %% "http4s-ember-server"    % http4sV,
      "org.http4s"                  %% "http4s-circe"           % http4sV,
      "org.http4s"                  %% "http4s-dsl"             % http4sV,
      // endpoints tipados (Tapir)
      "com.softwaremill.sttp.tapir" %% "tapir-http4s-server"    % tapirV,
      "com.softwaremill.sttp.tapir" %% "tapir-json-circe"       % tapirV,
      // banco (Postgres como cerebro_gateway, NOBYPASSRLS)
      "org.tpolecat"                %% "doobie-core"            % doobieV,
      "org.tpolecat"                %% "doobie-hikari"          % doobieV,
      "org.tpolecat"                %% "doobie-postgres"        % doobieV,
      "org.postgresql"               % "postgresql"             % "42.7.3", // driver JDBC no classpath do main (review #3)
      // JWT (HS256, mesmo JWT_SECRET do gateway .NET)
      "com.github.jwt-scala"        %% "jwt-circe"              % "10.0.1",
      // json
      "io.circe"                    %% "circe-generic"          % circeV,
      // log
      "ch.qos.logback"               % "logback-classic"        % "1.5.6" % Runtime,
      // testes — testcontainers-scala (gate de isolamento de tenant)
      "com.dimafeng"                %% "testcontainers-scala-munit"      % "0.41.4" % Test,
      "com.dimafeng"                %% "testcontainers-scala-postgresql" % "0.41.4" % Test,
      "org.typelevel"               %% "munit-cats-effect"      % "2.0.0"  % Test,
    ),
    // a RLS exige o pgvector:pg16 (mesma imagem do fixture .NET) — ver TenantIsolationSpec.
    Test / fork := true,
    scalacOptions ++= Seq("-deprecation", "-feature", "-Wunused:all"),
  )
