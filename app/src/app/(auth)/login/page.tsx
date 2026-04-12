    "use client";

    import { useState } from "react";
    import { signIn } from "next-auth/react";
    import { useRouter } from "next/navigation";

    export default function LoginPage() {
        const [cedula, setCedula] = useState("");
        const [password, setPassword] = useState("");
        const [error, setError] = useState("");
        const [loading, setLoading] = useState(false);
        const router = useRouter();

        async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            cedula,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
        setError("Cédula o contraseña incorrecta. Verificá tus datos.");
        } else {
        router.push("/dashboard");
        router.refresh();
        }
    }

    return (
        <main
        className="min-h-screen flex items-center justify-center"
        style={{
            background: "linear-gradient(135deg, #0B1F3A 0%, #142E52 50%, #1E4270 100%)",
        }}
        >
        <div className="w-full max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-2xl p-10">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="text-5xl mb-3">🎓</div>
                <div className="text-2xl font-bold text-[#0B1F3A]">
                Uni<span className="text-[#2563EB]">Matrícula</span>
                </div>
                <div className="mt-2 inline-block bg-slate-100 text-slate-500 text-xs font-medium px-3 py-1 rounded-full">
                🔒 Acceso institucional seguro
                </div>
            </div>

            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                Bienvenido al sistema
            </h1>
            <p className="text-sm text-slate-500 mb-6">
                Iniciá sesión con tus credenciales institucionales
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Cédula o usuario
                </label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Contraseña
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
                {loading ? "Ingresando..." : "Ingresar al sistema →"}
                </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
                ¿Problemas para acceder? Contactá a administración
            </div>
            </div>
        </div>
        </main>
    );
    }
