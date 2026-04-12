    "use client";

    import { useState, useEffect, useCallback } from "react";
    import Link from "next/link";

    type Carrera = { id_carrera: number; descripcion: string; activo: boolean };

    export default function CarrerasPage() {
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState("");

    const [filtroActivo, setFiltroActivo] = useState("true");

    const [modalOpen, setModalOpen] = useState(false);
    const [editCarrera, setEditCarrera] = useState<Carrera | null>(null);
    const [saving, setSaving]     = useState(false);
    const [formError, setFormError] = useState("");
    const [formDesc, setFormDesc] = useState("");

    const fetchCarreras = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ activos: filtroActivo });
        const res  = await fetch(`/api/carreras?${params}`);
        const json = await res.json();
        if (json.ok) setCarreras(json.data);
        else setError(json.error);
        setLoading(false);
    }, [filtroActivo]);

    useEffect(() => { fetchCarreras(); }, [fetchCarreras]);

    function openCreate() {
        setEditCarrera(null);
        setFormDesc("");
        setFormError("");
        setModalOpen(true);
    }

    function openEdit(c: Carrera) {
        setEditCarrera(c);
        setFormDesc(c.descripcion);
        setFormError("");
        setModalOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setFormError("");

        const url    = editCarrera ? `/api/carreras/${editCarrera.id_carrera}` : "/api/carreras";
        const method = editCarrera ? "PUT" : "POST";

        const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion: formDesc }),
        });
        const json = await res.json();
        setSaving(false);
        if (!json.ok) { setFormError(json.error); return; }
        setModalOpen(false);
        fetchCarreras();
    }

    async function handleToggle(c: Carrera) {
        await fetch(`/api/carreras/${c.id_carrera}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !c.activo }),
        });
        fetchCarreras();
    }

    return (
        <main className="min-h-screen bg-slate-50">
        <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Link href="/admin/gestion" className="text-slate-400 hover:text-white text-sm">← Gestión</Link>
            <span className="text-slate-600">|</span>
            <span className="font-semibold">Gestión de Carreras</span>
            </div>
            <button
            onClick={openCreate}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
            + Nueva carrera
            </button>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex gap-3 mb-6">
            <select
                value={filtroActivo}
                onChange={(e) => setFiltroActivo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white"
            >
                <option value="true">Solo activas</option>
                <option value="false">Todas</option>
            </select>
            </div>

            {loading ? (
            <p className="text-slate-500 text-sm">Cargando...</p>
            ) : error ? (
            <p className="text-red-600 text-sm">{error}</p>
            ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Carrera</th>
                    <th className="text-center px-5 py-3 text-slate-500 font-medium">Estado</th>
                    <th className="px-5 py-3" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {carreras.length === 0 && (
                    <tr><td colSpan={3} className="text-center py-10 text-slate-400">Sin carreras</td></tr>
                    )}
                    {carreras.map((c) => (
                    <tr key={c.id_carrera} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-800">{c.descripcion}</td>
                        <td className="px-5 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${c.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                            {c.activo ? "Activa" : "Inactiva"}
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

        {modalOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6">
                {editCarrera ? "Editar carrera" : "Nueva carrera"}
                </h2>
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                    <input
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="ej. Ingeniería en Sistemas"
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
