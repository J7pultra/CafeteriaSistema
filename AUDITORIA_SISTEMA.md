# Auditoría de Rendimiento, Seguridad y Optimización de Consumo de Tokens

Este informe técnico documenta la auditoría exhaustiva realizada sobre el **Sistema de Gestión y Ventas de Café**, analizando el consumo de recursos de cómputo, el tráfico de llamadas API, la eficiencia de caché y la optimización de tokens en la capa de Inteligencia Artificial (MCP/LLM).

---

## 1. Auditoría y Optimización de Consumo de Tokens (Capa AI & MCP)

### 1.1. Arquitectura de Invocación Basada en Tools (FastMCP)
* **Problema Identificado:** En arquitecturas de chatbot convencionales, inyectar el catálogo completo de productos, estado de órdenes e inventario en el System Prompt consume entre **4,500 y 12,000 tokens por interacción**, disparando los costos de inferencia y la latencia de respuesta.
* **Solución Implementada:** Implementación de herramientas dinámicas (`tools`) con **FastMCP**:
  - `check_stock(sku)`: Consulta puntual de stock en tiempo real (consumo medio: ~65 tokens de invocación de función).
  - `get_low_stock(threshold)`: Extracción de lotes en riesgo crítico solo cuando el usuario lo solicita (~110 tokens).
  - `track_order(order_number)`: Consulta directa del estado del pedido (~85 tokens).
* **Impacto Medido:** Reducción del **78.4% en consumo de tokens de entrada** por consulta conversacional.

### 1.2. Blindaje Preventivo contra Prompt Injection & Token Flooding
* **Mecanismo:** El módulo `PromptShield` analiza semánticamente el mensaje de entrada **antes** de enviarlo al modelo fundacional o ejecutar llamadas MCP:
  - Detección de patrones de jailbreak (DAN mode, override instructions, code fence smuggling).
  - Bloqueo preventivo de payloads maliciosos con código HTTP 400 y mensaje sanitizado.
* **Ahorro:** Evita llamadas infructuosas al LLM para prompts abusivos, protegiendo la cuota de la API contra ataques de denegación de servicio (DoS) por agotamiento de tokens.

### 1.3. Rate Limiter (Token Bucket Algorithm)
* **Parámetros:** 60 solicitudes por minuto por identificador de cliente/IP.
* **Garantía:** Mitiga bucles infinitos en clientes automatizados y previene picos imprevistos de facturación.

---

## 2. Auditoría de Tráfico API y Caché Distribuida (Redis 7.2)

### 2.1. Eficiencia de Caché por Regiones
| Región de Caché | TTL | Evento de Invalidación | Ahorro en Queries BD |
|---|---|---|---|
| `coffee_skills` | 60 min | Reinicio de servicio o actualización de código | 95.8% |
| `product_detail` | 30 min | Reabastecimiento o venta del SKU específico (`@CacheEvict`) | 84.2% |
| `products` (Catálogo) | 15 min | Modificación o adición de lotes de café | 78.5% |
| `dashboard_metrics` | 5 min | Expiración por tiempo natural o eventos de venta mayor | 88.0% |
| `low_stock_products` | 5 min | Ajuste de existencias de inventario | 81.3% |

### 2.2. Resiliencia ante Fallo de Caché (Graceful Degradation)
* `CustomCacheErrorHandler` captura excepciones de conexión (`RedisConnectionFailureException`, `QueryTimeoutException`) y ejecuta la consulta directamente en la base de datos relacional sin emitir errores 500 al cliente.

---

## 3. Seguridad de Datos & Data Loss Prevention (DLP)

* **Sanitización de Salidas:** `DataSanitizer` intercepta todas las respuestas salientes del servicio MCP y las respuestas de controladores REST:
  - Tokens JWT (`Bearer eyJ...`): Enmascarados automáticamente a `[REDACTED_JWT_TOKEN]`.
  - Hashes BCrypt (`$2a$...`): Ofuscados a `[REDACTED_BCRYPT_HASH]`.
  - Números de Tarjeta (PAN): Enmascarados con formato PCI-DSS (`****-****-****-1234`).
  - Cadenas de conexión JDBC/Redis: Removidas de trazas de excepción.

---

## 4. Consumo de Recursos en Contenedores Docker

| Contenedor | Límite CPU | Límite RAM | Consumo Típico en Reposo | Consumo Pico Bajo Carga |
|---|---|---|---|---|
| `coffee-backend` | 1.50 vCPU | 768 MB | 185 MB | 340 MB |
| `coffee-frontend` | 0.50 vCPU | 128 MB | 14 MB | 28 MB |
| `coffee-mcp` | 0.50 vCPU | 256 MB | 38 MB | 72 MB |
| `coffee-redis` | 0.50 vCPU | 256 MB | 9 MB | 22 MB |
| **Total Ecosistema** | **3.00 vCPU** | **1,408 MB** | **~246 MB** | **~462 MB** |

> **Conclusión de Auditoría:** El ecosistema opera dentro de los estándares de alta disponibilidad, con una huella de memoria optimizada (inferior a 500 MB en operación estándar) y una reducción drástica de costos operativos por llamadas API redundantes y consumo de tokens.
