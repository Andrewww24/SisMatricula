import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, requireRoles, ROLES } from "@/lib/api-helpers";

const COSTO_POR_CREDITO = 15_000;

// GET /api/estado-cuenta — estado de cuenta del estudiante (RF-16)
export async function GET(_req: NextRequest) {
  const { session, response } = await requireRoles([ROLES.ESTUDIANTE]);
  if (response) return response;

  const cedula = session!.user.cedula;

  const matriculas = await db.matricula.findMany({
    where: {
      cedula_persona: cedula,
      estado: { not: "cancelada" },
    },
    include: {
      grupo: {
        include: {
          curso:   { select: { descripcion: true, creditos: true } },
          periodo: { select: { descripcion: true } },
        },
      },
      pagos: {
        select: { id_pago: true, monto: true, estado: true, fecha_pago: true },
      },
    },
    orderBy: { fecha_matricula: "desc" },
  });

  const pendientes = matriculas
    .filter((m) => m.estado === "pendiente")
    .map((m) => ({
      id_matricula:  m.id_matricula,
      curso:         m.grupo.curso.descripcion,
      creditos:      m.grupo.curso.creditos,
      periodo:       m.grupo.periodo.descripcion,
      monto_adeudado: m.grupo.curso.creditos * COSTO_POR_CREDITO,
    }));

  const confirmadas = matriculas
    .filter((m) => m.estado === "confirmada")
    .map((m) => ({
      id_matricula: m.id_matricula,
      curso:        m.grupo.curso.descripcion,
      periodo:      m.grupo.periodo.descripcion,
      monto_pagado: m.pagos
        .filter((p) => p.estado === "confirmado")
        .reduce((sum, p) => sum + Number(p.monto), 0),
      fecha_pago: m.pagos[0]?.fecha_pago ?? null,
    }));

  const total_adeudado  = pendientes.reduce((s, m) => s + m.monto_adeudado, 0);
  const total_pagado    = confirmadas.reduce((s, m) => s + m.monto_pagado, 0);

  return ok({ pendientes, confirmadas, total_adeudado, total_pagado });
}
