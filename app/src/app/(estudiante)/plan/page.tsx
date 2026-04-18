import Link from "next/link";
import { db } from "@/lib/db";

export default async function SeleccionarCarreraPage() {
  const carreras = await db.carrera.findMany({
    where: { activo: true },
    orderBy: { descripcion: "asc" },
    include: { _count: { select: { cursos: true } } },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
          ← Dashboard
        </Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Plan de Estudio</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-slate-500 text-sm mb-6">
          Selecciona una carrera para ver su plan de estudios.
        </p>

        {carreras.length === 0 && (
          <p className="text-slate-400 text-sm">No hay carreras disponibles.</p>
        )}

        <div className="grid gap-3">
          {carreras.map((c) => (
            <Link
              key={c.id_carrera}
              href={`/plan/${c.id_carrera}`}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 hover:border-[#2563EB] hover:shadow-sm transition-all group"
            >
              <div>
                <div className="font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors">
                  {c.descripcion}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {c._count.cursos} curso{c._count.cursos !== 1 ? "s" : ""}
                </div>
              </div>
              <span className="text-slate-300 group-hover:text-[#2563EB] text-lg">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
