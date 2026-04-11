/**
 * Seed script — crea datos iniciales en la BD
 * Uso: npx tsx prisma/seed.ts
 *
 * Datos creados:
 *  - Roles (Estudiante, Administrador, Tesorería, Docente)
 *  - Provincia y Cantón base
 *  - Usuario administrador de prueba
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // ─── Roles ────────────────────────────────────────────────────────────────
  const roles = [
    { id_rol: 1, descripcion: "Estudiante" },
    { id_rol: 2, descripcion: "Administrador" },
    { id_rol: 3, descripcion: "Tesorería" },
    { id_rol: 4, descripcion: "Docente" },
  ];

  for (const rol of roles) {
    await db.rol.upsert({
      where: { id_rol: rol.id_rol },
      update: {},
      create: rol,
    });
  }
  console.log("✅ Roles creados");

  // ─── Provincia base ───────────────────────────────────────────────────────
  const provincia = await db.provincia.upsert({
    where: { id_provincia: 1 },
    update: {},
    create: { id_provincia: 1, descripcion: "San José" },
  });

  // ─── Cantón base ─────────────────────────────────────────────────────────
  const canton = await db.canton.upsert({
    where: { id_canton: 1 },
    update: {},
    create: {
      id_canton: 1,
      id_provincia: provincia.id_provincia,
      descripcion: "San José",
    },
  });

  console.log("✅ Provincia y cantón creados");

  // ─── Admin por defecto ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin1234!", 12);

  await db.persona.upsert({
    where: { cedula: "1-0000-0001" },
    update: {},
    create: {
      cedula: "1-0000-0001",
      nombre: "Admin",
      apellidos: "Sistema",
      fecha_nacimiento: new Date("1990-01-01"),
      sexo: "M",
      email: "admin@unisistema.ac.cr",
      password_hash: passwordHash,
      id_rol: 2, // Administrador
      id_provincia: provincia.id_provincia,
      id_canton: canton.id_canton,
    },
  });

  console.log("✅ Usuario admin creado:");
  console.log("   Cédula:     1-0000-0001");
  console.log("   Contraseña: Admin1234!");
  console.log("\n⚠️  Cambia la contraseña en producción!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
