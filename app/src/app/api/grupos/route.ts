import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/grupos — lista de grupos con horarios y cupo
export async function GET(req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const id_curso   = searchParams.get("curso");
  const id_periodo = searchParams.get("periodo");
  const id_carrera = searchParams.get("carrera");
  const soloActivos = searchParams.get("activos") !== "false";
  const conCupo    = searchParams.get("con_cupo") === "true";

  const grupos = await db.grupo.findMany({
    where: {
      ...(soloActivos && { activo: true }),
      ...(id_curso   && { id_curso:   Number(id_curso) }),
      ...(id_periodo && { id_periodo: Number(id_periodo) }),
      ...(id_carrera && { id_carrera: Number(id_carrera) }),
      ...(conCupo    && { cupo_actual: { lt: db.grupo.fields.cupo_maximo } }),
    },
    include: {
      curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
      carrera: { select: { id_carrera: true, descripcion: true } },
      periodo: { select: { id_periodo: true, descripcion: true } },
      aula:    { select: { id_aula: true, nombre: true, capacidad: true, ubicacion: true } },
      horarios: true,
    },
    orderBy: [{ id_curso: "asc" }, { descripcion: "asc" }],
  });

  return ok(grupos);
}

// POST /api/grupos — crear grupo (solo Admin)
export async function POST(req: NextRequest) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  let body: {
    descripcion?: string;
    id_curso?: number;
    id_carrera?: number;
    id_periodo?: number;
    id_aula?: number;
    cupo_maximo?: number;
    horarios?: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
  };

  try {
    body = await req.json();
  } catch {
    return err("Body JSON inválido");
  }

  const {
    descripcion,
    id_curso,
    id_carrera,
    id_periodo,
    id_aula,
    cupo_maximo = 30,
    horarios = [],
  } = body;

  if (!descripcion?.trim()) return err("El campo 'descripcion' es requerido");
  if (!id_curso)   return err("El campo 'id_curso' es requerido");
  if (!id_carrera) return err("El campo 'id_carrera' es requerido");
  if (!id_periodo) return err("El campo 'id_periodo' es requerido");
  if (!id_aula)    return err("El campo 'id_aula' es requerido");

  // Validar existencia de FKs
  const [curso, carrera, periodo, aula] = await Promise.all([
    db.curso.findUnique({ where: { id_curso } }),
    db.carrera.findUnique({ where: { id_carrera } }),
    db.periodo.findUnique({ where: { id_periodo } }),
    db.aula.findUnique({ where: { id_aula } }),
  ]);

  if (!curso)   return err("Curso no encontrado", 404);
  if (!carrera) return err("Carrera no encontrada", 404);
  if (!periodo) return err("Período no encontrado", 404);
  if (!aula)    return err("Aula no encontrada", 404);

  const grupo = await db.grupo.create({
    data: {
      descripcion: descripcion.trim(),
      id_curso,
      id_carrera,
      id_periodo,
      id_aula,
      cupo_maximo,
      ...(horarios.length > 0 && {
        horarios: {
          create: horarios.map((h) => ({
            dia_semana:  h.dia_semana,
            hora_inicio: new Date(`1970-01-01T${h.hora_inicio}`),
            hora_fin:    new Date(`1970-01-01T${h.hora_fin}`),
          })),
        },
      }),
    },
    include: {
      curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
      carrera: { select: { id_carrera: true, descripcion: true } },
      periodo: { select: { id_periodo: true, descripcion: true } },
      aula:    { select: { id_aula: true, nombre: true } },
      horarios: true,
    },
  });

  return created(grupo);
}
