# SisMatrícula — Instrucciones del proyecto

## Descripción
Sistema de matrícula universitaria. Permite a estudiantes matricularse en grupos/cursos, gestionar pagos y facturas, y a admins gestionar el catálogo académico.

## Stack
- **Framework**: Next.js 16 (App Router, TypeScript)
- **Base de datos**: Supabase (PostgreSQL) via Prisma 6
- **ORM**: Prisma 6 — schema en `prisma/schema.prisma`
- **Auth**: NextAuth v5 (Auth.js beta)
- **Estilos**: Tailwind CSS v4
- **Deploy**: Vercel

## Comandos comunes

```bash
npm run dev          # servidor local en localhost:3000
npm run build        # build de producción
npm run lint         # linter ESLint

# Prisma (ejecutar siempre desde la raíz del proyecto)
npx prisma db push          # sincroniza schema con Supabase (sin migraciones)
npx prisma generate         # regenera el cliente tipado
npx prisma studio           # explorador visual de la BD en localhost:5555
```

## Estructura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # layout raíz
│   ├── page.tsx                # landing / login
│   ├── (auth)/login/           # autenticación
│   ├── (estudiante)/           # rutas protegidas: rol estudiante
│   │   ├── dashboard/
│   │   ├── matricula/
│   │   ├── horario/
│   │   └── pagos/
│   ├── (admin)/                # rutas protegidas: rol admin
│   │   ├── gestion/
│   │   ├── reportes/
│   │   └── auditoria/
│   └── api/                    # API Routes (serverless)
│       ├── auth/[...nextauth]/
│       ├── cursos/
│       ├── grupos/
│       ├── matricula/
│       └── pagos/
├── lib/
│   ├── db.ts          # singleton PrismaClient
│   └── supabase.ts    # cliente Supabase (anon key)
└── components/        # componentes React reutilizables
```

## Base de datos — tablas principales

| Tabla | Descripción |
|---|---|
| `persona` | Usuarios del sistema. PK = `cedula` (string). Tiene `id_rol` |
| `roles` | 1=Estudiante, 2=Administrador, 3=Tesorería, 4=Docente |
| `cursos` | Catálogo de cursos por carrera |
| `grupos` | Secciones de un curso en un periodo, con cupo y aula |
| `horarios` | Días/horas de cada grupo |
| `matricula` | Relación persona ↔ grupo. Estado: pendiente/confirmada/cancelada |
| `pagos` | Pagos asociados a matrículas |
| `factura` | Facturas generadas por cada pago |
| `bitacora_auditoria` | Log de todas las acciones del sistema |

## Convenciones de código

- Usar `db` de `@/lib/db` para consultas Prisma en Server Components y API Routes
- Nunca usar `SUPABASE_SERVICE_ROLE_KEY` en código cliente (solo en Server)
- Variables con prefijo `NEXT_PUBLIC_` son las únicas accesibles en el cliente
- Los roles se validan en el servidor — nunca confiar en el rol que viene del cliente
- Archivos de referencia de UI: `sistema_matricula.html`, `script.js`, `styles.css` (no borrar)

## Variables de entorno requeridas

```
DATABASE_URL          # Supabase pooled (pgbouncer) — usado por Prisma en runtime
DIRECT_URL            # Supabase direct — usado por Prisma CLI
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
AUTH_SECRET           # NextAuth secret
NEXTAUTH_URL          # http://localhost:3000 en dev
```

## Notas importantes

- `prisma db push` funciona solo desde la raíz `sismatricula/app/` (donde está el `.env`)
- El schema ya está sincronizado con Supabase — no hacer `db push` si hay datos en producción, usar migraciones
- El archivo `supabase_migration.sql` es el SQL equivalente para ejecutar manualmente si se necesita
- La UI de referencia está en `sistema_matricula.html` — tiene los 3 roles implementados: estudiante, admin, tesorería
