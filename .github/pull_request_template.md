## Descripción del Cambio
Describe de manera concisa y clara los cambios implementados, el contexto y la motivación técnica.

### Tipo de Cambio
- [ ] `feat`: Nueva funcionalidad o tool para el sistema de café.
- [ ] `fix`: Corrección de bug o excepción de negocio/infraestructura.
- [ ] `security`: Mejora en blindaje de prompts, JWT o políticas de seguridad.
- [ ] `perf`: Optimización de caché Redis, queries JPA o tiempo de respuesta.
- [ ] `refactor`: Refactorización de código sin cambios en funcionalidad.
- [ ] `docs`: Documentación técnica o diagramas de arquitectura.

---

### Componentes Afectados
- [ ] Backend (Spring Boot 3 / JPA / Security)
- [ ] Frontend (React / TypeScript / Axios / Dashboard)
- [ ] Python MCP Service (FastMCP / Tools / Prompt Guard)
- [ ] Infraestructura & Docker (Compose / Redis / Nginx)

---

### Checklist de Calidad & Seguridad Enterprise
- [ ] Se han agregado o actualizado pruebas unitarias/integración correspondientes.
- [ ] Cobertura de pruebas validada (100% de tests pasando en verde).
- [ ] El código cumple con principios SOLID y Clean Code.
- [ ] No se exponen credenciales, tokens JWT ni contraseñas en logs ni respuestas (DLP).
- [ ] Validación de inputs implementada para prevenir Inyección SQL y Prompt Injection.
- [ ] La build local (`mvn clean test`, `npm test`, `pytest`) finaliza exitosamente.
