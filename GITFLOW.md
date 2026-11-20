# Estrategia de Ramas GitFlow & Estándares de Ingeniería

Este documento establece las políticas de ramificación, control de versiones semántico y estándares de commits adoptados por el equipo de ingeniería para el **Sistema de Gestión y Ventas de Café**.

---

## 1. Modelo de Ramas GitFlow

```
master (v1.0.0) ───●──────────────────────────────────────────────● (v1.1.0)
                    \                                            /
release/v1.1.0       \                        ●─────────●───────/
                      \                      /         /
develop                ●─────────●──────────●─────────●─────────●
                        \       /            \       /
feature/pos-discounts    ●─────●              \     /
feature/mcp-vision                             ●───●
```

### Ramas Principales (Larga Duración)
- `master` / `main`: Código en producción, estable y desplegable en cualquier momento. Solo recibe merges desde ramas `release/*` o `hotfix/*`. Cada merge se etiqueta con un tag semántico (`vX.Y.Z`).
- `develop`: Rama de integración principal. Contiene las últimas características probadas y listas para el próximo release.

### Ramas de Apoyo (Corta Duración)
- `feature/<nombre-feature>`: Creadas a partir de `develop`. Se utilizan para desarrollar nuevas funcionalidades (ej. `feature/order-pos-redesign`). Se integran de vuelta en `develop` mediante Pull Request aprobado.
- `release/v<version>`: Creadas a partir de `develop` para congelar código, realizar pruebas finales de regresión y pulir documentación antes de desplegar en producción.
- `hotfix/<incidente>`: Creadas a partir de `master` para resolver vulnerabilidades críticas o errores bloqueantes en producción. Se integran simultáneamente en `master` y `develop`.

---

## 2. Convención de Commits (Conventional Commits 1.0.0)

Todo mensaje de commit debe seguir la estructura:
```
<tipo>(<alcance>): <descripción concisa en minúsculas>

[cuerpo opcional detallado]

[pie de página con referencias a issues, ej. Closes #42]
```

### Tipos Permitidos
| Tipo | Significado |
|---|---|
| `feat` | Nueva característica para el usuario o sistema (ej. endpoints, tools MCP, vistas React). |
| `fix` | Corrección de un defecto o bug en código de backend, frontend o scripts. |
| `security` | Ajustes de seguridad, blindaje contra inyección, RBAC o filtros DLP. |
| `perf` | Optimización de rendimiento, índices SQL, configuraciones de caché Redis. |
| `refactor` | Cambio de código que no altera el comportamiento funcional ni corrige bugs. |
| `test` | Incorporación o corrección de pruebas unitarias o de integración. |
| `chore` | Actualización de tareas de compilación, dependencias de paquetes, Dockerfile. |
| `docs` | Cambios únicamente en documentación (`README.md`, OpenAPI, diagramas). |

---

## 3. Versionamiento Semántico (SemVer 2.0.0)

El esquema de versiones sigue el patrón `MAYOR.MENOR.PARCHE`:
- **MAYOR (`X.0.0`)**: Cambios incompatibles con la API anterior (breaking changes).
- **MENOR (`0.Y.0`)**: Nuevas funcionalidades compatibles con versiones anteriores.
- **PARCHE (`0.0.Z`)**: Correcciones de errores compatibles con versiones anteriores.

---

## 4. Política de Pull Requests & Code Review
1. **Revisión Obligatoria:** Al menos un desarrollador senior debe aprobar el PR.
2. **CI Verde:** Todas las comprobaciones automatizadas de GitHub Actions (`backend-test`, `frontend-test`, `mcp-service-test`, `docker-compose-validate`) deben finalizar en éxito antes del merge.
3. **Squash and Merge:** Se recomienda para ramas feature con historial de commits disperso, preservando un commit conciso y legible en `develop`.
