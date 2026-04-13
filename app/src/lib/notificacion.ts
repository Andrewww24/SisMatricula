import { db } from "@/lib/db";

export const TIPO_NOTIFICACION = {
  MATRICULA:   1,
  CANCELACION: 2,
  PAGO:        3,
} as const;

/**
 * Crea una notificación in-app para un usuario.
 * Errores se loguean silenciosamente para no interrumpir el flujo principal.
 */
export async function crearNotificacion({
  id_tipo_notificacion,
  cedula_persona,
  asunto,
  mensaje,
}: {
  id_tipo_notificacion: number;
  cedula_persona: string;
  asunto: string;
  mensaje: string;
}) {
  try {
    await db.notificacion.create({
      data: {
        id_tipo_notificacion,
        cedula_persona,
        asunto,
        mensaje,
        canal:        "in-app",
        estado_envio: "pendiente",
        fecha_envio:  new Date(),
      },
    });
  } catch (e) {
    console.error("[crearNotificacion]", e);
  }
}
