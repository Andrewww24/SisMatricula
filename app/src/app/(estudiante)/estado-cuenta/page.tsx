"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Pendiente = {
  id_matricula:   number;
  curso:          string;
  creditos:       number;
  periodo:        string;
  monto_adeudado: number;
};

type Confirmada = {
  id_matricula: number;
  curso:        string;
  periodo:      string;
  monto_pagado: number;
  fecha_pago:   string | null;
};

type EstadoCuenta = {
  pendientes:     Pendiente[];
  confirmadas:    Confirmada[];
  total_adeudado: number;
  total_pagado:   number;
};

async function handlePagar(
  id_matricula: number,
  id_metodo_pago: number,
  cargarDatos: () => void
): Promise<void> {
  const res = await fetch("/api/pagos", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id_matricula, id_metodo_pago }),
  });
  const json = await res.json();

  if (!json.ok) {
    alert(json.error || "Error al procesar el pago");
    return;
  }

  cargarDatos();
}

function fmtMonto(n: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency", currency: "CRC", maximumFractionDigits: 0,
  }).format(n);
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  });
}

const METODOS = [
  { id: 1, icono: "💵", label: "Efectivo" },
  { id: 2, icono: "💳", label: "Tarjeta" },
  { id: 3, icono: "🏦", label: "Transferencia" },
];

export default function EstadoCuentaPage() {
  const [data,    setData]    = useState<EstadoCuenta | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalPago, setModalPago]           = useState<Pendiente | null>(null);
  const [metodoSeleccionado, setMetodo]     = useState(1);
  const [pagando, setPagando]               = useState(false);

  function cargarDatos() {
    setLoading(true);
    fetch("/api/estado-cuenta")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setData(j.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargarDatos(); }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Estado de Cuenta</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : !data ? (
          <p className="text-red-500 text-sm">Error al cargar el estado de cuenta.</p>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-5 ${data.total_adeudado > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                <p className="text-xs text-slate-500 mb-1">Total adeudado</p>
                <p className={`text-2xl font-bold ${data.total_adeudado > 0 ? "text-red-600" : "text-slate-400"}`}>
                  {fmtMonto(data.total_adeudado)}
                </p>
                <p className="text-xs text-slate-400 mt-1">{data.pendientes.length} matrícula(s) pendiente(s) de pago</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <p className="text-xs text-slate-500 mb-1">Total pagado</p>
                <p className="text-2xl font-bold text-green-600">{fmtMonto(data.total_pagado)}</p>
                <p className="text-xs text-slate-400 mt-1">{data.confirmadas.length} matrícula(s) confirmada(s)</p>
              </div>
            </div>

            {/* Cargos pendientes */}
            {data.pendientes.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Cargos pendientes de pago</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-slate-500 font-medium">Curso</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-medium">Período</th>
                        <th className="text-right px-4 py-3 text-slate-500 font-medium">Créditos</th>
                        <th className="text-right px-4 py-3 text-slate-500 font-medium">Monto</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.pendientes.map((m) => (
                        <tr key={m.id_matricula} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-800 text-xs font-medium">{m.curso}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{m.periodo}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs text-right">{m.creditos}</td>
                          <td className="px-4 py-3 text-red-600 text-xs font-semibold text-right">
                            {fmtMonto(m.monto_adeudado)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => { setModalPago(m); setMetodo(1); }}
                              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Pagar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-red-50 border-t border-red-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-slate-700">Total a pagar</td>
                        <td className="px-4 py-3 text-xs font-bold text-red-600 text-right">{fmtMonto(data.total_adeudado)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2">Seleccioná una matrícula y elegí tu método de pago para confirmarla.</p>
              </section>
            )}

            {/* Pagos realizados */}
            {data.confirmadas.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Pagos realizados</h2>
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-slate-500 font-medium">Curso</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-medium">Período</th>
                        <th className="text-left px-4 py-3 text-slate-500 font-medium">Fecha pago</th>
                        <th className="text-right px-4 py-3 text-slate-500 font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.confirmadas.map((m) => (
                        <tr key={m.id_matricula} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-800 text-xs font-medium">{m.curso}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{m.periodo}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {m.fecha_pago ? fmtFecha(m.fecha_pago) : "—"}
                          </td>
                          <td className="px-4 py-3 text-green-600 text-xs font-semibold text-right">
                            {fmtMonto(m.monto_pagado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {data.pendientes.length === 0 && data.confirmadas.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                No tienes matrículas activas en este momento.
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de pago */}
      {modalPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">

            {/* Resumen del cobro */}
            <div className="text-center mb-6">
              <p className="text-xs text-slate-500 mb-1">Tu compra</p>
              <p className="text-3xl font-bold text-red-600">{fmtMonto(modalPago.monto_adeudado)}</p>
              <p className="text-sm text-slate-600 mt-1 font-medium">{modalPago.curso}</p>
            </div>

            {/* Selector de método de pago */}
            <p className="text-sm font-medium text-slate-700 mb-3">Elegí tu método de pago</p>

            {/* TODO(human): Implementá las 3 cards del selector de método de pago.
                Tenés disponible el array METODOS (definido arriba del componente):
                  [{ id: 1, icono: "💵", label: "Efectivo" },
                   { id: 2, icono: "💳", label: "Tarjeta" },
                   { id: 3, icono: "🏦", label: "Transferencia" }]
                Cada card debe ser un <button> que:
                  - Muestre el icono y el label
                  - Llame a setMetodo(m.id) al hacer click
                  - Tenga borde azul (border-[#2563EB]) si metodoSeleccionado === m.id
                  - Tenga borde gris (border-slate-200) si no está seleccionado */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {/* Implementá las cards aquí usando METODOS.map(...) */}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => setModalPago(null)}
                disabled={pagando}
                className="flex-1 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl py-2.5 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={pagando}
                onClick={async () => {
                  setPagando(true);
                  await handlePagar(modalPago.id_matricula, metodoSeleccionado, cargarDatos);
                  setPagando(false);
                  setModalPago(null);
                }}
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {pagando ? "Procesando..." : "Confirmar pago →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
