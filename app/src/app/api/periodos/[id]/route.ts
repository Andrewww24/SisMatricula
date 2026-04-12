import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PUT /api/periodos/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;
  let body: { descripcion?: string; fecha_inicio?: string; fecha_fin?: string; activo?: boolean };
  try { body = await req.json(); } catch { return err("Body JSON inválido"); }

  const existing = await db.periodo.findUnique({ where: { id_periodo: Number(id) } });
  if (!existing) return err("Período no encontrado", 404);

  const nuevaInicio = body.fecha_inicio ? new Date(body.fecha_inicio) : existing.fecha_inicio;
  const nuevaFin    = body.fecha_fin    ? new Date(body.fecha_fin)    : existing.fecha_fin;
  if (nuevaInicio >= nuevaFin) return err("La fecha de inicio debe ser anterior a la fecha de fin");

  const periodo = await db.periodo.update({
    where: { id_periodo: Number(id) },
    data: {
      ...(body.descripcion  !== undefined && { descripcion:  body.descripcion.trim() }),
      ...(body.fecha_inicio !== undefined && { fecha_inicio: new Date(body.fecha_inicio) }),
      ...(body.fecha_fin    !== undefined && { fecha_fin:    new Date(body.fecha_fin) }),
      ...(body.activo       !== undefined && { activo:       body.activo }),
    },
  });

  return ok(periodo);
}
