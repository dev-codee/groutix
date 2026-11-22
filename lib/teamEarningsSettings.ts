import { EarningsError, earningsBody, earningsId, earningsInteger, earningsText, type EarningsMember } from "./teamEarnings";

export interface EarningsEmployeeSetting {
  memberId: string;
  mode: "percent" | "amount";
  rateBps: number;
  fixedAmountCents?: number;
  dailyCapCents: number | null;
}

export interface AutomaticExpenseRule {
  id: string;
  name: string;
  amountCents: number;
  active: boolean;
  activeFrom: string;
}

export interface TeamEarningsSettings {
  basis: "ex_gst" | "inclusive";
  gstRateBps: number;
  employeeSettings: EarningsEmployeeSetting[];
  automaticExpenses: AutomaticExpenseRule[];
  updatedAt?: string;
  updatedBy?: string;
}

export const defaultTeamEarningsSettings: TeamEarningsSettings = {
  basis: "ex_gst",
  gstRateBps: 1000,
  employeeSettings: [],
  automaticExpenses: [],
};

export function validateTeamEarningsSettings(value: unknown, members: EarningsMember[]): TeamEarningsSettings {
  const body = earningsBody(value);
  if (body.basis !== "ex_gst" && body.basis !== "inclusive") throw new EarningsError("Choose a valid invoice basis.");
  const gstRateBps = earningsInteger(body.gstRateBps, "GST rate", 0, 10000);
  if (!Array.isArray(body.employeeSettings) || body.employeeSettings.length > 500) throw new EarningsError("Invalid employee settings.");
  const knownMembers = new Set(members.map(member => member.id));
  const seenMembers = new Set<string>();
  const employeeSettings = body.employeeSettings.map(row => {
    const setting = earningsBody(row);
    const memberId = earningsText(setting.memberId, "Employee", 100, true);
    if (!knownMembers.has(memberId) || seenMembers.has(memberId)) throw new EarningsError("Choose each current CRM team member once.");
    seenMembers.add(memberId);
    if (setting.mode !== "percent" && setting.mode !== "amount") throw new EarningsError("Choose a valid default share type.");
    const dailyCapCents = setting.dailyCapCents === null || setting.dailyCapCents === undefined
      ? null : earningsInteger(setting.dailyCapCents, "daily maximum", 1);
    if (setting.mode === "percent") {
      return { memberId, mode: "percent" as const, rateBps: earningsInteger(setting.rateBps, "default percentage", 0, 10000), dailyCapCents };
    }
    return {
      memberId, mode: "amount" as const, rateBps: 0,
      fixedAmountCents: earningsInteger(setting.fixedAmountCents, "default fixed amount", 0),
      dailyCapCents,
    };
  });
  if (!Array.isArray(body.automaticExpenses) || body.automaticExpenses.length > 50) throw new EarningsError("Use up to 50 automatic expense rules.");
  const seenRules = new Set<string>();
  const automaticExpenses = body.automaticExpenses.map(row => {
    const rule = earningsBody(row);
    const id = earningsId(rule.id);
    if (seenRules.has(id)) throw new EarningsError("Automatic expense rules must have unique IDs.");
    seenRules.add(id);
    const name = earningsText(rule.name, "Expense name", 100, true);
    const amountCents = earningsInteger(rule.amountCents, "expense amount", 1);
    if (typeof rule.active !== "boolean") throw new EarningsError("Choose whether each expense rule is active.");
    const activeFrom = earningsText(rule.activeFrom, "Expense start date", 10, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(activeFrom) || !Number.isFinite(Date.parse(`${activeFrom}T00:00:00Z`))) {
      throw new EarningsError("Enter a valid automatic expense start date.");
    }
    return { id, name, amountCents, active: rule.active, activeFrom };
  });
  return { basis: body.basis, gstRateBps, employeeSettings, automaticExpenses };
}
