    import { NextRequest } from "next/server";
    import { db } from "@/lib/db";
    import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";

    // GET /api/carreras
    export async function GET(req: NextRequest) {
    const { session, response } = await requireRoles([
        ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
    ]);
    if (response) return response;
    void session;

    const { searchParams } = new URL(req.url);
    const soloActivas = searchParams.get("activos") !== "false";

    const carreras = await db.carrera.findMany({
        where: soloActivas ? { activo: true } : undefined,
        orderBy: { descripcion: "asc" },
    });

    return ok(carreras);
    }

    // POST /api/carreras
    export async function POST(req: NextRequest) {
    const { session, response } = await requireRoles([ROLES.ADMIN]);
    if (response) return response;
    void session;

    let body: { descripcion?: string };
    try { body = await req.json(); } catch { return err("Body JSON inválido"); }

    const { descripcion } = body;
    if (!descripcion?.trim()) return err("El campo 'descripcion' es requerido");

    const existe = await db.carrera.findFirst({ where: { descripcion: { equals: descripcion.trim(), mode: "insensitive" } } });
    if (existe) return err("Ya existe una carrera con ese nombre");

    const carrera = await db.carrera.create({ data: { descripcion: descripcion.trim() } });
    return created(carrera);
    }
