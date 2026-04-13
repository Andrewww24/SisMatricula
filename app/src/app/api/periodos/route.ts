import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/periodos
export async function GET(req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const { searchParams } = new URL(req.url);
  const soloActivos = searchParams.get("activos") !== "false";

  const periodos = await db.periodo.findMany({
    where: soloActivos ? { activo: true } : undefined,
    orderBy: { fecha_inicio: "desc" },
  });

  return ok(periodos);
}

// POST /api/periodos
export async function POST(req: NextRequest) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  let body: {
    descripcion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    fecha_inicio_ajustes?: string | null;
    fecha_fin_ajustes?: string | null;
  };
  try { body = await req.json(); } catch { return err("Body JSON inválido"); }

  const { descripcion, fecha_inicio, fecha_fin, fecha_inicio_ajustes, fecha_fin_ajustes } = body;
  if (!descripcion?.trim()) return err("El campo 'descripcion' es requerido");
  if (!fecha_inicio) return err("El campo 'fecha_inicio' es requerido");
  if (!fecha_fin)    return err("El campo 'fecha_fin' es requerido");
  if (new Date(fecha_inicio) >= new Date(fecha_fin)) return err("La fecha de inicio debe ser anterior a la fecha de fin");

  const periodo = await db.periodo.create({
    data: {
      descripcion:           descripcion.trim(),
      fecha_inicio:          new Date(fecha_inicio),
      fecha_fin:             new Date(fecha_fin),
      fecha_inicio_ajustes:  fecha_inicio_ajustes ? new Date(fecha_inicio_ajustes) : null,
      fecha_fin_ajustes:     fecha_fin_ajustes    ? new Date(fecha_fin_ajustes)    : null,
    },
  });
  return created(periodo);
}
