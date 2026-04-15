# SisMatrícula — Sistema de Matrícula Universitaria

Plataforma web para gestión de matrícula académica, pagos y administración de cursos.

## Stack

- **Next.js 16** (App Router) con TypeScript
- **Prisma ORM** → **PostgreSQL en Supabase**
- **NextAuth v5 (beta)** — autenticación con JWT y Credentials provider
- **Tailwind CSS v4**

## Requisitos

- Node.js 18+
- Acceso a una instancia de Supabase (PostgreSQL)

## Variables de entorno

Crear un archivo `.env.local` en `app/` con:

```env
DATABASE_URL=     # Conexión pooled de Supabase (para queries)
DIRECT_URL=       # Conexión directa de Supabase (para migraciones)
AUTH_SECRET=      # Secret para NextAuth (genera con: openssl rand -base64 32)
```

## Comandos

Todos los comandos deben ejecutarse desde el directorio `app/`:

```bash
npm run dev          # Servidor de desarrollo en localhost:3000
npm run build        # Build de producción
npm run lint         # ESLint

npx prisma generate  # Regenerar Prisma Client tras cambios en schema
npx prisma db push   # Aplicar cambios del schema a Supabase (solo dev)
npx prisma studio    # GUI para inspeccionar la base de datos
```

## Roles y acceso

| Rol | ID | Rutas |
|---|---|---|
| Estudiante | 1 | `/dashboard`, `/matricula`, `/estado-cuenta` |
| Admin | 2 | `/admin/gestion/*`, `/admin/auditoria`, `/admin/reportes` |
| Tesorería | 3 | Acceso a reportes financieros |
| Docente | 4 | — |

El login se realiza con `cédula` + contraseña en `/login`.

## Requerimientos implementados

| RF | Descripción | Estado |
|---|---|---|
| RF-01 | Autenticación con credenciales | ✅ |
| RF-02 | Roles y permisos por layout | ✅ |
| RF-03 | Bitácora de auditoría | ✅ |
| RF-04 | Gestión de carreras | ✅ |
| RF-05 | Catálogo de cursos | ✅ |
| RF-06 | Gestión de períodos académicos | ✅ |
| RF-07 | Configuración de prerrequisitos y correquisitos | ✅ |
| RF-08 | Creación de secciones (grupos) | ✅ |
| RF-09 | Administración de horarios y aulas | ✅ |
| RF-10 | Control de cupos por sección | ✅ |
| RF-11 | Visualización de oferta académica | ✅ |
| RF-12 | Validaciones de matrícula (cupo, horario, prereqs, coreqs, créditos, morosidad) | ✅ |
| RF-13 | Comprobante de matrícula | ✅ |
| RF-14 | Ajustes en período autorizado | ✅ |
| RF-15 | Cálculo de costos de matrícula | ✅ |
| RF-16 | Estado de cuenta del estudiante | ✅ |
| RF-17 | Simulación de pasarela de pago | ✅ |
| RF-18 | Bloqueo por morosidad | ✅ |
| RF-19 | Registro de pagos | ✅ |
| RF-20 | Reportes de matrícula | ✅ |
| RF-21 | Reportes financieros | ✅ |
| RF-22 | Exportación CSV | ✅ |
| RF-23 | Notificaciones in-app de matrícula | ✅ |
| RF-24 | Notificaciones in-app de pagos | ✅ |

## Estructura de carpetas clave

```
app/src/
├── app/
│   ├── (admin)/          # Rutas protegidas rol Admin
│   │   └── admin/
│   │       ├── gestion/  # Cursos, grupos, carreras, períodos
│   │       ├── auditoria/
│   │       └── reportes/
│   ├── (estudiante)/     # Rutas protegidas rol Estudiante
│   │   ├── matricula/
│   │   └── estado-cuenta/
│   ├── (auth)/           # Login (público)
│   └── api/              # Route handlers
│       ├── matricula/
│       ├── prerequisitos/
│       ├── pagos/
│       ├── cursos/
│       ├── grupos/
│       └── ...
├── lib/
│   ├── db.ts             # Singleton de Prisma
│   ├── auth.ts           # Configuración NextAuth
│   ├── api-helpers.ts    # requireRoles, ok(), err(), created()
│   ├── auditoria.ts      # Helper para BitacoraAuditoria
│   └── notificacion.ts   # Helper para notificaciones in-app
prisma/
└── schema.prisma         # Modelos de la base de datos
```

## Flujo de matrícula (RF-12)

`POST /api/matricula` valida en orden:

1. Cuenta no bloqueada ni morosa
2. Grupo existe y está activo
3. No inscrito previamente en el mismo grupo
4. Cupo disponible (si no, agrega a `lista_espera`)
5. Límite de 18 créditos por período
6. Sin choque de horario
7. Prerrequisitos aprobados (`estado = "confirmada"`)
8. Correquisitos inscritos en el mismo período

## Prerrequisitos y correquisitos (RF-07)

- **Admin**: botón "Requisitos" en `/admin/gestion/cursos` para asignar/eliminar
- **Estudiante**: ícono ⓘ en la oferta académica para consultar requisitos de cada curso
- La API detecta ciclos automáticamente (A→B→A es rechazado)
- Endpoints: `GET/POST /api/prerequisitos`, `DELETE /api/prerequisitos/[id]`
