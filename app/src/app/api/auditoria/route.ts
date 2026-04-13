import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/auditoria — bitácora de auditoría (solo Admin)
export async function GET(req: NextRequest) {
  const { response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const tipo   = searchParams.get("tipo");
  const cedula = searchParams.get("cedula");
  const limite = Math.min(Number(searchParams.get("limite") ?? "200"), 500);

  const registros = await db.bitacoraAuditoria.findMany({
    where: {
      ...(tipo   && { id_tipo_auditoria: Number(tipo) }),
      ...(cedula && { cedula_usuario: cedula }),
    },
    include: {
      tipo_auditoria: { select: { descripcion: true } },
      usuario:        { select: { nombre: true, apellidos: true } },
    },
    orderBy: { fecha_accion: "desc" },
    take: limite,
  });

  return ok(registros);
}
