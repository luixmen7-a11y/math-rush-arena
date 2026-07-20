# 🏋️ Puntos ONEX — Guía de configuración

Sistema de fidelización seguro para el gimnasio ONEX (Alto Hospicio).
El saldo real vive en el **servidor**, nunca en el navegador. Un usuario con DevTools
NO puede inflar su saldo, generar códigos, reutilizarlos ni superar el tope diario.

---

## 1. Crear la base de datos (Upstash Redis — gratis)

1. Entra al dashboard de Vercel → tu proyecto **math-rush-arena**.
2. Pestaña **Storage** → **Create Database** → elige **Upstash** → **Redis**.
3. Nombre cualquiera (ej. `onex-points`), región cercana (ej. `us-east-1` o `sa-east-1`).
4. Al crearla, pulsa **Connect Project** → selecciona **math-rush-arena** → **Connect**.
   - Esto inyecta solo `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`
     como variables de entorno automáticamente. No tienes que copiarlas a mano.

## 2. Configurar las variables secretas

Dashboard → proyecto → **Settings** → **Environment Variables** → agrega dos:

| Nombre | Valor | Cómo generarlo |
|---|---|---|
| `STAFF_PIN` | el PIN que usará el staff (4–8 dígitos) | invéntalo, ej. `4729` |
| `SESSION_SECRET` | secreto aleatorio largo | ver comando abajo |

Para generar `SESSION_SECRET`, en tu PC ejecuta:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copia el resultado (64 caracteres) como valor. Marca las 3 variables para
**Production, Preview y Development**.

## 3. Redesplegar

Cada vez que cambias variables de entorno hay que redeployar para que tomen efecto:
```
npx vercel deploy --prod --yes
```
(o desde el dashboard: Deployments → ⋯ del último → **Redeploy**).

## 4. Probar que todo funciona

```
node tests/fraud-test.mjs https://math-rush-arena-hazel.vercel.app 4729
```
(reemplaza `4729` por tu STAFF_PIN). Debe terminar con `N pasadas · 0 fallidas`.

---

## Cómo se usa en el día a día

### Cliente (jugador)
- Abre el juego → lobby → tarjeta **🏋️ Puntos ONEX** → se registra 1 vez (nombre + teléfono).
- Juega: cada respuesta correcta **+2**, victoria **+10**, combo x5 **+5** (máx **60/día**).
- Canjea premios → recibe un **código de 8 caracteres** (válido 15 min) → lo muestra en recepción.
- Ingresa **códigos de bonus** de 6 caracteres que le entrega el staff al comprar producto.

### Staff (recepción) — `https://tu-app.vercel.app/staff`
- Entra con su nombre + PIN.
- **🎫 Bonus**: cliente compra Agua/Score → genera código (+30 / +100 / +100+Dragón).
- **🎁 Canjes**: cliente muestra su código de premio → **Verificar** → ver premio/nombre/tel →
  **Marcar entregado**.
- **📋 Historial**: todos los códigos del día y su estado.

---

## Economía (valores exactos)

| Acción | Puntos |
|---|---|
| Respuesta correcta | +2 |
| Victoria de partida | +10 |
| Combo x5 (Modo Genio) | +5 |
| **Tope diario** | **60** |
| Racha 3 días seguidos | +10 (fuera del tope) |

| Bonus por compra | Puntos |
|---|---|
| Agua | +30 |
| Score | +100 |
| 2 Scores | +100 y desbloquea 🐉 Dragón Dorado ONEX |

*(Los bonus por compra NO cuentan para el tope diario de 60.)*

| Premio | Costo | Límite de canje |
|---|---|---|
| Agua Cielo 625ml | 150 | 2 por semana |
| Score | 350 | 2 por semana |
| Día gratis de gimnasio | 500 | 1 cada 14 días |
| Semana gratis de gimnasio | 2000 | 1 cada 90 días |

*Si un código de canje expira sin usarse (15 min), los puntos se devuelven solos.*

---

## Seguridad — por qué no se puede hacer trampa

- **El cliente nunca envía "cuántos puntos gané".** Solo notifica eventos (`correct`/`win`/`combo5`)
  y el **servidor** asigna 2/10/5. Cambiar el JS del navegador no cambia el cálculo del servidor.
- **Token de sesión firmado (HMAC-SHA256).** Sin el `SESSION_SECRET` (que solo está en el servidor)
  es imposible fabricar un token válido.
- **Coherencia temporal:** no se aceptan 2 respuestas en <6s ni una victoria en <90s.
- **Rate limiting:** máx 12 eventos/min, 5 intentos de PIN/15min, etc.
- **Tope diario atómico (60)** verificado en Redis, imposible de superar desde el cliente.
- **Códigos de un solo uso** (`GETDEL` atómico) que expiran.

### Riesgo residual (honesto)
Sin cuentas con contraseña, alguien podría crear **varias identidades** (varios registros) para
sumar más de 60/día en total. La defensa real es el **canje presencial**: el staff verifica
nombre + últimos 4 dígitos del teléfono antes de entregar el premio. Si más adelante quieres
cerrar del todo esa puerta, se agrega verificación por SMS/WhatsApp (tiene costo por mensaje).
