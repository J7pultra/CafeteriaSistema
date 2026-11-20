# 🛰️ Plantilla Base: Servidor MCP (Model Context Protocol)

Esta carpeta contiene la **estructura esencial y limpia** de un Servidor MCP para servir como guía y punto de partida (boilerplate), libre de dependencias a bases de datos específicas (PostgreSQL), clientes corporativos externos (SOAP/Core bancario) o sistemas de autenticación acoplados (Keycloak).

Está basada en la arquitectura oficial utilizada en el proyecto (**Spring Boot 3.4.x + Spring AI MCP Server WebFlux**), e incluye además una alternativa mínima en **Python FastMCP**.

---

## 📁 Estructura del Proyecto

```text
plantilla-service-mcp/
├── pom.xml                               # Configuración Maven con Spring AI MCP Starter
├── Dockerfile                            # Despliegue en contenedor Docker
├── run.sh                                # Script de inicio rápido en Linux/Bash
├── .env.example                          # Variables de entorno esenciales (ej. PORT_MCP)
├── src/
│   └── main/
│       ├── java/com/lhia/mcp/
│       │   ├── MainApplication.java      # Punto de entrada y registro @Bean ToolCallback
│       │   ├── config/
│       │   │   └── CorsConfig.java       # Configuración CORS para WebFlux / SSE
│       │   ├── dto/
│       │   │   └── ExampleResponseDTO.java# DTO modelo para respuestas estructuradas
│       │   └── tools/
│       │       └── ExampleTools.java     # Definición de herramientas con @Tool y @ToolParam
│       └── resources/
│           ├── application.properties    # Propiedades esenciales del protocolo MCP
│           └── logback-spring.xml        # Configuración de logs en consola y archivo
└── python-fastmcp-alternativa/
    └── server.py                         # Alternativa mínima equivalente usando Python FastMCP
```

---

## ⚙️ Conceptos Clave de MCP

El protocolo **MCP (Model Context Protocol)** permite a los LLMs (como Claude o GPT) y a frameworks de agentes (LangChain, LangGraph) interactuar con sistemas externos invocando "herramientas" (Tools).

En esta implementación:
1. **Transporte:** `SSE` (Server-Sent Events) sobre HTTP asíncrono (`WebFlux`).
2. **Endpoints principales:**
   - `GET /mcp/sse`: Canal reactivo donde los clientes escuchan eventos del servidor.
   - `POST /mcp/message`: Canal donde el cliente envía solicitudes JSON-RPC (handshake `initialize`, listado `tools/list`, ejecución `tools/call`).

---

## 🛠️ ¿Cómo agregar una nueva Tool?

Para crear una nueva herramienta en Java:

### Paso 1: Definir el método en una clase de servicio (`tools/`)
Usa las anotaciones `@Tool` y `@ToolParam`:

```java
@Service
public class MisHerramientas {

    @Tool(
        name = "consultar_clima",
        description = "Obtiene el pronóstico del clima para una ciudad específica."
    )
    public String consultarClima(
            @ToolParam(description = "Nombre de la ciudad (ej: Quito, Cuenca)") String ciudad) {
        
        // Aquí va tu lógica de negocio, llamada a base de datos o API externa
        return "El clima en " + ciudad + " es soleado con 22°C.";
    }
}
```

> **Regla de oro:** Tanto `name` como `description` deben ser claros y descriptivos, ya que el modelo de IA utiliza la descripción para decidir **cuándo** y **cómo** invocar la herramienta.

### Paso 2: Registrar la clase en `MainApplication.java`
Inyecta la clase en el método `@Bean` de registro:

```java
@Bean
public List<ToolCallback> mcpTools(ExampleTools exampleTools, MisHerramientas misHerramientas) {
    return Arrays.asList(
        MethodToolCallbackProvider.builder()
            .toolObjects(exampleTools, misHerramientas)
            .build()
            .getToolCallbacks()
    );
}
```

---

## 🚀 Compilación y Ejecución

### 1. Con Maven local (Java 17+)
```bash
# Compilar proyecto
mvn clean package

# Ejecutar el servicio
java -jar target/mcp-service-template.jar

# O alternativamente con el script incluido:
./run.sh
```

El servidor iniciará en el puerto `7206` (o el especificado en `PORT_MCP`).

### 2. Con Docker
```bash
# Construir la imagen
docker build -t mi-mcp-server .

# Correr el contenedor
docker run -p 7206:7206 mi-mcp-server
```

---

## 🔌 ¿Cómo se conecta un Agente Cliente?

Los clientes en Python (como el `mcp_client.py` del proyecto) se conectan realizando:
1. Handshake inicial (`POST /mcp/message?sessionId=...` con método `initialize`).
2. Notificación `notifications/initialized`.
3. Ejecución de herramientas mediante `tools/call` enviando el nombre de la tool y los argumentos en JSON.

---

## 🐍 Alternativa en Python (FastMCP)

Si prefieres implementar un servidor MCP en Python en lugar de Java, consulta la carpeta `python-fastmcp-alternativa/`:
```bash
pip install mcp
python python-fastmcp-alternativa/server.py
```
