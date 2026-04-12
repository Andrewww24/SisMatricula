/**
 * Seed script — crea datos iniciales en la BD
 * Uso: npx tsx prisma/seed.ts
 *
 * Datos creados:
 *  - Roles (Estudiante, Administrador, Tesorería, Docente)
 *  - Provincia y Cantón base
 *  - Usuarios de prueba (admin, estudiante, tesorería, docente)
 *  - Carreras, Período activo, Aulas
 *  - Cursos y Grupos de ejemplo
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── Roles ────────────────────────────────────────────────────────────────
  const roles = [
    { id_rol: 1, descripcion: "Estudiante" },
    { id_rol: 2, descripcion: "Administrador" },
    { id_rol: 3, descripcion: "Tesorería" },
    { id_rol: 4, descripcion: "Docente" },
  ];

  for (const rol of roles) {
    await db.rol.upsert({
      where: { id_rol: rol.id_rol },
      update: {},
      create: rol,
    });
  }
  console.log("✅ Roles creados");

  // ─── Provincia base ───────────────────────────────────────────────────────
  const provincia = await db.provincia.upsert({
    where: { id_provincia: 1 },
    update: {},
    create: { id_provincia: 1, descripcion: "San José" },
  });

  // ─── Cantón base ─────────────────────────────────────────────────────────
  const canton = await db.canton.upsert({
    where: { id_canton: 1 },
    update: {},
    create: {
      id_canton: 1,
      id_provincia: provincia.id_provincia,
      descripcion: "San José",
    },
  });

  console.log("✅ Provincia y cantón creados");

  // ─── Admin por defecto ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin1234!", 12);

  await db.persona.upsert({
    where: { cedula: "1-0000-0001" },
    update: {},
    create: {
      cedula: "1-0000-0001",
      nombre: "Admin",
      apellidos: "Sistema",
      fecha_nacimiento: new Date("1990-01-01"),
      sexo: "M",
      email: "admin@unisistema.ac.cr",
      password_hash: passwordHash,
      id_rol: 2, // Administrador
      id_provincia: provincia.id_provincia,
      id_canton: canton.id_canton,
    },
  });

  console.log("✅ Usuario admin creado:");
  console.log("   Cédula:     1-0000-0001");
  console.log("   Contraseña: Admin1234!");

  // ─── Usuarios adicionales de prueba ───────────────────────────────────────
  const estudianteHash = await bcrypt.hash("Est1234!", 12);
  const tesoreHash = await bcrypt.hash("Tes1234!", 12);
  const docenteHash = await bcrypt.hash("Doc1234!", 12);

  await db.persona.upsert({
    where: { cedula: "1-0000-0002" },
    update: {},
    create: {
      cedula: "1-0000-0002",
      nombre: "María",
      apellidos: "González Mora",
      fecha_nacimiento: new Date("2002-05-15"),
      sexo: "F",
      email: "estudiante@unisistema.ac.cr",
      password_hash: estudianteHash,
      id_rol: 1,
      id_provincia: provincia.id_provincia,
      id_canton: canton.id_canton,
    },
  });

  await db.persona.upsert({
    where: { cedula: "1-0000-0003" },
    update: {},
    create: {
      cedula: "1-0000-0003",
      nombre: "Carlos",
      apellidos: "Pérez Jiménez",
      fecha_nacimiento: new Date("1985-03-20"),
      sexo: "M",
      email: "tesoreria@unisistema.ac.cr",
      password_hash: tesoreHash,
      id_rol: 3,
      id_provincia: provincia.id_provincia,
      id_canton: canton.id_canton,
    },
  });

  await db.persona.upsert({
    where: { cedula: "1-0000-0004" },
    update: {},
    create: {
      cedula: "1-0000-0004",
      nombre: "Luis",
      apellidos: "Ramírez Solano",
      fecha_nacimiento: new Date("1978-11-08"),
      sexo: "M",
      email: "docente@unisistema.ac.cr",
      password_hash: docenteHash,
      id_rol: 4,
      id_provincia: provincia.id_provincia,
      id_canton: canton.id_canton,
    },
  });

  console.log("✅ Usuarios de prueba creados (estudiante, tesorería, docente)");

  // ─── Carreras ─────────────────────────────────────────────────────────────
  const carreras = [
    { id_carrera: 1, descripcion: "Ingeniería en Sistemas" },
    { id_carrera: 2, descripcion: "Contabilidad" },
    { id_carrera: 3, descripcion: "Administración de Empresas" },
    { id_carrera: 4, descripcion: "Derecho" },
  ];

  for (const carrera of carreras) {
    await db.carrera.upsert({
      where: { id_carrera: carrera.id_carrera },
      update: {},
      create: carrera,
    });
  }
  console.log("✅ Carreras creadas");

  // ─── Período activo ───────────────────────────────────────────────────────
  const periodo = await db.periodo.upsert({
    where: { id_periodo: 1 },
    update: {},
    create: {
      id_periodo: 1,
      descripcion: "2026-I",
      fecha_inicio: new Date("2026-02-01"),
      fecha_fin: new Date("2026-06-30"),
    },
  });
  console.log("✅ Período 2026-I creado");

  // ─── Aulas ────────────────────────────────────────────────────────────────
  const aulas = [
    { id_aula: 1, nombre: "A-101", capacidad: 35, ubicacion: "Edificio A, Piso 1" },
    { id_aula: 2, nombre: "A-102", capacidad: 35, ubicacion: "Edificio A, Piso 1" },
    { id_aula: 3, nombre: "B-201", capacidad: 40, ubicacion: "Edificio B, Piso 2" },
    { id_aula: 4, nombre: "Lab-1", capacidad: 25, ubicacion: "Edificio C — Laboratorio" },
  ];

  for (const aula of aulas) {
    await db.aula.upsert({
      where: { id_aula: aula.id_aula },
      update: {},
      create: aula,
    });
  }
  console.log("✅ Aulas creadas");

  // ─── Cursos de ejemplo ────────────────────────────────────────────────────
  const cursos = [
    { id_curso: 1, descripcion: "Cálculo Diferencial", creditos: 4, id_carrera: 1 },
    { id_curso: 2, descripcion: "Programación I", creditos: 4, id_carrera: 1 },
    { id_curso: 3, descripcion: "Bases de Datos", creditos: 4, id_carrera: 1 },
    { id_curso: 4, descripcion: "Contabilidad General", creditos: 3, id_carrera: 2 },
    { id_curso: 5, descripcion: "Administración I", creditos: 3, id_carrera: 3 },
  ];

  for (const curso of cursos) {
    await db.curso.upsert({
      where: { id_curso: curso.id_curso },
      update: {},
      create: curso,
    });
  }
  console.log("✅ Cursos creados");

  // ─── Grupos de ejemplo ────────────────────────────────────────────────────
  const grupos = [
    { id_grupo: 1, descripcion: "Grupo 01", id_curso: 1, id_carrera: 1, id_periodo: periodo.id_periodo, id_aula: 1, cupo_maximo: 35 },
    { id_grupo: 2, descripcion: "Grupo 02", id_curso: 1, id_carrera: 1, id_periodo: periodo.id_periodo, id_aula: 2, cupo_maximo: 35 },
    { id_grupo: 3, descripcion: "Grupo 01", id_curso: 2, id_carrera: 1, id_periodo: periodo.id_periodo, id_aula: 4, cupo_maximo: 25 },
    { id_grupo: 4, descripcion: "Grupo 01", id_curso: 3, id_carrera: 1, id_periodo: periodo.id_periodo, id_aula: 3, cupo_maximo: 30 },
  ];

  for (const grupo of grupos) {
    await db.grupo.upsert({
      where: { id_grupo: grupo.id_grupo },
      update: {},
      create: grupo,
    });
  }
  console.log("✅ Grupos creados");

  // ─── Horarios de ejemplo ──────────────────────────────────────────────────
  // Borrar y recrear sin IDs explícitos para que la secuencia quede sincronizada
  await db.horario.deleteMany({});
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"public"."horarios"', 'id_horario'), 1, false)`;
  await db.horario.createMany({
    data: [
      // Cálculo Diferencial G01 — Lunes y Miércoles 7-9am
      { id_grupo: 1, dia_semana: 1, hora_inicio: new Date("1970-01-01T07:00:00Z"), hora_fin: new Date("1970-01-01T09:00:00Z") },
      { id_grupo: 1, dia_semana: 3, hora_inicio: new Date("1970-01-01T07:00:00Z"), hora_fin: new Date("1970-01-01T09:00:00Z") },
      // Programación I G01 — Martes y Jueves 10-12am
      { id_grupo: 3, dia_semana: 2, hora_inicio: new Date("1970-01-01T10:00:00Z"), hora_fin: new Date("1970-01-01T12:00:00Z") },
      { id_grupo: 3, dia_semana: 4, hora_inicio: new Date("1970-01-01T10:00:00Z"), hora_fin: new Date("1970-01-01T12:00:00Z") },
      // Bases de Datos G01 — Viernes 1-4pm
      { id_grupo: 4, dia_semana: 5, hora_inicio: new Date("1970-01-01T13:00:00Z"), hora_fin: new Date("1970-01-01T16:00:00Z") },
    ],
  });
  console.log("✅ Horarios creados");

  console.log("\n📋 Credenciales de prueba:");
  console.log("   Admin:      1-0000-0001 / Admin1234!");
  console.log("   Estudiante: 1-0000-0002 / Est1234!");
  console.log("   Tesorería:  1-0000-0003 / Tes1234!");
  console.log("   Docente:    1-0000-0004 / Doc1234!");
  console.log("\n⚠️  Cambia las contraseñas en producción!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
