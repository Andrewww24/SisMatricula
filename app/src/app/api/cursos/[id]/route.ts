import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/cursos/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const { id } = await params;
  const curso = await db.curso.findUnique({
    where: { id_curso: Number(id) },
    include: {
      carrera: { select: { id_carrera: true, descripcion: true } },
      pre_requisitos: {
        include: { requisito: { select: { id_curso: true, descripcion: true } } },
      },
      grupos: {
        where: { activo: true },
        include: {
          periodo: { select: { id_periodo: true, descripcion: true } },
          aula:   { select: { id_aula: true, nombre: true } },
          horarios: true,
          _count:  { select: { matriculas: true } },
        },
      },
    },
  });

  if (!curso) return err("Curso no encontrado", 404);
  return ok(curso);
}

// PUT /api/cursos/[id] — actualizar (solo Admin)
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;
  let body: {
    descripcion?: string;
    id_carrera?: number;
    creditos?: number;
    costo?: number;
    activo?: boolean;
    semestre?: number | null;
    tipo?: string;
  };

  try {
    body = await req.json();
  } catch {
    return err("Body JSON inválido");
  }

  const { descripcion, id_carrera, creditos, costo, activo, semestre, tipo } = body;

  const TIPOS_VALIDOS = ["obligatorio", "electivo"];
  if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) return err("Tipo inválido. Use 'obligatorio' o 'electivo'");
  if (semestre !== undefined && semestre !== null && (semestre < 1 || semestre > 10)) return err("El semestre debe estar entre 1 y 10");

  const existing = await db.curso.findUnique({ where: { id_curso: Number(id) } });
  if (!existing) return err("Curso no encontrado", 404);

  if (id_carrera) {
    const carrera = await db.carrera.findUnique({ where: { id_carrera } });
    if (!carrera) return err("Carrera no encontrada", 404);
  }

  const curso = await db.curso.update({
    where: { id_curso: Number(id) },
    data: {
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(id_carrera !== undefined && { id_carrera }),
      ...(creditos   !== undefined && { creditos }),
      ...(costo      !== undefined && { costo: new Prisma.Decimal(costo) }),
      ...(activo     !== undefined && { activo }),
      ...(semestre   !== undefined && { semestre }),
      ...(tipo       !== undefined && { tipo }),
    },
    include: {
      carrera: { select: { id_carrera: true, descripcion: true } },
    },
  });

  return ok(curso);
}

// DELETE /api/cursos/[id] — desactivar lógicamente (solo Admin)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;

  const existing = await db.curso.findUnique({ where: { id_curso: Number(id) } });
  if (!existing) return err("Curso no encontrado", 404);

  // Baja lógica — no eliminar físicamente para respetar registros históricos
  const curso = await db.curso.update({
    where: { id_curso: Number(id) },
    data: { activo: false },
  });

  return ok(curso);
}
