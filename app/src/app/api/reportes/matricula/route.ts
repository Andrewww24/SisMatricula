import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/reportes/matricula — reporte de matrículas (RF-20, Admin)
export async function GET(req: NextRequest) {
  const { response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo");

  const matriculas = await db.matricula.findMany({
    where: {
      ...(periodo && { id_periodo: Number(periodo) }),
    },
    include: {
      persona: { select: { nombre: true, apellidos: true, cedula: true } },
      grupo: {
        include: {
          curso:   { select: { descripcion: true, creditos: true } },
          carrera: { select: { descripcion: true } },
          periodo: { select: { descripcion: true } },
        },
      },
    },
    orderBy: { fecha_matricula: "desc" },
  });

  // Agrupación por estado
  const por_estado = matriculas.reduce<Record<string, number>>((acc, m) => {
    acc[m.estado] = (acc[m.estado] ?? 0) + 1;
    return acc;
  }, {});

  // Agrupación por carrera
  const porCarreraMap = matriculas.reduce<Record<string, number>>((acc, m) => {
    const carrera = m.grupo.carrera.descripcion;
    acc[carrera] = (acc[carrera] ?? 0) + 1;
    return acc;
  }, {});
  const por_carrera = Object.entries(porCarreraMap)
    .map(([carrera, total]) => ({ carrera, total }))
    .sort((a, b) => b.total - a.total);

  return ok({ por_estado, por_carrera, total: matriculas.length, detalle: matriculas });
}
