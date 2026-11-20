# =========================================================================
# DOCKERFILE - SERVIDOR MCP (SPRING BOOT 3.4 + SPRING AI MCP)
# =========================================================================

# 1. Fase de Compilación
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# 2. Fase de Ejecución Liviana
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends wget curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/servidor-service-mcp.jar app.jar

EXPOSE 8001

ENV PORT_MCP=8001
ENV BACKEND_BASE_URL=http://backend:8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8001/healthz || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
