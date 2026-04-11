import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";

    // Etiquetas de roles
    const ROLES: Record<number, { label: string; color: string }> = {
    1: { label: "Estudiante", color: "bg-blue-100 text-blue-700" },
    2: { label: "Administrador", color: "bg-purple-100 text-purple-700" },
    3: { label: "Tesorería", color: "bg-amber-100 text-amber-700" },
    4: { label: "Docente", color: "bg-teal-100 text-teal-700" },
    };

    export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const { name, cedula, role } = session.user;
    const rolInfo = ROLES[role] ?? { label: "Desconocido", color: "bg-gray-100 text-gray-700" };

    return (
        <main className="min-h-screen bg-slate-50">
        {/* Navbar */}
        <nav className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center justify-between shadow-lg">
            <div className="text-lg font-bold">
            🎓 Uni<span className="text-[#2563EB]">Matrícula</span>
            </div>
            <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">{name}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${rolInfo.color}`}>
                {rolInfo.label}
            </span>
            <form
                action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
                }}
            >
                <button
                type="submit"
                className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                Cerrar sesión
                </button>
            </form>
            </div>
        </nav>

        {/* Contenido */}
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Bienvenido, {name?.split(" ")[0]} 👋
            </h1>
            <p className="text-slate-500 mb-8">
            Cédula: <span className="font-mono font-medium text-slate-700">{cedula}</span>
            </p>

            {/* Tarjetas por rol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {role === 1 && (
                <>
                <DashCard title="Mi matrícula" desc="Ver y gestionar tu matrícula del período actual" href="/matricula" icon="📋" />
                <DashCard title="Mis cursos" desc="Ver horarios y grupos matriculados" href="/horario" icon="📅" />
                <DashCard title="Pagos" desc="Estado de pagos y facturas" href="/pagos" icon="💳" />
                </>
            )}
            {role === 2 && (
                <>
                <DashCard title="Gestión académica" desc="Administrar cursos, grupos y períodos" href="/admin/gestion" icon="⚙️" />
                <DashCard title="Reportes" desc="Ver reportes del sistema" href="/admin/reportes" icon="📊" />
                <DashCard title="Auditoría" desc="Bitácora de actividades" href="/admin/auditoria" icon="🔍" />
                </>
            )}
            {role === 3 && (
                <>
                <DashCard title="Pagos pendientes" desc="Gestionar cobros y confirmaciones" href="/tesoreria/pagos" icon="💰" />
                <DashCard title="Facturas" desc="Emitir y consultar facturas" href="/tesoreria/facturas" icon="🧾" />
                </>
            )}
            {role === 4 && (
                <>
                <DashCard title="Mis grupos" desc="Ver grupos asignados y estudiantes" href="/docente/grupos" icon="👨‍🏫" />
                </>
            )}
            </div>

            <p className="mt-10 text-xs text-slate-400 text-center">
            Módulos en desarrollo — próximamente disponibles
            </p>
        </div>
        </main>
    );
    }

    function DashCard({
    title,
    desc,
    href,
    icon,
    }: {
    title: string;
    desc: string;
    href: string;
    icon: string;
    }) {
    return (
        <a
        href={href}
        className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#2563EB]
            hover:shadow-md transition-all group"
        >
        <div className="text-3xl mb-3">{icon}</div>
        <div className="font-semibold text-slate-800 group-hover:text-[#2563EB] transition-colors">
            {title}
        </div>
        <div className="text-sm text-slate-500 mt-1">{desc}</div>
        </a>
    );
    }
