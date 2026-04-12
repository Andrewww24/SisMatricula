"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Periodo = {
  id_periodo:  number;
  descripcion: string;
  activo:      boolean;
  fecha_inicio: string;
  fecha_fin:    string;
};

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const [filtroActivo, setFiltroActivo] = useState("true");

  const [modalOpen, setModalOpen]   = useState(false);
  const [editPeriodo, setEditPeriodo] = useState<Periodo | null>(null);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState("");

  const [formDesc,   setFormDesc]   = useState("");
  const [formInicio, setFormInicio] = useState("");
  const [formFin,    setFormFin]    = useState("");

  const fetchPeriodos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ activos: filtroActivo });
    const res  = await fetch(`/api/periodos?${params}`);
    const json = await res.json();
    if (json.ok) setPeriodos(json.data);
    else setError(json.error);
    setLoading(false);
  }, [filtroActivo]);

  useEffect(() => { fetchPeriodos(); }, [fetchPeriodos]);

  function openCreate() {
    setEditPeriodo(null);
    setFormDesc("");
    setFormInicio("");
    setFormFin("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p: Periodo) {
    setEditPeriodo(p);
    setFormDesc(p.descripcion);
    // Recortar a YYYY-MM-DD para el input date
    setFormInicio(p.fecha_inicio.slice(0, 10));
    setFormFin(p.fecha_fin.slice(0, 10));
    setFormError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");

    const url    = editPeriodo ? `/api/periodos/${editPeriodo.id_periodo}` : "/api/periodos";
    const method = editPeriodo ? "PUT" : "POST";

    const res  = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion: formDesc, fecha_inicio: formInicio, fecha_fin: formFin }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.ok) { setFormError(json.error); return; }
    setModalOpen(false);
    fetchPeriodos();
  }

  async function handleToggle(p: Periodo) {
    await fetch(`/api/periodos/${p.id_periodo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !p.activo }),
    });
    fetchPeriodos();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/gestion" className="text-slate-400 hover:text-white text-sm">← Gestión</Link>
          <span className="text-slate-600">|</span>
          <span className="font-semibold">Gestión de Períodos</span>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo período
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-6">
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
          >
            <option value="true">Solo activos</option>
            <option value="false">Todos</option>
          </select>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Período</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Inicio</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Fin</th>
                  <th className="text-center px-5 py-3 text-slate-500 font-medium">Estado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodos.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400">Sin períodos</td></tr>
                )}
                {periodos.map((p) => (
                  <tr key={p.id_periodo} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{p.descripcion}</td>
                    <td className="px-5 py-3 text-slate-600">{formatFecha(p.fecha_inicio)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatFecha(p.fecha_fin)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-[#2563EB] hover:underline text-xs">Editar</button>
                        <button onClick={() => handleToggle(p)} className="text-slate-400 hover:text-slate-700 text-xs">
                          {p.activo ? "Desactivar" : "Activar"}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              {editPeriodo ? "Editar período" : "Nuevo período"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="ej. 2026-II"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio *</label>
                <input
                  type="date"
                  value={formInicio}
                  onChange={(e) => setFormInicio(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de fin *</label>
                <input
                  type="date"
                  value={formFin}
                  onChange={(e) => setFormFin(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              {formError && (
                <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-6 py-2 rounded-xl disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
