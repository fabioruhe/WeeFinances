import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/goals",
  "/debts",
  "/cards",
  "/investments",
  "/reports",
  "/settings",
  "/onboarding",
];

const PUBLIC_PREFIXES = ["/auth", "/join", "/register", "/api"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas: deixa passar
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.id) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const onboardingCompleto = token.onboardingCompleto === true;

  if (!onboardingCompleto && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding/perfil", request.url));
  }

  if (onboardingCompleto && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)",
  ],
};
