import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { cedula, password, confirmar_password } = body ?? {};

  if (!cedula || !password || !confirmar_password) {
    return err("Todos los campos son requeridos.");
  }

  const persona = await db.persona.findUnique({
    where: { cedula },
    select: { cedula: true, password_hash: true, activo: true, bloqueado: true },
  });

  if (!persona) {
    return err("Cédula no registrada en el sistema.");
  }

  if (persona.password_hash !== null) {
    return err("Esta cuenta ya fue activada. Usá el login normal.");
  }

  if (!persona.activo || persona.bloqueado) {
    return err("Cuenta no disponible. Contactá a administración.");
  }

  if (password !== confirmar_password) {
    return err("Las contraseñas no coinciden.");
  }

  if (password.length < 8) {
    return err("La contraseña debe tener al menos 8 caracteres.");
  }

  const hash = await bcrypt.hash(password, 12);

  await db.persona.update({
    where: { cedula },
    data: { password_hash: hash },
  });

  return ok({ mensaje: "Cuenta activada exitosamente. Ya podés iniciar sesión." });
}
