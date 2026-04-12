# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands must be run from the `app/` directory:

```bash
cd app

npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # Run ESLint
npx prisma studio # Open Prisma GUI to inspect the database
npx prisma generate  # Regenerate Prisma Client after schema changes
npx prisma db push   # Push schema changes to Supabase (dev only)
```

> **Note from AGENTS.md:** This project uses Next.js with potential breaking changes from training data. Read relevant docs in `node_modules/next/dist/docs/` before writing code.

## Architecture

### Stack
- **Next.js 16** (App Router) with TypeScript
- **Prisma ORM** → **PostgreSQL on Supabase** (two connection URLs: `DATABASE_URL` for pooled, `DIRECT_URL` for migrations)
- **NextAuth v5 (beta)** with JWT strategy and Credentials provider
- **Tailwind CSS v4**

### Route Groups & Role Guards
The app uses Next.js route groups to enforce role-based access at the layout level:

| Route Group | Layout file | Required role |
|---|---|---|
| `(admin)` | `src/app/(admin)/layout.tsx` | `id_rol = 2` (ADMIN) |
| `(estudiante)` | `src/app/(estudiante)/layout.tsx` | `id_rol = 1` (ESTUDIANTE) |
| `(auth)` | — | Public |

Role IDs are defined in `src/lib/api-helpers.ts`:
```ts
ROLES = { ESTUDIANTE: 1, ADMIN: 2, TESORERIA: 3, DOCENTE: 4 }
```

### API Layer Pattern
All route handlers in `src/app/api/` follow a consistent pattern:

1. Call `requireRoles([...])` from `src/lib/api-helpers.ts` — returns `{ session, response }`. If `response` is non-null, return it immediately.
2. Use `ok()`, `created()`, `err()` helpers for all responses (wrap `NextResponse.json` with `{ ok, data/error }` envelope).
3. Use the singleton `db` from `src/lib/db.ts` (global Prisma instance, prevents connection exhaustion in dev hot-reload).

### Authentication Flow
- Login via `cedula` (national ID) + password at `/login`
- `auth()` (from `src/lib/auth.ts`) is the single entry point for session access in both server components and API routes
- Session JWT carries `cedula` and `role` (numeric)
- Accounts can be `bloqueado` or `moroso` — both block enrollment

### Core Business Logic: Enrollment (RF-12)
The enrollment endpoint `POST /api/matricula` enforces all rules in sequence:
1. Account not blocked/moroso
2. Group exists and is active
3. Not already enrolled in the same group
4. Cupo (capacity) available — if full, adds to `lista_espera` instead
5. Credit limit: max 18 credits per period
6. No schedule conflicts (checks `Horario.dia_semana` + time overlap)
7. Prerequisites: all `PreRequisito` courses must have a `confirmada` matricula

Enrollment uses `db.$transaction` + `upsert` on the unique constraint `[cedula_persona, id_grupo]` to handle reactivation of cancelled enrollments atomically.

### Data Model Key Relations
```
Persona (cedula PK) → Matricula → Grupo → Curso → Carrera
                                        → Horario
                                        → Aula
                                        → Periodo
Persona → Pago → Factura
Persona → BitacoraAuditoria
```
The `Matricula.estado` field uses string values: `"pendiente"`, `"confirmada"`, `"cancelada"`.

### Environment Variables Required
```
DATABASE_URL    # Pooled Supabase connection (Prisma queries)
DIRECT_URL      # Direct Supabase connection (migrations)
AUTH_SECRET     # NextAuth secret
```
