import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const isProtected = url.pathname.startsWith("/contacts") || url.pathname.startsWith("/properties") || url.pathname.startsWith("/import");
  const session = req.cookies.get("realtor_session")?.value === "ok";
  if (isProtected && !session) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("next", url.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/contacts/:path*", "/properties/:path*", "/import/:path*"],
};
