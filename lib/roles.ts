// Role model shared across edge middleware, Node route handlers, and client
// components. Keep this file dependency-free (no mongodb, no node:crypto) so it
// is safe to import from the edge runtime (middleware) and the browser.

export type Role = "intake" | "field" | "finance" | "manager";

export const ROLES: Role[] = ["intake", "field", "finance", "manager"];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

/** Human labels for the four roles. */
export const ROLE_LABELS: Record<Role, string> = {
  intake: "Intake / Leads",
  field: "Field / Scheduling",
  finance: "Finance / Completion",
  manager: "Manager",
};

// ── Dashboard views (tabs inside /admin) each role may open ──────────────────
// View ids match the `currentView` union in app/admin/page.tsx.
export const ROLE_VIEWS: Record<Role, string[]> = {
  intake: ["leads", "customers"],
  field: ["jobs", "leads", "customers"],
  finance: ["jobs", "quotes", "customers"],
  manager: [
    "dashboard",
    "analytics",
    "leads",
    "quotes",
    "jobs",
    "customers",
    "team",
  ],
};

/** The tab a role should land on when it opens the dashboard. */
export const ROLE_DEFAULT_VIEW: Record<Role, string> = {
  intake: "leads",
  field: "jobs",
  finance: "jobs",
  manager: "dashboard",
};

export function canView(role: Role, view: string): boolean {
  return ROLE_VIEWS[role]?.includes(view) ?? false;
}

// ── Sub-pages under /admin (separate routes) each role may open ──────────────
export const ROLE_PAGES: Record<Role, string[]> = {
  intake: [],
  field: [],
  finance: [],
  manager: ["content", "users"],
};

export function canOpenPage(role: Role, page: string): boolean {
  return ROLE_PAGES[role]?.includes(page) ?? false;
}

// ── API access control ───────────────────────────────────────────────────────
// Manager-only API surfaces. Everything else under /api/admin (submissions,
// tasks, export) is available to any authenticated role; the pipeline step
// tightens per-field write access later.
const MANAGER_ONLY_API = [
  "/api/admin/users",
  "/api/admin/content",
  "/api/admin/stats",
];

export function canAccessApi(role: Role, pathname: string): boolean {
  if (role === "manager") return true;
  return !MANAGER_ONLY_API.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}
