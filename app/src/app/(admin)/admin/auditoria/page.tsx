"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Registro = {
  id_bitacora:       string;
  accion:            string;
  tabla_afectada:    string;
  id_registro:       string;
  descripcion:       string | null;
  ip_origen:         string | null;
  fecha_accion:      string;
  tipo_auditoria:    { descripcion: string };
  usuario:           { nombre: string; apellidos: string };
};

const TIPOS = [
  { id: "",  label: "Todos los tipos" },
  { id: "1", label: "Login" },
  { id: "2", label: "Matrícula" },
  { id: "3", label: "Cancelación" },
  { id: "4", label: "Pago" },
  { id: "5", label: "Gestión" },
];

const ACCION_COLOR: Record<string, string> = {
  LOGIN:  "bg-blue-100 text-blue-700",
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-600",
};

function fechaStr(iso: string) {
  return new Date(iso).toLocaleString("es-CR", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

// ─── TODO(human) ──────────────────────────────────────────────────────────────
// Implement construirParams to build the query string for the API call.
// It receives the active filter values and should return a query string like
// "tipo=2&cedula=1-0000-0002" — only including params with non-empty values.
function construirParams(filtros: { tipo: string; cedula: string }): string {
  const params = new URLSearchParams();
  if (filtros.tipo)   params.append("tipo", filtros.tipo);
  if (filtros.cedula) params.append("cedula", filtros.cedula);
  return params.toString();
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [filtroTipo,   setFiltroTipo]   = useState("");
  const [filtroCedula, setFiltroCedula] = useState("");
  const [cedulaInput,  setCedulaInput]  = useState("");

  const fetchRegistros = useCallback(async () => {
    setLoading(true);
    const params = construirParams({ tipo: filtroTipo, cedula: filtroCedula });
    const res    = await fetch(`/api/auditoria${params ? `?${params}` : ""}`);
    const json   = await res.json();
    if (json.ok) setRegistros(json.data);
    setLoading(false);
  }, [filtroTipo, filtroCedula]);

  useEffect(() => { fetchRegistros(); }, [fetchRegistros]);

  function aplicarCedula(e: React.FormEvent) {
    e.preventDefault();
    setFiltroCedula(cedulaInput.trim());
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Bitácora de Auditoría</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
          >
            {TIPOS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <form onSubmit={aplicarCedula} className="flex gap-2">
            <input
              value={cedulaInput}
              onChange={(e) => setCedulaInput(e.target.value)}
              placeholder="Filtrar por cédula..."
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 w-48"
            />
            <button
              type="submit"
              className="bg-[#2563EB] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#1D4ED8]"
            >
              Buscar
            </button>
            {filtroCedula && (
              <button
                type="button"
                onClick={() => { setFiltroCedula(""); setCedulaInput(""); }}
                className="text-sm text-slate-500 hover:text-slate-700 px-2"
              >
                ✕
              </button>
            )}
          </form>

          <span className="text-xs text-slate-400 ml-auto">
            {registros.length} registro(s)
          </span>
        </div>

        {/* Tabla */}
        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : registros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No hay registros para los filtros seleccionados.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Fecha</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Usuario</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Tipo</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Acción</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registros.map((r) => (
                  <tr key={r.id_bitacora} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {fechaStr(r.fecha_accion)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">
                        {r.usuario.nombre} {r.usuario.apellidos}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.tipo_auditoria.descripcion}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACCION_COLOR[r.accion] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                      {r.descripcion ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
