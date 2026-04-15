import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireRoles, ROLES } from "@/lib/api-helpers";

// DELETE /api/prerequisitos/[id]?tipo=prereq|coreq
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireRoles([ROLES.ADMIN]);
  if (response) return response;
  void session;

  const { id } = await params;
  const tipo = new URL(req.url).searchParams.get("tipo");
  const idNum = Number(id);

  if (!idNum)  return err("ID inválido");
  if (tipo !== "prereq" && tipo !== "coreq") return err("Parámetro 'tipo' debe ser 'prereq' o 'coreq'");

  if (tipo === "prereq") {
    const existe = await db.preRequisito.findUnique({ where: { id_prerequisito: idNum } });
    if (!existe) return err("Prerrequisito no encontrado", 404);
    await db.preRequisito.delete({ where: { id_prerequisito: idNum } });
  } else {
    const existe = await db.correquisito.findUnique({ where: { id_correquisito: idNum } });
    if (!existe) return err("Correquisito no encontrado", 404);
    await db.correquisito.delete({ where: { id_correquisito: idNum } });
  }

  return ok({ eliminado: true });
}
