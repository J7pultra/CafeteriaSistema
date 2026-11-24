# PROYECTO: SISTEMA INTEGRAL ENTERPRISE DE GESTIÓN Y VENTAS DE CAFÉ (COFFEE ENTERPRISE SYSTEM)

## 1. Prompt Maestro Original y Requerimientos del Sistema

```text
Actúa como un equipo de ingeniería de software enterprise altamente estructurado bajo un sistema de subagentes especializados y opera estrictamente optimizado para la arquitectura y capacidades de procesamiento de Gemini 3.8 Flash. Tu objetivo es desarrollar, construir y desplegar de manera autónoma, modular y secuencial el sistema completo de gestión y ventas de café (Backend en Spring Boot, Frontend en React, integración MCP en Python, seguridad avanzada, Redis, Docker y GitHub).

Debido a los límites de contexto y para asegurar la máxima calidad técnica sin errores, mantendrás una estricta división de roles (subagentes) y trabajarás fase por fase, validando código y pruebas antes de avanzar.

Arquitectura de Subagentes Operativos:
1. Subagente Arquitecto & Líder de Proyecto (@Architect): Gestiona la memoria de estado, la creación y actualización del archivo de seguimiento en Markdown, y coordina el paso entre fases.
2. Subagente Backend & Base de Datos (@BackendDev): Especialista en Spring Boot, JPA, seguridad, Spring Security, control de inyecciones y lógica de negocio CRUD para el negocio de café.
3. Subagente AI & MCP Engineer (@MCPDev): Especialista en Python, servidores/clientes MCP, herramientas (tools) y blindaje de chatbots contra fugas de información y prompt injection.
4. Subagente Frontend & UX (@FrontendDev): Especialista en React, TypeScript, consumo de APIs y desarrollo del Dashboard analítico de métricas de negocio.
5. Subagente DevOps & QA (@DevOps): Especialista en Docker (4 imágenes optimizadas), control de recursos, manejo de excepciones de infraestructura, Redis y despliegue en GitHub.

Protocolo de Ejecución Obligatorio:
1. Archivo de Seguimiento y Contexto Inmutable (proyecto-estado-progreso.md).
2. Ejecución Secuencial estricta (Fase por Fase).
3. Protocolo de Pruebas y Calidad de Código.

Fases:
- Fase 1: Arquitectura Base, Modelado de Datos y Configuración de Spring Boot (Java 17, Spring Data JPA, HikariCP, Entidades de Clientes, Productos, Órdenes, Roles y Auditoría).
- Fase 2: Lógica de Negocio, CRUDs Completos, Controladores REST documentados con OpenAPI y Manejo Centralizado de Excepciones (@ControllerAdvice).
- Fase 3: Seguridad Avanzada, Autenticación JWT sin estado, RBAC, Blindaje total contra Inyección SQL/XSS/CSRF y Encriptación BCrypt.
- Fase 4: Caché Distribuida con Redis y Arquitectura Modular de Skills del Sistema.
- Fase 5: Servidor y Cliente MCP en Python, Tools especializadas y Blindaje del Chatbot contra prompt injection y exposición de datos internos.
- Fase 6: Frontend en React, TypeScript, Estilos Limpios, Consumo de APIs con Axios y Dashboard de Métricas de Negocio en tiempo real (ej. clientes creados semanalmente).
- Fase 7: Contenerización Avanzada con Docker (4 imágenes: Backend, Frontend/Nginx, Python MCP, Redis) y configuración de docker-compose.yml con límites de recursos y volúmenes persistentes.
- Fase 8: Orquestación, GitFlow, Auditoría de Consumos y Despliegue en GitHub con documentación técnica profesional (README.md).
```

---

## 2. Desglose Completo del Flujo de Trabajo y Actividades por Fase

### Fase 1: Arquitectura Base, Modelado de Datos y Configuración de Spring Boot
* Actividad 1.1: Inicialización del proyecto Maven Spring Boot 3 con Java 17/21, dependencias clave (Web, Data JPA, Validation, Lombok, H2/PostgreSQL, Flyway/DDL).
* Actividad 1.2: Configuración de pool de conexiones HikariCP y parámetros de persistencia optimizados en `application.yml`.
* Actividad 1.3: Definición del modelo base de auditoría (`AuditableEntity` con `@MappedSuperclass`, `@EntityListeners`, timestamps y usuario auditor).
* Actividad 1.4: Modelado de entidad de dominio `User` y `Role` (RBAC con enum de roles: ADMIN, BARISTA, CLIENTE).
* Actividad 1.5: Modelado de entidad de dominio `Customer` (clientes de café, perfil de fidelidad, teléfono, email, dirección, estado).
* Actividad 1.6: Modelado de entidad de dominio `Product` (variedades de café, notas de cata, origen, nivel de tueste, precio, stock, categoría).
* Actividad 1.7: Modelado de entidades de dominio `Order` y `OrderItem` (pedidos de café, numeración de factura, estados, totales calculados, relación relacional bidireccional).
* Actividad 1.8: Creación de interfaces de persistencia Spring Data JPA (`CustomerRepository`, `ProductRepository`, `OrderRepository`, `UserRepository`, `RoleRepository`) con consultas derivadas e indexadas.
* Actividad 1.9: Pruebas unitarias y de persistencia (`@DataJpaTest`) para validar mapeo relacional, integridad referencial y auditoría.

### Fase 2: Lógica de Negocio, CRUDs Completos, Controladores REST y Manejo Centralizado de Excepciones
* Actividad 2.1: Definición de DTOs (Data Transfer Objects) con Bean Validation (`@NotNull`, `@Size`, `@Email`, `@Positive`, etc.) y mappers de dominio.
* Actividad 2.2: Implementación de capa de servicios (`CustomerService`, `ProductService`, `OrderService`) con validaciones de negocio e integridad transaccional (`@Transactional`).
* Actividad 2.3: Controladores REST documentados con OpenAPI 3 / Swagger (`/api/v1/customers`, `/api/v1/products`, `/api/v1/orders`).
* Actividad 2.4: Manejo centralizado de excepciones con `@RestControllerAdvice` y esquema RFC 7807 (Problem Details).
* Actividad 2.5: Batería de pruebas unitarias y de integración (`@WebMvcTest` y mockito) sobre controladores y servicios.

### Fase 3: Seguridad Avanzada, Autenticación JWT sin estado, RBAC, Blindaje total y BCrypt
* Actividad 3.1: Configuración de Spring Security 6 (SecurityFilterChain, SessionCreationPolicy.STATELESS, desactivación selectiva CSRF para REST).
* Actividad 3.2: Servicio de generación, firma criptográfica (HMAC-SHA256/512) y validación de tokens JWT (Access & Refresh tokens).
* Actividad 3.3: Filtro de autenticación JWT (`OncePerRequestFilter`) e integración con el `SecurityContextHolder`.
* Actividad 3.4: Encriptación de contraseñas con `BCryptPasswordEncoder` y gestión de usuarios/credenciales.
* Actividad 3.5: Control de acceso basado en roles (RBAC) con `@PreAuthorize` en endpoints sensibles.
* Actividad 3.6: Blindaje contra Inyección SQL (JPA parameterized), XSS (sanitización de inputs) y cabeceras de seguridad HTTP (CSP, HSTS, X-Frame-Options).
* Actividad 3.7: Pruebas unitarias de seguridad y autenticación.

### Fase 4: Caché Distribuida con Redis y Arquitectura Modular de Skills del Sistema
* Actividad 4.1: Configuración de conexión Spring Data Redis con Lettuce y serializadores Jackson JSON para entidades y DTOs.
* Actividad 4.2: Implementación de anotaciones de caché (`@Cacheable`, `@CachePut`, `@CacheEvict`) en catálogos de café y consultas recurrentes.
* Actividad 4.3: Políticas de expiración (TTL), invalidación reactiva por evento de actualización de stock y fallback en fallo de Redis.
* Actividad 4.4: Diseño del catálogo de skills modular del sistema de café (gestor de inventario, asistente de barista, recomendador de mezclas).
* Actividad 4.5: Pruebas de integración de caché y rendimiento.

### Fase 5: Servidor y Cliente MCP en Python, Tools Especializadas y Blindaje del Chatbot
* Actividad 5.1: Estructuración del entorno Python (FastMCP / MCP SDK) con arquitectura modular.
* Actividad 5.2: Implementación del Servidor MCP con Tools para consulta de stock, catálogo de orígenes de café y estado de pedidos.
* Actividad 5.3: Implementación del Cliente MCP consumidor y orquestador de prompts.
* Actividad 5.4: Capa de Blindaje de Seguridad del LLM contra Prompt Injection, jailbreaks, leak de credenciales y filtrado de datos confidenciales.
* Actividad 5.5: Pruebas automatizadas de las herramientas MCP y tests de resistencia ante ataques de inyección de instrucciones.

### Fase 6: Frontend en React, TypeScript, Estilos Limpios, Axios y Dashboard de Métricas
* Actividad 6.1: Configuración del proyecto React con TypeScript y estructura modular enterprise (componentes, servicios, hooks, páginas).
* Actividad 6.2: Cliente HTTP Axios configurado con interceptores de autenticación JWT, renovación de tokens y manejo uniforme de errores.
* Actividad 6.3: Módulo de gestión y visualización de catálogo de café y toma de órdenes.
* Actividad 6.4: Dashboard de métricas de negocio analíticas en tiempo real (clientes nuevos semanales, ventas por tueste, stock crítico).
* Actividad 6.5: Pruebas de componentes y validación de diseño responsivo.

### Fase 7: Contenerización Avanzada con Docker (4 Imágenes) y Docker Compose
* Actividad 7.1: Dockerfile multi-stage optimizado para Backend Spring Boot con usuario sin privilegios y capas cacheadas.
* Actividad 7.2: Dockerfile multi-stage optimizado para Frontend React empaquetado en Nginx Alpine con gzip y seguridad.
* Actividad 7.3: Dockerfile optimizado para Servidor MCP en Python con entorno virtual y dependencias mínimas.
* Actividad 7.4: Configuración de imagen oficial Redis con límites de memoria y persistencia AOF/RDB.
* Actividad 7.5: Archivo `docker-compose.yml` integral con redes privadas, healthchecks, límites de recursos (CPU/RAM) y volúmenes.

### Fase 8: Orquestación, GitFlow, Auditoría de Consumos y Despliegue en GitHub
* Actividad 8.1: Configuración de pipeline CI/CD (GitHub Actions) para validación de compilación, tests y empaquetado.
* Actividad 8.2: Estrategia de ramas GitFlow y plantillas de contribución/PRs.
* Actividad 8.3: Auditoría y optimización de consumo de tokens y llamadas API.
* Actividad 8.4: Documentación técnica exhaustiva en `README.md` con guías de arquitectura, instalación y ejecución.
* Actividad 8.5: Verificación final integral del ecosistema.

---

## 3. Estado de Ejecución y Checklist de Progreso

### Fase 1: Arquitectura Base, Modelado de Datos y Configuración de Spring Boot
- [x] Actividad 1.1: Inicialización de proyecto Maven Spring Boot 3 con Java 17/21 y dependencias necesarias.
- [x] Actividad 1.2: Configuración de HikariCP y persistencia en `application.yml`.
- [x] Actividad 1.3: Implementación de `AuditableEntity` y listener de auditoría.
- [x] Actividad 1.4: Modelo de entidades `User`, `Role` y enums correspondientes.
- [x] Actividad 1.5: Modelo de entidad `Customer` (clientes de café).
- [x] Actividad 1.6: Modelo de entidad `Product` (granos, variedades, tueste, stock).
- [x] Actividad 1.7: Modelo de entidades `Order` y `OrderItem` (pedidos de café).
- [x] Actividad 1.8: Repositorios Spring Data JPA con métodos optimizados.
- [x] Actividad 1.9: Pruebas unitarias y validación de compilación/persistencia de Fase 1.

### Fase 2: Lógica de Negocio, CRUDs, Controladores REST y Manejo de Excepciones
- [x] Actividad 2.1: Definición de DTOs con validaciones Bean Validation.
- [x] Actividad 2.2: Capa de Servicios (`CustomerService`, `ProductService`, `OrderService`).
- [x] Actividad 2.3: Controladores REST documentados con OpenAPI/Swagger.
- [x] Actividad 2.4: Manejador global de excepciones (`@RestControllerAdvice`).
- [x] Actividad 2.5: Batería de pruebas unitarias y de integración de controladores.

### Fase 3: Seguridad Avanzada, Autenticación JWT, RBAC y Blindaje
- [x] Actividad 3.1: Configuración de `SecurityFilterChain` en Spring Security.
- [x] Actividad 3.2: Proveedor y utilitarios de tokens JWT.
- [x] Actividad 3.3: Filtro de autenticación JWT para peticiones entrantes.
- [x] Actividad 3.4: Encriptación BCrypt y servicio de autenticación.
- [x] Actividad 3.5: Seguridad por roles con `@PreAuthorize`.
- [x] Actividad 3.6: Blindaje contra Inyecciones SQL, XSS y cabeceras de seguridad.
- [x] Actividad 3.7: Pruebas de seguridad y autenticación.

### Fase 4: Caché Distribuida con Redis y Skills del Sistema
- [x] Actividad 4.1: Configuración de Spring Data Redis y serialización JSON.
- [x] Actividad 4.2: Implementación de `@Cacheable`, `@CachePut` y `@CacheEvict`.
- [x] Actividad 4.3: Políticas de expiración TTL y resiliencia ante caídas de Redis.
- [x] Actividad 4.4: Estructuración del catálogo de skills modular del sistema.
- [x] Actividad 4.5: Pruebas de caché e invalidación.

### Fase 5: Servidor y Cliente MCP en Python, Tools y Blindaje AI
- [x] Actividad 5.1: Estructuración del proyecto Python MCP.
- [x] Actividad 5.2: Servidor MCP con Tools para el sistema de café.
- [x] Actividad 5.3: Cliente MCP con interfaz de interacción.
- [x] Actividad 5.4: Sistema de blindaje contra Prompt Injection y fugas de datos.
- [x] Actividad 5.5: Pruebas automatizadas de Tools y seguridad del LLM.

### Fase 6: Frontend en React, TypeScript y Dashboard de Métricas
- [x] Actividad 6.1: Inicialización del proyecto React + TypeScript con arquitectura limpia.
- [x] Actividad 6.2: Cliente Axios con interceptores JWT y manejo de errores.
- [x] Actividad 6.3: Vistas y componentes para gestión de catálogo y ventas de café.
- [x] Actividad 6.4: Dashboard de métricas de negocio analíticas en tiempo real.
- [x] Actividad 6.5: Pruebas de componentes y experiencia de usuario.

### Fase 7: Contenerización Avanzada con Docker y Compose
- [x] Actividad 7.1: Dockerfile multi-stage para Backend Spring Boot.
- [x] Actividad 7.2: Dockerfile multi-stage para Frontend React en Nginx.
- [x] Actividad 7.3: Dockerfile optimizado para Python MCP.
- [x] Actividad 7.4: Configuración de Redis persistente y seguro.
- [x] Actividad 7.5: Orquestación completa en `docker-compose.yml` con límites y salud.

### Fase 8: Orquestación, GitFlow, Auditoría y Despliegue en GitHub
- [x] Actividad 8.1: Workflows de GitHub Actions (CI/CD).
- [x] Actividad 8.2: Configuración de GitFlow y plantillas de control de versiones.
- [x] Actividad 8.3: Auditoría y optimización de consumo de tokens y llamadas API.
- [x] Actividad 8.4: Documentación técnica profesional `README.md` de nivel enterprise.
- [x] Actividad 8.5: Validación global final del sistema desplegado.


---

## 4. Estabilización y Refactorización para Producción

### Bloque 1 (@Architect + @BackendDev): Cambio de Dominio a Cafetería Real y Limpieza para Producción
- [x] Actividad 1.1: Re-alineación del modelo de Producto a Cafetería Real (Bebidas Calientes, Bebidas Frías, Repostería, Desayunos, Snacks, Otros; unidades enteras, sin atributos de tostaduría/kg).
- [x] Actividad 1.2: Eliminación absoluta de datos ficticios / de prueba en base de datos e inicializadores (DB limpia con roles y único admin parametrizado por `.env`).
- [x] Actividad 1.3: Verificación de tolerancia a tablas vacías en todos los endpoints (retorno de `[]` y `0` sin excepciones 500).
- [x] Actividad 1.4: Auditoría y corrección de métricas del Dashboard (ingresos reales no cancelados, desglose de órdenes por estado, clientes semanales, stock bajo, ventas por categoría e invalidación Redis).
- [x] Actividad 1.5: Ciclo de vida de órdenes con nivel de fidelización en DTO y transiciones de estado válidas (`PENDIENTE` -> `CONFIRMADO` -> `EN_PREPARACION` -> `LISTO` -> `ENTREGADO` / `CANCELADO`) protegidas por RBAC.
- [x] Actividad 1.6: Actualización de herramientas MCP (@MCPDev) en Java y Python para gestión por unidad en cafetería comercial.
- [x] Actividad 1.7: Pruebas unitarias y de integración de backend y MCP superadas exitosamente (46/46 tests Spring Boot, compilación Spring AI MCP Server y 38/38 tests Python MCP Client).

### Bloque 2 (@FrontendDev): Rediseño Sobrio, Profesional y 100% Real del Frontend
- [x] Actividad 2.1: Eliminación total de textos, etiquetas y señales de IA (eliminación de "Gemini", "Sommelier Virtual", emojis y referencias a tostaduría).
- [x] Actividad 2.2: Reorganización de navegación por rol y eliminación de vistas de relleno (Laboratorio de Tueste / Fichas de Extracción).
- [x] Actividad 2.3: Rediseño del Dashboard con grilla horizontal responsiva de 4 KPIs y gráficos conectados a métricas reales.
- [x] Actividad 2.4: Adaptación de vista Productos con modal "Nuevo Producto" para cafetería real (unidades, categorías reales, sin kg).
- [x] Actividad 2.5: Corrección de Pedidos y POS con mapeo a español legible, columna NIVEL funcional y botones de acción por rol.
- [x] Actividad 2.6: Control estricto de RBAC en interfaz (BARISTA solo consulta y gestiona pedidos; ADMIN controla catálogo).
- [x] Actividad 2.7: Adaptación de vistas de cliente (Menú, Mi Carrito, Mis Pedidos) con unidades, stepper sincronizado y sin duplicidad.

### Bloque 3 (@DevOps + Verificación Integral): Pruebas y Validación de Despliegue Real
- [x] Actividad 3.1: Ejecución de builds de producción (`npm run build`, `mvn clean package`, tests Python).
- [x] Actividad 3.2: Reconstrucción y despliegue limpio de contenedores con `docker-compose up --build -d` sobre volúmenes vírgenes.
- [x] Actividad 3.3: Prueba funcional extremo a extremo (login admin .env, creación de catálogo, compra cliente, flujo barista/admin, sincronización dashboard y Redis).
- [x] Actividad 3.4: Actualización final de estado y documentación de despliegue.

#### Resumen de Estabilización y Despliegue en Producción
- **Re-alineación de Dominio:** Transición 100% completada del modelo legacy de tostaduría de granos (por kg) a Cafetería Comercial de Especialidad (bebidas calientes, bebidas frías, repostería, desayunos, snacks y otros por unidades).
- **Limpieza de Datos:** Eliminación total de datos de prueba, seeders hardcodeados y mocks. Base de datos desplegada limpia desde cero con roles y único usuario administrador parametrizado desde variables de entorno (`.env`).
- **Frontend Refactorizado:** Rediseño corporativo sobrio sin emojis, sin marcas de modelos de IA ni etiquetas de prototipo ("Gemini", "Copiloto", "Sommelier"). Grilla KPI del Dashboard en 4 columnas horizontales responsivas y gráficos enlazados a métricas reales en vivo con invalidación automática de caché en Redis.
- **Contenedores Activos y Saludables en Docker:**
  - `coffee-frontend` (React + Nginx): Puerto 3000 -> Saludable.
  - `coffee-backend` (Spring Boot 3.3.5 / Java 21): Puerto 8088 -> Saludable.
  - `coffee-mcp-server` (Spring AI WebFlux SSE): Puerto 8001 -> Saludable.
  - `coffee-mcp-client` (FastAPI / Gemini Client): Puerto 8000 -> Saludable.
  - `coffee-postgres` (PostgreSQL 16 Alpine): Puerto 5432 -> Saludable.
  - `coffee-redis` (Redis 7.2 Alpine): Puerto 6379 -> Saludable.


---

## 5. Pruebas de Validación E2E en Navegador Real (Simulación Humana) y Auditoría

### Fase de Verificación Integral de Usuario (@QATester / Browser Subagent)
- [x] **Flujo Cliente:**
  - Registro de nuevo cliente `cliente_pedro` (`pedro@cafeteria.com`) desde el formulario y pestaña "Registrarse" en `/login`.
  - Inicio de sesión y redirección automática al Menú de Cafetería (`/store`).
  - Exploración del catálogo y adición de productos al carrito (1x Cappuccino Clásico, 1x Croissant de Almendras).
  - Checkout y facturación en `/carritocliente`.
  - Creación de comanda con código `ORD-188D4FB2` y verificación de seguimiento en tiempo real con stepper sincronizado en `/my-orders`.
- [x] **Flujo Barista:**
  - Cierre de sesión de cliente e ingreso como Barista (`barista` / `barista123`).
  - Recepción de la comanda `ORD-188D4FB2` en `/orders` en estado `Confirmado`.
  - Transición paso a paso del pedido: `Preparar` (EN_PREPARACION) -> `Listo` (LISTO) -> `Entregar` (ENTREGADO).
  - Descuento de stock en tiempo real en barra y activación de alerta de "Stock bajo" para productos con stock <= 10 unidades.
  - Verificación estricta de RBAC en `/catalog`: El rol Barista no tiene acceso a crear productos ("Nuevo Producto" oculto) ni a eliminarlos/desactivarlos.
- [x] **Flujo Administrador:**
  - Ingreso como Administrador (`admin` / `admin123`).
  - Verificación del Dashboard en tiempo real (`/dashboard`) en cuadrícula horizontal de 4 columnas responsivas:
    - Ingresos Totales: Actualizados a `$19.04` (órdenes válidas entregadas).
    - Órdenes Procesadas: `2` (1 orden activa).
    - Clientes Nuevos Semanales: `2` (Pedro y Valentina registrados en los últimos 7 días).
    - Stock Bajo: `1` producto en nivel crítico.
    - Ventas por Categoría: `Bebidas Calientes: $10.50 (62%)`, `Repostería: $6.50 (38%)`.
  - Verificación de permisos de gestión en `/catalog`: Botón "Nuevo Producto" y botones de desactivación plenamente operativos y visibles solo para `ADMIN`.
- [x] **Flujo Asistente (Chat y Soporte):**
  - Acceso a `/chat` y evaluación de las consultas humanas sobre menú y stock bajo.
  - Detección de error de autorización HTTP 401 en el servicio Python MCP Client debido a discrepancia de decodificación del `JWT_SECRET` (Hex vs Base64).
  - Detección de conflicto visual de superposición del botón flotante sobre el botón de envío en `/chat`.
- [x] **Documentación de Hallazgos:**
  - Creación del archivo consolidado `errores.md` con los 7 errores identificados (clasificados por severidad y con su solución técnica detallada) para su posterior corrección.


---

## 5. Pruebas de Validación E2E en Navegador Real (Simulación Humana) y Auditoría

### Fase de Verificación Integral de Usuario (@QATester / Browser Subagent)
- [x] **Flujo Cliente:**
  - Registro de nuevo cliente `cliente_pedro` (`pedro@cafeteria.com`) desde el formulario y pestaña "Registrarse" en `/login`.
  - Inicio de sesión y redirección automática al Menú de Cafetería (`/store`).
  - Exploración del catálogo y adición de productos al carrito (1x Cappuccino Clásico, 1x Croissant de Almendras).
  - Checkout y facturación en `/carritocliente`.
  - Creación de comanda con código `ORD-188D4FB2` y verificación de seguimiento en tiempo real con stepper sincronizado en `/my-orders`.
- [x] **Flujo Barista:**
  - Cierre de sesión de cliente e ingreso como Barista (`barista` / `barista123`).
  - Recepción de la comanda `ORD-188D4FB2` en `/orders` en estado `Confirmado`.
  - Transición paso a paso del pedido: `Preparar` (EN_PREPARACION) -> `Listo` (LISTO) -> `Entregar` (ENTREGADO).
  - Descuento de stock en tiempo real en barra y activación de alerta de "Stock bajo" para productos con stock <= 10 unidades.
  - Verificación estricta de RBAC en `/catalog`: El rol Barista no tiene acceso a crear productos ("Nuevo Producto" oculto) ni a eliminarlos/desactivarlos.
- [x] **Flujo Administrador:**
  - Ingreso como Administrador (`admin` / `admin123`).
  - Verificación del Dashboard en tiempo real (`/dashboard`) en cuadrícula horizontal de 4 columnas responsivas:
    - Ingresos Totales: Actualizados a `$19.04` (órdenes válidas entregadas).
    - Órdenes Procesadas: `2` (1 orden activa).
    - Clientes Nuevos Semanales: `2` (Pedro y Valentina registrados en los últimos 7 días).
    - Stock Bajo: `1` producto en nivel crítico.
    - Ventas por Categoría: `Bebidas Calientes: $10.50 (62%)`, `Repostería: $6.50 (38%)`.
  - Verificación de permisos de gestión en `/catalog`: Botón "Nuevo Producto" y botones de desactivación plenamente operativos y visibles solo para `ADMIN`.
- [x] **Flujo Asistente (Chat y Soporte):**
  - Acceso a `/chat` y evaluación de las consultas humanas sobre menú y stock bajo.
  - Detección de error de autorización HTTP 401 en el servicio Python MCP Client debido a discrepancia de decodificación del `JWT_SECRET` (Hex vs Base64).
  - Detección de conflicto visual de superposición del botón flotante sobre el botón de envío en `/chat`.
- [x] **Documentación de Hallazgos:**
  - Creación del archivo consolidado `errores.md` con los 7 errores identificados (clasificados por severidad y con su solución técnica detallada) para su posterior corrección.

---

## 6. Fase 6: Corrección Integral de Errores E2E, Estabilización de CI/CD y Preparación para Despliegue

- [x] **Corrección de Autenticación JWT en MCP Client (BUG-01):**
  - Se configuró `JWT_SECRET` en las variables de entorno de `mcp-client` en `docker-compose.yml`.
  - Se refactorizó `get_jwt_signing_key()` en `jwt_auth.py` para admitir claves en formato Hex de 64 caracteres (`bytes.fromhex(secret)`), garantizando compatibilidad idéntica con los tokens emitidos por Spring Boot.
- [x] **Corrección de Interfaz y Usabilidad (BUG-02 y BUG-03):**
  - Se ocultó condicionalmente el `FloatingChatWidget` cuando la ruta actual es `/chat`, evitando la intercepción física del clic sobre el botón "Enviar".
  - Se eliminaron todos los textos, destellos y emojis de "Sommelier AI ✨" en `SommelierHighlighter.tsx`, `index.html` y `Layout.tsx`, adoptando terminología formal de cafetería (`Gestión de Cafetería`, `Menú`, `Asistente`).
- [x] **Sincronización Financiera y de Lealtad (BUG-04, BUG-05 y BUG-06):**
  - Se ajustó el cálculo de IVA en el frontend a 12% (`0.12`), eliminando la discrepancia con el backend.
  - Se incorporó `loyaltyPointsEarned` en `OrderResponseDto.java`, `OrderMapper.java` y los tipos de frontend, permitiendo mostrar los puntos ganados de forma consistente tras la compra.
  - Se sustituyeron placeholders y textos de tostaduría por instrucciones reales de cafetería en la pantalla de carrito y checkout.
- [x] **Reparación del Pipeline CI/CD en GitHub Actions:**
  - Se corrigió el `working-directory` del job `mcp-service-test` en `.github/workflows/ci.yml`, apuntándolo a `cliente_service_mcp`.
  - Se verificó la compatibilidad y ejecución exitosa de pruebas unitarias y compilación de producción en Frontend (`vitest` + `npm run build`), Backend (`mvn test`) y Python MCP (`pytest`).
