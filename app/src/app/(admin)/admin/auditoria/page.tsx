import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuditoriaPage() {
  const session = await auth();
  if (!session || session.user.role !== 2) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Auditoría</span>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Bitácora de auditoría</h1>
        <p className="text-slate-500">Este módulo estará disponible próximamente (RF-22).</p>
      </div>
    </main>
  );
}
