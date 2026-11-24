# Registro de Errores y Hallazgos de Pruebas E2E en Navegador

Este documento recopila de manera exhaustiva todos los errores, desalineaciones de dominio, bugs visuales, fallos de integración y discrepancias encontradas durante la simulación integral de usuario humano en la aplicación web (`http://localhost:3000`).

---

## Índice de Errores

1. [BUG-01: Falla de Autenticación HTTP 401 en `/api/chat` por discrepancia de JWT Secret y decodificación Hex/Base64](#bug-01-falla-de-autenticación-http-401-en-apichat-por-discrepancia-de-jwt-secret-y-decodificación-hexbase64)
2. [BUG-02: Superposición física del botón flotante sobre el botón "Enviar" en `/chat`](#bug-02-superposición-física-del-botón-flotante-sobre-el-botón-enviar-en-chat)
3. [BUG-03: Remanentes visuales de prototipo de IA ("Sommelier AI ✨", destellos y títulos de tostaduría)](#bug-03-remanentes-visuales-de-prototipo-de-ia-sommelier-ai--destellos-y-títulos-de-tostaduría)
4. [BUG-04: Discrepancia impositiva (IVA 10% vs 12%) entre Vista de Carrito y Facturación Final del Backend](#bug-04-discrepancia-impositiva-iva-10-vs-12-entre-vista-de-carrito-y-facturación-final-del-backend)
5. [BUG-05: Puntos de lealtad no acreditados en la respuesta de confirmación de orden (+0 puntos)](#bug-05-puntos-de-lealtad-no-acreditados-en-la-respuesta-de-confirmación-de-orden-0-puntos)
6. [BUG-06: Textos y placeholders con jerga de tostaduría/granos en la vista de Carrito y Checkout](#bug-06-textos-y-placeholders-con-jerga-de-tostaduríagranos-en-la-vista-de-carrito-y-checkout)
7. [BUG-07: Error de recurso estático 404 en consola al entrar a `/carritocliente`](#bug-07-error-de-recurso-estático-404-en-consola-al-entrar-a-carritocliente)

---

### BUG-01: Falla de Autenticación HTTP 401 en `/api/chat` por discrepancia de JWT Secret y decodificación Hex/Base64
* **Severidad:** Crítica
* **Componentes afectados:** `cliente_service_mcp/mcp_service/security/jwt_auth.py`, `docker-compose.yml`, `backend/src/main/resources/application.yml`.
* **Descripción:**
  - El backend Spring Boot emite un Access Token firmado con `JWT_SECRET` en formato hexadecimal (`404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`). En Java se decodifica con `HexFormat.of().parseHex(secretKey)`.
  - El servicio Python MCP Client en `jwt_auth.py` solo intentaba decodificación Base64 (`base64.b64decode()`) o UTF-8 puro, y en `docker-compose.yml` el contenedor `mcp-client` no tenía expuesta la variable `JWT_SECRET: ${JWT_SECRET}`.
  - Al enviar un mensaje autenticado desde `/chat`, Python arrojaba `Invalid JWT signature or format: Signature verification failed`, retornando HTTP 401 Unauthorized y activando el mensaje de desconexión en el frontend.
* **Solución requerida:**
  1. Agregar `JWT_SECRET: ${JWT_SECRET:-404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}` a `mcp-client` en `docker-compose.yml`.
  2. Actualizar `jwt_auth.py` para soportar tanto claves en Hexadecimal de 64 caracteres (`bytes.fromhex(...)`) como Base64 y UTF-8, garantizando paridad exacta con Spring Boot.

---

### BUG-02: Superposición física del botón flotante sobre el botón "Enviar" en `/chat`
* **Severidad:** Alta
* **Componentes afectados:** `frontend/src/components/common/FloatingChatWidget.tsx`, `frontend/src/pages/ChatPage.tsx`.
* **Descripción:**
  - El trigger flotante del widget (`FloatingChatWidget`) tiene posición `fixed` en la esquina inferior derecha (`bottom: 24px, right: 24px`) con `z-index: 1000`.
  - En la página completa de `/chat`, el botón "Enviar" del formulario se ubica exactamente en la misma esquina inferior derecha.
  - Al hacer clic con el ratón en "Enviar", el evento lo intercepta el botón flotante, abriendo el drawer en miniatura en vez de despachar el formulario principal.
* **Solución requerida:**
  - Ocultar condicionalmente `FloatingChatWidget` cuando el usuario se encuentre en la ruta `/chat`:
    ```tsx
    const location = useLocation()
    if (location.pathname === '/chat') return null
    ```

---

### BUG-03: Remanentes visuales de prototipo de IA ("Sommelier AI ✨", destellos y títulos de tostaduría)
* **Severidad:** Media
* **Componentes afectados:**
  - `frontend/src/components/common/SommelierHighlighter.tsx`
  - `frontend/src/components/layout/Layout.tsx`
  - `frontend/index.html`
* **Descripción:**
  - `SommelierHighlighter.tsx` mantenía un cursor flotante etiquetado como `"Sommelier AI ✨"` con ícono `Sparkles`, el cual aparecía en la esquina inferior derecha en todas las vistas.
  - `frontend/index.html` conservaba el título HTML `<title>Sistema Café — Tostaduría de Especialidad & Origen</title>`.
  - `Layout.tsx` en el encabezado de visitantes (invitados sin login) mostraba el subtítulo `"Specialty Coffee Roasters"`, enlace `"Tienda de Café"` (en vez de `"Menú"`), y `<Sparkles /> <span>Asistente AI</span>` (en vez de un ícono estándar de mensajería y texto `"Asistente"`).
* **Solución requerida:**
  - En `index.html`, actualizar el título a `Sistema Café — Gestión de Cafetería`.
  - En `Layout.tsx`, actualizar subtítulo a `Gestión de Cafetería`, enlace a `Menú` y `Asistente` con ícono `MessageSquare` sobrio sin destellos.
  - En `SommelierHighlighter.tsx`, eliminar emojis (`✨`), destellos y rebautizar el cursor/banner a un indicador técnico o de co-navegación sobrio sin etiquetas de "Sommelier".

---

### BUG-04: Discrepancia impositiva (IVA 10% vs 12%) entre Vista de Carrito y Facturación Final del Backend
* **Severidad:** Media
* **Componentes afectados:** `frontend/src/pages/CustomerCartPage.tsx`, `frontend/src/context/CartContext.tsx`.
* **Descripción:**
  - En la pantalla del carrito (`CustomerCartPage`), el cálculo de impuestos se realiza al 10%:
    - Subtotal: $6.75
    - IVA (10%): $0.68
    - Total: **$7.42 USD**
  - Sin embargo, el backend (`OrderService.java`) aplica un IVA del 12% para la facturación:
    - Subtotal: $6.75
    - IVA (12%): $0.81
    - Total facturado: **$7.56 USD**
  - Esta desincronización genera desconcierto en el cliente, quien ve un precio en el resumen pero se le factura otro en la confirmación.
* **Solución requerida:**
  - Unificar la constante de cálculo de IVA en el frontend al 12% (`subtotal * 0.12`) para que coincida exactamente con la facturación real del backend.

---

### BUG-05: Puntos de lealtad no acreditados en la respuesta de confirmación de orden (+0 puntos)
* **Severidad:** Baja
* **Componentes afectados:** `CustomerCartPage.tsx`, `OrderService.java`, `CustomerService.java`.
* **Descripción:**
  - El carrito anuncia: *"Acumularás +7 puntos en tu cuenta"*.
  - En la pantalla de confirmación exitosa (`/carritocliente` post-checkout), se renderiza: *"Puntos Acumulados: +0 Puntos"*.
* **Solución requerida:**
  - Asegurar que el DTO de respuesta del pedido devuelva los puntos acumulados en la transacción (`order.getLoyaltyPointsEarned()`) y no 0.

---

### BUG-06: Textos y placeholders con jerga de tostaduría/granos en la vista de Carrito y Checkout
* **Severidad:** Baja
* **Componentes afectados:** `frontend/src/pages/CustomerCartPage.tsx`.
* **Descripción:**
  - El subtítulo indica: *"Revisa tus granos seleccionados, aplica descuentos de membresía y factura tu orden."*
  - El placeholder de notas de entrega dice: *"Ej: Molienda media para Chemex, empaque sellado..."*
  - Se deben alinear al dominio de cafetería (bebidas, repostería, temperatura, endulzante o mesa).
* **Solución requerida:**
  - Actualizar subtítulo a: *"Revisa tus productos seleccionados y confirma tu orden."*
  - Actualizar placeholder a: *"Ej: Sin azúcar, leche deslactosada, servir caliente, entregar en mesa 4..."*

---

### BUG-07: Error de recurso estático 404 en consola al entrar a `/carritocliente`
* **Severidad:** Menor
* **Componentes afectados:** `frontend/src/pages/CustomerCartPage.tsx` o imágenes en caché.
* **Descripción:**
  - Al ingresar a `/carritocliente`, se produce una petición fallida con status 404 en la consola del navegador.
* **Solución requerida:**
  - Auditar enlaces o imágenes en `CustomerCartPage` para evitar peticiones a rutas rotas o favicons inexistentes.

---
*Fin del registro de errores. Todos los bugs identificados fueron corregidos satisfactoriamente:*
- **BUG-01 [RESUELTO]:** Se configuró `JWT_SECRET` en `docker-compose.yml` para `mcp-client` y se actualizó `jwt_auth.py` para decodificar claves en formato Hex de 64 caracteres (`bytes.fromhex()`), garantizando paridad 1:1 con Spring Boot.
- **BUG-02 [RESUELTO]:** Se añadió `if (location.pathname === '/chat') return null` en `FloatingChatWidget.tsx` para evitar que tape el botón de envío.
- **BUG-03 [RESUELTO]:** Se eliminaron emojis y menciones de "Sommelier AI ✨" en `SommelierHighlighter.tsx`, se corrigió `<title>` en `index.html` a "Sistema Café — Gestión de Cafetería", y en `Layout.tsx` se cambió "Specialty Coffee Roasters" por "Gestión de Cafetería", "Tienda de Café" por "Menú" y "Asistente AI" por "Asistente" con ícono sobrio `MessageSquare`.
- **BUG-04 [RESUELTO]:** Se unificó la tasa de IVA al 12% (`0.12`) en `CustomerCartPage.tsx`, alineándola con el cálculo del backend.
- **BUG-05 [RESUELTO]:** Se añadió `loyaltyPointsEarned` en `OrderResponseDto.java` y `OrderMapper.java`, y se actualizó `CustomerCartPage.tsx` para mostrar los puntos calculados de la orden creada de forma persistente.
- **BUG-06 [RESUELTO]:** Se reemplazó el texto y placeholder de tostaduría por notas de cafetería real en `CustomerCartPage.tsx`.
- **BUG-07 [RESUELTO]:** Se depuraron las referencias y enlaces a imágenes/recursos en `CustomerCartPage.tsx`.
- **CI/CD [RESUELTO]:** Se corrigió la ruta de trabajo en `.github/workflows/ci.yml` de `mcp_service` a `cliente_service_mcp` y se validó el paso de frontend con `npm ci` y `vitest`.
