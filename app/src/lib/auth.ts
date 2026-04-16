import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registrarAuditoria, TIPO_AUDITORIA } from "@/lib/auditoria";

    // ─── Extensión de tipos NextAuth ──────────────────────────────────────────────
    declare module "next-auth" {
    interface Session {
        user: {
        cedula: string;
        role: number;
        } & DefaultSession["user"];
    }
    interface User {
        cedula: string;
        role: number;
    }
    interface JWT {
        cedula: string;
        role: number;
    }
    }

    // ─── Config NextAuth ──────────────────────────────────────────────────────────
    export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
        credentials: {
            cedula: { label: "Cédula", type: "text" },
            password: { label: "Contraseña", type: "password" },
        },
        async authorize(credentials) {
            if (!credentials?.cedula || !credentials?.password) return null;

            // Aceptar correo institucional: cedula@cuc.cr → extraer cédula
            const input = credentials.cedula as string;
            let cedula = input;
            if (input.includes("@")) {
              const [local, domain] = input.split("@");
              if (domain !== "cuc.cr") return null;
              cedula = local;
            }

            const persona = await db.persona.findUnique({
            where: { cedula },
            select: {
                cedula: true,
                nombre: true,
                apellidos: true,
                email: true,
                id_rol: true,
                password_hash: true,
                activo: true,
                bloqueado: true,
            },
            });

            if (!persona || !persona.password_hash) return null;
            if (!persona.activo || persona.bloqueado) return null;

            const valid = await bcrypt.compare(
            credentials.password as string,
            persona.password_hash
            );
            if (!valid) return null;

            // RF-03: Auditoría de login exitoso
            await registrarAuditoria({
              id_tipo_auditoria: TIPO_AUDITORIA.LOGIN,
              cedula_usuario:    persona.cedula,
              tabla_afectada:    "persona",
              id_registro:       persona.cedula,
              accion:            "LOGIN",
              descripcion:       `Inicio de sesión exitoso`,
            });

            return {
            id: persona.cedula,
            cedula: persona.cedula,
            name: `${persona.nombre} ${persona.apellidos}`,
            email: persona.email,
            role: persona.id_rol,
            };
        },
        }),
    ],

    callbacks: {
        jwt({ token, user }) {
        if (user) {
            token.cedula = user.cedula;
            token.role = user.role;
        }
        return token;
        },
        session({ session, token }) {
        session.user.cedula = token.cedula as string;
        session.user.role = token.role as number;
        return session;
        },
    },

    pages: {
        signIn: "/login",
    },

    session: {
        strategy: "jwt",
    },

    trustHost: true,
    });
