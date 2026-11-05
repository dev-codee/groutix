export const CAREER_ROLES = { inspector: "Inspector / Estimator", technician: "Repair Technician" } as const;
export const APPLICATION_STATUSES = ["new", "reviewing", "shortlisted", "interview", "hired", "not proceeding", "withdrawn"] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export const ROLE_SKILLS = {
  inspector: ["Leak and moisture assessment", "Shower and balcony inspections", "Measuring and preparing quotes", "Photo reports and scope of works", "Customer advice and communication"],
  technician: ["Tile regrouting", "Epoxy grout", "Silicone removal and recaulking", "Shower leak repairs", "Balcony repairs", "Tile replacement", "Waterproofing", "Shower screen installation"],
} as const;
export const CAREER_OPTIONS = {
  experience: ["New to the industry", "Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years"],
  workRights: ["Unrestricted Australian work rights", "Work rights with conditions", "Would need sponsorship"],
  engagement: ["Employee", "Subcontractor", "Open to either"],
  startAvailability: ["Immediately", "Within 2 weeks", "Within 4 weeks", "More than 4 weeks"],
  licence: ["Yes", "No"],
  vehicle: ["Own reliable vehicle", "Own work van / ute", "Would need a company vehicle"],
  whiteCard: ["Current White Card", "Willing to obtain", "Not held"],
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
} as const;
export type CareerInput = {
  role: keyof typeof CAREER_ROLES; fullName: string; email: string; phone: string;
  suburb: string; postcode: string; experience: string; workRights: string; engagement: string;
  startAvailability: string; licence: string; vehicle: string; whiteCard: string;
  coverage: string; skills: string[]; days: string[]; summary: string; qualifications: string;
  tools: string; workRightsDetails: string; portfolio: string; expectations: string; adjustments: string;
  consent: boolean;
};
export type CareerApplication = CareerInput & {
  id: string; createdAt: string; status: ApplicationStatus; notes: string;
  updatedAt?: string; updatedBy?: string; resumeName?: string;
};

export function validateCareerInput(value: unknown): CareerInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid application.");
  const v = value as Record<string, unknown>;
  const string = (key: string, max: number, required = true) => {
    const text = typeof v[key] === "string" ? v[key].trim() : "";
    if ((required && !text) || text.length > max) throw new Error(`Please check ${key.replace(/([A-Z])/g, " $1").toLowerCase()}.`);
    return text;
  };
  const role = string("role", 20);
  if (role !== "inspector" && role !== "technician") throw new Error("Please select a role.");
  const choice = (key: keyof typeof CAREER_OPTIONS) => {
    const text = string(key, 100);
    if (!(CAREER_OPTIONS[key] as readonly string[]).includes(text)) throw new Error(`Please check ${key}.`);
    return text;
  };
  const list = (key: string, options: readonly string[], required: boolean) => {
    const items = v[key];
    if (!Array.isArray(items) || items.length > options.length || (required && !items.length) || items.some(item => typeof item !== "string" || !options.includes(item))) throw new Error(`Please check ${key}.`);
    return [...new Set(items)] as string[];
  };
  const email = string("email", 254).toLowerCase();
  const phone = string("phone", 30);
  const postcode = string("postcode", 4);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email.");
  if (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 8) throw new Error("Please enter a valid phone number.");
  if (!/^\d{4}$/.test(postcode)) throw new Error("Please enter a four-digit Australian postcode.");
  if (v.consent !== true) throw new Error("Please consent to the use of your application for recruitment.");
  const summary = string("summary", 4000);
  if (summary.length < 30) throw new Error("Please tell us a little more about your relevant experience (at least 30 characters).");
  const portfolio = string("portfolio", 500, false);
  if (portfolio) { try { if (new URL(portfolio).protocol !== "https:") throw new Error(); } catch { throw new Error("Portfolio link must start with https://."); } }
  return {
    role, fullName: string("fullName", 120), email, phone, suburb: string("suburb", 120), postcode,
    experience: choice("experience"), workRights: choice("workRights"), engagement: choice("engagement"),
    startAvailability: choice("startAvailability"), licence: choice("licence"), vehicle: choice("vehicle"), whiteCard: choice("whiteCard"),
    coverage: string("coverage", 500), skills: list("skills", ROLE_SKILLS[role], false), days: list("days", CAREER_OPTIONS.days, true), summary,
    qualifications: string("qualifications", 2000, false), tools: string("tools", 1000, false), workRightsDetails: string("workRightsDetails", 500, false),
    portfolio, expectations: string("expectations", 500, false), adjustments: string("adjustments", 1000, false), consent: true,
  };
}
