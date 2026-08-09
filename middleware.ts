import { NextResponse, type NextRequest } from "next/server";
import { getAdminBasePath, verifySession, SESSION_COOKIE } from "@/lib/adminAuth";

// Guards the admin panel and its API.
//
// The admin pages physically live at /admin. ADMIN_BASE_PATH lets you serve
// them from a different (hidden) URL: this middleware rewrites that public path
// onto /admin, and 404s the physical /admin so the real path stays hidden.
// It also enforces the session cookie on every admin page and API route.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const basePath = getAdminBasePath();
  const custom = basePath !== "/admin";

  // ── Admin API (fixed at /api/admin regardless of the public base path) ──
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") return NextResponse.next();
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  // ── Map the public page path to the internal /admin tree ──
  let internalPath: string | null = null;
  if (custom) {
    if (pathname === basePath || pathname.startsWith(basePath + "/")) {
      internalPath = "/admin" + pathname.slice(basePath.length);
    } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      // Hide the physical route when a custom path is configured.
      const nf = req.nextUrl.clone();
      nf.pathname = "/_gx_admin_hidden";
      return NextResponse.rewrite(nf);
    }
  } else if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    internalPath = pathname;
  }

  if (!internalPath) return NextResponse.next();

  // ── Auth guard (login page is public) ──
  if (internalPath !== "/admin/login") {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = `${basePath}/login`;
      url.search = "";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (custom) {
    const url = req.nextUrl.clone();
    url.pathname = internalPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on page + API routes, skip Next internals and static files (anything
  // with a file extension). A custom ADMIN_BASE_PATH is unknown at build time,
  // so we can't scope tighter than this.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
