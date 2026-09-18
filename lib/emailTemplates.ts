import { formatAppt } from "./scheduling";

export interface EmailTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  subject: string;
  body: string;
}

export interface TemplateContext {
  id?: string;
  jobNo?: string;
  name?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  service?: string;
  address?: string;
  city?: string;
  suburb?: string;
  state?: string;
  assigned?: string;
  technician?: string;
  technicianName?: string;
  quoteNumber?: string;
  quoteAmount?: number;
  depositAmount?: number;
  invoiceNumber?: string;
  inspectionAt?: string;
  jobAt?: string;
  amountPaid?: number;
  companyName?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  [key: string]: any;
}

export interface DynamicTagInfo {
  tag: string;
  label: string;
  category: "Customer" | "Job & Location" | "Schedule" | "Billing" | "Company";
  description: string;
  example: string;
}

export const DYNAMIC_EMAIL_TAGS: DynamicTagInfo[] = [
  // Customer
  { tag: "{first_name}", label: "First Name", category: "Customer", description: "Customer's first name", example: "Sarah" },
  { tag: "{customer_name}", label: "Full Name", category: "Customer", description: "Customer's full name", example: "Sarah Jenkins" },
  { tag: "{phone}", label: "Phone", category: "Customer", description: "Customer's contact phone number", example: "0412 345 678" },
  { tag: "{email}", label: "Email", category: "Customer", description: "Customer's email address", example: "sarah@example.com" },

  // Job & Location
  { tag: "{job_no}", label: "Job #", category: "Job & Location", description: "Job / lead tracking number", example: "Job No-1248" },
  { tag: "{service}", label: "Service", category: "Job & Location", description: "Primary service required or quoted", example: "Shower Regrouting & Sealing" },
  { tag: "{address}", label: "Full Address", category: "Job & Location", description: "Service property address", example: "14 Elm St, Hawthorn VIC 3122" },
  { tag: "{suburb}", label: "Suburb / City", category: "Job & Location", description: "Customer's suburb or locality", example: "Hawthorn" },

  // Schedule
  { tag: "{technician_name}", label: "Specialist / Tech", category: "Schedule", description: "Assigned technician or inspector name", example: "Marco Rossi" },
  { tag: "{inspection_date}", label: "Inspection Date/Time", category: "Schedule", description: "Formatted on-site inspection appointment", example: "Wed, 23 Sep, 10:00 AM" },
  { tag: "{booking_date}", label: "Booking Date/Time", category: "Schedule", description: "Formatted job execution date & time", example: "Fri, 25 Sep, 8:30 AM" },

  // Billing
  { tag: "{quote_number}", label: "Quote #", category: "Billing", description: "Official quotation reference", example: "GX-9402" },
  { tag: "{quote_amount}", label: "Quote Amount", category: "Billing", description: "Total quotation amount", example: "AUD $580.00" },
  { tag: "{deposit_amount}", label: "Deposit Amount", category: "Billing", description: "Deposit required or paid", example: "AUD $58.00" },
  { tag: "{invoice_number}", label: "Invoice #", category: "Billing", description: "Tax invoice reference number", example: "INV-9402" },
  { tag: "{invoice_total}", label: "Total Due", category: "Billing", description: "Total invoice balance due", example: "AUD $580.00" },

  // Company Contact & Branding
  { tag: "{company_name}", label: "Company Name", category: "Company", description: "Business name", example: "Groutix" },
  { tag: "{company_phone}", label: "Company Phone", category: "Company", description: "Main office / dispatch phone number", example: "7023 8094" },
  { tag: "{company_email}", label: "Company Email", category: "Company", description: "General enquiries & support email", example: "info@groutix.com" },
  { tag: "{company_website}", label: "Website", category: "Company", description: "Company website domain", example: "groutix.com" },
];

export const SAMPLE_TEMPLATE_CONTEXT: TemplateContext = {
  id: "lead_demo_9402",
  jobNo: "Job No-1248",
  customerName: "Sarah Jenkins",
  name: "Sarah Jenkins",
  phone: "0412 345 678",
  email: "sarah.jenkins@example.com",
  service: "Shower Regrouting & Silicone Sealing",
  address: "14 Elm St, Hawthorn VIC 3122",
  city: "Hawthorn",
  suburb: "Hawthorn",
  state: "VIC",
  assigned: "Marco Rossi",
  technician: "Marco Rossi",
  technicianName: "Marco Rossi",
  quoteNumber: "GX-9402",
  quoteAmount: 580,
  depositAmount: 58,
  invoiceNumber: "INV-9402",
  inspectionAt: new Date(Date.now() + 86400000 * 2).toISOString(),
  jobAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  companyName: "Groutix",
  companyPhone: "7023 8094",
  companyEmail: "info@groutix.com",
  companyWebsite: "groutix.com",
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "initial_enquiry",
    category: "Enquiries & Leads",
    name: "📋 Initial Enquiry - Requirements & Photos",
    description: "Acknowledge enquiry, ask key diagnostic questions or request photos",
    subject: "Groutix Enquiry: {service} for {customer_name}",
    body: `Hi {first_name},

Thank you for contacting Groutix regarding your {service}!

To help us recommend the best solution and prepare an accurate estimate, could you please let us know:
1. Which specific areas require work (e.g. shower recess, bathroom floor, kitchen, balcony)?
2. Are there any loose or cracked tiles, or missing grout lines?
3. Could you reply with 2-3 clear photos showing the current condition of the tiles and joints?

Alternatively, we can arrange a complimentary on-site inspection at {address} to evaluate the area in person.

Looking forward to hearing from you.

Warm regards,
Groutix Customer Care
📞 7023 8094
✉️ info@groutix.com
🌐 groutix.com`,
  },
  {
    id: "request_photos",
    category: "Enquiries & Leads",
    name: "📸 Request Photos for Fast Virtual Quote",
    description: "Request clear photos of tiles, mold, or damaged silicone for rapid pricing",
    subject: "Photo Request: Quick Quote for your {service} - Groutix",
    body: `Hi {first_name},

Thank you for your enquiry with Groutix.

To provide you with a fixed, transparent quotation as quickly as possible without waiting for an on-site visit, could you please reply to this email with a few clear photos?

Helpful angles:
• A wide shot showing the entire shower or tiled area
• Close-ups of any problem spots (cracked grout, black mold, or failing silicone)
• The floor-to-wall junction / perimeter joints

Once received, our technical team will review the photos and send through your tailored quotation right away.

Thank you,
Groutix Estimations Team
📞 7023 8094
✉️ info@groutix.com
🌐 www.groutix.com`,
  },
  {
    id: "inspection_confirmed",
    category: "Inspections",
    name: "📅 On-Site Inspection Confirmation",
    description: "Confirm scheduled inspection date, time, address, and specialist visit details",
    subject: "Confirmed: Groutix On-Site Inspection at {address}",
    body: `Hi {first_name},

This email confirms your upcoming on-site inspection with Groutix:

📍 Service Address: {address}
📅 Scheduled Time: {inspection_date}
👨‍🔧 Specialist: {technician_name}

During the inspection, our specialist will:
• Thoroughly assess tile condition, grout deterioration, and perimeter seals
• Check for moisture ingress or underlying dampness
• Provide a clear explanation of options and a transparent quotation on the spot

If you need to reschedule or have any questions beforehand, please reply to this email or call us on 7023 8094.

Kind regards,
Groutix Team
📞 7023 8094
✉️ info@groutix.com
🌐 www.groutix.com`,
  },
  {
    id: "quote_followup",
    category: "Quotations",
    name: "💬 Quote Follow-Up & Availability",
    description: "Follow up on a sent quotation, highlight 10-year warranty, and offer booking dates",
    subject: "Checking in on your Groutix Quote {quote_number}",
    body: `Hi {first_name},

I hope you're having a great week!

I wanted to check in to see if you had any questions regarding the quotation we sent for your {service}{quote_amount_clause}.

A quick reminder of the Groutix difference:
✓ 10-Year Warranty on our premium epoxy and hybrid regrouting systems
✓ Stain-resistant, mold-resistant, and 100% waterproof protection
✓ Friendly, insured, certified specialists who treat your home with care

We currently have availability for next week. Would you like us to tentatively reserve a day for you?

Looking forward to assisting you!

Warm regards,
Groutix Estimations Team
📞 7023 8094
✉️ info@groutix.com
🌐 www.groutix.com`,
  },
  {
    id: "booking_confirmed",
    category: "Bookings",
    name: "🛠️ Booking Confirmed & Work Preparation",
    description: "Confirm booking date and share arrival checklist and curing instructions",
    subject: "Booking Confirmed: Groutix Service on {booking_date}",
    body: `Hi {first_name},

Great news! Your booking for {service} is confirmed.

📅 Service Date: {booking_date}
📍 Address: {address}
👨‍🔧 Assigned Specialist: {technician_name}

Preparation checklist for our visit:
1. Please ensure the work area is clear of personal items, bath products, and rugs.
2. Please leave the shower dry on the morning of service.
3. Ensure pets are secure and technicians have access to power and water.
4. Curing Time: Please note that new grout and silicone require 24 to 48 hours to fully cure before water can be used.

If you have any questions before our arrival, please don't hesitate to reach out.

Kind regards,
Groutix Operations
📞 7023 8094
✉️ info@groutix.com
🌐 www.groutix.com`,
  },
  {
    id: "job_complete_care",
    category: "Job Completion & Care",
    name: "🛡️ Job Complete - Aftercare & Maintenance",
    description: "Post-service care guide, 24-48h curing notice, and pH-neutral cleaner tips",
    subject: "Work Completed: Aftercare Guidelines - Groutix",
    body: `Hi {first_name},

Thank you for choosing Groutix! Our specialist has completed your {service} at {address}.

Important Curing & Aftercare Instructions:
• Curing Period: Please allow 24 to 48 hours for the new grout and commercial-grade silicone to cure completely before exposing the area to water or steam.
• Cleaning: Use only mild, pH-neutral cleaners and soft microfiber cloths. Avoid harsh acids, bleach, or abrasive scrubbing pads, as they can break down protective sealant barriers.
• Ventilation: Keep the area well-ventilated or squeegee tiles after use to maintain a fresh, mold-free finish for years to come.

Your work is protected under our comprehensive Groutix Warranty. Your warranty certificate and final paperwork are attached/filed under your account.

Thank you again for your business!

Best regards,
Groutix Team
📞 7023 8094
✉️ info@groutix.com
🌐 www.groutix.com`,
  },
  {
    id: "review_request",
    category: "Job Completion & Care",
    name: "⭐ Customer Review & Feedback Request",
    description: "Polite Google review request with direct link for satisfied customers",
    subject: "How did we do? Groutix Service Feedback",
    body: `Hi {first_name},

We hope you're delighted with your newly restored tiles and sparkling clean grout lines!

As a proud local business, reviews and word-of-mouth recommendations mean the world to our team. If you were happy with our work and service, could you please take 30 seconds to share your experience on Google?

👉 Leave a review here: https://g.page/r/groutix/review

Your feedback makes a huge difference and helps other homeowners find reliable grout specialists.

If there was anything at all that didn't meet your 5-star expectations, please reply directly to this email so our management can take care of it immediately.

Thank you again for trusting Groutix!

Warm regards,
The Groutix Team
📞 7023 8094
✉️ info@groutix.com
🌐 groutix.com`,
  },
  {
    id: "invoice_reminder",
    category: "Billing",
    name: "🧾 Invoice & Payment Reminder",
    description: "Friendly payment reminder with invoice number, amount, and EFT bank details",
    subject: "Payment Reminder: Groutix Tax Invoice {invoice_number}",
    body: `Hi {first_name},

We hope you are having a wonderful week.

This is a friendly reminder regarding Tax Invoice {invoice_number} for the {service} carried out at {address}.

Total Due: {invoice_total}

Payment Options:
• Direct Bank Transfer (EFT):
  Bank: Commonwealth Bank
  Account Name: Groutix Pty Ltd
  BSB: 063-000 | Account: 1234 5678
  Reference: {invoice_number} or {customer_name}

• Credit Card: Please call us on 7023 8094 to pay securely over the phone.

If you have already processed this payment, please disregard this reminder with our sincere thanks.

Kind regards,
Groutix Accounts
📞 7023 8094
✉️ info@groutix.com
🌐 groutix.com`,
  },
  {
    id: "blank_custom",
    category: "General",
    name: "✏️ Custom Message (Blank with Greeting)",
    description: "Clean greeting and professional sign-off for bespoke messages",
    subject: "Re: Groutix Enquiry - {customer_name}",
    body: `Hi {first_name},



Kind regards,
Groutix Team
📞 7023 8094
✉️ info@groutix.com
🌐 groutix.com`,
  },
];

function formatDateTime(isoOrStr?: string, fallback = "Scheduled Date & Time"): string {
  if (!isoOrStr) return fallback;
  try {
    return (
      formatAppt(isoOrStr, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) || isoOrStr
    );
  } catch {
    return isoOrStr;
  }
}

/**
 * Extract all dynamic tags detected in a template string
 */
export function extractTemplateTags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/\{\{?\s*([a-zA-Z0-9_-]+)\s*\}?\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.toLowerCase().replace(/[\s{}]/g, ""))));
}

/**
 * Interpolate email template text with lead data.
 * Supports:
 * - Single braces: {tag}
 * - Double braces: {{tag}}
 * - Spaces: { tag }, {{ tag }}
 * - Case-insensitive: {FIRST_NAME}, {first_name}, {First_Name}
 * - All tag synonyms: {job_no}, {job_number}, {suburb}, {quote_amount}, {deposit_amount}, {company_phone}
 */
export function renderEmailTemplate(
  template: { subject?: string; body?: string;[key: string]: any },
  lead?: TemplateContext | null
): { subject: string; body: string } {
  const ctx = lead || {};
  const fullName = (ctx.name || ctx.customerName || "").trim() || "Valued Customer";
  const firstName = fullName.split(/\s+/)[0] || "there";
  const service = ctx.service?.trim() || "tiling & grouting service";
  const jobNo = ctx.jobNo?.trim() || (ctx.id ? `Job-${ctx.id.slice(-5).toUpperCase()}` : "Job No-1201");
  const address =
    ctx.address?.trim() ||
    [ctx.city, ctx.state].filter(Boolean).join(", ") ||
    "your property";
  const suburb = ctx.suburb?.trim() || ctx.city?.trim() || ctx.state?.trim() || "your area";
  const phone = ctx.phone?.trim() || "";
  const email = ctx.email?.trim() || "";
  const tech = ctx.technician?.trim() || ctx.technicianName?.trim() || ctx.assigned?.trim() || "our specialist";
  const inspectionDate = formatDateTime(ctx.inspectionAt, "Upcoming Inspection (Date TBC)");
  const bookingDate = formatDateTime(ctx.jobAt, "Scheduled Booking (Date TBC)");
  const quoteNum = ctx.quoteNumber?.trim() || "Quote";
  const quoteAmountStr =
    ctx.quoteAmount && ctx.quoteAmount > 0
      ? `AUD $${Number(ctx.quoteAmount).toFixed(2)}`
      : "quoted amount";
  const quoteClause =
    ctx.quoteAmount && ctx.quoteAmount > 0
      ? ` (AUD $${Number(ctx.quoteAmount).toFixed(2)})`
      : "";
  const depositAmountStr =
    ctx.depositAmount && ctx.depositAmount > 0
      ? `AUD $${Number(ctx.depositAmount).toFixed(2)}`
      : ctx.quoteAmount && ctx.quoteAmount > 0
        ? `AUD $${(Number(ctx.quoteAmount) * 0.1).toFixed(2)}`
        : "deposit amount";
  const invoiceNum =
    ctx.invoiceNumber?.trim() || (ctx.id ? `INV-${ctx.id.slice(-5).toUpperCase()}` : "Invoice");
  const invoiceTotalStr =
    ctx.quoteAmount && ctx.quoteAmount > 0
      ? `AUD $${Number(ctx.quoteAmount).toFixed(2)}`
      : "as stated on your invoice";

  const companyName = ctx.companyName || "Groutix";
  const companyPhone = ctx.companyPhone || "7023 8094";
  const companyEmail = ctx.companyEmail || "info@groutix.com";
  const companyWebsite = ctx.companyWebsite || "www.groutix.com";

  // Normalized tag lookup: keys lowercase without underscores or hyphens
  const tagLookup: Record<string, string> = {
    // Names & Contact
    firstname: firstName,
    first: firstName,
    customername: fullName,
    fullname: fullName,
    name: fullName,
    customer: fullName,
    clientname: fullName,
    client: fullName,
    phone: phone,
    customerphone: phone,
    mobile: phone,
    email: email,
    customeremail: email,

    // Job & Location
    jobno: jobNo,
    jobnumber: jobNo,
    jobnum: jobNo,
    jobid: jobNo,
    job: jobNo,
    service: service,
    servicename: service,
    services: service,
    address: address,
    propertyaddress: address,
    streetaddress: address,
    suburb: suburb,
    city: suburb,
    area: suburb,
    state: ctx.state || "VIC",

    // Schedule & Staff
    technicianname: tech,
    technician: tech,
    specialist: tech,
    tech: tech,
    inspector: tech,
    assigned: tech,
    inspectiondate: inspectionDate,
    inspectiontime: inspectionDate,
    inspectiondatetime: inspectionDate,
    inspection: inspectionDate,
    bookingdate: bookingDate,
    bookingtime: bookingDate,
    servicedate: bookingDate,
    jobdate: bookingDate,

    // Billing & Quotes
    quotenumber: quoteNum,
    quoteno: quoteNum,
    quoteid: quoteNum,
    quote: quoteNum,
    quoteamount: quoteAmountStr,
    quotetotal: quoteAmountStr,
    quoteprice: quoteAmountStr,
    quoteamountclause: quoteClause,
    depositamount: depositAmountStr,
    deposit: depositAmountStr,
    invoicenumber: invoiceNum,
    invoiceno: invoiceNum,
    invoiceid: invoiceNum,
    invoice: invoiceNum,
    invoicetotal: invoiceTotalStr,
    invoiceamount: invoiceTotalStr,
    totaldue: invoiceTotalStr,
    totalamount: invoiceTotalStr,

    // Company
    companyname: companyName,
    company: companyName,
    companyphone: companyPhone,
    phonecompany: companyPhone,
    companyemail: companyEmail,
    emailcompany: companyEmail,
    companywebsite: companyWebsite,
    website: companyWebsite,
  };

  const applyReplacements = (str?: string): string => {
    if (!str) return "";
    return str.replace(/\{\{?\s*([a-zA-Z0-9_-]+)\s*\}?\}/g, (match, rawKey) => {
      const normalized = rawKey.toLowerCase().replace(/[-_]/g, "");
      if (Object.prototype.hasOwnProperty.call(tagLookup, normalized)) {
        return tagLookup[normalized];
      }
      return match;
    });
  };

  return {
    subject: applyReplacements(template.subject),
    body: applyReplacements(template.body),
  };
}
