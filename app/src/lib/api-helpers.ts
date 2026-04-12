import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ─── Roles ────────────────────────────────────────────────
export const ROLES = {
  ESTUDIANTE: 1,
  ADMIN: 2,
  TESORERIA: 3,
  DOCENTE: 4,
} as const;

// ─── Respuestas estándar ───────────────────────────────────
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// ─── Autenticación y autorización ─────────────────────────
/**
 * Obtiene la sesión autenticada. Devuelve null si no hay sesión.
 */
export async function getSession() {
  return auth();
}

/**
 * Verifica que el usuario tenga al menos uno de los roles permitidos.
 * Retorna la sesión si es válida, o una respuesta de error si no.
 */
export async function requireRoles(allowedRoles: number[]) {
  const session = await auth();

  if (!session) {
    return { session: null, response: err("No autenticado", 401) };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return { session: null, response: err("Acceso no autorizado", 403) };
  }

  return { session, response: null };
}
