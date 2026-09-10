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
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  address?: string;
  city?: string;
  state?: string;
  assigned?: string;
  technician?: string;
  quoteNumber?: string;
  quoteAmount?: number;
  invoiceNumber?: string;
  inspectionAt?: string;
  jobAt?: string;
}

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
📞 1300 476 884 | ✉️ info@groutix.com
🌐 www.groutix.com.au`,
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
📞 1300 476 884`,
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

If you need to reschedule or have any questions beforehand, please reply to this email or call us on 1300 476 884.

Kind regards,
Groutix Team`,
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
📞 1300 476 884 | ✉️ info@groutix.com`,
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
📞 1300 476 884`,
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
🌐 www.groutix.com.au`,
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
The Groutix Team`,
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

• Credit Card: Please call us on 1300 476 884 to pay securely over the phone.

If you have already processed this payment, please disregard this reminder with our sincere thanks.

Kind regards,
Groutix Accounts
✉️ accounts@groutix.com | 📞 1300 476 884`,
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
📞 1300 476 884 | ✉️ info@groutix.com
🌐 www.groutix.com.au`,
  },
];

function formatDateTime(isoOrStr?: string): string {
  if (!isoOrStr) return "Scheduled Date & Time";
  try {
    const d = new Date(isoOrStr);
    if (isNaN(d.getTime())) return isoOrStr;
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoOrStr;
  }
}

/**
 * Interpolate email template text with lead data
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  lead: TemplateContext
): { subject: string; body: string } {
  const fullName = lead.name?.trim() || "Valued Customer";
  const firstName = lead.name?.trim().split(/\s+/)[0] || "there";
  const service = lead.service?.trim() || "tiling & grouting service";
  const address =
    lead.address?.trim() ||
    [lead.city, lead.state].filter(Boolean).join(", ") ||
    "your property";
  const suburb = lead.city || lead.state || "";
  const phone = lead.phone || "";
  const email = lead.email || "";
  const tech = lead.technician || lead.assigned || "our specialist";
  const inspectionDate = formatDateTime(lead.inspectionAt);
  const bookingDate = formatDateTime(lead.jobAt);
  const quoteNum = lead.quoteNumber || "Quote";
  const quoteClause = lead.quoteAmount && lead.quoteAmount > 0 ? ` (AUD $${Number(lead.quoteAmount).toFixed(2)})` : "";
  const invoiceNum = lead.invoiceNumber || (lead.id ? `INV-${lead.id.slice(-5).toUpperCase()}` : "Invoice");
  const invoiceTotal = lead.quoteAmount && lead.quoteAmount > 0
    ? `AUD $${Number(lead.quoteAmount).toFixed(2)}`
    : "as stated on your invoice";

  const replaceMap: Record<string, string> = {
    "{customer_name}": fullName,
    "{name}": fullName,
    "{first_name}": firstName,
    "{service}": service,
    "{address}": address,
    "{suburb}": suburb,
    "{phone}": phone,
    "{email}": email,
    "{technician_name}": tech,
    "{technician}": tech,
    "{inspection_date}": inspectionDate,
    "{booking_date}": bookingDate,
    "{quote_number}": quoteNum,
    "{quote_amount_clause}": quoteClause,
    "{invoice_number}": invoiceNum,
    "{invoice_total}": invoiceTotal,
  };

  const applyReplacements = (str: string): string => {
    let res = str;
    for (const [placeholder, val] of Object.entries(replaceMap)) {
      res = res.split(placeholder).join(val);
      const upper = placeholder.toUpperCase();
      if (upper !== placeholder) res = res.split(upper).join(val);
    }
    return res;
  };

  return {
    subject: applyReplacements(template.subject),
    body: applyReplacements(template.body),
  };
}
