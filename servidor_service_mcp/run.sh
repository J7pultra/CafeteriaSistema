#!/usr/bin/env bash
# =========================================================================
# SCRIPT DE EJECUCIÓN - PLANTILLA MCP SERVER
# =========================================================================

cd "$(dirname "${BASH_SOURCE[0]}")" || exit 1

# Cargar variables de entorno si existe .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

PORT="${PORT_MCP:-7206}"
echo "🚀 Iniciando Servidor MCP en el puerto $PORT..."

# Si existe el JAR compilado, lo ejecuta directamente; si no, usa Maven Spring Boot
if [ -f "target/mcp-service-template.jar" ]; then
  java -jar target/mcp-service-template.jar --server.port="$PORT"
else
  mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=$PORT"
fi
