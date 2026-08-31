# Citas

Aplicación web de gestión de citas personales. Permite crear, editar y
eliminar citas con nombre, fecha, hora, lugar y archivo adjunto opcional
(imagen o PDF) que se almacena en Google Drive. Incluye autenticación
por login (sin registro público) y un sistema de recordatorios por
correo electrónico que se ejecuta una vez al día.

Diseñada con **Next.js 16 (App Router)**, **Prisma 7** sobre **PostgreSQL**,
y un frontend en **React 19** con tema oscuro. Sigue una arquitectura
limpia (Repository / Service / Server Action) y patrones de Atomic
Design en los componentes.

---

## Tabla de contenidos

- [Stack técnico](#stack-técnico)
- [Prerrequisitos](#prerrequisitos)
- [Gestor de paquetes](#gestor-de-paquetes)
- [Instalación](#instalación)
- [Configuración de entorno](#configuración-de-entorno)
- [Base de datos y seed](#base-de-datos-y-seed)
- [Desarrollo](#desarrollo)
- [Build y producción](#build-y-producción)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Recordatorio diario por correo](#recordatorio-diario-por-correo)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Comandos útiles](#comandos-útiles)
- [Seguridad](#seguridad)
- [Solución de problemas](#solución-de-problemas)

---

## Stack técnico

| Capa | Tecnología |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| UI | [React 19](https://react.dev), [Tailwind CSS v4](https://tailwindcss.com) |
| Lenguaje | [TypeScript 5](https://www.typescriptlang.org) (strict) |
| ORM | [Prisma 7](https://www.prisma.io) con `@prisma/adapter-pg` |
| Base de datos | PostgreSQL 14+ |
| Autenticación | JWT firmado con [`jose`](https://github.com/panva/jose), contraseñas hasheadas con [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) |
| Validación | [Zod 4](https://zod.dev) |
| Almacenamiento de archivos | [Google Drive API](https://developers.google.com/drive) v3 |
| Correo transaccional | [Nodemailer](https://nodemailer.com) con SMTP de Gmail |
| Scheduler | [Vercel Cron](https://vercel.com/docs/cron-jobs) |
| Proxy / Middleware | `proxy.ts` (Next 16) ejecutando en Edge Runtime |

---

## Prerrequisitos

Antes de empezar necesitás:

- **Node.js 20.9+** (requerido por Next.js 16)
- **pnpm 10+** (gestor de paquetes recomendado; ver abajo)
- **PostgreSQL 14+** corriendo localmente o accesible por red
- Una **cuenta de Google** con acceso a Google Drive y (opcional, para el
  recordatorio por correo) con 2FA activado para poder generar
  *App Passwords*
- (Opcional, para producción) Una **cuenta de Vercel**

Verificá tu entorno:

```bash
node --version    # >= v20.9
pnpm --version    # >= 10
psql --version    # >= 14
```

---

## Gestor de paquetes

Este proyecto usa **[pnpm](https://pnpm.io)**. El archivo
`pnpm-lock.yaml` está commiteado y `package.json` declara
`"packageManager": "pnpm@..."` para que Corepack lo respete
automáticamente.

No uses `npm install` ni `yarn install`: cambian el lockfile y rompen la
reproducibilidad del build. Si todavía no tenés pnpm:

```bash
# Opción A — vía Corepack (recomendado, viene con Node 20+)
corepack enable
corepack prepare pnpm@latest --activate

# Opción B — instalador standalone
npm install -g pnpm
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd documents
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar las variables de entorno

Copiá el archivo de ejemplo y editá los valores (ver [Configuración de
entorno](#configuración-de-entorno) para el detalle de cada variable):

```bash
cp .env.example .env
```

### 4. Levantar la base de datos

Asegurate de que tu PostgreSQL esté corriendo y de que la base exista:

```bash
# Si usás Docker:
docker run --name citas-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=citas -p 5432:5432 -d postgres:16

# O usá una instancia remota (Supabase, Neon, RDS, etc.) y copiá la
# connection string a DATABASE_URL en tu .env.
```

### 5. Aplicar migraciones y sembrar usuarios

```bash
pnpm prisma migrate dev
pnpm prisma db seed
```

El seed crea los usuarios iniciales — **no hay registro público**, las
cuentas se aprovisionan únicamente por este mecanismo. Ver [Base de
datos y seed](#base-de-datos-y-seed).

### 6. Iniciar el servidor de desarrollo

```bash
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador. El
proxy te redirige automáticamente a `/login`.

---

## Configuración de entorno

Todas las variables viven en `.env` (local) y en el panel de
**Environment Variables** del proyecto en Vercel (producción). El
archivo `.env` está en `.gitignore`; el archivo `.env.example` está
commiteado y lista **todas** las variables necesarias con valores de
ejemplo — **nunca commitees valores reales**.

> **Generá los secretos con este formato:** `openssl rand -base64 48`
> da 64 caracteres base64, suficiente para JWT y para el `CRON_SECRET`.

### Variables requeridas

| Variable | Descripción | Cómo obtenerla |
| --- | --- | --- |
| `DATABASE_URL` | URL de conexión a PostgreSQL (`postgresql://user:pass@host:port/db`) | Tu proveedor de Postgres |
| `AUTH_SECRET` | Secreto para firmar los JWT de sesión (mín. 32 chars) | `openssl rand -base64 48` |
| `CRON_SECRET` | Token Bearer que protege la ruta del recordatorio diario | `openssl rand -base64 32` |
| `GMAIL_USER` | Cuenta de Gmail que envía los recordatorios | Una dirección de Gmail |
| `GMAIL_APP_PASSWORD` | App Password de 16 caracteres (no la contraseña normal) | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requiere 2FA) |
| `GOOGLE_DRIVE_PARENT_FOLDER_ID` | ID de la carpeta raíz de Drive donde se suben los adjuntos | La URL de la carpeta, p. ej. `https://drive.google.com/drive/folders/<ESTE_ID>` |

### Variables opcionales

| Variable | Default | Descripción |
| --- | --- | --- |
| `EMAIL_TO` | `example@gmail.com` | Destinataria del recordatorio. Si coincide con un usuario registrado, sólo se incluyen sus citas. |
| `EMAIL_FROM` | `GMAIL_USER` | Dirección "From" visible (ej. `Citas <tu@gmail.com>`) |
| `SMTP_HOST` | `smtp.gmail.com` | Cambialo si usás otro proveedor |
| `SMTP_PORT` | `465` | Puerto SMTP |
| `SMTP_SECURE` | `true` | Usar TLS |

### Autenticación de Google Drive (elegí **una**)

La aplicación soporta dos modos. Si las dos están configuradas, gana
OAuth. Sólo necesitás las del modo que elijas.

**Modo OAuth (recomendado, usa tu cuenta personal):**

| Variable | Descripción |
| --- | --- |
| `GOOGLE_DRIVE_OAUTH_CLIENT_ID` | Client ID de la app OAuth de Google Cloud |
| `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` | Client Secret |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | Refresh token de larga duración |
| `GOOGLE_DRIVE_OAUTH_REDIRECT_URI` | (Opcional) Redirect URI; default `http://localhost` |

**Modo Service Account (para Google Workspace / uso automatizado):**

| Variable | Descripción |
| --- | --- |
| `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` | Email de la service account |
| `GOOGLE_DRIVE_PRIVATE_KEY` | Llave privada con `\n` literales escapados |
| `GOOGLE_DRIVE_IMPERSONATE_USER_EMAIL` | (Opcional) Usuario a impersonar |

> **Nota:** Gmail rechaza el envío de mail si la cuenta no tiene 2FA
> activado y se intenta usar la contraseña normal. Por eso
> `GMAIL_APP_PASSWORD` es **obligatorio** y **distinto** de la
> contraseña de la cuenta.

---

## Base de datos y seed

### Comandos principales

```bash
# Crear una nueva migración a partir de cambios en prisma/schema.prisma
pnpm prisma migrate dev --name <nombre-descriptivo>

# Aplicar migraciones pendientes en producción
pnpm prisma migrate deploy

# Regenerar el cliente de Prisma (después de tocar el schema)
pnpm prisma generate

# Cargar datos iniciales (idempotente)
pnpm prisma db seed
```

### Seed de usuarios

El seed vive en [`prisma/seed.ts`](./prisma/seed.ts) y crea cuentas de
ejemplo con contraseñas temporales. **Cambialas antes de cualquier
despliegue** o reemplazá el seed por uno que cree únicamente el usuario
administrador inicial con un password que vos elijas.

Los usuarios de ejemplo son únicamente para desarrollo local. **No los
uses en producción.**

---

## Desarrollo

```bash
pnpm dev          # Inicia Next.js + Turbopack en :3000
pnpm lint         # Corre ESLint
pnpm tsc --noEmit # Type-check sin emitir archivos
```

Durante el desarrollo:

- El servidor se reinicia automáticamente al guardar archivos
- Las Server Actions se recompilan on-demand (Turbopack)
- Los errores se muestran en la consola del servidor y en el overlay
  del navegador

### Probar el endpoint del cron manualmente

```bash
# Obtené el token del .env
export CRON_SECRET=$(grep '^CRON_SECRET=' .env | cut -d'=' -f2-)

# Disparalo a mano
curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/cron/daily-reminders | jq
```

La respuesta es un JSON con el detalle de la corrida:

```json
{
  "ok": true,
  "recipient": "example@gmail.com",
  "recipientUserId": "cmsth0zub...",
  "matchedCitas": 2,
  "matchedToday": 1,
  "matchedTomorrow": 1,
  "sent": true,
  "messageId": "<abc...@gmail.com>",
  "elapsedMs": 412
}
```

---

## Build y producción

```bash
pnpm build        # Compila para producción
pnpm start        # Sirve el build en :3000
```

El build genera:

- Páginas estáticas y dinámicas según corresponda
- Edge bundle para el proxy
- Service worker / manifest para PWA (si aplica)

El proyecto incluye un script de smoke test del pipeline de
recordatorios: `pnpm tsx scripts/test-reminder.ts`. Crea 2 citas de
prueba (hoy y mañana), valida el lookup, renderiza el email, y limpia
al final. Útil antes de un deploy para confirmar que el formato y la
query están bien.

---

## Despliegue en Vercel

1. Hacé push de la rama a GitHub/GitLab/Bitbucket
2. Importá el repositorio en [vercel.com/new](https://vercel.com/new)
3. Vercel detecta Next.js automáticamente y configura el build
4. En **Project Settings → Environment Variables**, cargá las mismas
   variables del `.env` (ver [Configuración de entorno](#configuración-de-entorno))
5. Deploy

### Cron job diario

[`vercel.json`](./vercel.json) declara el cron que se ejecuta una vez al
día. En el plan gratuito (Hobby) de Vercel el cron se ejecuta como
mínimo una vez al día.

```
crons:
  - path: /api/cron/daily-reminders
    schedule: 0 13 * * *       # 1pm UTC = 8am Colombia (UTC-5)
```

Vercel inyecta automáticamente el header
`Authorization: Bearer ${CRON_SECRET}` al disparar la URL, así que el
endpoint lo valida contra `process.env.CRON_SECRET`.

Para ver la próxima ejecución y el historial: **Project → Settings →
Cron Jobs**.

---

## Recordatorio diario por correo

El flujo completo:

1. Vercel cron dispara `GET /api/cron/daily-reminders` a las 8am hora
   de Colombia todos los días
2. El endpoint valida el Bearer token contra `CRON_SECRET` (401 si
   falla)
3. El service `citaReminderService` busca citas con `fecha` en el rango
   `[hoy 00:00 UTC, día-siguiente-al-de-mañana 00:00 UTC)`
4. Si el `EMAIL_TO` coincide con un usuario registrado, filtra a sus
   citas; si no, envía todas
5. Si hay ≥ 1 cita, renderiza el email (HTML dark + texto plano) y lo
   envía por SMTP usando Nodemailer + Gmail
6. Si no hay citas, responde 200 con `matchedCitas: 0, sent: false`
   (no se manda mail)

El email ordena las citas con **HOY primero, MAÑANA después**, y dentro
de cada grupo por hora. Cada cita muestra nombre, fecha, hora, lugar y
link al archivo adjunto en Drive (si tiene).

> **Nota sobre la zona horaria:** el `fecha` de cada cita se guarda
> como `YYYY-MM-DDT00:00:00Z` (UTC midnight). El "hoy" del cron
> también es UTC. Para el huso de Colombia (UTC-5), las citas
> cargadas con fecha local se matchean correctamente porque ambas
> puntas están en UTC.

---

## Estructura del proyecto

```
.
├── app/                              # Rutas (App Router)
│   ├── api/cron/daily-reminders/     # Endpoint del cron
│   ├── citas/                        # CRUD de citas
│   │   ├── [id]/page.tsx             # Editar
│   │   ├── nueva/page.tsx            # Crear
│   │   └── page.tsx                  # Listar
│   ├── login/page.tsx                # Login
│   ├── error.tsx                     # Error boundary global
│   ├── layout.tsx                    # Root layout
│   ├── not-found.tsx
│   └── page.tsx                      # Redirect a /citas
│
├── actions/                          # Server Actions
│   ├── auth.ts                       # loginAction, logoutAction
│   └── citas.ts                      # CRUD + listCitasAction
│
├── components/                       # Atomic Design
│   ├── atoms/                        # Button, Input, Label, Badge
│   ├── molecules/                    # FormField, FileUpload, SearchInput,
│   │                                 # DateFilter, LoadMoreButton, …
│   ├── organisms/                    # AppointmentForm, CitasExplorer, …
│   └── templates/                    # PageLayout
│
├── lib/                              # Infraestructura
│   ├── auth/                         # Sesión, password, config
│   ├── email/                        # Templates, transporter, config
│   ├── google-drive/service.ts       # Wrapper de la API de Drive
│   ├── prisma.ts                     # Singleton del cliente Prisma
│   ├── cn.ts                         # className combiner
│   ├── constants.ts                  # Tags de cache, límites
│   ├── date.ts                       # Formatters es-CO
│   └── validation/                   # Schemas Zod
│
├── repositories/                     # Acceso a datos
│   ├── citas.ts
│   └── users.ts
│
├── services/                         # Lógica de negocio
│   ├── auth.ts                       # verifyCredentials
│   ├── citas.ts                      # CRUD + paginación + filtros
│   ├── google-drive.ts               # Wrapper tipado
│   └── notifications/                # Recordatorios por mail
│
├── types/                            # DTOs y tipos compartidos
│
├── prisma/
│   ├── schema.prisma                 # Modelos + migraciones
│   ├── migrations/                   # Migraciones generadas
│   └── seed.ts                       # Script de seed
│
├── scripts/                          # Utilidades de dev
│   ├── test-session.ts               # Genera un JWT para tests con curl
│   ├── test-delete.ts                # Smoke test de la acción de delete
│   └── test-reminder.ts              # Smoke test del cron
│
├── prisma.config.ts                  # Config de Prisma 7
├── proxy.ts                          # Auth + redirects (Edge runtime)
├── vercel.json                       # Cron schedule
├── next.config.ts                    # Config de Next.js
├── tsconfig.json                     # Config de TypeScript
└── package.json
```

---

## Arquitectura

El backend sigue una **arquitectura por capas** estricta. La regla de
oro: las dependencias siempre apuntan hacia adentro, nunca hacia
afuera.

```
Page / Componente UI
       │ invoca
       ▼
Server Action (src/actions/)
       │ valida input + orquesta
       ▼
Service (src/services/)
       │ aplica reglas de negocio
       ▼
Repository (src/repositories/)
       │ única capa que toca Prisma
       ▼
Prisma Client (src/lib/prisma.ts)
       │
       ▼
PostgreSQL
```

**Frontend** sigue **Atomic Design**:

- **Atoms** — primitivos puros (Button, Input, Label). No tienen
  lógica de negocio.
- **Molecules** — combinaciones de atoms (FormField, SearchInput).
  Sin fetch, sin reglas de negocio.
- **Organisms** — secciones complejas que reciben datos por props y
  delegan mutaciones a Server Actions.
- **Templates** — layouts (PageLayout).

**Auth flow**:

```
1. Usuario → /login
2. loginAction valida con Zod → authService.verifyCredentials
3. Si OK: crea JWT (jose, HS256) y setea cookie httpOnly + secure
4. proxy.ts (Edge) verifica el JWT en cada request a /citas/*
   - Si falta o es inválido: 307 a /login?next=<path>
   - Si OK: agrega headers x-user-id y x-user-email al response
5. Server Components / Actions usan requireSession() para leer la sesión
   - Filtran todas las queries por session.userId
   - Ownership se enforcea a nivel service (mensaje genérico en
     404 para no leakear existencia)
```

---

## Comandos útiles

```bash
# ── Desarrollo ──
pnpm dev                              # Servidor de desarrollo
pnpm tsc --noEmit                     # Type-check
pnpm lint                             # ESLint

# ── Base de datos ──
pnpm prisma migrate dev --name X      # Nueva migración
pnpm prisma migrate deploy            # Aplicar migraciones (prod)
pnpm prisma generate                  # Regenerar cliente
pnpm prisma db seed                   # Cargar datos iniciales
pnpm prisma studio                    # GUI de la base

# ── Build ──
pnpm build                            # Compilar para producción
pnpm start                            # Servir el build

# ── Tests / smoke ──
pnpm tsx scripts/test-session.ts      # Generar un JWT (curl testing)
pnpm tsx scripts/test-delete.ts       # Validar delete + idempotencia
pnpm tsx scripts/test-reminder.ts     # Validar lookup + render del email
```

---

## Seguridad

- **Contraseñas** hasheadas con `bcryptjs` (cost factor 12)
- **Sesiones** firmadas con HS256 + secret de ≥32 caracteres en
  cookie `httpOnly`, `secure` (en prod) y `sameSite: "lax"`
- **Validación de entrada** con Zod en todas las Server Actions y en
  la query del cron
- **Timing-safe** el branch de "usuario no encontrado" en login hace
  un `bcrypt.compare` contra un hash dummy para evitar que un atacante
  enumere emails por tiempo de respuesta
- **Ownership** se chequea en todos los servicios (`session.userId`
  filtra las queries; `findById` y `delete` verifican pertenencia)
- **CSRF** mitigado por Next.js para Server Actions (firma interna
  del Next-Action header)
- **Open-redirect** mitigado en el `?next=` del login: Zod valida que
  sea un path relativo que empiece con `/` y no `//`
- **Proxy en Edge Runtime** corre antes de cualquier Server Component;
  cualquier path que no sea `/login` o asset estático requiere sesión
  válida
- **Endpoint del cron** protegido con Bearer token; no se ejecuta
  nada sin `Authorization: Bearer ${CRON_SECRET}`

Para reportar vulnerabilidades, abrí un issue privado en el
repositorio.

---

## Solución de problemas

### "Missing required env var: GMAIL_USER" al hacer build

El `EMAIL_CONFIG` se lee **lazy** (sólo cuando se necesita enviar un
mail), pero el endpoint del cron chequea el `CRON_SECRET` desde
`process.env` directamente. Si tu build local falla con ese error
durante la fase de "collect page data", asegurate de tener un valor
(aunque sea dummy) en `GMAIL_USER` en tu `.env`.

### El recordatorio no se manda aunque hay citas

1. Verificá los logs de la función en Vercel: **Project → Logs**.
   El endpoint loguea una línea por corrida.
2. Probá manualmente con curl (ver [Probar el endpoint del cron
   manualmente](#probar-el-endpoint-del-cron-manualmente)).
3. Verificá que `EMAIL_TO` esté bien escrito (case-insensitive, debe
   matchear el email de un usuario **o** un email válido).
4. Si Gmail rechaza la conexión, puede ser que la app password haya
   expirado o que la cuenta tenga 2FA desactivado. Regenerala.

### "Unauthorized" en el cron

El token en `Authorization: Bearer <X>` no coincide con
`process.env.CRON_SECRET` en producción. Asegurate de que la variable
esté definida en **Vercel → Project Settings → Environment
Variables** y que el deploy la haya tomado (redeploya si fue
modificada).

### Errores de Prisma: "Adapter not configured"

Este proyecto usa el adapter de Postgres (`@prisma/adapter-pg`)
porque Prisma 7 lo requiere. Si copiaste el `lib/prisma.ts` a otro
proyecto, asegurate de usar el patrón del adapter. Ver
[`lib/prisma.ts`](./lib/prisma.ts).

### Hot reload no toma cambios en Server Actions

Turbopack a veces cachea las actions. Si pasa, pará y re-levantá
`pnpm dev`.

---

## Licencia

Privado / no publicado.
