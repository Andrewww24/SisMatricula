import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireRoles, ROLES } from "@/lib/api-helpers";

// GET /api/reportes/financiero — reporte financiero (RF-21, Admin + Tesorería)
export async function GET(req: NextRequest) {
  const { response } = await requireRoles([ROLES.ADMIN, ROLES.TESORERIA]);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get("periodo");

  const pagos = await db.pago.findMany({
    where: {
      ...(periodo && { matricula: { id_periodo: Number(periodo) } }),
    },
    include: {
      metodo_pago: { select: { descripcion: true } },
      facturas:    { select: { id_factura: true, monto_neto: true } },
      persona:     { select: { nombre: true, apellidos: true, cedula: true } },
      matricula: {
        include: {
          grupo: {
            include: {
              curso:   { select: { descripcion: true } },
              periodo: { select: { descripcion: true } },
            },
          },
        },
      },
    },
    orderBy: { fecha_pago: "desc" },
  });

  // Total recaudado (solo pagos confirmados)
  const total_recaudado = pagos
    .filter((p) => p.estado === "confirmado")
    .reduce((sum, p) => sum + Number(p.monto), 0);

  const total_facturas = pagos.reduce((sum, p) => sum + p.facturas.length, 0);

  // Agrupación por método de pago
  const porMetodoMap = pagos.reduce<Record<string, { total: number; count: number }>>((acc, p) => {
    const metodo = p.metodo_pago.descripcion;
    if (!acc[metodo]) acc[metodo] = { total: 0, count: 0 };
    acc[metodo].total += Number(p.monto);
    acc[metodo].count += 1;
    return acc;
  }, {});
  const por_metodo = Object.entries(porMetodoMap)
    .map(([metodo, { total, count }]) => ({ metodo, total, count }))
    .sort((a, b) => b.total - a.total);

  // Serializar Decimal → number para JSON
  const detalle = pagos.map((p) => ({
    ...p,
    monto: Number(p.monto),
    saldo: Number(p.saldo),
    facturas: p.facturas.map((f) => ({ ...f, monto_neto: Number(f.monto_neto) })),
  }));

  return ok({ total_recaudado, total_facturas, por_metodo, total: pagos.length, detalle });
}
