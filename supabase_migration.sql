-- ============================================================
-- MIGRACIÓN: SQL Server → PostgreSQL (Supabase)
-- Base de datos: MatriculaDB
-- ============================================================
-- Instrucciones:
--   1. Copia este contenido completo
--   2. En Supabase → SQL Editor → New query → Pega y ejecuta
-- ============================================================

-- ─── TABLAS DE CATÁLOGO (sin dependencias) ─────────────────

CREATE TABLE roles (
  id_rol      SERIAL PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE provincia (
  id_provincia SERIAL PRIMARY KEY,
  descripcion  VARCHAR(100) NOT NULL,
  activo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_auditoria (
  id_tipo_auditoria SERIAL PRIMARY KEY,
  descripcion       VARCHAR(100) NOT NULL,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_descuento (
  id_tipo_descuento SERIAL PRIMARY KEY,
  descripcion       VARCHAR(100) NOT NULL,
  porcentaje        NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  activo            BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tipo_notificacion (
  id_tipo_notificacion SERIAL PRIMARY KEY,
  descripcion          VARCHAR(100) NOT NULL,
  activo               BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE metodos_pago (
  id_metodo_pago SERIAL PRIMARY KEY,
  descripcion    VARCHAR(100) NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE periodos (
  id_periodo  SERIAL PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_inicio DATE NOT NULL,
  fecha_fin    DATE NOT NULL
);

CREATE TABLE carreras (
  id_carrera  SERIAL PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE aula (
  id_aula   SERIAL PRIMARY KEY,
  nombre    VARCHAR(50) NOT NULL,
  capacidad INT NOT NULL DEFAULT 0,
  ubicacion VARCHAR(150),
  activo    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── TABLAS GEOGRÁFICAS ────────────────────────────────────

CREATE TABLE canton (
  id_canton   SERIAL PRIMARY KEY,
  id_provincia INT NOT NULL REFERENCES provincia(id_provincia),
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE distrito (
  id_distrito SERIAL PRIMARY KEY,
  id_canton   INT NOT NULL REFERENCES canton(id_canton),
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── PERSONA ───────────────────────────────────────────────
-- Nota: cedula es la PK (string), no un auto-incremental

CREATE TABLE persona (
  cedula           VARCHAR(20) PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo             CHAR(1) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  telefono         VARCHAR(20),
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  bloqueado        BOOLEAN NOT NULL DEFAULT FALSE,
  moroso           BOOLEAN NOT NULL DEFAULT FALSE,
  id_provincia     INT NOT NULL REFERENCES provincia(id_provincia),
  id_canton        INT NOT NULL REFERENCES canton(id_canton),
  id_rol           INT NOT NULL REFERENCES roles(id_rol)
);

-- ─── CURSOS ────────────────────────────────────────────────

CREATE TABLE cursos (
  id_curso    SERIAL PRIMARY KEY,
  descripcion VARCHAR(150) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  id_carrera  INT NOT NULL REFERENCES carreras(id_carrera),
  creditos    INT NOT NULL DEFAULT 0
);

CREATE TABLE pre_requisitos (
  id_prerequisito SERIAL PRIMARY KEY,
  id_curso        INT NOT NULL REFERENCES cursos(id_curso),
  id_curso_req    INT NOT NULL REFERENCES cursos(id_curso)
);

CREATE TABLE correquisitos (
  id_correquisito SERIAL PRIMARY KEY,
  id_curso        INT NOT NULL REFERENCES cursos(id_curso),
  id_curso_coreq  INT NOT NULL REFERENCES cursos(id_curso)
);

-- ─── GRUPOS Y HORARIOS ─────────────────────────────────────

CREATE TABLE grupos (
  id_grupo    SERIAL PRIMARY KEY,
  descripcion VARCHAR(100) NOT NULL,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  id_curso    INT NOT NULL REFERENCES cursos(id_curso),
  id_carrera  INT NOT NULL REFERENCES carreras(id_carrera),
  id_periodo  INT NOT NULL REFERENCES periodos(id_periodo),
  id_aula     INT NOT NULL REFERENCES aula(id_aula),
  cupo_maximo INT NOT NULL DEFAULT 30,
  cupo_actual INT NOT NULL DEFAULT 0
);

CREATE TABLE horarios (
  id_horario  SERIAL PRIMARY KEY,
  id_grupo    INT NOT NULL REFERENCES grupos(id_grupo),
  dia_semana  SMALLINT NOT NULL,   -- 1=Lunes … 7=Domingo
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL
);

-- ─── MATRÍCULA ─────────────────────────────────────────────

CREATE TABLE matricula (
  id_matricula       SERIAL PRIMARY KEY,
  cedula_persona     VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  id_grupo           INT NOT NULL REFERENCES grupos(id_grupo),
  id_periodo         INT NOT NULL REFERENCES periodos(id_periodo),
  estado             VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  fecha_matricula    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_confirmacion TIMESTAMPTZ,
  observaciones      VARCHAR(500),
  CONSTRAINT uq_matricula_persona_grupo UNIQUE (cedula_persona, id_grupo)
);

CREATE TABLE lista_espera (
  id_espera       SERIAL PRIMARY KEY,
  cedula_persona  VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  id_grupo        INT NOT NULL REFERENCES grupos(id_grupo),
  fecha_registro  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PAGOS Y FACTURACIÓN ───────────────────────────────────

CREATE TABLE pagos (
  id_pago             SERIAL PRIMARY KEY,
  id_metodo_pago      INT NOT NULL REFERENCES metodos_pago(id_metodo_pago),
  cedula_persona      VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  id_matricula        INT REFERENCES matricula(id_matricula),
  monto               NUMERIC(10,2) NOT NULL,
  saldo               NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  referencia_externa  VARCHAR(100),
  fecha_pago          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE factura (
  id_factura     SERIAL PRIMARY KEY,
  id_pago        INT NOT NULL REFERENCES pagos(id_pago),
  cedula_persona VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  id_matricula   INT NOT NULL REFERENCES matricula(id_matricula),
  monto_total    NUMERIC(10,2) NOT NULL,
  descuento      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  monto_neto     NUMERIC(10,2) NOT NULL,
  fecha_emision  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descripcion    VARCHAR(500)
);

-- ─── DESCUENTOS ────────────────────────────────────────────

CREATE TABLE persona_descuento (
  id_persona_descuento SERIAL PRIMARY KEY,
  cedula_persona       VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  id_tipo_descuento    INT NOT NULL REFERENCES tipo_descuento(id_tipo_descuento),
  fecha_inicio         DATE NOT NULL,
  fecha_fin            DATE,
  activo               BOOLEAN NOT NULL DEFAULT TRUE
);

-- ─── NOTIFICACIONES ────────────────────────────────────────

CREATE TABLE notificaciones (
  id_notificacion      SERIAL PRIMARY KEY,
  id_tipo_notificacion INT NOT NULL REFERENCES tipo_notificacion(id_tipo_notificacion),
  cedula_persona       VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  asunto               VARCHAR(200) NOT NULL,
  mensaje              TEXT NOT NULL,
  canal                VARCHAR(20) NOT NULL DEFAULT 'email',
  estado_envio         VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  fecha_envio          TIMESTAMPTZ,
  fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BITÁCORA DE AUDITORÍA ─────────────────────────────────

CREATE TABLE bitacora_auditoria (
  id_bitacora       BIGSERIAL PRIMARY KEY,
  id_tipo_auditoria INT NOT NULL REFERENCES tipo_auditoria(id_tipo_auditoria),
  cedula_usuario    VARCHAR(20) NOT NULL REFERENCES persona(cedula),
  tabla_afectada    VARCHAR(100) NOT NULL,
  id_registro       VARCHAR(50) NOT NULL,
  accion            VARCHAR(20) NOT NULL,
  descripcion       TEXT,
  ip_origen         VARCHAR(45),
  fecha_accion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

INSERT INTO roles (descripcion) VALUES
  ('Estudiante'),
  ('Administrador'),
  ('Tesorería'),
  ('Docente');

INSERT INTO tipo_auditoria (descripcion) VALUES
  ('Inicio de sesión'),
  ('Matrícula'),
  ('Pago'),
  ('Modificación de datos'),
  ('Eliminación');

INSERT INTO metodos_pago (descripcion) VALUES
  ('Transferencia bancaria'),
  ('Tarjeta de crédito'),
  ('Tarjeta de débito'),
  ('Efectivo');

INSERT INTO tipo_notificacion (descripcion) VALUES
  ('Matrícula confirmada'),
  ('Pago recibido'),
  ('Lista de espera'),
  ('Recordatorio de pago'),
  ('Cambio de horario');
