    "use client";

    import { useState, useEffect, useCallback } from "react";
    import Link from "next/link";

    type Carrera = { id_carrera: number; descripcion: string };
    type Curso = {
    id_curso: number;
    descripcion: string;
    creditos: number;
    activo: boolean;
    carrera: Carrera;
    pre_requisitos: { requisito: { id_curso: number; descripcion: string } }[];
    };

    const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

    export default function CursosPage() {
    const [cursos, setCursos]     = useState<Curso[]>([]);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");

    // Filtros
    const [filtroCarrera, setFiltroCarrera] = useState("");
    const [filtroActivo, setFiltroActivo]   = useState("true");

    // Modal
    const [modalOpen, setModalOpen]   = useState(false);
    const [editCurso, setEditCurso]   = useState<Curso | null>(null);
    const [saving, setSaving]         = useState(false);
    const [formError, setFormError]   = useState("");

    // Form
    const [formDesc, setFormDesc]         = useState("");
    const [formCarrera, setFormCarrera]   = useState("");
    const [formCreditos, setFormCreditos] = useState("0");

    const fetchCursos = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtroCarrera) params.set("carrera", filtroCarrera);
        params.set("activos", filtroActivo);

        const res = await fetch(`/api/cursos?${params}`);
        const json = await res.json();
        if (json.ok) setCursos(json.data);
        else setError(json.error);
        setLoading(false);
    }, [filtroCarrera, filtroActivo]);

    useEffect(() => {
        fetch("/api/carreras")
        .then((r) => r.json())
        .then((j) => j.ok && setCarreras(j.data));
    }, []);

    useEffect(() => { fetchCursos(); }, [fetchCursos]);

    function openCreate() {
        setEditCurso(null);
        setFormDesc("");
        setFormCarrera(carreras[0]?.id_carrera.toString() ?? "");
        setFormCreditos("0");
        setFormError("");
        setModalOpen(true);
    }

    function openEdit(c: Curso) {
        setEditCurso(c);
        setFormDesc(c.descripcion);
        setFormCarrera(c.carrera.id_carrera.toString());
        setFormCreditos(c.creditos.toString());
        setFormError("");
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setFormError("");

        const body = {
        descripcion: formDesc,
        id_carrera: Number(formCarrera),
        creditos: Number(formCreditos),
        };

        const url    = editCurso ? `/api/cursos/${editCurso.id_curso}` : "/api/cursos";
        const method = editCurso ? "PUT" : "POST";

        const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const json = await res.json();

        setSaving(false);
        if (!json.ok) { setFormError(json.error); return; }

        setModalOpen(false);
        fetchCursos();
    }

    async function handleToggle(c: Curso) {
        await fetch(`/api/cursos/${c.id_curso}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !c.activo }),
        });
        fetchCursos();
    }

    void DIAS;

    return (
        <main className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">← Dashboard</Link>
            <span className="text-slate-600">|</span>
            <span className="font-semibold">Gestión de Cursos</span>
            </div>
            <button
            onClick={openCreate}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
            + Nuevo curso
            </button>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6">
            <select
                value={filtroCarrera}
                onChange={(e) => setFiltroCarrera(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
            >
                <option value="">Todas las carreras</option>
                {carreras.map((c) => (
                <option key={c.id_carrera} value={c.id_carrera}>{c.descripcion}</option>
                ))}
            </select>
            <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
            >
                <option value="true">Solo activos</option>
                <option value="false">Todos</option>
            </select>
            </div>

            {/* Tabla */}
            {loading ? (
            <p className="text-slate-500 text-sm">Cargando...</p>
            ) : error ? (
            <p className="text-red-600 text-sm">{error}</p>
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Curso</th>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Carrera</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Créditos</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Estado</th>
                    <th className="px-5 py-3" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {cursos.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">Sin cursos</td></tr>
                    )}
                    {cursos.map((c) => (
                    <tr key={c.id_curso} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{c.descripcion}</td>
                        <td className="px-5 py-3 text-slate-600">{c.carrera.descripcion}</td>
                        <td className="px-5 py-3 text-center">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{c.creditos}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {c.activo ? "Activo" : "Inactivo"}
                        </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(c)} className="text-[#2563EB] hover:underline text-xs">Editar</button>
                            <button onClick={() => handleToggle(c)} className="text-slate-400 hover:text-slate-700 text-xs">
                            {c.activo ? "Desactivar" : "Activar"}
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>

        {/* Modal */}
        {modalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6">
                {editCurso ? "Editar curso" : "Nuevo curso"}
                </h2>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del curso *</label>
                    <input
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="ej. Cálculo Diferencial"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Carrera *</label>
                    <select
                    value={formCarrera}
                    onChange={(e) => setFormCarrera(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                    {carreras.map((c) => (
                        <option key={c.id_carrera} value={c.id_carrera}>{c.descripcion}</option>
                    ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Créditos</label>
                    <input
                    type="number"
                    min={0}
                    max={12}
                    value={formCreditos}
                    onChange={(e) => setFormCreditos(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                </div>
                {formError && (
                    <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
                )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="text-sm text-slate-600 hover:text-slate-900 px-4 py-2">Cancelar</button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-6 py-2 rounded-xl disabled:opacity-60"
                >
                    {saving ? "Guardando..." : "Guardar"}
                </button>
                </div>
            </div>
            </div>
        )}
        </main>
    );
    }
