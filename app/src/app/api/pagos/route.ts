import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";

// GET /api/pagos — mis pagos (estudiante) o por cédula (admin/tesorería)
export async function GET(req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ESTUDIANTE, ROLES.ADMIN, ROLES.TESORERIA,
  ]);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const cedula =
    session!.user.role === ROLES.ESTUDIANTE
      ? session!.user.cedula
      : (searchParams.get("cedula") ?? undefined);

  const pagos = await db.pago.findMany({
    where: {
      ...(cedula && { cedula_persona: cedula }),
    },
    include: {
      metodo_pago: { select: { descripcion: true } },
      matricula: {
        include: {
          grupo: {
            include: {
              curso:   { select: { descripcion: true, creditos: true } },
              periodo: { select: { descripcion: true } },
            },
          },
        },
      },
      facturas: {
        select: { id_factura: true, monto_neto: true, fecha_emision: true },
      },
    },
    orderBy: { fecha_pago: "desc" },
  });

  return ok(pagos);
}

// POST /api/pagos — registrar pago y confirmar matrícula (Tesorería / Admin)
export async function POST(req: NextRequest) {
  const { session, response } = await requireRoles([ROLES.TESORERIA, ROLES.ADMIN]);
  if (response) return response;

  let body: {
    id_matricula?: number;
    monto?: number;
    id_metodo_pago?: number;
    descripcion?: string;
  };
  try { body = await req.json(); } catch { return err("Body JSON inválido"); }

  const { id_matricula, monto, id_metodo_pago = 1, descripcion } = body;
  if (!id_matricula) return err("El campo 'id_matricula' es requerido");
  if (!monto || monto <= 0) return err("El monto debe ser mayor a 0");

  const matricula = await db.matricula.findUnique({
    where: { id_matricula },
    include: { grupo: { include: { curso: true } } },
  });

  if (!matricula) return err("Matrícula no encontrada", 404);
  if (matricula.estado === "confirmada") return err("Esta matrícula ya está confirmada.");
  if (matricula.estado === "cancelada")  return err("No se puede pagar una matrícula cancelada.");

  // Garantizar que exista el método de pago (setup experimental)
  await db.metodoPago.upsert({
    where:  { id_metodo_pago },
    update: {},
    create: { id_metodo_pago, descripcion: "Efectivo" },
  });

  try {
    const resultado = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Registrar el pago
      const pago = await tx.pago.create({
        data: {
          cedula_persona:    matricula.cedula_persona,
          id_matricula,
          id_metodo_pago,
          monto:  new Prisma.Decimal(monto),
          saldo:  new Prisma.Decimal(0),
          estado: "confirmado",
        },
      });

      // 2. Emitir factura
      const factura = await tx.factura.create({
        data: {
          id_pago:       pago.id_pago,
          cedula_persona: matricula.cedula_persona,
          id_matricula,
          monto_total: new Prisma.Decimal(monto),
          descuento:   new Prisma.Decimal(0),
          monto_neto:  new Prisma.Decimal(monto),
          descripcion: descripcion ?? `Matrícula — ${matricula.grupo.curso.descripcion}`,
        },
      });

      // 3. Confirmar la matrícula
      const matriculaConfirmada = await tx.matricula.update({
        where: { id_matricula },
        data:  { estado: "confirmada", fecha_confirmacion: new Date() },
      });

      return { pago, factura, matricula: matriculaConfirmada };
    });

    return created(resultado);
  } catch (e) {
    console.error("[POST /api/pagos]", e);
    return err("Error interno al procesar el pago", 500);
  }
}
