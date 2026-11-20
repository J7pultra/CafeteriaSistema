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
