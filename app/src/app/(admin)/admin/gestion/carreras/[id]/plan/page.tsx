import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export default async function PlanPage({ params }: Params) {
  const { id } = await params;
  const idCarrera = Number(id);

  const carrera = await db.carrera.findUnique({ where: { id_carrera: idCarrera } });
  if (!carrera) notFound();

  const cursos = await db.curso.findMany({
    where: { id_carrera: idCarrera },
    orderBy: [{ semestre: "asc" }, { tipo: "asc" }, { descripcion: "asc" }],
    include: {
      pre_requisitos: {
        include: { requisito: { select: { id_curso: true, descripcion: true } } },
      },
    },
  });

  // Agrupar por semestre; null va al final
  const porSemestre = new Map<number | null, typeof cursos>();
  for (const curso of cursos) {
    const key = curso.semestre;
    if (!porSemestre.has(key)) porSemestre.set(key, []);
    porSemestre.get(key)!.push(curso);
  }
  const semestresOrdenados: (number | null)[] = [
    ...[...porSemestre.keys()].filter((k): k is number => k !== null).sort((a, b) => a - b),
    ...(porSemestre.has(null) ? [null] : []),
  ];

  // Totales para la barra de resumen
  const totalCreditos   = cursos.reduce((s, c) => s + c.creditos, 0);
  const nObligatorio    = cursos.filter((c) => (c.tipo ?? "obligatorio") === "obligatorio").length;
  const nElectivo       = cursos.length - nObligatorio;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/gestion/carreras" className="text-slate-400 hover:text-white text-sm">
          ← Carreras
        </Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Plan de Estudio</span>
        <span className="text-slate-400">—</span>
        <span className="text-slate-200">{carrera.descripcion}</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Barra de resumen */}
        {cursos.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 mb-8 flex flex-wrap gap-6 text-sm text-slate-600">
            <span><span className="font-semibold text-slate-800">{cursos.length}</span> cursos</span>
            <span><span className="font-semibold text-slate-800">{totalCreditos}</span> créditos totales</span>
            <span>
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full mr-1">
                {nObligatorio}
              </span>
              obligatorios
            </span>
            <span>
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full mr-1">
                {nElectivo}
              </span>
              electivos
            </span>
          </div>
        )}

        {/* Vacío */}
        {cursos.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-16 text-center text-slate-400 text-sm">
            Esta carrera aún no tiene cursos.{" "}
            <Link href="/admin/gestion/cursos" className="text-[#2563EB] hover:underline">
              Agregar cursos
            </Link>
          </div>
        )}

        {/* Secciones por semestre */}
        {semestresOrdenados.map((sem) => {
          const lista = porSemestre.get(sem)!;
          const creditosSem = lista.reduce((s, c) => s + c.creditos, 0);
          return (
            <section key={sem ?? "sin-semestre"} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-base font-semibold text-slate-700">
                  {sem !== null ? `Semestre ${sem}` : "Sin semestre asignado"}
                </h2>
                <span className="text-xs text-slate-400 font-mono">{creditosSem} créditos</span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Curso</th>
                      <th className="text-center px-5 py-3 text-slate-500 font-medium">Tipo</th>
                      <th className="text-center px-5 py-3 text-slate-500 font-medium">Créditos</th>
                      <th className="text-right px-5 py-3 text-slate-500 font-medium">Costo</th>
                      <th className="text-center px-5 py-3 text-slate-500 font-medium">Prereqs</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lista.map((c) => (
                      <tr key={c.id_curso} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{c.descripcion}</td>
                        <td className="px-5 py-3 text-center">
                          {(c.tipo ?? "obligatorio") === "obligatorio" ? (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              Obligatorio
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                              Electivo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{c.creditos}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600 font-mono text-xs">
                          {Number(c.costo).toLocaleString("es-CR", {
                            style: "currency",
                            currency: "CRC",
                            maximumFractionDigits: 0,
                          })}
                        </td>
                        <td className="px-5 py-3 text-center text-slate-500 text-xs">
                          {c.pre_requisitos.length > 0 ? `${c.pre_requisitos.length} prereq.` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/gestion/cursos?carrera=${idCarrera}`}
                            className="text-[#2563EB] hover:underline text-xs"
                          >
                            Editar
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
