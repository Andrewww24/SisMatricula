import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/cursos — lista de cursos (autenticado, cualquier rol)
export async function GET(req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const id_carrera = searchParams.get("carrera");
  const soloActivos = searchParams.get("activos") !== "false";

  const cursos = await db.curso.findMany({
    where: {
      ...(soloActivos && { activo: true }),
      ...(id_carrera && { id_carrera: Number(id_carrera) }),
    },
    include: {
      carrera: { select: { id_carrera: true, descripcion: true } },
      pre_requisitos: {
        include: { requisito: { select: { id_curso: true, descripcion: true } } },
      },
    },
    orderBy: [{ id_carrera: "asc" }, { descripcion: "asc" }],
  });

  return ok(cursos);
}

// POST /api/cursos — crear curso (solo Admin)
export async function POST(req: NextRequest) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  let body: {
    descripcion?: string;
    id_carrera?: number;
    creditos?: number;
    costo?: number;
    pre_requisitos?: number[];
  };

  try {
    body = await req.json();
  } catch {
    return err("Body JSON inválido");
  }

  const { descripcion, id_carrera, creditos = 0, costo = 0, pre_requisitos = [] } = body;

  if (!descripcion?.trim()) return err("El campo 'descripcion' es requerido");
  if (!id_carrera) return err("El campo 'id_carrera' es requerido");

  // Verificar que la carrera existe
  const carrera = await db.carrera.findUnique({ where: { id_carrera } });
  if (!carrera) return err("Carrera no encontrada", 404);

  const curso = await db.curso.create({
    data: {
      descripcion: descripcion.trim(),
      id_carrera,
      creditos,
      costo: new Prisma.Decimal(costo),
      ...(pre_requisitos.length > 0 && {
        pre_requisitos: {
          create: pre_requisitos.map((id_curso_req) => ({ id_curso_req })),
        },
      }),
    },
    include: {
      carrera: { select: { id_carrera: true, descripcion: true } },
      pre_requisitos: {
        include: { requisito: { select: { id_curso: true, descripcion: true } } },
      },
    },
  });

  return created(curso);
}
