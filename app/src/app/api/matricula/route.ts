    import { NextRequest } from "next/server";
    import { db } from "@/lib/db";
    import { ok, created, err, requireRoles, ROLES } from "@/lib/api-helpers";
    import { Prisma } from "@prisma/client";
    import { registrarAuditoria, TIPO_AUDITORIA } from "@/lib/auditoria";

    const MAX_CREDITOS = 18; // límite de créditos por período (RF-12)

    // GET /api/matricula — mis matrículas (estudiante) o todas (admin/tesorería)
    export async function GET(req: NextRequest) {
    const { session, response } = await requireRoles([
        ROLES.ESTUDIANTE, ROLES.ADMIN, ROLES.TESORERIA,
    ]);
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const id_periodo = searchParams.get("periodo");

    // Estudiante solo ve las suyas; admin/tesorería pueden ver todas
    const cedula =
        session!.user.role === ROLES.ESTUDIANTE
        ? session!.user.cedula
        : (searchParams.get("cedula") ?? undefined);

    const matriculas = await db.matricula.findMany({
        where: {
        ...(cedula      && { cedula_persona: cedula }),
        ...(id_periodo  && { id_periodo: Number(id_periodo) }),
        },
        include: {
        grupo: {
            include: {
            curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
            carrera: { select: { id_carrera: true, descripcion: true } },
            periodo: { select: { id_periodo: true, descripcion: true } },
            aula:    { select: { id_aula: true, nombre: true } },
            horarios: true,
            },
        },
        periodo: { select: { id_periodo: true, descripcion: true } },
        },
        orderBy: { fecha_matricula: "desc" },
    });

    return ok(matriculas);
    }

    // POST /api/matricula — inscribir en un grupo (RF-12: todas las validaciones)
    export async function POST(req: NextRequest) {
    const { session, response } = await requireRoles([ROLES.ESTUDIANTE]);
    if (response) return response;

    let body: { id_grupo?: number };
    try { body = await req.json(); } catch { return err("Body JSON inválido"); }

    const { id_grupo } = body;
    if (!id_grupo) return err("El campo 'id_grupo' es requerido");

    const cedula = session!.user.cedula;

    try {
        // ── 0. Cargar persona ────────────────────────────────────────────────────
        const persona = await db.persona.findUnique({ where: { cedula } });
        if (!persona) return err("Persona no encontrada", 404);

        // ── RF-12: Restricciones financieras (moroso / bloqueado) ───────────────
        if (persona.bloqueado) return err("Tu cuenta está bloqueada. Contacta con Registro Académico.");
        if (persona.moroso)    return err("Tienes deudas pendientes. Regulariza tu situación en Tesorería antes de matricularte.");

        // ── Cargar el grupo ──────────────────────────────────────────────────────
        const grupo = await db.grupo.findUnique({
        where: { id_grupo },
        include: {
            curso:    { include: { pre_requisitos: { include: { requisito: true } } } },
            periodo:  true,
            horarios: true,
        },
        });
        if (!grupo)        return err("Grupo no encontrado", 404);
        if (!grupo.activo) return err("Este grupo no está disponible.");

        // ── Ya inscrito en este grupo ────────────────────────────────────────────
        const yaInscrito = await db.matricula.findFirst({
        where: { cedula_persona: cedula, id_grupo, estado: { not: "cancelada" } },
        });
        if (yaInscrito) return err("Ya estás inscrito en este grupo.");

        // ── RF-12: Cupos disponibles ─────────────────────────────────────────────
        const sinCupo = grupo.cupo_actual >= grupo.cupo_maximo;

        // ── Matrículas activas del estudiante en este período ───────────────────
        const matriculasActuales = await db.matricula.findMany({
        where: {
            cedula_persona: cedula,
            id_periodo:     grupo.id_periodo,
            estado:         { not: "cancelada" },
        },
        include: {
            grupo: { include: { curso: true, horarios: true } },
        },
        });

        // ── RF-12: Límite de créditos ────────────────────────────────────────────
        const creditosActuales = matriculasActuales.reduce(
        (sum: number, m: typeof matriculasActuales[number]) => sum + m.grupo.curso.creditos, 0
        );
        if (creditosActuales + grupo.curso.creditos > MAX_CREDITOS) {
        return err(
            `Excede el límite de ${MAX_CREDITOS} créditos por período. ` +
            `Llevas ${creditosActuales} crédito(s) y este curso tiene ${grupo.curso.creditos}.`
        );
        }

        // ── RF-12: Choque de horario ─────────────────────────────────────────────
        for (const mActual of matriculasActuales) {
        for (const hExistente of mActual.grupo.horarios) {
            for (const hNuevo of grupo.horarios) {
            if (hExistente.dia_semana !== hNuevo.dia_semana) continue;
            const existIni = hExistente.hora_inicio.getTime();
            const existFin = hExistente.hora_fin.getTime();
            const nuevoIni = hNuevo.hora_inicio.getTime();
            const nuevoFin = hNuevo.hora_fin.getTime();
            if (nuevoIni < existFin && existIni < nuevoFin) {
                const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
                return err(
                `Choque de horario el ${DIAS[hNuevo.dia_semana]} con el grupo "${mActual.grupo.descripcion}" (${mActual.grupo.curso.descripcion}).`
                );
            }
            }
        }
        }

        // ── RF-12: Prerrequisitos ────────────────────────────────────────────────
        if (grupo.curso.pre_requisitos.length > 0) {
        const aprobados = await db.matricula.findMany({
            where: { cedula_persona: cedula, estado: "confirmada" },
            select: { grupo: { select: { id_curso: true } } },
        });
        const cursosAprobados = new Set(aprobados.map((m: { grupo: { id_curso: number } }) => m.grupo.id_curso));
        for (const prereq of grupo.curso.pre_requisitos) {
            if (!cursosAprobados.has(prereq.id_curso_req)) {
            return err(
                `Prerrequisito pendiente: debes haber aprobado "${prereq.requisito.descripcion}" antes de inscribirte en este curso.`
            );
            }
        }
        }

        // ── Sin cupo → lista de espera ───────────────────────────────────────────
        if (sinCupo) {
        const enEspera = await db.listaEspera.findFirst({ where: { cedula_persona: cedula, id_grupo } });
        if (enEspera) return err("Ya estás en la lista de espera para este grupo.");
        const espera = await db.listaEspera.create({ data: { cedula_persona: cedula, id_grupo } });
        return created({ lista_espera: true, espera });
        }

        // ── Inscripción exitosa ──────────────────────────────────────────────────
        // Usamos transacción interactiva + upsert porque @@unique([cedula_persona, id_grupo])
        // impide crear si ya existe un registro cancelado; en ese caso lo reactivamos.
        const matricula = await db.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.grupo.update({
            where: { id_grupo },
            data:  { cupo_actual: { increment: 1 } },
        });

        return tx.matricula.upsert({
            where: { cedula_persona_id_grupo: { cedula_persona: cedula, id_grupo } },
            create: {
            cedula_persona:  cedula,
            id_grupo,
            id_periodo:      grupo.id_periodo,
            estado:          "pendiente",
            fecha_matricula: new Date(),
            },
            update: {
            estado:             "pendiente",
            fecha_matricula:    new Date(),
            fecha_confirmacion: null,
            },
            include: {
            grupo: {
                include: {
                curso:   { select: { id_curso: true, descripcion: true, creditos: true } },
                carrera: { select: { id_carrera: true, descripcion: true } },
                periodo: { select: { id_periodo: true, descripcion: true } },
                aula:    { select: { id_aula: true, nombre: true } },
                horarios: true,
                },
            },
            },
        });
        });

        // RF-03: Auditoría de matrícula
        await registrarAuditoria({
          id_tipo_auditoria: TIPO_AUDITORIA.MATRICULA,
          cedula_usuario:    cedula,
          tabla_afectada:    "matricula",
          id_registro:       String(matricula.id_matricula),
          accion:            "CREATE",
          descripcion:       `Inscripción en grupo ${id_grupo} — ${matricula.grupo.curso.descripcion}`,
        });

        return created(matricula);

    } catch (e) {
        console.error("[POST /api/matricula]", e);
        return err("Error interno al procesar la matrícula", 500);
    }
    }
