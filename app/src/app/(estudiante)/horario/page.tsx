"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };
type Matricula = {
  id_matricula: number;
  estado: string;
  grupo: {
    id_grupo:    number;
    descripcion: string;
    curso:   { descripcion: string; creditos: number };
    carrera: { descripcion: string };
    periodo: { id_periodo: number; descripcion: string };
    aula:    { nombre: string };
    horarios: Horario[];
  };
};

const DIAS_FULL = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_SHORT = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Horas del día a mostrar en la grilla (7:00 – 21:00)
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7);

function horaNum(iso: string) {
  const d = new Date(iso);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

function horaStr(iso: string) {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

const COLORES = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-rose-100 border-rose-300 text-rose-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
];

export default function HorarioPage() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodoId, setPeriodoId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/matricula")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          const activas: Matricula[] = json.data.filter(
            (m: Matricula) => m.estado !== "cancelada"
          );
          setMatriculas(activas);
          // Preseleccionar período del primero
          if (activas.length > 0) {
            setPeriodoId(activas[0].grupo.periodo.id_periodo);
          }
        }
        setLoading(false);
      });
  }, []);

  // Períodos únicos de las matrículas
  const periodosUnicos = Array.from(
    new Map(
      matriculas.map((m) => [m.grupo.periodo.id_periodo, m.grupo.periodo])
    ).values()
  );

  // Matrículas del período seleccionado
  const activas = periodoId
    ? matriculas.filter((m) => m.grupo.periodo.id_periodo === periodoId)
    : matriculas;

  const totalCreditos = activas.reduce((s, m) => s + m.grupo.curso.creditos, 0);

  // Mapa color por grupo
  const colorMap = new Map<number, string>();
  activas.forEach((m, i) => {
    colorMap.set(m.grupo.id_grupo, COLORES[i % COLORES.length]);
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Mi Horario</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : matriculas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-400 text-sm mb-4">No tienes matrículas activas.</p>
            <Link href="/matricula" className="text-[#2563EB] text-sm hover:underline">
              Ir a Matrícula →
            </Link>
          </div>
        ) : (
          <>
            {/* Selector de período + resumen */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 font-medium">Período:</label>
                <select
                  value={periodoId ?? ""}
                  onChange={(e) => setPeriodoId(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white"
                >
                  {periodosUnicos.map((p) => (
                    <option key={p.id_periodo} value={p.id_periodo}>{p.descripcion}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{activas.length}</span> grupos ·{" "}
                <span className="font-medium text-slate-700">{totalCreditos}</span> créditos
              </div>
            </div>

            {/* Grilla semanal */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-auto mb-8">
              <div
                className="grid min-w-[640px]"
                style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}
              >
                {/* Encabezado de días */}
                <div className="border-b border-slate-200 bg-slate-50" />
                {[1, 2, 3, 4, 5].map((dia) => (
                  <div
                    key={dia}
                    className="border-b border-l border-slate-200 bg-slate-50 text-center py-2 text-xs font-medium text-slate-500"
                  >
                    {DIAS_FULL[dia]}
                  </div>
                ))}

                {/* Filas de hora */}
                {HORAS.map((hora) => (
                  <>
                    {/* Etiqueta de hora */}
                    <div
                      key={`h-${hora}`}
                      className="border-t border-slate-100 text-right pr-2 pt-1 text-xs text-slate-400"
                      style={{ height: "48px" }}
                    >
                      {hora}:00
                    </div>

                    {/* Celdas por día */}
                    {[1, 2, 3, 4, 5].map((dia) => {
                      // Buscar bloques que caigan en esta hora+día
                      const bloques = activas.flatMap((m) =>
                        m.grupo.horarios
                          .filter((h) => {
                            if (h.dia_semana !== dia) return false;
                            const ini = horaNum(h.hora_inicio);
                            const fin = horaNum(h.hora_fin);
                            return ini <= hora && hora < fin;
                          })
                          .map((h) => ({ m, h }))
                      );

                      return (
                        <div
                          key={`${hora}-${dia}`}
                          className="border-t border-l border-slate-100 relative"
                          style={{ height: "48px" }}
                        >
                          {bloques.map(({ m, h }, bi) => {
                            const ini = horaNum(h.hora_inicio);
                            // Solo renderizar el bloque en la primera fila (hora de inicio)
                            if (Math.floor(ini) !== hora) return null;
                            const dur = horaNum(h.hora_fin) - ini;
                            const color = colorMap.get(m.grupo.id_grupo) ?? COLORES[0];
                            return (
                              <div
                                key={bi}
                                className={`absolute inset-x-0.5 rounded-md border text-xs px-1 py-0.5 overflow-hidden ${color}`}
                                style={{
                                  top: `${(ini - hora) * 48}px`,
                                  height: `${dur * 48 - 2}px`,
                                }}
                                title={`${m.grupo.curso.descripcion} — ${horaStr(h.hora_inicio)} a ${horaStr(h.hora_fin)}`}
                              >
                                <div className="font-medium truncate">{m.grupo.curso.descripcion}</div>
                                <div className="opacity-70 truncate">{m.grupo.aula.nombre}</div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>

            {/* Lista de cursos inscritos */}
            <h2 className="text-base font-semibold text-slate-700 mb-3">Detalle de grupos inscritos</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Curso</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Grupo</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Horario</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Aula</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Créditos</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activas.map((m) => (
                    <tr key={m.id_matricula} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full border ${colorMap.get(m.grupo.id_grupo) ?? ""}`}
                          />
                          <span className="font-medium text-slate-800">{m.grupo.curso.descripcion}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 ml-4">{m.grupo.carrera.descripcion}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{m.grupo.descripcion}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {m.grupo.horarios.map((h, i) => (
                          <div key={i} className="text-xs">
                            {DIAS_SHORT[h.dia_semana]} {horaStr(h.hora_inicio)}–{horaStr(h.hora_fin)}
                          </div>
                        ))}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{m.grupo.aula.nombre}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {m.grupo.curso.creditos}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                          m.estado === "confirmada"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {m.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
