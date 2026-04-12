import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function horaStr(date: Date) {
  const h = date.getUTCHours().toString().padStart(2, "0");
  const m = date.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function fechaStr(date: Date) {
  return date.toLocaleString("es-CR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

type Props = { params: Promise<{ id: string }> };

export default async function ComprobantePage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const matricula = await db.matricula.findUnique({
    where: { id_matricula: Number(id) },
    include: {
      persona: { select: { cedula: true, nombre: true, apellidos: true, email: true } },
      grupo: {
        include: {
          curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
          carrera: { select: { descripcion: true } },
          periodo: { select: { descripcion: true, fecha_inicio: true, fecha_fin: true } },
          aula:    { select: { nombre: true, ubicacion: true } },
          horarios: true,
        },
      },
      periodo: { select: { descripcion: true } },
    },
  });

  if (!matricula) notFound();

  // Estudiante solo puede ver las suyas
  if (session.user.role === 1 && matricula.cedula_persona !== session.user.cedula) {
    redirect("/matricula");
  }

  const estadoColor: Record<string, string> = {
    pendiente:  "bg-amber-100 text-amber-700 border-amber-200",
    confirmada: "bg-green-100 text-green-700 border-green-200",
    cancelada:  "bg-red-100  text-red-700   border-red-200",
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0B1F3A] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/matricula" className="text-slate-400 hover:text-white text-sm">← Matrícula</Link>
        <span className="text-slate-600">|</span>
        <span className="font-semibold">Comprobante de Matrícula</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Tarjeta comprobante */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Encabezado */}
          <div className="bg-[#0B1F3A] px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Comprobante de matrícula</div>
                <div className="text-2xl font-bold">#{matricula.id_matricula.toString().padStart(6, "0")}</div>
              </div>
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border capitalize ${estadoColor[matricula.estado] ?? "bg-slate-100 text-slate-600"}`}>
                {matricula.estado}
              </span>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Estudiante */}
            <section>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Estudiante</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500">Nombre</div>
                  <div className="font-medium text-slate-800">{matricula.persona.nombre} {matricula.persona.apellidos}</div>
                </div>
                <div>
                  <div className="text-slate-500">Cédula</div>
                  <div className="font-mono font-medium text-slate-800">{matricula.persona.cedula}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-slate-500">Correo electrónico</div>
                  <div className="font-medium text-slate-800">{matricula.persona.email}</div>
                </div>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Curso y grupo */}
            <section>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Detalle del curso</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2">
                  <div className="text-slate-500">Curso</div>
                  <div className="font-medium text-slate-800">{matricula.grupo.curso.descripcion}</div>
                </div>
                <div>
                  <div className="text-slate-500">Carrera</div>
                  <div className="font-medium text-slate-800">{matricula.grupo.carrera.descripcion}</div>
                </div>
                <div>
                  <div className="text-slate-500">Créditos</div>
                  <div className="font-mono font-medium text-slate-800">{matricula.grupo.curso.creditos}</div>
                </div>
                <div>
                  <div className="text-slate-500">Grupo</div>
                  <div className="font-medium text-slate-800">{matricula.grupo.descripcion}</div>
                </div>
                <div>
                  <div className="text-slate-500">Aula</div>
                  <div className="font-medium text-slate-800">
                    {matricula.grupo.aula.nombre}
                    {matricula.grupo.aula.ubicacion && (
                      <span className="text-slate-400 text-xs ml-1">({matricula.grupo.aula.ubicacion})</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Período</div>
                  <div className="font-medium text-slate-800">{matricula.grupo.periodo.descripcion}</div>
                </div>
              </div>
            </section>

            {/* Horario */}
            {matricula.grupo.horarios.length > 0 && (
              <>
                <hr className="border-slate-100" />
                <section>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Horario</div>
                  <div className="space-y-2">
                    {matricula.grupo.horarios.map((h) => (
                      <div key={h.id_horario} className="flex items-center gap-3 text-sm">
                        <span className="w-24 font-medium text-slate-700">{DIAS[h.dia_semana]}</span>
                        <span className="text-slate-600 font-mono">
                          {horaStr(h.hora_inicio)} – {horaStr(h.hora_fin)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            <hr className="border-slate-100" />

            {/* Fechas */}
            <section>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Registro</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500">Fecha de matrícula</div>
                  <div className="font-medium text-slate-800">{fechaStr(matricula.fecha_matricula)}</div>
                </div>
                {matricula.fecha_confirmacion && (
                  <div>
                    <div className="text-slate-500">Fecha de confirmación</div>
                    <div className="font-medium text-slate-800">{fechaStr(matricula.fecha_confirmacion)}</div>
                  </div>
                )}
                {matricula.observaciones && (
                  <div className="col-span-2">
                    <div className="text-slate-500">Observaciones</div>
                    <div className="text-slate-700">{matricula.observaciones}</div>
                  </div>
                )}
              </div>
            </section>

            {/* Alerta si está pendiente */}
            {matricula.estado === "pendiente" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                ⚠️ Tu matrícula está <strong>pendiente de pago</strong>. Dirígete a Tesorería para completar el proceso.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex justify-between items-center">
            <span className="text-xs text-slate-400">Sistema de Matrícula Universitaria</span>
            <Link href="/matricula" className="text-sm text-[#2563EB] hover:underline">
              ← Volver a Matrícula
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
