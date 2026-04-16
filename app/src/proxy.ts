import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Permitir la página de login siempre
  if (pathname === "/login") {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Rutas que no requieren autenticación
  const publicPaths = ["/", "/activar-cuenta", "/api/activar-cuenta"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Protege todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - api/auth (rutas de NextAuth)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
