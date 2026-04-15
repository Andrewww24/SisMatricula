"use client";

import { useState } from "react";
import Link from "next/link";

// TODO(human): Implementá esta función de validación del lado del cliente.
// Recibe (password, confirmar) y retorna:
//   - null  → si todo está correcto (puede enviar el formulario)
//   - string → mensaje de error para mostrarle al usuario
//
// Reglas mínimas:
//   1. password.length < 8  → "La contraseña debe tener al menos 8 caracteres"
//   2. password !== confirmar  → "Las contraseñas no coinciden"
// Podés agregar reglas extra (sin espacios, al menos un número, etc.)
function validarPassword(password: string, confirmar: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (password.includes(" ")) {
    return "La contraseña no puede contener espacios";
  }
  if (!/\d/.test(password)) {
    return "La contraseña debe contener al menos un número";
  }
  if (password !== confirmar) {
    return "Las contraseñas no coinciden";
  }
  return null;
  
}

export default function ActivarCuentaPage() {
  const [cedula,    setCedula]    = useState("");
  const [password,  setPassword]  = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [mensaje,   setMensaje]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validarPassword(password, confirmar);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const res  = await fetch("/api/activar-cuenta", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ cedula, password, confirmar_password: confirmar }),
    });
    const json = await res.json();

    setLoading(false);

    if (!json.ok) {
      setError(json.error);
      return;
    }

    setMensaje(json.data.mensaje);
    setSuccess(true);
  }

  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #142E52 50%, #1E4270 100%)" }}
      >
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">¡Cuenta activada!</h1>
            <p className="text-sm text-slate-500 mb-8">{mensaje}</p>
            <Link
              href="/login"
              className="block w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold
                py-3 rounded-xl transition-colors text-center"
            >
              Ir al inicio de sesión →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0B1F3A 0%, #142E52 50%, #1E4270 100%)" }}
    >
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎓</div>
            <div className="text-2xl font-bold text-[#0B1F3A]">
              Uni<span className="text-[#2563EB]">Matrícula</span>
            </div>
          </div>

          <h1 className="text-xl font-semibold text-slate-800 mb-1">Activar cuenta</h1>
          <p className="text-sm text-slate-500 mb-6">
            Ingresá tu cédula y elegí una contraseña para activar tu acceso.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cédula</label>
              <input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="1-0000-0000"
                required
                autoComplete="username"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800
                  placeholder:text-slate-400 focus:outline-none focus:ring-2
                  focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800
                  placeholder:text-slate-400 focus:outline-none focus:ring-2
                  focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repetí la contraseña"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800
                  placeholder:text-slate-400 focus:outline-none focus:ring-2
                  focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold
                py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Activando..." : "Activar cuenta →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-slate-400 hover:text-slate-600">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
