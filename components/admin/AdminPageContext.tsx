"use client";

import { createContext, useContext } from "react";
import type { Lead } from "./types";
import type { StaffMember } from "./types";
import type { Role } from "@/lib/roles";

export interface AdminPageCtxType {
  // Identity
  role: Role;
  username: string;

  // Core data shared by row components
  staff: StaffMember[];
  assignableTechnicians: StaffMember[];
  inspectionStaff: StaffMember[];
  scopedLeads: Lead[];
  counts: Record<string, number>;

  // Row UI state
  onTheWayLoading: string | null;
  openDetails: Record<string, boolean>;
  setOpenDetails: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  unreadReplyCount: number;

  // Lead CRUD
  updateLeadField: (id: string, updates: Partial<Lead>) => Promise<void>;
  handleDeleteLead: (id: string) => Promise<void>;
  setEditingLead: React.Dispatch<React.SetStateAction<Partial<Lead> | null>>;
  setLeadModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setStartJobPrompt: React.Dispatch<React.SetStateAction<{ lead: Lead } | null>>;
  setStartJobDays: React.Dispatch<React.SetStateAction<number>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;

  // Communication
  callCustomer: (l: Lead) => void;
  openMessagesModal: (l: Lead, channel?: "email" | "sms") => Promise<void>;

  // Modal openers
  openGpsModal: (l: Lead) => void;
  openInspectionModal: (l: Lead) => void;
  openPhotosModal: (l: Lead) => Promise<void>;
  openQuoteModal: (l: Lead) => void;
  openWarrantyModal: (l: Lead) => void;
  openInvoiceModal: (l: Lead) => void;

  // On-the-way
  handleOnTheWay: (l: Lead, eventType: "en_route" | "arrived") => Promise<void>;

  // Assignee helpers
  rowAssigneeOptions: (current?: string, status?: string) => string[];
  isTechnicianName: (name?: string) => boolean;

  // Navigation (used by manager dashboard)
  setCurrentView: (view: string) => void;
  openLeadsFiltered: (statuses: string[]) => void;
  openInbox: () => void;
  startNewLead: () => void;
}

const AdminPageContext = createContext<AdminPageCtxType | null>(null);

export const AdminPageProvider = AdminPageContext.Provider;

export function useAdminPageCtx(): AdminPageCtxType {
  const ctx = useContext(AdminPageContext);
  if (!ctx) throw new Error("useAdminPageCtx must be used inside AdminPageProvider");
  return ctx;
}
