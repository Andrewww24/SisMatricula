/**
 * populate.ts — datos de demostración ampliados
 * Uso: npx tsx prisma/populate.ts
 *
 * Agrega (sin borrar lo existente):
 *  - Fechas de ajuste al período 2026-I (RF-14)
 *  - Período anterior 2025-II (cerrado)
 *  - 5 aulas adicionales
 *  - Cursos para las 4 carreras (~20 cursos nuevos)
 *  - Prerequisitos entre cursos de Sistemas
 *  - Grupos con horarios variados para el período activo
 *  - 4 estudiantes adicionales de prueba
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Convierte "HH:MM" → Date con fecha base 1970-01-01 (formato Prisma Time)
function t(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

async function main() {
  console.log("🌱 Populate: datos de demostración ampliados...\n");

  // ─── 1. Actualizar período 2026-I con fechas de ajustes ──────────────────
  await db.periodo.update({
    where: { id_periodo: 1 },
    data: {
      fecha_inicio_ajustes: new Date("2026-04-10"),
      fecha_fin_ajustes:    new Date("2026-04-25"),
    },
  });
  console.log("✅ Período 2026-I actualizado con fechas de ajustes (10–25 abr)");

  // ─── 2. Período anterior (cerrado) ───────────────────────────────────────
  await db.periodo.upsert({
    where:  { id_periodo: 2 },
    update: {},
    create: {
      id_periodo:   2,
      descripcion:  "2025-II",
      activo:       false,
      fecha_inicio: new Date("2025-07-01"),
      fecha_fin:    new Date("2025-11-30"),
    },
  });
  console.log("✅ Período 2025-II creado");

  // ─── 3. Aulas adicionales ─────────────────────────────────────────────────
  const aulasExtra = [
    { id_aula: 5, nombre: "A-201", capacidad: 40, ubicacion: "Edificio A, Piso 2" },
    { id_aula: 6, nombre: "B-101", capacidad: 35, ubicacion: "Edificio B, Piso 1" },
    { id_aula: 7, nombre: "B-202", capacidad: 30, ubicacion: "Edificio B, Piso 2" },
    { id_aula: 8, nombre: "Lab-2", capacidad: 20, ubicacion: "Edificio C — Laboratorio 2" },
    { id_aula: 9, nombre: "Auditorium", capacidad: 80, ubicacion: "Edificio Central" },
  ];
  for (const a of aulasExtra) {
    await db.aula.upsert({ where: { id_aula: a.id_aula }, update: {}, create: a });
  }
  console.log("✅ 5 aulas adicionales creadas");

  // ─── 4. Cursos ────────────────────────────────────────────────────────────
  // Sistemas (id_carrera: 1)
  const cursosSistemas = [
    { id_curso:  6, descripcion: "Estructuras de Datos",       creditos: 4, costo: 85000, id_carrera: 1 },
    { id_curso:  7, descripcion: "Programación II",            creditos: 4, costo: 85000, id_carrera: 1 },
    { id_curso:  8, descripcion: "Redes de Computadoras",      creditos: 3, costo: 65000, id_carrera: 1 },
    { id_curso:  9, descripcion: "Ingeniería de Software",     creditos: 4, costo: 85000, id_carrera: 1 },
    { id_curso: 10, descripcion: "Sistemas Operativos",        creditos: 3, costo: 65000, id_carrera: 1 },
    { id_curso: 11, descripcion: "Inteligencia Artificial",    creditos: 4, costo: 95000, id_carrera: 1 },
  ];
  // Contabilidad (id_carrera: 2)
  const cursosContabilidad = [
    { id_curso: 12, descripcion: "Contabilidad de Costos",     creditos: 3, costo: 65000, id_carrera: 2 },
    { id_curso: 13, descripcion: "Auditoría I",                creditos: 3, costo: 65000, id_carrera: 2 },
    { id_curso: 14, descripcion: "Finanzas Empresariales",     creditos: 4, costo: 85000, id_carrera: 2 },
    { id_curso: 15, descripcion: "Tributación",                creditos: 3, costo: 65000, id_carrera: 2 },
    { id_curso: 16, descripcion: "Contabilidad Gubernamental", creditos: 3, costo: 65000, id_carrera: 2 },
  ];
  // Administración (id_carrera: 3)
  const cursosAdmin = [
    { id_curso: 17, descripcion: "Administración II",          creditos: 3, costo: 65000, id_carrera: 3 },
    { id_curso: 18, descripcion: "Marketing Estratégico",      creditos: 3, costo: 65000, id_carrera: 3 },
    { id_curso: 19, descripcion: "Gestión de RRHH",            creditos: 3, costo: 65000, id_carrera: 3 },
    { id_curso: 20, descripcion: "Estadística para Negocios",  creditos: 4, costo: 85000, id_carrera: 3 },
  ];
  // Derecho (id_carrera: 4)
  const cursosDerecho = [
    { id_curso: 21, descripcion: "Introducción al Derecho",    creditos: 3, costo: 65000, id_carrera: 4 },
    { id_curso: 22, descripcion: "Derecho Civil",              creditos: 3, costo: 65000, id_carrera: 4 },
    { id_curso: 23, descripcion: "Derecho Penal",              creditos: 3, costo: 65000, id_carrera: 4 },
    { id_curso: 24, descripcion: "Derecho Laboral",            creditos: 3, costo: 65000, id_carrera: 4 },
    { id_curso: 25, descripcion: "Derecho Constitucional",     creditos: 4, costo: 85000, id_carrera: 4 },
  ];

  const todosCursos = [...cursosSistemas, ...cursosContabilidad, ...cursosAdmin, ...cursosDerecho];
  for (const c of todosCursos) {
    await db.curso.upsert({ where: { id_curso: c.id_curso }, update: {}, create: c });
  }
  console.log(`✅ ${todosCursos.length} cursos adicionales creados`);

  // ─── 5. Prerequisitos en Sistemas ────────────────────────────────────────
  // Prog II requiere Prog I; Estructuras requiere Prog I; IA requiere Prog II
  const prereqs = [
    { id_prerequisito: 1, id_curso: 7,  id_curso_req: 2 },  // Prog II → Prog I
    { id_prerequisito: 2, id_curso: 6,  id_curso_req: 2 },  // Estructuras → Prog I
    { id_prerequisito: 3, id_curso: 9,  id_curso_req: 7 },  // Ing. Software → Prog II
    { id_prerequisito: 4, id_curso: 11, id_curso_req: 7 },  // IA → Prog II
    { id_prerequisito: 5, id_curso: 12, id_curso_req: 4 },  // Costos → Cont. General
    { id_prerequisito: 6, id_curso: 17, id_curso_req: 5 },  // Admin II → Admin I
  ];
  for (const p of prereqs) {
    await db.preRequisito.upsert({
      where:  { id_prerequisito: p.id_prerequisito },
      update: {},
      create: p,
    });
  }
  console.log("✅ Prerequisitos creados");

  // ─── 6. Grupos para período 2026-I ───────────────────────────────────────
  // id_grupo 1-4 ya existen (seed base). Nuevos desde 5.
  const pid = 1; // 2026-I
  const grupos = [
    // Cálculo G02 (ya existía pero sin horario — se mantiene, solo se agregan más)
    // Sistemas — cursos nuevos
    { id_grupo:  5, descripcion: "Grupo 01", id_curso:  6, id_carrera: 1, id_periodo: pid, id_aula: 4, cupo_maximo: 25 },
    { id_grupo:  6, descripcion: "Grupo 01", id_curso:  7, id_carrera: 1, id_periodo: pid, id_aula: 4, cupo_maximo: 25 },
    { id_grupo:  7, descripcion: "Grupo 01", id_curso:  8, id_carrera: 1, id_periodo: pid, id_aula: 6, cupo_maximo: 35 },
    { id_grupo:  8, descripcion: "Grupo 01", id_curso:  9, id_carrera: 1, id_periodo: pid, id_aula: 3, cupo_maximo: 30 },
    { id_grupo:  9, descripcion: "Grupo 01", id_curso: 10, id_carrera: 1, id_periodo: pid, id_aula: 5, cupo_maximo: 40 },
    { id_grupo: 10, descripcion: "Grupo 02", id_curso: 10, id_carrera: 1, id_periodo: pid, id_aula: 7, cupo_maximo: 30 },
    { id_grupo: 11, descripcion: "Grupo 01", id_curso: 11, id_carrera: 1, id_periodo: pid, id_aula: 8, cupo_maximo: 20 },
    // Contabilidad
    { id_grupo: 12, descripcion: "Grupo 01", id_curso:  4, id_carrera: 2, id_periodo: pid, id_aula: 1, cupo_maximo: 35 },
    { id_grupo: 13, descripcion: "Grupo 01", id_curso: 12, id_carrera: 2, id_periodo: pid, id_aula: 2, cupo_maximo: 35 },
    { id_grupo: 14, descripcion: "Grupo 01", id_curso: 13, id_carrera: 2, id_periodo: pid, id_aula: 6, cupo_maximo: 35 },
    { id_grupo: 15, descripcion: "Grupo 01", id_curso: 14, id_carrera: 2, id_periodo: pid, id_aula: 5, cupo_maximo: 40 },
    { id_grupo: 16, descripcion: "Grupo 01", id_curso: 15, id_carrera: 2, id_periodo: pid, id_aula: 7, cupo_maximo: 30 },
    // Administración
    { id_grupo: 17, descripcion: "Grupo 01", id_curso:  5, id_carrera: 3, id_periodo: pid, id_aula: 9, cupo_maximo: 50 },
    { id_grupo: 18, descripcion: "Grupo 02", id_curso:  5, id_carrera: 3, id_periodo: pid, id_aula: 1, cupo_maximo: 35 },
    { id_grupo: 19, descripcion: "Grupo 01", id_curso: 17, id_carrera: 3, id_periodo: pid, id_aula: 2, cupo_maximo: 35 },
    { id_grupo: 20, descripcion: "Grupo 01", id_curso: 18, id_carrera: 3, id_periodo: pid, id_aula: 6, cupo_maximo: 35 },
    { id_grupo: 21, descripcion: "Grupo 01", id_curso: 19, id_carrera: 3, id_periodo: pid, id_aula: 3, cupo_maximo: 30 },
    { id_grupo: 22, descripcion: "Grupo 01", id_curso: 20, id_carrera: 3, id_periodo: pid, id_aula: 5, cupo_maximo: 40 },
    // Derecho
    { id_grupo: 23, descripcion: "Grupo 01", id_curso: 21, id_carrera: 4, id_periodo: pid, id_aula: 9, cupo_maximo: 60 },
    { id_grupo: 24, descripcion: "Grupo 02", id_curso: 21, id_carrera: 4, id_periodo: pid, id_aula: 7, cupo_maximo: 30 },
    { id_grupo: 25, descripcion: "Grupo 01", id_curso: 22, id_carrera: 4, id_periodo: pid, id_aula: 6, cupo_maximo: 35 },
    { id_grupo: 26, descripcion: "Grupo 01", id_curso: 23, id_carrera: 4, id_periodo: pid, id_aula: 3, cupo_maximo: 30 },
    { id_grupo: 27, descripcion: "Grupo 01", id_curso: 24, id_carrera: 4, id_periodo: pid, id_aula: 5, cupo_maximo: 35 },
    { id_grupo: 28, descripcion: "Grupo 01", id_curso: 25, id_carrera: 4, id_periodo: pid, id_aula: 9, cupo_maximo: 50 },
  ];

  for (const g of grupos) {
    await db.grupo.upsert({ where: { id_grupo: g.id_grupo }, update: {}, create: g });
  }
  console.log(`✅ ${grupos.length} grupos adicionales creados`);

  // ─── 7. Horarios ─────────────────────────────────────────────────────────
  // Solo inserta si el grupo aún no tiene horarios para no duplicar
  type HorarioData = { id_grupo: number; dia_semana: number; hora_inicio: Date; hora_fin: Date };
  const horariosNuevos: HorarioData[] = [
    // Grupo 2 — Cálculo G02 — Lun/Mié 9-11
    { id_grupo: 2,  dia_semana: 1, hora_inicio: t("09:00"), hora_fin: t("11:00") },
    { id_grupo: 2,  dia_semana: 3, hora_inicio: t("09:00"), hora_fin: t("11:00") },
    // Estructuras de Datos — Mar/Jue 7-9
    { id_grupo: 5,  dia_semana: 2, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    { id_grupo: 5,  dia_semana: 4, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    // Prog II — Lun/Mié/Vie 11-12
    { id_grupo: 6,  dia_semana: 1, hora_inicio: t("11:00"), hora_fin: t("12:00") },
    { id_grupo: 6,  dia_semana: 3, hora_inicio: t("11:00"), hora_fin: t("12:00") },
    { id_grupo: 6,  dia_semana: 5, hora_inicio: t("11:00"), hora_fin: t("12:00") },
    // Redes — Mar/Jue 13-15
    { id_grupo: 7,  dia_semana: 2, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    { id_grupo: 7,  dia_semana: 4, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    // Ing. Software — Lun/Mié 15-17
    { id_grupo: 8,  dia_semana: 1, hora_inicio: t("15:00"), hora_fin: t("17:00") },
    { id_grupo: 8,  dia_semana: 3, hora_inicio: t("15:00"), hora_fin: t("17:00") },
    // Sistemas Operativos G01 — Mar/Jue 9-11
    { id_grupo: 9,  dia_semana: 2, hora_inicio: t("09:00"), hora_fin: t("11:00") },
    { id_grupo: 9,  dia_semana: 4, hora_inicio: t("09:00"), hora_fin: t("11:00") },
    // Sistemas Operativos G02 — Vie 13-16
    { id_grupo: 10, dia_semana: 5, hora_inicio: t("13:00"), hora_fin: t("16:00") },
    // Inteligencia Artificial — Sáb 8-12
    { id_grupo: 11, dia_semana: 6, hora_inicio: t("08:00"), hora_fin: t("12:00") },
    // Contabilidad General G01 — Lun/Mié 7-9
    { id_grupo: 12, dia_semana: 1, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    { id_grupo: 12, dia_semana: 3, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    // Costos — Mar/Jue 7-9
    { id_grupo: 13, dia_semana: 2, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    { id_grupo: 13, dia_semana: 4, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    // Auditoría — Lun/Mié 11-13
    { id_grupo: 14, dia_semana: 1, hora_inicio: t("11:00"), hora_fin: t("13:00") },
    { id_grupo: 14, dia_semana: 3, hora_inicio: t("11:00"), hora_fin: t("13:00") },
    // Finanzas — Mar/Jue 13-15
    { id_grupo: 15, dia_semana: 2, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    { id_grupo: 15, dia_semana: 4, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    // Tributación — Vie 13-16
    { id_grupo: 16, dia_semana: 5, hora_inicio: t("13:00"), hora_fin: t("16:00") },
    // Admin I G01 — Lun/Mié/Vie 9-10
    { id_grupo: 17, dia_semana: 1, hora_inicio: t("09:00"), hora_fin: t("10:00") },
    { id_grupo: 17, dia_semana: 3, hora_inicio: t("09:00"), hora_fin: t("10:00") },
    { id_grupo: 17, dia_semana: 5, hora_inicio: t("09:00"), hora_fin: t("10:00") },
    // Admin I G02 — Sáb 8-11
    { id_grupo: 18, dia_semana: 6, hora_inicio: t("08:00"), hora_fin: t("11:00") },
    // Admin II — Mar/Jue 11-13
    { id_grupo: 19, dia_semana: 2, hora_inicio: t("11:00"), hora_fin: t("13:00") },
    { id_grupo: 19, dia_semana: 4, hora_inicio: t("11:00"), hora_fin: t("13:00") },
    // Marketing — Lun/Mié 13-15
    { id_grupo: 20, dia_semana: 1, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    { id_grupo: 20, dia_semana: 3, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    // RRHH — Vie 9-12
    { id_grupo: 21, dia_semana: 5, hora_inicio: t("09:00"), hora_fin: t("12:00") },
    // Estadística — Mar/Jue 15-17
    { id_grupo: 22, dia_semana: 2, hora_inicio: t("15:00"), hora_fin: t("17:00") },
    { id_grupo: 22, dia_semana: 4, hora_inicio: t("15:00"), hora_fin: t("17:00") },
    // Intro Derecho G01 — Lun/Mié 7-9
    { id_grupo: 23, dia_semana: 1, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    { id_grupo: 23, dia_semana: 3, hora_inicio: t("07:00"), hora_fin: t("09:00") },
    // Intro Derecho G02 — Sáb 8-11
    { id_grupo: 24, dia_semana: 6, hora_inicio: t("08:00"), hora_fin: t("11:00") },
    // Derecho Civil — Lun/Mié 11-13
    { id_grupo: 25, dia_semana: 1, hora_inicio: t("11:00"), hora_fin: t("13:00") },
    { id_grupo: 25, dia_semana: 3, hora_inicio: t("11:00"), hora_fin: t("13:00") },
    // Derecho Penal — Mar/Jue 9-11
    { id_grupo: 26, dia_semana: 2, hora_inicio: t("09:00"), hora_fin: t("11:00") },
    { id_grupo: 26, dia_semana: 4, hora_inicio: t("09:00"), hora_fin: t("11:00") },
    // Laboral — Mar/Jue 13-15
    { id_grupo: 27, dia_semana: 2, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    { id_grupo: 27, dia_semana: 4, hora_inicio: t("13:00"), hora_fin: t("15:00") },
    // Constitucional — Vie 13-17
    { id_grupo: 28, dia_semana: 5, hora_inicio: t("13:00"), hora_fin: t("17:00") },
  ];

  for (const h of horariosNuevos) {
    const existe = await db.horario.findFirst({
      where: { id_grupo: h.id_grupo, dia_semana: h.dia_semana },
    });
    if (!existe) await db.horario.create({ data: h });
  }
  console.log(`✅ Horarios creados para ${grupos.length + 1} grupos`);

  // ─── 8. Estudiantes adicionales ───────────────────────────────────────────
  const hash = await bcrypt.hash("Est1234!", 12);
  const estudiantes = [
    { cedula: "1-0000-0010", nombre: "Andrea",   apellidos: "Vargas Solís",     sexo: "F", email: "andrea@unisistema.ac.cr" },
    { cedula: "1-0000-0011", nombre: "Diego",    apellidos: "Mora Cascante",     sexo: "M", email: "diego@unisistema.ac.cr"  },
    { cedula: "1-0000-0012", nombre: "Sofía",    apellidos: "Chaves Rojas",      sexo: "F", email: "sofia@unisistema.ac.cr"  },
    { cedula: "1-0000-0013", nombre: "Esteban",  apellidos: "Quirós Ulate",      sexo: "M", email: "esteban@unisistema.ac.cr"},
  ];
  for (const e of estudiantes) {
    await db.persona.upsert({
      where:  { cedula: e.cedula },
      update: {},
      create: {
        ...e,
        fecha_nacimiento: new Date("2001-06-01"),
        password_hash: hash,
        id_rol: 1,
        id_provincia: 1,
        id_canton: 1,
      },
    });
  }
  console.log("✅ 4 estudiantes adicionales creados (contraseña: Est1234!)");

  console.log("\n📊 Resumen:");
  console.log("   • 4 carreras con cursos completos");
  console.log("   • 25+ cursos en total");
  console.log("   • 28 grupos con horarios");
  console.log("   • Período 2026-I con ajustes activos (10–25 abr 2026)");
  console.log("   • Estudiantes: 1-0000-0002, 0010, 0011, 0012, 0013 / Est1234!");
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => db.$disconnect());
