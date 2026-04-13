"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Periodo = { id_periodo: number; descripcion: string };

type ReporteMatricula = {
  total:      number;
  por_estado: Record<string, number>;
  por_carrera: { carrera: string; total: number }[];
  detalle: {
    id_matricula:   number;
    estado:         string;
    fecha_matricula: string;
    persona: { cedula: string; nombre: string; apellidos: string };
    grupo: {
      descripcion: string;
      curso:   { descripcion: string; creditos: number };
      carrera: { descripcion: string };
      periodo: { descripcion: string };
    };
  }[];
};

type ReporteFinanciero = {
  total:            number;
  total_recaudado:  number;
  total_facturas:   number;
  por_metodo: { metodo: string; total: number; count: number }[];
  detalle: {
    id_pago:     number;
    monto:       number;
    estado:      string;
    fecha_pago:  string;
    persona:     { cedula: string; nombre: string; apellidos: string };
    metodo_pago: { descripcion: string };
    matricula:   { grupo: { curso: { descripcion: string }; periodo: { descripcion: string } } };
  }[];
};


function exportarCSV(filas: Record<string, unknown>[], nombre: string): void {
  if (filas.length === 0) return;
  const encabezados = Object.keys(filas[0]);
  const csv = [
    encabezados.join(","),
    ...filas.map(fila => encabezados.map(col => {
      const val = String(fila[col] ?? "");
      return val.includes (",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombre}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
// ─────────────────────────────────────────────────────────────────────────────

const ESTADO_COLOR: Record<string, string> = {
  confirmada: "bg-green-100 text-green-700",
  pendiente:  "bg-amber-100 text-amber-700",
  cancelada:  "bg-red-100 text-red-600",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" });
}

function fmtMonto(n: number) {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(n);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ReportesPage() {
  const [tab,      setTab]      = useState<"matricula" | "financiero">("matricula");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodo,  setPeriodo]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const [dataMatricula,  setDataMatricula]  = useState<ReporteMatricula | null>(null);
  const [dataFinanciero, setDataFinanciero] = useState<ReporteFinanciero | null>(null);

  // Cargar periodos para el selector
  useEffect(() => {
    fetch("/api/periodos").then((r) => r.json()).then((j) => {
      if (j.ok) setPeriodos(j.data);
    });
  }, []);

  const fetchMatricula = useCallback(async () => {
    setLoading(true);
    const qs  = periodo ? `?periodo=${periodo}` : "";
    const res = await fetch(`/api/reportes/matricula${qs}`);
    const j   = await res.json();
    if (j.ok) setDataMatricula(j.data);
    setLoading(false);
  }, [periodo]);

  const fetchFinanciero = useCallback(async () => {
    setLoading(true);
    const qs  = periodo ? `?periodo=${periodo}` : "";
    const res = await fetch(`/api/reportes/financiero${qs}`);
    const j   = await res.json();
    if (j.ok) setDataFinanciero(j.data);
    setLoading(false);
  }, [periodo]);

  useEffect(() => {
    if (tab === "matricula")  fetchMatricula();
    if (tab === "financiero") fetchFinanciero();
  }, [tab, fetchMatricula, fetchFinanciero]);

  // ── Exportar matrícula ─────────────────────────────────────
  function exportMatricula() {
    if (!dataMatricula) return;
    const filas = dataMatricula.detalle.map((m) => ({
      cedula:   m.persona.cedula,
      nombre:   `${m.persona.nombre} ${m.persona.apellidos}`,
      curso:    m.grupo.curso.descripcion,
      carrera:  m.grupo.carrera.descripcion,
      periodo:  m.grupo.periodo.descripcion,
      estado:   m.estado,
      fecha:    fmt(m.fecha_matricula),
      creditos: m.grupo.curso.creditos,
    }));
    exportarCSV(filas, `reporte_matricula_${periodo || "todos"}`);
  }

  // ── Exportar financiero ────────────────────────────────────
  function exportFinanciero() {
    if (!dataFinanciero) return;
    const filas = dataFinanciero.detalle.map((p) => ({
      cedula:  p.persona.cedula,
      nombre:  `${p.persona.nombre} ${p.persona.apellidos}`,
      curso:   p.matricula.grupo.curso.descripcion,
      periodo: p.matricula.grupo.periodo.descripcion,
      metodo:  p.metodo_pago.descripcion,
      monto:   p.monto,
      estado:  p.estado,
      fecha:   fmt(p.fecha_pago),
    }));
    exportarCSV(filas, `reporte_financiero_${periodo || "todos"}`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Reportes</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Controles */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Tabs */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            <button
              onClick={() => setTab("matricula")}
              className={`px-4 py-2 text-sm font-medium ${tab === "matricula" ? "bg-[#0B1F3A] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Matrícula
            </button>
            <button
              onClick={() => setTab("financiero")}
              className={`px-4 py-2 text-sm font-medium ${tab === "financiero" ? "bg-[#0B1F3A] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Financiero
            </button>
          </div>

          {/* Filtro por periodo */}
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-700"
          >
            <option value="">Todos los periodos</option>
            {periodos.map((p) => (
              <option key={p.id_periodo} value={p.id_periodo}>{p.descripcion}</option>
            ))}
          </select>

          {/* Botón exportar */}
          <button
            onClick={tab === "matricula" ? exportMatricula : exportFinanciero}
            className="ml-auto bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1D4ED8]"
          >
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : tab === "matricula" ? (
          <TabMatricula data={dataMatricula} />
        ) : (
          <TabFinanciero data={dataFinanciero} />
        )}
      </div>
    </main>
  );
}

// ─── Tab Matrícula ────────────────────────────────────────────────────────────
function TabMatricula({ data }: { data: ReporteMatricula | null }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card label="Total" value={data.total} />
        <Card label="Confirmadas" value={data.por_estado["confirmada"] ?? 0} color="text-green-600" />
        <Card label="Pendientes"  value={data.por_estado["pendiente"]  ?? 0} color="text-amber-600" />
        <Card label="Canceladas"  value={data.por_estado["cancelada"]  ?? 0} color="text-red-500" />
      </div>

      {/* Por carrera */}
      {data.por_carrera.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Por carrera</h2>
          <div className="space-y-2">
            {data.por_carrera.map((c) => (
              <div key={c.carrera} className="flex justify-between text-sm">
                <span className="text-slate-600">{c.carrera}</span>
                <span className="font-medium text-slate-800">{c.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla detalle */}
      <DetalleTable
        headers={["Fecha", "Estudiante", "Curso", "Carrera", "Estado"]}
        rows={data.detalle.map((m) => [
          fmt(m.fecha_matricula),
          `${m.persona.nombre} ${m.persona.apellidos}`,
          m.grupo.curso.descripcion,
          m.grupo.carrera.descripcion,
          <span key="e" className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[m.estado] ?? "bg-slate-100 text-slate-600"}`}>
            {m.estado}
          </span>,
        ])}
      />
    </div>
  );
}

// ─── Tab Financiero ───────────────────────────────────────────────────────────
function TabFinanciero({ data }: { data: ReporteFinanciero | null }) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card label="Total recaudado" value={new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(data.total_recaudado)} />
        <Card label="Pagos registrados" value={data.total} />
        <Card label="Facturas emitidas" value={data.total_facturas} />
      </div>

      {/* Por método de pago */}
      {data.por_metodo.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Por método de pago</h2>
          <div className="space-y-2">
            {data.por_metodo.map((m) => (
              <div key={m.metodo} className="flex justify-between text-sm">
                <span className="text-slate-600">{m.metodo} <span className="text-slate-400">({m.count} pago(s))</span></span>
                <span className="font-medium text-slate-800">{fmtMonto(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla detalle */}
      <DetalleTable
        headers={["Fecha", "Estudiante", "Curso", "Método", "Monto", "Estado"]}
        rows={data.detalle.map((p) => [
          fmt(p.fecha_pago),
          `${p.persona.nombre} ${p.persona.apellidos}`,
          p.matricula.grupo.curso.descripcion,
          p.metodo_pago.descripcion,
          fmtMonto(p.monto),
          <span key="e" className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.estado === "confirmado" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {p.estado}
          </span>,
        ])}
      />
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function Card({ label, value, color = "text-slate-800" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function DetalleTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  if (rows.length === 0) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
      No hay registros para los filtros seleccionados.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-600 text-xs">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
