"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };
type Grupo = {
  id_grupo:    number;
  descripcion: string;
  cupo_actual: number;
  cupo_maximo: number;
  activo:      boolean;
  curso:   { id_curso: number; descripcion: string; creditos: number };
  carrera: { id_carrera: number; descripcion: string };
  periodo: { id_periodo: number; descripcion: string };
  aula:    { id_aula: number; nombre: string };
  horarios: Horario[];
};
type Matricula = {
  id_matricula:   number;
  estado:         string;
  fecha_matricula: string;
  grupo: Grupo;
};
type Periodo = {
  id_periodo:            number;
  descripcion:           string;
  fecha_inicio:          string;
  fecha_fin:             string;
  fecha_inicio_ajustes?: string | null;
  fecha_fin_ajustes?:    string | null;
}

type VentanaEstado = "abierta" | "ajustes" | "cerrada";

function getWindowStatus(p: Periodo): VentanaEstado {
  const hoy = new Date();
  const inicioAjustes = p.fecha_inicio_ajustes ? new Date(p.fecha_inicio_ajustes) : null;
  const finAjustes    = p.fecha_fin_ajustes    ? new Date(p.fecha_fin_ajustes)    : null;
  const inicio = new Date(p.fecha_inicio);
  const fin    = new Date(p.fecha_fin);
  if (inicioAjustes && finAjustes && hoy >= inicioAjustes && hoy <= finAjustes) return "ajustes";
  if (hoy >= inicio && hoy <= fin) return "abierta";
  return "cerrada";
};
type Carrera = { id_carrera: number; descripcion: string };

const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function horaStr(iso: string) {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    pendiente:  "bg-amber-100 text-amber-700",
    confirmada: "bg-green-100 text-green-700",
    cancelada:  "bg-red-100 text-red-600",
  };
  return map[estado] ?? "bg-slate-100 text-slate-600";
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MatriculaPage() {
  const router = useRouter();

  // Catálogos
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);

  // Filtros oferta
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [filtroCarrera, setFiltroCarrera] = useState("");

  // Datos
  const [grupos,     setGrupos]     = useState<Grupo[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loadingGrupos,     setLoadingGrupos]     = useState(false);
  const [loadingMatriculas, setLoadingMatriculas] = useState(true);

  // Inscripción
  const [enrolling,  setEnrolling]  = useState<number | null>(null);
  const [canceling,  setCanceling]  = useState<number | null>(null);
  const [msgGlobal,  setMsgGlobal]  = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Tabs
  const [tab, setTab] = useState<"oferta" | "mis">("oferta");

  // Modal requisitos del estudiante
  type ReqInfo = { id: number; curso: { id_curso: number; descripcion: string } };
  const [reqModal, setReqModal] = useState<{ id_curso: number; descripcion: string } | null>(null);
  const [reqModalData, setReqModalData] = useState<{ prereqs: ReqInfo[]; coreqs: ReqInfo[] } | null>(null);
  const [reqModalLoading, setReqModalLoading] = useState(false);

  async function openReqModal(id_curso: number, descripcion: string) {
    setReqModal({ id_curso, descripcion });
    setReqModalData(null);
    setReqModalLoading(true);
    const res  = await fetch(`/api/prerequisitos?curso=${id_curso}`);
    const json = await res.json();
    if (json.ok) {
      setReqModalData({
        prereqs: json.data.prereqs.map((p: { id_prerequisito: number; requisito: { id_curso: number; descripcion: string } }) => ({ id: p.id_prerequisito, curso: p.requisito })),
        coreqs:  json.data.coreqs.map((p: { id_correquisito: number; correquisito: { id_curso: number; descripcion: string } }) => ({ id: p.id_correquisito, curso: p.correquisito })),
      });
    }
    setReqModalLoading(false);
  }

  // ── Cargar catálogos ────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch("/api/periodos").then((r) => r.json()),
      fetch("/api/carreras").then((r) => r.json()),
    ]).then(([p, c]) => {
      if (p.ok) {
        setPeriodos(p.data);
        // Preseleccionar el primer período activo
        if (p.data.length > 0) setFiltroPeriodo(String(p.data[0].id_periodo));
      }
      if (c.ok) setCarreras(c.data);
    });
  }, []);

  // ── Mis matrículas ──────────────────────────────────────────────────────────
  const fetchMatriculas = useCallback(async () => {
    setLoadingMatriculas(true);
    const res  = await fetch("/api/matricula");
    const json = await res.json();
    if (json.ok) setMatriculas(json.data);
    setLoadingMatriculas(false);
  }, []);

  useEffect(() => { fetchMatriculas(); }, [fetchMatriculas]);

  // ── Oferta académica ────────────────────────────────────────────────────────
  const fetchGrupos = useCallback(async () => {
    if (!filtroPeriodo) return;
    setLoadingGrupos(true);
    const params = new URLSearchParams({ periodo: filtroPeriodo, activos: "true" });
    if (filtroCarrera) params.set("carrera", filtroCarrera);
    const res  = await fetch(`/api/grupos?${params}`);
    const json = await res.json();
    if (json.ok) setGrupos(json.data);
    setLoadingGrupos(false);
  }, [filtroPeriodo, filtroCarrera]);

  useEffect(() => { fetchGrupos(); }, [fetchGrupos]);

  // IDs de grupos ya inscritos (para deshabilitar el botón)
  const inscritosIds = new Set(
    matriculas
      .filter((m) => m.estado !== "cancelada")
      .map((m) => m.grupo.id_grupo)
  );

  // ── Inscribirse ─────────────────────────────────────────────────────────────
  async function handleEnroll(id_grupo: number) {
    setEnrolling(id_grupo);
    setMsgGlobal(null);
    const res  = await fetch("/api/matricula", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id_grupo }),
    });
    const json = await res.json();
    setEnrolling(null);

    if (!json.ok) {
      setMsgGlobal({ type: "err", text: json.error });
      return;
    }

    if (json.data?.lista_espera) {
      setMsgGlobal({ type: "ok", text: "No hay cupo disponible. Fuiste agregado a la lista de espera." });
    } else {
      setMsgGlobal({ type: "ok", text: "¡Inscripción exitosa! Recuerda completar tu pago para confirmar la matrícula." });
      router.push(`/matricula/${json.data.id_matricula}`);
      return;
    }

    fetchGrupos();
    fetchMatriculas();
  }

  // ── Cancelar ────────────────────────────────────────────────────────────────
  async function handleCancel(id_matricula: number) {
    if (!confirm("¿Confirmas que deseas cancelar esta matrícula?")) return;
    setCanceling(id_matricula);
    setMsgGlobal(null);
    const res  = await fetch(`/api/matricula/${id_matricula}`, { method: "DELETE" });
    const json = await res.json();
    setCanceling(null);

    if (!json.ok) { setMsgGlobal({ type: "err", text: json.error }); return; }
    setMsgGlobal({ type: "ok", text: "Matrícula cancelada correctamente." });
    fetchGrupos();
    fetchMatriculas();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Matrícula en Línea</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Mensaje global */}
        {msgGlobal && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            msgGlobal.type === "ok"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {msgGlobal.text}
            <button onClick={() => setMsgGlobal(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-6">
          <button
            onClick={() => setTab("oferta")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "oferta"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Oferta académica
          </button>
          <button
            onClick={() => setTab("mis")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === "mis"
                ? "border-[#2563EB] text-[#2563EB]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Mis matrículas
            {matriculas.filter((m) => m.estado !== "cancelada").length > 0 && (
              <span className="ml-2 bg-[#2563EB] text-white text-xs rounded-full px-1.5 py-0.5">
                {matriculas.filter((m) => m.estado !== "cancelada").length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab: Oferta académica ─────────────────────────────────────────── */}
        {tab === "oferta" && (
          <>
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                <option value="">Selecciona período</option>
                {periodos.map((p) => (
                  <option key={p.id_periodo} value={p.id_periodo}>{p.descripcion}</option>
                ))}
              </select>
              <select
                value={filtroCarrera}
                onChange={(e) => setFiltroCarrera(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
              >
                <option value="">Todas las carreras</option>
                {carreras.map((c) => (
                  <option key={c.id_carrera} value={c.id_carrera}>{c.descripcion}</option>
                ))}
              </select>
            </div>

            {/* Banner estado de ventana RF-14 */}
            {filtroPeriodo && (() => {
              const p = periodos.find((x) => String(x.id_periodo) === filtroPeriodo);
              if (!p) return null;
              const estado = getWindowStatus(p);
              const banners: Record<VentanaEstado, { cls: string; msg: string }> = {
                abierta: { cls: "bg-green-50 border-green-200 text-green-700", msg: `Matrícula abierta hasta el ${new Date(p.fecha_fin).toLocaleDateString("es-CR")}` },
                ajustes: { cls: "bg-blue-50 border-blue-200 text-blue-700",   msg: `Período de ajustes activo hasta el ${new Date(p.fecha_fin_ajustes!).toLocaleDateString("es-CR")}` },
                cerrada: { cls: "bg-amber-50 border-amber-200 text-amber-700", msg: "El período de inscripción está cerrado. No se pueden realizar nuevas inscripciones." },
              };
              const { cls, msg } = banners[estado];
              return (
                <div className={`mb-4 px-4 py-2.5 rounded-xl border text-sm font-medium ${cls}`}>
                  {msg}
                </div>
              );
            })()}

            {/* Tabla de oferta */}
            {loadingGrupos ? (
              <p className="text-slate-500 text-sm">Cargando oferta...</p>
            ) : grupos.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                No hay grupos disponibles para los filtros seleccionados.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Curso</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Grupo</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Horario</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Aula</th>
                      <th className="text-center px-5 py-3 text-slate-500 font-medium">Créditos</th>
                      <th className="text-center px-5 py-3 text-slate-500 font-medium">Cupo</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grupos.map((g) => {
                      const yaInscrito  = inscritosIds.has(g.id_grupo);
                      const sinCupo     = g.cupo_actual >= g.cupo_maximo;
                      const isEnrolling = enrolling === g.id_grupo;

                      return (
                        <tr key={g.id_grupo} className="hover:bg-slate-50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-800">{g.curso.descripcion}</span>
                              <button
                                onClick={() => openReqModal(g.curso.id_curso, g.curso.descripcion)}
                                title="Ver prerrequisitos y correquisitos"
                                className="text-slate-400 hover:text-[#2563EB] text-xs leading-none transition-colors"
                              >
                                ⓘ
                              </button>
                            </div>
                            <div className="text-xs text-slate-400">{g.carrera.descripcion}</div>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{g.descripcion}</td>
                          <td className="px-5 py-3 text-slate-600">
                            {g.horarios.length === 0
                              ? <span className="text-slate-400 italic">Sin horario</span>
                              : g.horarios.map((h, i) => (
                                  <div key={i} className="text-xs">
                                    {DIAS[h.dia_semana]} {horaStr(h.hora_inicio)}–{horaStr(h.hora_fin)}
                                  </div>
                                ))
                            }
                          </td>
                          <td className="px-5 py-3 text-slate-600 text-xs">{g.aula.nombre}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">
                              {g.curso.creditos}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-xs font-medium ${sinCupo ? "text-red-600" : "text-green-700"}`}>
                              {g.cupo_actual}/{g.cupo_maximo}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {yaInscrito ? (
                              <span className="text-xs text-green-600 font-medium">✓ Inscrito</span>
                            ) : (
                              <button
                                onClick={() => handleEnroll(g.id_grupo)}
                                disabled={isEnrolling}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                                  sinCupo
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                    : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                                }`}
                              >
                                {isEnrolling ? "..." : sinCupo ? "Lista de espera" : "Inscribirse"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Mis matrículas ───────────────────────────────────────────── */}
        {tab === "mis" && (
          <>
            {loadingMatriculas ? (
              <p className="text-slate-500 text-sm">Cargando...</p>
            ) : matriculas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                No tienes matrículas registradas.
              </div>
            ) : (
              <div className="space-y-3">
                {matriculas.map((m) => (
                  <div
                    key={m.id_matricula}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{m.grupo.curso.descripcion}</div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {m.grupo.descripcion} · {m.grupo.aula.nombre} · {m.grupo.periodo.descripcion}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {m.grupo.horarios.map((h, i) => (
                          <span key={i} className="mr-3">
                            {DIAS[h.dia_semana]} {horaStr(h.hora_inicio)}–{horaStr(h.hora_fin)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${estadoBadge(m.estado)}`}>
                        {m.estado}
                      </span>
                      <Link
                        href={`/matricula/${m.id_matricula}`}
                        className="text-xs text-[#2563EB] hover:underline"
                      >
                        Ver comprobante
                      </Link>
                      {m.estado === "pendiente" && (
                        <button
                          onClick={() => handleCancel(m.id_matricula)}
                          disabled={canceling === m.id_matricula}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          {canceling === m.id_matricula ? "..." : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal requisitos del curso */}
      {reqModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Requisitos</h2>
                <p className="text-xs text-slate-500 mt-0.5">{reqModal.descripcion}</p>
              </div>
              <button onClick={() => setReqModal(null)} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>

            {reqModalLoading ? (
              <p className="text-slate-500 text-sm">Cargando...</p>
            ) : reqModalData && (
              <div className="space-y-4">
                <section>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Prerrequisitos</h3>
                  {reqModalData.prereqs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tiene prerrequisitos</p>
                  ) : (
                    <ul className="space-y-1">
                      {reqModalData.prereqs.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <span className="text-amber-500">⚠</span>
                          {r.curso.descripcion}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Correquisitos</h3>
                  {reqModalData.coreqs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No tiene correquisitos</p>
                  ) : (
                    <ul className="space-y-1">
                      {reqModalData.coreqs.map((r) => (
                        <li key={r.id} className="flex items-center gap-2 text-sm text-slate-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                          <span className="text-blue-400">↔</span>
                          {r.curso.descripcion}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <p className="text-xs text-slate-400 pt-1">
                  Los prerrequisitos deben estar <strong>aprobados</strong> antes de inscribirte. Los correquisitos deben cursarse en el <strong>mismo período</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
