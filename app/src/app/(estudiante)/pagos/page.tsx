"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Factura = {
  id_factura:    number;
  monto_neto:    string;
  fecha_emision: string;
};
type Pago = {
  id_pago:     number;
  monto:       string;
  estado:      string;
  fecha_pago:  string;
  metodo_pago: { descripcion: string };
  matricula: {
    id_matricula: number;
    estado:       string;
    grupo: {
      curso:   { descripcion: string; creditos: number };
      periodo: { descripcion: string };
    };
  } | null;
  facturas: Factura[];
};
type Matricula = {
  id_matricula:    number;
  estado:          string;
  fecha_matricula: string;
  grupo: {
    descripcion: string;
    curso:   { descripcion: string; creditos: number };
    periodo: { descripcion: string };
  };
};

// ─── TODO(human) ──────────────────────────────────────────────────────────────
// Implement calcularResumen to derive account stats from the payments list.
// It should return: { totalPagado: number; cantidadFacturas: number }
//
// Notes:
//  - pago.monto is serialized as a string (Prisma Decimal → JSON)
//  - Only count pagos where estado === "confirmado"
//  - cantidadFacturas is the total count across all pago.facturas arrays
function calcularResumen(pagos: Pago[]): { totalPagado: number; cantidadFacturas: number } {
  return pagos.reduce(
    (resumen, pago) => {
      resumen.cantidadFacturas += pago.facturas.length;
      if (pago.estado === "confirmado") {
        resumen.totalPagado += Number(pago.monto) || 0;
      }
      return resumen;
    },
    { totalPagado: 0, cantidadFacturas: 0 }
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function formatColones(n: number) {
  return `₡${n.toLocaleString("es-CR")}`;
}

function fechaStr(iso: string) {
  return new Date(iso).toLocaleDateString("es-CR", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PagosPage() {
  const [pagos,      setPagos]      = useState<Pago[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [resPagos, resMatriculas] = await Promise.all([
      fetch("/api/pagos").then((r) => r.json()),
      fetch("/api/matricula").then((r) => r.json()),
    ]);
    if (resPagos.ok)      setPagos(resPagos.data);
    if (resMatriculas.ok) setMatriculas(resMatriculas.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pendientes = matriculas.filter((m) => m.estado === "pendiente");
  const resumen    = calcularResumen(pagos);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
          ← Dashboard
        </Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Mis Pagos</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : (
          <>
            {/* ── Tarjetas de resumen ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total pagado</div>
                <div className="text-2xl font-bold text-slate-800">
                  {formatColones(resumen.totalPagado)}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Facturas emitidas</div>
                <div className="text-2xl font-bold text-slate-800">{resumen.cantidadFacturas}</div>
              </div>
              <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="text-xs text-amber-600 uppercase tracking-wider mb-1">Pendientes de pago</div>
                <div className="text-2xl font-bold text-amber-700">{pendientes.length}</div>
              </div>
            </div>

            {/* ── Matrículas pendientes de pago ───────────────────────────── */}
            {pendientes.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                  Pendientes de pago
                </h2>
                <div className="space-y-3">
                  {pendientes.map((m) => (
                    <div
                      key={m.id_matricula}
                      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-medium text-slate-800">{m.grupo.curso.descripcion}</div>
                        <div className="text-sm text-slate-500">
                          {m.grupo.descripcion} · {m.grupo.periodo.descripcion}
                        </div>
                      </div>
                      <Link
                        href={`/matricula/${m.id_matricula}`}
                        className="text-xs text-amber-700 font-medium hover:underline shrink-0"
                      >
                        Ver comprobante →
                      </Link>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Dirígete a Tesorería con tu comprobante para completar el pago.
                </p>
              </section>
            )}

            {/* ── Historial de pagos ──────────────────────────────────────── */}
            <section>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Historial de pagos
              </h2>
              {pagos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                  No tienes pagos registrados.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-slate-500 font-medium">Curso</th>
                        <th className="text-left px-5 py-3 text-slate-500 font-medium">Método</th>
                        <th className="text-right px-5 py-3 text-slate-500 font-medium">Monto</th>
                        <th className="text-left px-5 py-3 text-slate-500 font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagos.map((p) => (
                        <tr key={p.id_pago} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-slate-700">
                            {p.matricula?.grupo.curso.descripcion ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {p.metodo_pago.descripcion}
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-medium text-slate-800">
                            {formatColones(parseFloat(p.monto))}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {fechaStr(p.fecha_pago)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
