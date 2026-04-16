import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";

// ─── Detección de ciclos ───────────────────────────────────
// Verifica si existe un camino desde `desde` hasta `hasta` en el grafo
// de prerrequisitos. Usado para prevenir ciclos (A→B→A).
async function existeCiclo(
  desde: number,
  hasta: number,
  visitados = new Set<number>()
): Promise<boolean> {
  if (desde === hasta) return true;
  if (visitados.has(desde)) return false;
  visitados.add(desde);

  const hijos = await db.preRequisito.findMany({
    where: { id_curso: desde },
    select: { id_curso_req: true },
  });

  for (const { id_curso_req } of hijos) {
    if (await existeCiclo(id_curso_req, hasta, visitados)) return true;
  }
  return false;
}

// GET /api/prerequisitos?curso=X
// Devuelve prerrequisitos y correquisitos del curso indicado
export async function GET(req: NextRequest) {
  const { session, response } = await requireRoles([
    ROLES.ADMIN, ROLES.ESTUDIANTE, ROLES.TESORERIA, ROLES.DOCENTE,
  ]);
  if (response) return response;
  void session;

  const id_curso = Number(new URL(req.url).searchParams.get("curso"));
  if (!id_curso) return err("Parámetro 'curso' requerido");

  const curso = await db.curso.findUnique({ where: { id_curso } });
  if (!curso) return err("Curso no encontrado", 404);

  const [prereqs, coreqs] = await Promise.all([
    db.preRequisito.findMany({
      where: { id_curso },
      include: { requisito: { select: { id_curso: true, descripcion: true } } },
    }),
    db.correquisito.findMany({
      where: { id_curso },
      include: { correquisito: { select: { id_curso: true, descripcion: true } } },
    }),
  ]);

  return ok({ prereqs, coreqs });
}

// POST /api/prerequisitos
// Body: { id_curso, id_curso_req, tipo: "prereq" | "coreq" }
export async function POST(req: NextRequest) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  let body: { id_curso?: number; id_curso_req?: number; tipo?: string };
  try {
    body = await req.json();
  } catch {
    return err("Body JSON inválido");
  }

  const { id_curso, id_curso_req, tipo } = body;

  if (!id_curso)     return err("El campo 'id_curso' es requerido");
  if (!id_curso_req) return err("El campo 'id_curso_req' es requerido");
  if (tipo !== "prereq" && tipo !== "coreq") return err("El campo 'tipo' debe ser 'prereq' o 'coreq'");
  if (id_curso === id_curso_req) return err("Un curso no puede ser requisito de sí mismo");

  // Verificar que ambos cursos existen
  const [cursoBase, cursoReq] = await Promise.all([
    db.curso.findUnique({ where: { id_curso } }),
    db.curso.findUnique({ where: { id_curso: id_curso_req } }),
  ]);
  if (!cursoBase) return err("Curso base no encontrado", 404);
  if (!cursoReq)  return err("Curso requisito no encontrado", 404);

  if (tipo === "prereq") {
    // Verificar duplicado
    const existe = await db.preRequisito.findFirst({ where: { id_curso, id_curso_req } });
    if (existe) return err("Ese prerrequisito ya existe");

    // Detectar ciclo: si id_curso_req ya tiene id_curso como prereq (directo o transitivo)
    if (await existeCiclo(id_curso_req, id_curso)) {
      return err("No se puede agregar: generaría un ciclo de prerrequisitos");
    }

    const nuevo = await db.preRequisito.create({
      data: { id_curso, id_curso_req },
      include: { requisito: { select: { id_curso: true, descripcion: true } } },
    });
    return created(nuevo);
  } else {
    // Verificar duplicado coreq
    const existe = await db.correquisito.findFirst({ where: { id_curso, id_curso_coreq: id_curso_req } });
    if (existe) return err("Ese correquisito ya existe");

    const nuevo = await db.correquisito.create({
      data: { id_curso, id_curso_coreq: id_curso_req },
      include: { correquisito: { select: { id_curso: true, descripcion: true } } },
    });
    return created(nuevo);
  }
}
