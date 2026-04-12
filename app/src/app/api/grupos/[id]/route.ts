import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// GET /api/grupos/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const { id } = await params;

  const grupo = await db.grupo.findUnique({
    where: { id_grupo: Number(id) },
    include: {
      curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
      carrera: { select: { id_carrera: true, descripcion: true } },
      periodo: { select: { id_periodo: true, descripcion: true, fecha_inicio: true, fecha_fin: true } },
      aula:    { select: { id_aula: true, nombre: true, capacidad: true, ubicacion: true } },
      horarios: true,
      _count:  { select: { matriculas: true } },
    },
  });

  if (!grupo) return err("Grupo no encontrado", 404);
  return ok(grupo);
}

// PUT /api/grupos/[id] — actualizar (solo Admin)
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;
  let body: {
    descripcion?: string;
    id_aula?: number;
    cupo_maximo?: number;
    activo?: boolean;
    horarios?: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
  };

  try {
    body = await req.json();
  } catch {
    return err("Body JSON inválido");
  }

  const { descripcion, id_aula, cupo_maximo, activo, horarios } = body;

  const existing = await db.grupo.findUnique({ where: { id_grupo: Number(id) } });
  if (!existing) return err("Grupo no encontrado", 404);

  if (id_aula) {
    const aula = await db.aula.findUnique({ where: { id_aula } });
    if (!aula) return err("Aula no encontrada", 404);
  }

  try {
    // Si se envían horarios, borrar los existentes y crear los nuevos explícitamente
    if (horarios !== undefined) {
      await db.horario.deleteMany({ where: { id_grupo: Number(id) } });
      if (horarios.length > 0) {
        await db.horario.createMany({
          data: horarios.map((h) => ({
            id_grupo:    Number(id),
            dia_semana:  h.dia_semana,
            hora_inicio: new Date(`1970-01-01T${h.hora_inicio}:00Z`),
            hora_fin:    new Date(`1970-01-01T${h.hora_fin}:00Z`),
          })),
        });
      }
    }

    const grupo = await db.grupo.update({
      where: { id_grupo: Number(id) },
      data: {
        ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
        ...(id_aula     !== undefined && { id_aula }),
        ...(cupo_maximo !== undefined && { cupo_maximo }),
        ...(activo      !== undefined && { activo }),
      },
      include: {
        curso:   { select: { id_curso: true, descripcion: true } },
        carrera: { select: { id_carrera: true, descripcion: true } },
        periodo: { select: { id_periodo: true, descripcion: true } },
        aula:    { select: { id_aula: true, nombre: true } },
        horarios: true,
      },
    });

    return ok(grupo);
  } catch (e) {
    console.error("PUT /api/grupos/[id] error:", e);
    return err("Error al actualizar el grupo", 500);
  }
}

// DELETE /api/grupos/[id] — desactivar lógicamente (solo Admin)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;

  const existing = await db.grupo.findUnique({ where: { id_grupo: Number(id) } });
  if (!existing) return err("Grupo no encontrado", 404);

  const grupo = await db.grupo.update({
    where: { id_grupo: Number(id) },
    data: { activo: false },
  });

  return ok(grupo);
}
