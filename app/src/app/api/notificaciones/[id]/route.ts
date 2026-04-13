import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/notificaciones/[id] — marcar una notificación como leída
export async function PATCH(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([
    ROLES.ESTUDIANTE, ROLES.ADMIN, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;

  const { id } = await params;

  const notif = await db.notificacion.findUnique({
    where: { id_notificacion: Number(id) },
  });

  if (!notif) return err("Notificación no encontrada", 404);
  if (notif.cedula_persona !== session!.user.cedula) return err("No autorizado", 403);

  await db.notificacion.update({
    where: { id_notificacion: Number(id) },
    data:  { estado_envio: "leido" },
  });

  return ok({ mensaje: "Marcada como leída." });
}
