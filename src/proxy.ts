import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE_NAME, isValidSessionToken } from "./lib/adminAuth";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin lives outside the [locale] segment entirely — it's an internal
  // tool, not a localized storefront route — so it bypasses next-intl and
  // gets its own password-session guard instead.
  if (pathname.startsWith("/admin")) {
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));
    const authed = await isValidSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

    if (!authed && !isPublicAdminPath) {
      const redirectUrl = new URL("/admin/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (authed && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  // `models/*` holds the face-scan model weights. The current `.bin` files
  // would already match the `.*\..*` exclusion, but the older face-api.js
  // shards were extensionless and got routed through the intl middleware
  // (404ing on the locale-prefixed redirect) — so the folder stays
  // excluded explicitly, whatever the weights are named.
  matcher: ["/((?!api|_next|_vercel|models|.*\\..*).*)"],
};
