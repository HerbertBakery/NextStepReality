import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, origin } = new URL(req.url);
  const isProtected =
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/properties") ||
    pathname.startsWith("/import");

  const loggedIn = req.cookies.get("realtor_session")?.value === "ok";

  if (isProtected && !loggedIn) {
    const login = new URL("/login", origin);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/contacts/:path*", "/properties/:path*", "/import/:path*"],
};
