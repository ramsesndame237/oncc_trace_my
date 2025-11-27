export { default } from "next-auth/middleware";

export const config = {
  // Protéger les routes principales mais exclure les routes d'auth et de PIN
  matcher: [
    "/(main)/dashboard/:path*",
    // Exclure explicitement les routes d'auth pour éviter les conflits
    "/((?!auth|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*):",
  ],
};
