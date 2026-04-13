import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/notificaciones — mis notificaciones (estudiante)
export async function GET(_req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ESTUDIANTE, ROLES.ADMIN, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;

  const notificaciones = await db.notificacion.findMany({
    where:   { cedula_persona: session!.user.cedula },
    include: { tipo_notificacion: { select: { descripcion: true } } },
    orderBy: { fecha_creacion: "desc" },
    take:    50,
  });

  return ok(notificaciones);
}

// PATCH /api/notificaciones — marcar todas como leídas
export async function PATCH(_req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ESTUDIANTE, ROLES.ADMIN, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;

  await db.notificacion.updateMany({
    where: { cedula_persona: session!.user.cedula, estado_envio: "pendiente" },
    data:  { estado_envio: "leido" },
  });

  return ok({ mensaje: "Notificaciones marcadas como leídas." });
}
