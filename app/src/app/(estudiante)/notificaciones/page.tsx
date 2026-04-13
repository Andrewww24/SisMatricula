"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Notificacion = {
  id_notificacion:     number;
  asunto:              string;
  mensaje:             string;
  estado_envio:        string;
  fecha_creacion:      string;
  tipo_notificacion:   { descripcion: string };
};

const TIPO_ICON: Record<string, string> = {
  "Matrícula":   "📋",
  "Cancelación": "❌",
  "Pago":        "💳",
};

function fechaStr(iso: string) {
  return new Date(iso).toLocaleString("es-CR", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

// ─── TODO(human) ──────────────────────────────────────────────────────────────
// Implement marcarTodasLeidas:
// - Call PATCH /api/notificaciones (no body needed)
// - If the response is ok, update local state so all notifications
//   show as read (estado_envio = "leido") without refetching
async function marcarTodasLeidas(
  setNotifs: React.Dispatch<React.SetStateAction<Notificacion[]>>
): Promise<void> {
  const res = await fetch("/api/notificaciones", { method: "PATCH" });
  if (res.ok) {
    setNotifs((prev) => prev.map((n) => ({ ...n, estado_envio: "leido" }))); //se marcan todas las notificaciones como leídas en el estado local
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default function NotificacionesPage() {
  const [notifs,  setNotifs]  = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notificaciones")
      .then((r) => r.json())
      .then((j) => { if (j.ok) setNotifs(j.data); })
      .finally(() => setLoading(false));
  }, []);

  async function marcarUnaLeida(id: number) {
    await fetch(`/api/notificaciones/${id}`, { method: "PATCH" });
    setNotifs((prev) =>
      prev.map((n) => n.id_notificacion === id ? { ...n, estado_envio: "leido" } : n)
    );
  }

  const noLeidas = notifs.filter((n) => n.estado_envio === "pendiente").length;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Notificaciones</span>
        {noLeidas > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {noLeidas} nueva(s)
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {noLeidas > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => marcarTodasLeidas(setNotifs)}
              className="text-sm text-[#2563EB] hover:underline"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : notifs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No tienes notificaciones.
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => (
              <div
                key={n.id_notificacion}
                className={`bg-white rounded-2xl border p-4 transition-colors ${
                  n.estado_envio === "pendiente"
                    ? "border-[#2563EB] shadow-sm"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">
                      {TIPO_ICON[n.tipo_notificacion.descripcion] ?? "🔔"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{n.asunto}</p>
                      <p className="text-slate-500 text-xs mt-1">{n.mensaje}</p>
                      <p className="text-slate-400 text-xs mt-2">{fechaStr(n.fecha_creacion)}</p>
                    </div>
                  </div>
                  {n.estado_envio === "pendiente" && (
                    <button
                      onClick={() => marcarUnaLeida(n.id_notificacion)}
                      className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      ✓ Leída
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
