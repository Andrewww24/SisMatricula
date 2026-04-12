    import Link from "next/link";
    import { auth } from "@/lib/auth";
    import { redirect } from "next/navigation";

    export default async function GestionPage() {
    const session = await auth();
    if (!session || session.user.role !== 2) redirect("/dashboard");

    return (
        <main className="min-h-screen bg-slate-50">
        <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-slate-600">|</span>
            <span className="font-semibold">Gestión Académica</span>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-2xl font-bold text-slate-800 mb-8">Gestión Académica</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
                href="/admin/gestion/carreras"
                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#2563EB] hover:shadow-md transition-all group"
            >
                <div className="text-3xl mb-3">🎓</div>
                <div className="font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors">Carreras</div>
                <div className="text-sm text-slate-500 mt-1">Administrar programas académicos</div>
            </Link>
            <Link
                href="/admin/gestion/periodos"
                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#2563EB] hover:shadow-md transition-all group"
            >
                <div className="text-3xl mb-3">📅</div>
                <div className="font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors">Períodos</div>
                <div className="text-sm text-slate-500 mt-1">Gestionar períodos académicos y fechas</div>
            </Link>
            <Link
                href="/admin/gestion/cursos"
                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#2563EB] hover:shadow-md transition-all group"
            >
                <div className="text-3xl mb-3">📚</div>
                <div className="font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors">Cursos</div>
                <div className="text-sm text-slate-500 mt-1">Administrar catálogo de cursos por carrera</div>
            </Link>
            <Link
                href="/admin/gestion/grupos"
                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#2563EB] hover:shadow-md transition-all group"
            >
                <div className="text-3xl mb-3">🗂️</div>
                <div className="font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors">Grupos</div>
                <div className="text-sm text-slate-500 mt-1">Gestionar grupos, aulas y horarios por período</div>
            </Link>
            </div>
        </div>
        </main>
    );
    }
