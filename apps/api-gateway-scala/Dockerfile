# =============================================================================
# Stage 1: Build (JDK 21 + sbt + Scala 3) — gera o app empacotado (sbt stage)
# =============================================================================
FROM sbtscala/scala-sbt:eclipse-temurin-jammy-21.0.2_13_1.10.1_3.3.3 AS build

WORKDIR /src

# Cache de dependências (resolve antes de copiar o source)
COPY build.sbt .
COPY project/build.properties project/build.properties
COPY project/plugins.sbt project/plugins.sbt
RUN sbt update

# Source + empacotamento (target/universal/stage/{bin,lib})
COPY . .
RUN sbt stage

# =============================================================================
# Stage 2: Runtime (JRE 21 slim)
# =============================================================================
FROM eclipse-temurin:21-jre-jammy AS runtime

# curl para o HEALTHCHECK (a imagem jre slim não traz)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Usuário não-root (espelha o gateway .NET)
RUN (getent group app >/dev/null || groupadd -r app) && \
    (getent passwd app >/dev/null || useradd -r -g app app)

COPY --from=build /src/target/universal/stage/ /app/
RUN chown -R app:app /app

USER app

# :5001 evita colidir com o gateway .NET (:5000) durante a coexistência (ADR-067)
EXPOSE 5001
ENV PORT=5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail http://localhost:5001/health || exit 1

ENTRYPOINT ["/app/bin/api-gateway-scala"]
