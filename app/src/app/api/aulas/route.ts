import { db } from "@/lib/db";
import { ok, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/aulas — catálogo de aulas activas
export async function GET() {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const aulas = await db.aula.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
  });

  return ok(aulas);
}
