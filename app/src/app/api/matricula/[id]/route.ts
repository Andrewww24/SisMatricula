import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";
import { Prisma } from "@prisma/client";
import { registrarAuditoria, TIPO_AUDITORIA } from "@/lib/auditoria";

type Params = { params: Promise<{ id: string }> };

// GET /api/matricula/[id] — detalle de una matrícula (comprobante)
export async function GET(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([
    ROLES.ESTUDIANTE, ROLES.ADMIN, ROLES.TESORERIA,
  ]);
  if (response) return response;

  const { id } = await params;

  const matricula = await db.matricula.findUnique({
    where: { id_matricula: Number(id) },
    include: {
      persona: { select: { cedula: true, nombre: true, apellidos: true, email: true } },
      grupo: {
        include: {
          curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
          carrera: { select: { id_carrera: true, descripcion: true } },
          periodo: { select: { id_periodo: true, descripcion: true, fecha_inicio: true, fecha_fin: true } },
          aula:    { select: { id_aula: true, nombre: true, ubicacion: true } },
          horarios: true,
        },
      },
      periodo: { select: { id_periodo: true, descripcion: true } },
      pagos:   { select: { id_pago: true, monto: true, estado: true, fecha_pago: true } },
    },
  });

  if (!matricula) return err("Matrícula no encontrada", 404);

  // Estudiante solo puede ver las suyas
  if (
    session!.user.role === ROLES.ESTUDIANTE &&
    matricula.cedula_persona !== session!.user.cedula
  ) {
    return err("No autorizado", 403);
  }

  return ok(matricula);
}

// DELETE /api/matricula/[id] — cancelar matrícula (RF-14: ajustes)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { session, response } = await requireRoles([ROLES.ESTUDIANTE, ROLES.ADMIN]);
  if (response) return response;

  const { id } = await params;

  const matricula = await db.matricula.findUnique({
    where: { id_matricula: Number(id) },
    include: { grupo: true },
  });

  if (!matricula) return err("Matrícula no encontrada", 404);

  // Estudiante solo puede cancelar las suyas
  if (
    session!.user.role === ROLES.ESTUDIANTE &&
    matricula.cedula_persona !== session!.user.cedula
  ) {
    return err("No autorizado", 403);
  }

  // Solo se puede cancelar si está en estado pendiente (antes del pago)
  if (matricula.estado === "confirmada") {
    return err("No se puede cancelar una matrícula ya confirmada. Contacta con Registro Académico.");
  }
  if (matricula.estado === "cancelada") {
    return err("Esta matrícula ya está cancelada.");
  }

  // Cancelar en transacción: actualizar estado + decrementar cupo + promover lista de espera
  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Cancelar la matrícula
    await tx.matricula.update({
      where: { id_matricula: Number(id) },
      data:  { estado: "cancelada" },
    });

    // 2. Decrementar cupo del grupo
    await tx.grupo.update({
      where: { id_grupo: matricula.id_grupo },
      data:  { cupo_actual: { decrement: 1 } },
    });

    // 3. Promover el primero en lista de espera (si existe)
    const siguiente = await tx.listaEspera.findFirst({
      where:   { id_grupo: matricula.id_grupo },
      orderBy: { fecha_registro: "asc" },
    });

    if (siguiente) {
      // Crear matrícula para el siguiente en espera
      await tx.matricula.create({
        data: {
          cedula_persona: siguiente.cedula_persona,
          id_grupo:       matricula.id_grupo,
          id_periodo:     matricula.id_periodo,
          estado:         "pendiente",
          observaciones:  "Promovido desde lista de espera",
        },
      });
      // Incrementar cupo nuevamente
      await tx.grupo.update({
        where: { id_grupo: matricula.id_grupo },
        data:  { cupo_actual: { increment: 1 } },
      });
      // Eliminar de la lista de espera
      await tx.listaEspera.delete({ where: { id_espera: siguiente.id_espera } });
    }
  });

  // RF-03: Auditoría de cancelación
  await registrarAuditoria({
    id_tipo_auditoria: TIPO_AUDITORIA.CANCELACION,
    cedula_usuario:    session!.user.cedula,
    tabla_afectada:    "matricula",
    id_registro:       id,
    accion:            "DELETE",
    descripcion:       `Cancelación de matrícula #${id}`,
  });

  return ok({ mensaje: "Matrícula cancelada correctamente." });
}
