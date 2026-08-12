import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_COOKIE_NAME, isValidSessionCookie } from "./lib/adminAuth";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin lives outside the [locale] segment entirely — it's an internal
  // tool, not a localized storefront route — so it bypasses next-intl and
  // gets its own password-session guard instead.
  if (pathname.startsWith("/admin")) {
    const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));
    const authed = await isValidSessionCookie(request.cookies.get(ADMIN_COOKIE_NAME)?.value);

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
  // `models/*` holds the face-api.js weight shards, which are extensionless
  // binary files — the `.*\..*` exclusion below only catches paths with a
  // dot (e.g. the `.json` manifests), so shard files were still being
  // routed through the intl middleware and 404ing on the locale-prefixed
  // redirect. Excluded here explicitly.
  matcher: ["/((?!api|_next|_vercel|models|.*\\..*).*)"],
};
