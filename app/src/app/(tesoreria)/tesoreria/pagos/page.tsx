"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Grupo = {
  descripcion: string;
  curso:   { descripcion: string; creditos: number };
  periodo: { descripcion: string };
  aula:    { nombre: string };
};
type Matricula = {
  id_matricula:    number;
  estado:          string;
  fecha_matricula: string;
  grupo: Grupo;
};

// Precio sugerido experimental: ₡15 000 por crédito
const COSTO_POR_CREDITO = 15_000;

const METODOS = [
  { id: 1, label: "Efectivo" },
  { id: 2, label: "Tarjeta" },
  { id: 3, label: "Transferencia" },
];

function formatColones(n: number) {
  return `₡${n.toLocaleString("es-CR")}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TesoreriaPagosPage() {
  // Búsqueda
  const [cedula,   setCedula]   = useState("");
  const [buscando, setBuscando] = useState(false);
  const [busError, setBusError] = useState("");

  // Resultados
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [soloParaConfirmar, setSoloParaConfirmar] = useState(true);

  // Formularios de pago por matrícula
  const [montos,    setMontos]    = useState<Record<number, string>>({});
  const [metodos,   setMetodos]   = useState<Record<number, number>>({});
  const [procesando, setProcesando] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Record<number, { ok: boolean; text: string }>>({});

  // ── Buscar matrículas de un estudiante ──────────────────────────────────────
  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!cedula.trim()) return;

    setBuscando(true);
    setBusError("");
    setMatriculas([]);
    setMsgs({});

    const res  = await fetch(`/api/matricula?cedula=${encodeURIComponent(cedula.trim())}`);
    const json = await res.json();
    setBuscando(false);

    if (!json.ok) { setBusError(json.error); return; }
    if (json.data.length === 0) {
      setBusError("No se encontraron matrículas para esta cédula.");
      return;
    }

    // Preinicializar montos sugeridos
    const montosInit: Record<number, string> = {};
    const metodosInit: Record<number, number> = {};
    for (const m of json.data) {
      montosInit[m.id_matricula]  = String(m.grupo.curso.creditos * COSTO_POR_CREDITO);
      metodosInit[m.id_matricula] = 1;
    }
    setMontos(montosInit);
    setMetodos(metodosInit);
    setMatriculas(json.data);
  }

  // ── Confirmar pago para una matrícula ───────────────────────────────────────
  async function confirmar(id_matricula: number) {
    const monto = parseFloat(montos[id_matricula] ?? "0");
    if (!monto || monto <= 0) {
      setMsgs((p) => ({ ...p, [id_matricula]: { ok: false, text: "El monto debe ser mayor a 0." } }));
      return;
    }

    setProcesando(id_matricula);
    setMsgs((p) => ({ ...p, [id_matricula]: { ok: true, text: "" } }));

    const res  = await fetch("/api/pagos", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        id_matricula,
        monto,
        id_metodo_pago: metodos[id_matricula] ?? 1,
      }),
    });
    const json = await res.json();
    setProcesando(null);

    if (!json.ok) {
      setMsgs((p) => ({ ...p, [id_matricula]: { ok: false, text: json.error } }));
      return;
    }

    setMsgs((p) => ({
      ...p,
      [id_matricula]: { ok: true, text: `Pago confirmado. Factura #${json.data.factura.id_factura}` },
    }));

    // Actualizar estado localmente para reflejar la confirmación
    setMatriculas((prev) =>
      prev.map((m) =>
        m.id_matricula === id_matricula ? { ...m, estado: "confirmada" } : m
      )
    );
  }

  const listaFiltrada = soloParaConfirmar
    ? matriculas.filter((m) => m.estado === "pendiente")
    : matriculas;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
          ← Dashboard
        </Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Confirmación de Pagos</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Búsqueda por cédula */}
        <form onSubmit={buscar} className="flex gap-3 mb-6">
          <input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Cédula del estudiante"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
          <button
            type="submit"
            disabled={buscando}
            className="bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {busError && (
          <p className="text-sm text-red-600 mb-4">{busError}</p>
        )}

        {/* Resultados */}
        {matriculas.length > 0 && (
          <>
            {/* Controles */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600">
                Cédula: <span className="font-mono font-semibold text-slate-800">{cedula}</span>
                {" · "}
                <span>{matriculas.filter((m) => m.estado === "pendiente").length} pendiente(s)</span>
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloParaConfirmar}
                  onChange={(e) => setSoloParaConfirmar(e.target.checked)}
                  className="accent-[#2563EB]"
                />
                Solo pendientes
              </label>
            </div>

            {listaFiltrada.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
                No hay matrículas pendientes para esta cédula.
              </div>
            ) : (
              <div className="space-y-4">
                {listaFiltrada.map((m) => {
                  const creditos = m.grupo.curso.creditos;
                  const isPending = m.estado === "pendiente";
                  const msg = msgs[m.id_matricula];

                  return (
                    <div
                      key={m.id_matricula}
                      className={`bg-white rounded-2xl border p-5 ${
                        isPending ? "border-slate-200" : "border-green-200 opacity-70"
                      }`}
                    >
                      {/* Info del curso */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-semibold text-slate-800">
                            {m.grupo.curso.descripcion}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {m.grupo.descripcion} · {m.grupo.periodo.descripcion}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {creditos} crédito(s) · Sugerido: {formatColones(creditos * COSTO_POR_CREDITO)}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                            isPending
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {m.estado}
                        </span>
                      </div>

                      {/* Formulario de pago (solo si pendiente) */}
                      {isPending && (
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-xs text-slate-500 block mb-1">Monto (₡)</label>
                            <input
                              type="number"
                              min="1"
                              value={montos[m.id_matricula] ?? ""}
                              onChange={(e) =>
                                setMontos((p) => ({ ...p, [m.id_matricula]: e.target.value }))
                              }
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Método</label>
                            <select
                              value={metodos[m.id_matricula] ?? 1}
                              onChange={(e) =>
                                setMetodos((p) => ({
                                  ...p,
                                  [m.id_matricula]: Number(e.target.value),
                                }))
                              }
                              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
                            >
                              {METODOS.map((met) => (
                                <option key={met.id} value={met.id}>
                                  {met.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => confirmar(m.id_matricula)}
                            disabled={procesando === m.id_matricula}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                          >
                            {procesando === m.id_matricula ? "Procesando..." : "Confirmar pago"}
                          </button>
                        </div>
                      )}

                      {/* Feedback inline */}
                      {msg?.text && (
                        <p
                          className={`mt-3 text-sm font-medium ${
                            msg.ok ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          {msg.ok ? "✓" : "✗"} {msg.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
