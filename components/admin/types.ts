// Shared types for the admin CRM — imported by page.tsx and all sub-components.

export interface QuoteItem {
  templateNo?: string | number;
  code?: string;
  service?: string;
  scope?: string;
  description?: string;
  price?: number;
  qty?: number;
}

export interface CustomerMessage {
  id: string;
  from: "customer" | "groutix";
  channel?: "email" | "sms" | "lead" | "internal";
  subject?: string;
  text: string;
  time: string;
  initial?: boolean;
  read?: boolean;
  attachments?: {
    name: string;
    contentType?: string;
    size?: number;
    url?: string;
    secureUrl?: string;
    publicId?: string;
  }[];
}

export interface GpsCheckin {
  lat: number;
  lng: number;
  accuracy?: number;
  time: string;
}

export interface WarrantyDoc {
  jobNo?: string;
  warrantyNo?: string;
  completionDate?: string;
  expiryDate?: string;
  customerName?: string;
  address?: string;
  authorisedBy?: string;
  dateIssued?: string;
  sentAt?: string;
  provided?: boolean;
}

export interface ActivityEntry {
  time: string;
  actor: string;
  action: string;
  detail?: string;
}

export interface Lead {
  id: string;
  type?: "quote" | "support_ticket" | "lead";
  status: string;
  createdAt: string;
  jobNo?: string;
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  enquiry?: string;
  message?: string;
  address?: string;
  city?: string;
  state?: string;
  assigned?: string;
  inspectorId?: string;
  technician?: string;
  technicianId?: string;
  priority?: string;
  received?: string;
  contacted?: string;
  follow?: string;
  source?: string;
  notes?: string;
  customerType?: string;
  areas?: string;
  leaking?: string;
  damagedTiles?: string;
  quoteItems?: QuoteItem[];
  quoteItemCode?: string;
  quoteScope?: string;
  quoteTaxMode?: "inclusive" | "exclusive" | "none";
  quoteTaxRate?: number;
  quoteTerms?: string;
  quoteUpdated?: string;
  quoteAmount?: number;
  photosCount?: number;
  photos?: {
    name: string;
    contentType?: string;
    url?: string;
    secureUrl?: string;
    publicId?: string;
    dataUrl?: string;
    width?: number;
    height?: number;
    size?: number;
    added?: string;
    uploadedBy?: string;
  }[];
  messages?: CustomerMessage[];
  gps?: GpsCheckin | null;
  warranty?: WarrantyDoc;
  warrantyProvided?: boolean;
  activity?: ActivityEntry[];
  quoteNumber?: string;
  quoteAcceptedAt?: string;
  quoteDeclinedAt?: string;
  quoteSignature?: string;
  quoteSignedName?: string;
  quoteSignedAt?: string;
  followUpStage?: number;
  followUpNext?: string;
  invoiceNumber?: string;
  invoiceSentAt?: string;
  invoiceStatus?: string;
  invoiceOpenedAt?: string;
  inspectionAt?: string;
  jobAt?: string;
  inspectionReminderSent?: boolean;
  inspectionRescheduled?: boolean;
  jobReminderSent?: boolean;
  inspectionReport?: import("@/lib/inspection").InspectionReportDoc;
  jobTotalDays?: number;
  jobDaysDone?: number;
  paymentType?: "full" | "half" | "partial"; // full or partial payment received
  amountPaid?: number;                        // actual amount received (for partial)
}

export interface CrmTask {
  id: string;
  text: string;
  done: boolean;
}

export type StaffMember = {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
};
