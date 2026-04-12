"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Aula    = { id_aula: number; nombre: string; capacidad: number; ubicacion: string | null };
type Carrera = { id_carrera: number; descripcion: string };
type Curso   = { id_curso: number; descripcion: string; creditos: number };
type Periodo = { id_periodo: number; descripcion: string };

type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };

type Grupo = {
  id_grupo: number;
  descripcion: string;
  activo: boolean;
  cupo_maximo: number;
  cupo_actual: number;
  curso: Curso;
  carrera: Carrera;
  periodo: Periodo;
  aula: Aula;
  horarios: { dia_semana: number; hora_inicio: string; hora_fin: string }[];
};

const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function horaStr(iso: string) {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function GruposPage() {
  const [grupos, setGrupos]     = useState<Grupo[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [cursos, setCursos]     = useState<Curso[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [aulas, setAulas]       = useState<Aula[]>([]);
  const [loading, setLoading]   = useState(true);

  // Filtros
  const [filtroCurso, setFiltroCurso]     = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [filtroActivo, setFiltroActivo]   = useState("true");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editGrupo, setEditGrupo] = useState<Grupo | null>(null);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState("");

  // Form fields
  const [formDesc, setFormDesc]       = useState("");
  const [formCurso, setFormCurso]     = useState("");
  const [formCarrera, setFormCarrera] = useState("");
  const [formPeriodo, setFormPeriodo] = useState("");
  const [formAula, setFormAula]       = useState("");
  const [formCupo, setFormCupo]       = useState("30");
  const [formHorarios, setFormHorarios] = useState<Horario[]>([
    { dia_semana: 1, hora_inicio: "07:00", hora_fin: "09:00" },
  ]);

  const fetchGrupos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("activos", filtroActivo);
    if (filtroCurso)   params.set("curso", filtroCurso);
    if (filtroPeriodo) params.set("periodo", filtroPeriodo);
    const res  = await fetch(`/api/grupos?${params}`);
    const json = await res.json();
    if (json.ok) setGrupos(json.data);
    setLoading(false);
  }, [filtroCurso, filtroPeriodo, filtroActivo]);

  useEffect(() => {
    Promise.all([
      fetch("/api/carreras").then(r => r.json()),
      fetch("/api/cursos").then(r => r.json()),
      fetch("/api/periodos").then(r => r.json()),
      fetch("/api/aulas").then(r => r.json()),
    ]).then(([c, cu, p, a]) => {
      if (c.ok)  setCarreras(c.data);
      if (cu.ok) setCursos(cu.data);
      if (p.ok)  setPeriodos(p.data);
      if (a.ok)  setAulas(a.data);
    });
  }, []);

  useEffect(() => { fetchGrupos(); }, [fetchGrupos]);

  function openCreate() {
    setEditGrupo(null);
    setFormDesc("");
    setFormCurso(cursos[0]?.id_curso.toString() ?? "");
    setFormCarrera(carreras[0]?.id_carrera.toString() ?? "");
    setFormPeriodo(periodos[0]?.id_periodo.toString() ?? "");
    setFormAula(aulas[0]?.id_aula.toString() ?? "");
    setFormCupo("30");
    setFormHorarios([{ dia_semana: 1, hora_inicio: "07:00", hora_fin: "09:00" }]);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(g: Grupo) {
    setEditGrupo(g);
    setFormDesc(g.descripcion);
    setFormCurso(g.curso.id_curso.toString());
    setFormCarrera(g.carrera.id_carrera.toString());
    setFormPeriodo(g.periodo.id_periodo.toString());
    setFormAula(g.aula.id_aula.toString());
    setFormCupo(g.cupo_maximo.toString());
    setFormHorarios(
      g.horarios.map(h => ({
        dia_semana:  h.dia_semana,
        hora_inicio: horaStr(h.hora_inicio),
        hora_fin:    horaStr(h.hora_fin),
      }))
    );
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");

    const body = {
      descripcion: formDesc,
      id_curso:    Number(formCurso),
      id_carrera:  Number(formCarrera),
      id_periodo:  Number(formPeriodo),
      id_aula:     Number(formAula),
      cupo_maximo: Number(formCupo),
      horarios:    formHorarios,
    };

    const url    = editGrupo ? `/api/grupos/${editGrupo.id_grupo}` : "/api/grupos";
    const method = editGrupo ? "PUT" : "POST";

    try {
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!json.ok) { setFormError(json.error); return; }
      setModalOpen(false);
      fetchGrupos();
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(g: Grupo) {
    await fetch(`/api/grupos/${g.id_grupo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !g.activo }),
    });
    fetchGrupos();
  }

  void carreras;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
          <span className="text-slate-600">|</span>
          <span className="font-semibold">Gestión de Grupos</span>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/gestion/cursos" className="text-slate-300 hover:text-white text-sm px-3 py-2">
            Ver cursos
          </Link>
          <button
            onClick={openCreate}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            + Nuevo grupo
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
            <option value="">Todos los cursos</option>
            {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.descripcion}</option>)}
          </select>
          <select value={filtroPeriodo} onChange={e => setFiltroPeriodo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
            <option value="">Todos los períodos</option>
            {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.descripcion}</option>)}
          </select>
          <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white">
            <option value="true">Solo activos</option>
            <option value="false">Todos</option>
          </select>
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Curso</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Grupo</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Aula</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Horario</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">Cupo</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grupos.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-400">Sin grupos</td></tr>
                )}
                {grupos.map(g => (
                  <tr key={g.id_grupo} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{g.curso.descripcion}</td>
                    <td className="px-5 py-3 text-slate-600">{g.descripcion}</td>
                    <td className="px-5 py-3 text-slate-600">{g.aula.nombre}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {g.horarios.map((h, i) => (
                        <span key={i} className="block text-xs">
                          {DIAS[h.dia_semana]} {horaStr(h.hora_inicio)}–{horaStr(h.hora_fin)}
                        </span>
                      ))}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-mono ${g.cupo_actual >= g.cupo_maximo ? "text-red-600" : "text-slate-700"}`}>
                        {g.cupo_actual}/{g.cupo_maximo}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${g.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {g.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(g)} className="text-[#2563EB] hover:underline text-xs">Editar</button>
                        <button onClick={() => handleToggle(g)} className="text-slate-400 hover:text-slate-700 text-xs">
                          {g.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              {editGrupo ? "Editar grupo" : "Nuevo grupo"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Curso *</label>
                  <select value={formCurso} onChange={e => setFormCurso(e.target.value)}
                    disabled={!!editGrupo}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-slate-50">
                    {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Carrera *</label>
                  <select value={formCarrera} onChange={e => setFormCarrera(e.target.value)}
                    disabled={!!editGrupo}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-slate-50">
                    {carreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Período *</label>
                  <select value={formPeriodo} onChange={e => setFormPeriodo(e.target.value)}
                    disabled={!!editGrupo}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm disabled:bg-slate-50">
                    {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.descripcion}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (grupo)</label>
                  <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                    placeholder="ej. Grupo 01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aula *</label>
                  <select value={formAula} onChange={e => setFormAula(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                    {aulas.map(a => <option key={a.id_aula} value={a.id_aula}>{a.nombre} (cap. {a.capacidad})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cupo máximo</label>
                  <input type="number" min={1} value={formCupo} onChange={e => setFormCupo(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>

              {/* Horarios */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Horarios</label>
                  <button
                    type="button"
                    onClick={() => setFormHorarios([...formHorarios, { dia_semana: 1, hora_inicio: "07:00", hora_fin: "09:00" }])}
                    className="text-xs text-[#2563EB] hover:underline"
                  >
                    + Agregar día
                  </button>
                </div>
                {formHorarios.map((h, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select value={h.dia_semana}
                      onChange={e => setFormHorarios(formHorarios.map((x, idx) => idx === i ? { ...x, dia_semana: Number(e.target.value) } : x))}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                      {DIAS.slice(1).map((d, j) => <option key={j+1} value={j+1}>{d}</option>)}
                    </select>
                    <input type="time" value={h.hora_inicio}
                      onChange={e => setFormHorarios(formHorarios.map((x, idx) => idx === i ? { ...x, hora_inicio: e.target.value } : x))}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                    <span className="text-slate-500 text-xs">a</span>
                    <input type="time" value={h.hora_fin}
                      onChange={e => setFormHorarios(formHorarios.map((x, idx) => idx === i ? { ...x, hora_fin: e.target.value } : x))}
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm" />
                    {formHorarios.length > 1 && (
                      <button type="button" onClick={() => setFormHorarios(formHorarios.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
              </div>

              {formError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-6 py-2 rounded-xl disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
