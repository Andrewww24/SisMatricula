import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/carreras/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;
  let body: { descripcion?: string; activo?: boolean };
  try { body = await req.json(); } catch { return err("Body JSON inválido"); }

  const existing = await db.carrera.findUnique({ where: { id_carrera: Number(id) } });
  if (!existing) return err("Carrera no encontrada", 404);

  if (body.descripcion !== undefined) {
    const dup = await db.carrera.findFirst({
      where: {
        descripcion: { equals: body.descripcion.trim(), mode: "insensitive" },
        id_carrera:  { not: Number(id) },
      },
    });
    if (dup) return err("Ya existe una carrera con ese nombre");
  }

  const carrera = await db.carrera.update({
    where: { id_carrera: Number(id) },
    data: {
      ...(body.descripcion !== undefined && { descripcion: body.descripcion.trim() }),
      ...(body.activo      !== undefined && { activo: body.activo }),
    },
  });

  return ok(carrera);
}
