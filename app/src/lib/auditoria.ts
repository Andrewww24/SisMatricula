import { db } from "@/lib/db";

// IDs de tipo_auditoria (deben existir en la BD via seed)
export const TIPO_AUDITORIA = {
  LOGIN:       1,
  MATRICULA:   2,
  CANCELACION: 3,
  PAGO:        4,
  GESTION:     5,
} as const;

/**
 * Registra una entrada en la bitácora de auditoría.
 * Los errores son silenciosos — una falla de auditoría nunca interrumpe el flujo principal.
 */
export async function registrarAuditoria(data: {
  id_tipo_auditoria: number;
  cedula_usuario:    string;
  tabla_afectada:    string;
  id_registro:       string;
  accion:            string;
  descripcion?:      string;
  ip_origen?:        string;
}) {
  try {
    await db.bitacoraAuditoria.create({ data });
  } catch (e) {
    console.error("[auditoria]", e);
  }
}
