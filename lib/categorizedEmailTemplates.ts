import type { EmailTemplate } from "./emailTemplates";

// Imported from GROUTIX_Categorized_Templates_with_Codes.docx (26 October 2026).
// Preserve source paragraphs, bullet points, signatures and merge codes.
export const CATEGORIZED_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "categorized_enquiry_new_customer",
    category: "Enquiry",
    name: "Enquiry – New Customer",
    description: "Enquiry – New Customer",
    subject: "Thank You for Contacting GROUTIX",
    body: `Hi {first_name},

Thank you for contacting GROUTIX.

We’ve received your enquiry and one of our team members will review your request shortly.

To help us assess your enquiry and recommend the most suitable solution, we may ask you to provide photos of the affected area and some additional information about the issue.

Any requested photos or information can be sent by replying directly to this email.

Once we have the required information, our team will review it and advise you on the next steps.

We’ll be in touch shortly.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_enquiry_further_information_required",
    category: "Enquiry",
    name: "Enquiry – Further Information Required",
    description: "Enquiry – Further Information Required",
    subject: "Enquiry – Further Information Required – GROUTIX",
    body: `Hi {first_name},

Thank you for your enquiry. We require some additional information before we can proceed.

Please reply with:

[MISSING INFORMATION]

If easier, you can also call us on {company_phone}.

Thank you,

GROUTIX

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_photo_request_shower_bathroom_tiled_area",
    category: "Request for Missing Info / Photos",
    name: "Photo Request – Shower/Bathroom/Tiled Area",
    description: "Photo Request – Shower/Bathroom/Tiled Area",
    subject: "Photos Required for Your Quote – GROUTIX",
    body: `Hi {first_name},

Thank you for contacting GROUTIX.

To help us assess the area you would like us to work on and provide the most accurate recommendation and quotation, could you please send through a few clear photos of the area?

Where possible, please include:

• A full view of the area you would like quoted

• Photos from a few different angles so we can see the overall condition

• Close-up photos of any grout or silicone requiring attention

• Any cracked, missing or deteriorated grout

• Any damaged or deteriorated silicone

• Any loose, cracked or damaged tiles

• Any visible mould, staining or water damage

• Any surrounding areas showing signs of moisture, swelling or water damage, where applicable

Please make sure the photos clearly show the entire area you would like included in the quotation.

In many cases, we can assess the visible condition and provide a detailed quote directly from the photos, avoiding the need for an initial site visit.

Once we receive the photos, our team will review them and advise you of the recommended next steps and pricing for the works.

If the photos do not provide enough information to determine the appropriate scope of works, we may recommend an on-site assessment.

You can send the photos simply by replying to this email.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_photo_request_balcony",
    category: "Request for Missing Info / Photos",
    name: "Photo Request – Balcony",
    description: "Photo Request – Balcony",
    subject: "Photos Required for Your Balcony Quote – GROUTIX",
    body: `Hi {first_name},

Thank you for contacting GROUTIX.

To help us assess the condition of your balcony and provide the most accurate recommendation and quotation, could you please send through a few clear photos of the area?

Where possible, please include:

• A full view of the entire balcony from a few different angles

• Close-up photos of the grout and perimeter joints

• Any cracked, missing or deteriorated grout

• Any damaged, cracked or deteriorated caulking or sealant

• Any loose, cracked or damaged tiles

• Photos of the balcony edges, wall-to-floor junctions and perimeter areas

• Photos of any door thresholds or balcony-to-building junctions

• Clear photos of all drains and drainage points

• Any visible staining, moisture damage or other signs of water ingress

• If the balcony is leaking, photos of the area underneath or inside the property where the water or moisture is appearing

Please make sure the photos clearly show the entire area you would like included in the quotation.

In many cases, we can assess the visible condition and provide a detailed quote directly from the photos, avoiding the need for an initial site visit.

Once we receive the photos, our team will review them and advise you of the recommended next steps and pricing for the works.

If the photos do not provide enough information to determine the appropriate scope of works, we may recommend an on-site assessment.

You can send the photos simply by replying to this email.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_photo_request_follow_up",
    category: "Request for Missing Info / Photos",
    name: "Photo Request – Follow Up",
    description: "Photo Request – Follow Up",
    subject: "GROUTIX – Photos Required for Your Quote",
    body: `Hi {first_name},

Thank you for getting in touch with GROUTIX.

Just following up regarding your enquiry.

We’re still waiting on the photos so we can assess the area and provide you with the most appropriate solution and an accurate quote.

Once received, we’ll review everything and get back to you as soon as possible.

You can send the photos by replying to this email or attaching them to the text message we sent you.

We recommend sending the photos through as soon as possible, as our availability can change quickly and we’re unable to finalise your quote until we’ve reviewed them.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_photo_assessment_shower_condition",
    category: "Request for Missing Info / Photos",
    name: "Photo Assessment – Shower Condition",
    description: "Photo Assessment – Shower Condition",
    subject: "Review of Your Shower Photos – Repairs Recommended",
    body: `Hi {first_name},

Thank you for sending through the photos.

After reviewing the images provided, we can see deterioration within the shower area that should be addressed. Areas of the grout and/or silicone appear to be deteriorated, damaged or no longer providing an effective seal.

When grout or silicone joints deteriorate, water may be able to penetrate through vulnerable areas around the tiled surface. If left unresolved, continued exposure to water can contribute to moisture entering surrounding areas and may lead to further deterioration.

To minimise the risk of additional water damage, we recommend having the affected areas repaired as soon as reasonably possible. Where there are significant openings, failed joints or signs of water ingress, we also recommend avoiding use of the shower until repairs have been completed, where practical.

Continued water exposure can potentially contribute to deterioration behind or around the tiled area, including damage to substrates, swelling or deterioration of adjoining materials, mould growth, loose tiles and more extensive repairs being required.

We will send you a quotation outlining our recommended scope of works and pricing shortly.

Once you receive the quotation, please review the proposed works and let us know if you have any questions or would like to proceed.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_photo_assessment_balcony_condition",
    category: "Request for Missing Info / Photos",
    name: "Photo Assessment – Balcony Condition",
    description: "Photo Assessment – Balcony Condition",
    subject: "Review of Your Balcony Photos – Repairs Recommended",
    body: `Hi {first_name},

Thank you for sending through the photos.

After reviewing the images provided, we can see deterioration within the balcony area that should be addressed. Areas of the grout, perimeter joints and/or sealant appear to be deteriorated, damaged or no longer providing an effective seal.

When grout and sealed joints deteriorate, water may be able to penetrate through vulnerable areas of the tiled surface and surrounding junctions. If left unresolved, continued exposure to rain and water can contribute to moisture entering the underlying or adjoining areas and may lead to further deterioration.

To minimise the risk of additional water damage, we recommend having the affected areas repaired as soon as reasonably possible.

Continued water exposure can potentially contribute to deterioration beneath or around the tiled area, including damage to substrates, loose tiles, deterioration of adjoining building materials, staining, mould growth and water damage to areas below or adjacent to the balcony.

We will send you a quotation outlining our recommended scope of works and pricing shortly.

Once you receive the quotation, please review the proposed works and let us know if you have any questions or would like to proceed.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_assessment_booking_confirmation",
    category: "Inspection",
    name: "Assessment – Booking Confirmation",
    description: "Assessment – Booking Confirmation",
    subject: "Assessment – Booking Confirmation – GROUTIX",
    body: `Hi {first_name},

Your GROUTIX assessment booking has been confirmed.

If you need to make any changes, please reply to this message or call us on {company_phone}.

Thank you,

GROUTIX

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_general",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – General",
    description: "Job Scheduled – General",
    subject: "Your GROUTIX Booking Is Confirmed",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm your booking for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend within the scheduled arrival window to complete the agreed scope of works.

Before our arrival, please ensure:

• The work area is clean, dry and easily accessible.

• Personal items and belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs will be added to your invoice.

Payment is required upon completion of the works.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_epoxy_grouting",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – Epoxy Grouting",
    description: "Job Scheduled – Epoxy Grouting",
    subject: "Your GROUTIX Epoxy Grouting Booking Is Confirmed",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm your epoxy grouting works for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend to complete the agreed works.

Before our arrival, please ensure:

• If the works involve a shower or wet area, please do not use or wet the area for at least 24 hours before our arrival. The area must be completely dry before works commence.

• The work area must be clean, completely dry and easily accessible before our technician arrives.

• Please ensure the area is free from excessive dirt, soap residue, mould build-up, grease, debris or other contamination that may interfere with the works.

• If the area is not clean, dry or otherwise suitable for the works to proceed, an additional cleaning/preparation fee may be charged. If the condition of the area prevents the works from proceeding, the appointment may be cancelled or rescheduled and a cancellation/rescheduling fee may apply.

• Personal items and belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• Please ensure there is sufficient clear space for our technician to safely bring equipment and materials to and from the work area.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Power tools may be used during the works and intermittent noise should be expected. If your property has building or Owners Corporation restrictions relating to noisy works, please advise us before the appointment.

• Grout removal and preparation may generate some dust despite reasonable dust-control measures.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs will be added to your invoice.

• If site conditions differ from the information provided or the agreed scope of works, any additional work required will be discussed with you before proceeding.

Important – Drying & Curing Period After Completion

Once the works have been completed, the treated area must remain completely unused and dry for at least 4 full days (96 hours), starting from the time the works are completed.

During this curing period:

• Do not use the shower or treated wet area.

• Do not wet, wash or clean the treated surfaces.

• Avoid unnecessary contact with the newly completed surfaces.

• Allow adequate ventilation where possible to assist the curing process.

This curing period is important to allow the completed works sufficient time to properly cure before being exposed to water and normal use.

Please do not use the treated area until the full 4-day curing period has passed, unless otherwise specifically advised by your technician.

Payment is required upon completion of the works.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to completing the works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_epoxy_grout_visit_1",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – Epoxy Grout – Visit 1",
    description: "Job Scheduled – Epoxy Grout – Visit 1",
    subject: "Your GROUTIX Epoxy Grouting – Visit 1 Confirmed",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm Visit 1 of your epoxy grouting works for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

During this visit, our technician will carry out the first stage of the agreed epoxy grouting works.

Before our arrival, please ensure:

• The work area is clean, completely dry and easily accessible.

• Please do not use the shower or treated wet area for at least 24 hours before our arrival.

• After the shower or wet area’s final use, please dry the area thoroughly and remove any standing water or visible moisture, including around the floor, corners, drain and shower screen. The work area must be completely dry before epoxy grouting works can commence.

• If the shower or wet area has been used within the 24 hours prior to our arrival, or the area is too wet or damp for the works to proceed, the job may need to be rescheduled and a $250 rescheduling/call-out fee will apply.

• Personal items and belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• Please ensure there is sufficient clear space for our technician to safely bring equipment and materials to and from the work area.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Power tools may be used during the works and intermittent noise should be expected. If your property has building or Owners Corporation restrictions relating to noisy works, please advise us before the appointment.

• Grout removal and preparation may generate some dust despite reasonable dust-control measures.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs will be added to your invoice.

• If site conditions differ from the information provided or the agreed scope of works, any additional work required will be discussed with you before proceeding.

Important – After Visit 1

Please do not use or wet the treated area after Visit 1. The area must remain completely undisturbed and dry until our technician returns for Visit 2 to complete the remaining works.

The shower or treated wet area is not ready for use after Visit 1. Final curing and usage instructions will be provided once all works have been completed.

Payment is required upon completion of the final visit.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_epoxy_grout_visit_2",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – Epoxy Grout – Visit 2",
    description: "Job Scheduled – Epoxy Grout – Visit 2",
    subject: "Your GROUTIX Epoxy Grouting – Visit 2 Confirmed",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm Visit 2 of your epoxy grouting works for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

During this visit, our technician will carry out the final stage of the agreed epoxy grouting works, including the remaining cleaning and silicone works where applicable.

Before our arrival, please ensure:

• The treated area has remained completely unused and dry since Visit 1.

• The work area is clear and easily accessible.

• Personal items and belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• Please ensure there is sufficient clear space for our technician to safely bring equipment and materials to and from the work area.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Power tools may be used during the works and intermittent noise should be expected. If your property has building or Owners Corporation restrictions relating to noisy works, please advise us before the appointment.

• Grout removal and preparation may generate some dust despite reasonable dust-control measures.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs will be added to your invoice.

• If site conditions differ from the information provided or the agreed scope of works, any additional work required will be discussed with you before proceeding.

Important – After Visit 2

Once the final works have been completed, please do not use or wet the treated area for 48 hours, unless otherwise advised by your technician. This allows the silicone and completed works sufficient time to cure properly.

Payment is required upon completion of Visit 2.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to completing the works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_polymer_grout",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – Polymer Grout",
    description: "Job Scheduled – Polymer Grout",
    subject: "Your GROUTIX Polymer Regrouting Booking Is Confirmed",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm your polymer regrouting booking for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend within the scheduled arrival window to complete the agreed polymer regrouting works.

Before our arrival, please ensure:

• The work area is clean, completely dry and easily accessible.

• Please do not use the shower or treated wet area for at least 24 hours before our arrival.

• After the shower or wet area’s final use, please dry the area thoroughly and remove any standing water or visible moisture, including around the floor, corners, drain and shower screen. The work area must be completely dry before regrouting works can commence.

• If the shower or wet area has been used within the 24 hours prior to our arrival, or the area is too wet or damp for the works to proceed, the job may need to be rescheduled and a $250 rescheduling/call-out fee will apply.

• Personal items and belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• Please ensure there is sufficient clear space for our technician to safely bring equipment and materials to and from the work area.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Power tools may be used during the works and intermittent noise should be expected. If your property has building or Owners Corporation restrictions relating to noisy works, please advise us before the appointment.

• Grout removal and preparation may generate some dust despite reasonable dust-control measures.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs may be added to your invoice.

• If site conditions differ from the information provided or the agreed scope of works, any additional work required will be discussed with you before proceeding.

Important – After Completion

Once the works have been completed, please do not use or wet the treated area for at least 24 hours, unless otherwise advised by your technician. This allows the polymer grout and silicone sufficient time to cure before the area is returned to normal use.

Payment is required upon completion of the works.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email.

We look forward to completing the works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_shower_screen_replacement",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – Shower Screen Replacement",
    description: "Job Scheduled – Shower Screen Replacement",
    subject: "Your GROUTIX Shower Screen Replacement Is Booked",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm your shower screen replacement booking for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend within the scheduled arrival window to complete the agreed shower screen replacement works.

Before our arrival, please ensure:

• The shower and surrounding bathroom area are clean, dry and easily accessible.

• Please avoid using the shower before our arrival and ensure the area is as dry as possible.

• Personal items and belongings are removed from the shower and immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• There is sufficient clear space for our technician to safely carry the shower screen, glass panels, equipment and materials to and from the bathroom.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties, particularly where these may affect the safe movement of glass panels.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Power tools may be used during the works and intermittent noise should be expected. If your property has building or Owners Corporation restrictions relating to noisy works, please advise us before the appointment.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technician will need to unload the shower screen, tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs may be added to your invoice.

• If site conditions, measurements or existing installation conditions differ from the information provided or the agreed scope of works, any additional work required will be discussed with you before proceeding.

Important – After Installation

Once the shower screen replacement has been completed, please do not use or wet the shower for at least 24 hours, unless otherwise advised by your technician. This allows the silicone and sealants used during installation sufficient time to cure.

Payment is required upon completion of the works.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email.

We look forward to completing the works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_scheduled_silicone_replacement",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Scheduled – Silicone Replacement",
    description: "Job Scheduled – Silicone Replacement",
    subject: "Your GROUTIX Silicone Replacement Booking Is Confirmed",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm your silicone replacement booking for:

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend within the scheduled arrival window to complete the agreed silicone replacement works.

Before our arrival, please ensure:

• The work area is clean, completely dry and easily accessible.

• Please do not use the shower or treated wet area for at least 24 hours before our arrival.

• After the shower or wet area’s final use, please dry the area thoroughly and remove any standing water or visible moisture, including around the floor, corners, drain and shower screen. The work area must be completely dry before silicone replacement works can commence.

• If the shower or wet area has been used within the 24 hours prior to our arrival, or the area is too wet or damp for the works to proceed, the job may need to be rescheduled and a $250 rescheduling/call-out fee will apply.

• Personal items and belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• Please ensure there is sufficient clear space for our technician to safely bring equipment and materials to and from the work area.

• If you will not be present, any keys or access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Power tools may be used during the works and intermittent noise should be expected. If your property has building or Owners Corporation restrictions relating to noisy works, please advise us before the appointment.

• Removal and preparation of existing silicone may generate some dust or debris despite reasonable dust-control measures.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs will be added to your invoice.

• If site conditions differ from the information provided or the agreed scope of works, any additional work required will be discussed with you before proceeding.

Important – After Completion

Once the works have been completed, please do not use or wet the treated area for at least 24 hours, unless otherwise advised by your technician. This allows the newly installed sanitary-grade silicone sufficient time to cure properly.

Payment is required upon completion of the works.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to completing the works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_appointment_reminder",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job – Appointment Reminder",
    description: "Job – Appointment Reminder",
    subject: "Reminder: Your Upcoming GROUTIX Job",
    body: `Dear {customer_name},

This is a friendly reminder of your upcoming booking with GROUTIX.

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend within the scheduled arrival window to complete the agreed scope of works.

Before our arrival, please ensure:

• The work area is clean, completely dry and easily accessible.

• If your booking includes shower grouting, regrouting or silicone works, please ensure the shower is not used for at least 24 hours before our arrival and is completely dry before works commence.

• After the shower’s final use, please dry the shower thoroughly and remove any standing water or visible moisture, including around the floor, corners, drain and shower screen. The work area must be completely dry before grout or silicone works can commence.

• If the shower or wet area has been used within the 24 hours prior to our arrival, or the area is too wet or damp for the works to proceed, the job may need to be rescheduled and a $250 rescheduling/call-out fee will apply.

• Personal items, toiletries, bathmats and other belongings are removed from the immediate work area.

• Our technician has access to the property and work area for the duration of the appointment.

• If you will not be present, any keys, lockbox details or other access arrangements are organised in advance.

• Running water from a suitable tap and electricity are available on site.

• Toilet facilities are available for our technician during the works.

• Any required building, gate, lift or apartment access has been arranged in advance.

• Please advise us in advance of any stairs, restricted lift access, loading restrictions or other access difficulties.

• Pets and young children are kept safely away from the work area while works are being carried out.

• Where possible, please provide a parking space as close to the property or work area as possible, as our technicians need to unload tools, equipment and materials.

• If on-site parking is unavailable, please advise us of the nearest suitable parking location before the appointment.

• Where paid parking is required, parking costs will be added to your invoice.

Payment is required upon completion of the works.

If there have been any changes to the property access, parking arrangements or other details we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to seeing you soon.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_technician_running_late",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Technician Running Late",
    description: "Technician Running Late",
    subject: "Update Regarding Your GROUTIX Booking",
    body: `Hi {first_name},

We hope you're doing well.

We wanted to let you know that our technician is currently running behind schedule and there will be a delay to your scheduled arrival time.

We sincerely apologise for the inconvenience and appreciate your patience and understanding.

Our team will keep you updated regarding the technician’s expected arrival. We appreciate your flexibility while we work to have our technician attend your property as soon as possible.

If you need to contact us or if the delay affects your availability, please reply to this email or call us on {company_phone}.

Thank you for your patience and understanding.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_booking_reschedule_confirmation",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Booking – Reschedule Confirmation",
    description: "Booking – Reschedule Confirmation",
    subject: "Booking – Reschedule Confirmation – GROUTIX",
    body: `Hi {first_name},

Your GROUTIX booking has been rescheduled.

We’ve emailed you the updated booking confirmation with the new appointment details.

If you need to make any further changes, please reply to this message or call us on {company_phone}.

Thank you,

GROUTIX

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_rescheduling_fee_site_wet",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Rescheduling Fee – Site Wet",
    description: "Job Rescheduling Fee – Site Wet",
    subject: "Rescheduling Fee - Site Not Ready for Scheduled Works",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

Our technician attended the property for the scheduled works; however, we were unable to commence because the work area was not dry and ready as required under our Terms & Conditions.

As a result, the works will need to be rescheduled.

A rescheduling fee has been applied to cover the costs associated with the unsuccessful attendance, including:

Technician attendance and allocated time

Travel time and associated costs

Loss of the scheduled booking allocation

Please find the invoice attached and arrange payment at your earliest convenience.

Once payment has been received, we will be able to allocate a new available date for the works. Please note that new bookings remain subject to availability.

If you have any questions, please reply to this email or call us on {company_phone}.

Thank you for your understanding.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_on_hold_customer_requested",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job – On Hold – Customer Requested",
    description: "Job – On Hold – Customer Requested",
    subject: "Your GROUTIX Job Has Been Placed on Hold",
    body: `Hi {first_name},

We hope you're doing well.

As requested, we have placed your GROUTIX job on hold for the time being.

No appointment is currently scheduled, and no further action is required from you at this stage.

When you're ready to proceed, simply reply to this email or call us on (03) 7023 8094 and our team will provide you with our current availability.

Please note that future booking dates will be subject to availability at the time you are ready to proceed.

Thank you for keeping us updated. We look forward to assisting you when you're ready.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_unable_to_access_property",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job – Unable to Access Property",
    description: "Job – Unable to Access Property",
    subject: "Unable to Access Property for Your GROUTIX Booking",
    body: `Hi {first_name},

We hope you’re doing well.

Our technician attended your property for your scheduled GROUTIX booking; however, unfortunately we were unable to gain access to the property or work area.

We attempted to make contact but were unable to proceed with the scheduled works.

Please reply to this email or call us on {company_phone} so we can discuss the next available appointment and arrange suitable access.

Please note that any rescheduled appointment will be subject to our current availability.

For the rescheduled booking, please ensure that someone is available to provide access or that any keys, building access, gate codes or other entry arrangements are organised with us in advance.

If there has been any misunderstanding regarding today's access arrangements, please let us know.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_unable_to_complete_as_scheduled",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job – Unable to Complete as Scheduled",
    description: "Job – Unable to Complete as Scheduled",
    subject: "Unable to Complete Your GROUTIX Works as Scheduled",
    body: `Hi {first_name},

Thank you for your understanding today.

Our technician attended your property as scheduled; however, we were unable to complete the agreed works due to conditions identified during the attendance.

Based on the conditions encountered, proceeding with the works as originally planned may not have been appropriate or may have affected the quality, safety or reliability of the completed work.

Our team will review the technician’s findings and any information recorded during the attendance and will contact you regarding the appropriate next steps.

Depending on the circumstances, this may involve additional preparation, a revised scope of works, an updated quotation, additional materials or components, or arranging another appointment.

If you have any questions in the meantime, please reply to this email or call us on {company_phone}.

We appreciate your understanding and look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_completion_confirmation",
    category: "Job Booked / Scheduled / Rescheduled / Completed",
    name: "Job Completion – Confirmation",
    description: "Job Completion – Confirmation",
    subject: "Your GROUTIX Job Has Been Completed",
    body: `Dear {first_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm that the scheduled works at {address} have now been completed.

We appreciate the opportunity to assist you and hope you’re happy with the completed work.

Please follow any specific curing, use or aftercare instructions provided by your technician, as these may vary depending on the work completed.

If you have any questions or require further assistance, please reply to this email or call us on {company_phone}.

Thank you again for choosing GROUTIX.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_ready_photo_assessment_general",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Ready – Photo Assessment – General",
    description: "Quote Ready – Photo Assessment – General",
    subject: "Your GROUTIX Quote Is Ready",
    body: `Dear {customer_name},

Thank you for sending through your photos and information.

Our team has reviewed the photos and information provided, and we’re pleased to provide your quotation for the requested works.

You can view and accept your quotation online here:

{document}

Please review the scope of works, pricing, warranty information and any notes included in the quotation.

If you would like to proceed, simply accept the quotation online and our team will contact you to arrange your booking.

Our upcoming booking dates can fill quickly, so we recommend accepting your quotation as soon as possible if you would like to secure an earlier booking.

As the quotation has been prepared from the photos and information provided, if we discover conditions on site that were not visible or disclosed beforehand, we will discuss these with you before carrying out any additional works.

If you have any questions regarding the quotation or works, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_ready_photo_assessment_epoxy_grout",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Ready – Photo Assessment – Epoxy Grout",
    description: "Quote Ready – Photo Assessment – Epoxy Grout",
    subject: "Your GROUTIX Epoxy Grout Quote Is Ready",
    body: `Dear {customer_name},

Thank you for sending through your photos and information.

Our team has reviewed the photos and information provided, and we’re pleased to provide your quotation for the requested works.

You can view and accept your quotation online here:

{document}

Please review the scope of works, pricing, warranty information and any notes included in the quotation.

IMPORTANT – 4-DAY CURING PERIOD

After completion, the treated shower/area must not be used or exposed to water for a minimum of 4 days to allow the epoxy grout and associated sealing works to properly cure.

Please ensure you have access to an alternative shower or bathroom where required and that this curing period is suitable for you before accepting the quotation.

If you would like to proceed, simply accept the quotation online and our team will contact you to arrange your booking.

Our upcoming booking dates can fill quickly, so we recommend accepting your quotation as soon as possible if you would like to secure an earlier booking.

As the quotation has been prepared from the photos and information provided, if we discover conditions on site that were not visible or disclosed beforehand, we will discuss these with you before carrying out any additional works.

If you have any questions regarding the quotation or works, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_ready_photo_assessment_polymer_grout",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Ready – Photo Assessment – Polymer Grout",
    description: "Quote Ready – Photo Assessment – Polymer Grout",
    subject: "Your GROUTIX Polymer Grout Quote Is Ready",
    body: `Dear {customer_name},

Thank you for sending through your photos and information.

Our team has reviewed the photos and information provided, and we’re pleased to provide your quotation for the requested works.

You can view and accept your quotation online here:

{document}

Please review the scope of works, pricing, warranty information and any notes included in the quotation.

IMPORTANT – 24-HOUR CURING PERIOD

After completion, the treated shower/area must not be used or exposed to water for a minimum of 24 hours to allow the grout and associated sealing works to properly cure.

Please ensure this curing period is suitable for you before accepting the quotation.

If you would like to proceed, simply accept the quotation online and our team will contact you to arrange your booking.

Our upcoming booking dates can fill quickly, so we recommend accepting your quotation as soon as possible if you would like to secure an earlier booking.

As the quotation has been prepared from the photos and information provided, if we discover conditions on site that were not visible or disclosed beforehand, we will discuss these with you before carrying out any additional works.

If you have any questions regarding the quotation or works, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_ready_site_assessment",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Ready – Site Assessment",
    description: "Quote Ready – Site Assessment",
    subject: "Your GROUTIX Quote Is Ready",
    body: `Dear {customer_name},

Thank you for arranging access to the property and allowing our technician to complete the onsite assessment.

Following our assessment, we have prepared your quotation outlining the recommended works based on the conditions observed at the property.

You can view and accept your quotation online here:{document}

Please review the scope of works, pricing, warranty information and any notes included in the quotation.

If you would like to proceed, simply accept the quotation online and our team will contact you to arrange your booking.

Our upcoming booking dates fill quickly, so we recommend accepting your quotation as soon as possible if you would like to secure an earlier booking.

If you have any questions regarding the recommended works, scope, pricing or quotation, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_not_accepted_1st_follow_up",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote – Not Accepted – 1st Follow Up",
    description: "Quote – Not Accepted – 1st Follow Up",
    subject: "Following Up on Your GROUTIX Quote",
    body: `Hi {first_name},

Hope you're doing well.

Just following up regarding the quotation we recently sent through for your proposed works.

If you have any questions regarding the scope of works, recommended repair method, pricing, warranty, or the quotation itself, please feel free to reply to this email and our team will be happy to assist.

Where deteriorated grout, failed sealant or water ingress is present, delaying repairs can allow moisture to continue penetrating surrounding areas. Over time, this may lead to more extensive damage, including deterioration of walls, flooring and substrates, swelling or rotting of surrounding materials, mould growth, loose tiles and damage to adjoining areas, potentially resulting in significantly more extensive and costly repairs.

Our upcoming booking dates are filling quickly, so if you are looking to have the works completed soon, we recommend securing your preferred date as early as possible.

If you would like to proceed, simply reply to this email and we’ll provide you with our next available booking dates.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_not_accepted_2nd_follow_up",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote – Not Accepted – 2nd Follow Up",
    description: "Quote – Not Accepted – 2nd Follow Up",
    subject: "Following Up Again on Your GROUTIX Quote",
    body: `Hi {first_name},

I hope this email finds you well.

We’re following up again regarding the quotation we sent through for your proposed works.

We wanted to check whether you have had a chance to review the quotation and whether there is anything preventing you from proceeding at this stage.

If your concern is related to the pricing, scope of works, recommended repair method, warranty, timing, or any other aspect of the quotation, please feel free to let us know. We are happy to discuss your concerns, answer any questions and, where appropriate, explore whether there are alternative options available for your particular situation.

We value your feedback, so even if you have decided not to proceed, we would appreciate knowing the reason. This helps us understand whether there is anything we can clarify or assist you with and also helps us continue improving our service.

If you would like to proceed, you can reply to this email or accept the quotation that was previously sent to you. Once accepted, our team will contact you with our current available booking dates.

We look forward to hearing from you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_accepted_available_booking_dates",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Accepted – Available Booking Dates",
    description: "Quote Accepted – Available Booking Dates",
    subject: "Available Dates for Your GROUTIX Booking",
    body: `Hi {first_name},

Thank you for accepting your GROUTIX quotation. We appreciate the opportunity to carry out the works for you.

We’re now ready to arrange your booking. Our current availability is:

Available Appointment

Date: {booking_date}

Arrival Time: {booking_time}

Location: {address}

Please reply to this email to let us know if this appointment suits you, and we’ll reserve it for you.

Bookings are allocated on a first come, first served basis, so availability may change until the appointment has been confirmed.

Once your appointment is confirmed, we’ll send you a booking confirmation along with any preparation instructions relevant to the works.

If this date does not suit you, please let us know and our team can provide you with the next available options.

If you have any questions, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_accepted_booking_call_attempted",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Accepted – Booking Call Attempted",
    description: "Quote Accepted – Booking Call Attempted",
    subject: "We Tried Calling to Schedule Your GROUTIX Booking",
    body: `Hi {first_name},

Thank you for accepting your GROUTIX quotation.

We recently tried calling you to arrange a suitable date for your works, however, we were unable to reach you.

Please call us on {company_phone} at your earliest convenience so we can discuss our current availability and arrange your booking.

Our upcoming booking dates fill quickly, and appointments are allocated on a first come, first served basis. We recommend getting in touch as soon as possible if you have a preferred date or timeframe.

Once your booking has been arranged, we’ll send you a booking confirmation with the scheduled date, arrival time and any preparation instructions relevant to the works.

If you have any questions in the meantime, please feel free to reply to this email.

We look forward to completing the works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_accepted_booking_follow_up",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote Accepted – Booking Follow Up",
    description: "Quote Accepted – Booking Follow Up",
    subject: "Following Up on Your GROUTIX Booking",
    body: `Hi {first_name},

We hope you're doing well.

We're following up regarding your accepted GROUTIX quotation, as we haven't yet confirmed a booking date for the works.

If you would still like to proceed, please reply to this email or call us on (03) 7023 8094 and our team will provide you with our current available booking dates.

Our schedule can fill quickly, so we recommend getting in touch when you're ready to secure an appointment.

If your plans have changed or you would prefer to place the works on hold for now, please let us know and we can update your job accordingly.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_updated",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote – Updated",
    description: "Quote – Updated",
    subject: "Your Updated GROUTIX Quote Is Ready",
    body: `Hi {first_name},

Thank you for getting in touch regarding your quotation.

As requested, we have updated your quotation to reflect the revised scope of works and/or information provided.

You can view and accept your updated quotation online here:

{document}

Please review the updated scope of works, pricing, warranty information and any notes included in the quotation.

This updated quotation replaces the previous version provided.

If you would like to proceed, simply accept the updated quotation online and our team will contact you to arrange your booking.

If you have any questions regarding the changes or updated quotation, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_quote_unable_to_proceed",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Quote – Unable to Proceed",
    description: "Quote – Unable to Proceed",
    subject: "Update Regarding Your GROUTIX Enquiry",
    body: `Hi {first_name},

We hope you're doing well.

Following our review of the information provided and the works required, unfortunately we are unable to provide a quotation or proceed with the proposed works in their current condition.

The conditions identified fall outside the scope of works we are able to complete and/or warrant. Proceeding with a limited repair in these circumstances may not provide a reliable or long-term outcome.

For this reason, we believe it is best not to undertake works that we cannot confidently stand behind.

We recommend engaging an appropriately qualified contractor to further assess the affected area and determine the most suitable repair or rectification method.

We appreciate your understanding and thank you for considering GROUTIX.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_additional_works_approval_required",
    category: "Quote – Pending / Ready / Accepted / Updated",
    name: "Job – Additional Works Approval Required",
    description: "Job – Additional Works Approval Required",
    subject: "Additional Works Required for Your GROUTIX Job",
    body: `Hi {first_name},

We hope you’re doing well.

During the course of the works at your property, our technician has identified additional work that was not included in the original agreed scope.

The additional work is required due to site conditions or issues that were not reasonably identifiable from the information available when the original quotation was prepared.

Before proceeding with any work outside the agreed scope, we require your approval.

Our team will provide you with details of the additional work required and any associated costs for your review.

No additional chargeable work will be carried out without your approval.

Please review the information provided and let us know if you would like us to proceed.

Depending on the additional work required, it may be possible to complete it during the current appointment. If additional time, materials or another visit are required, we will advise you accordingly.

The works included in your original quotation remain subject to the original agreed scope and conditions.

If you have any questions or would like to discuss the additional works, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_job_completion_payment_request",
    category: "Payment / Invoicing",
    name: "Job Completion – Payment Request",
    description: "Job Completion – Payment Request",
    subject: "Your GROUTIX Invoice – Payment Due",
    body: `Dear {customer_name},

Thank you for choosing GROUTIX.

We’re pleased to confirm that the scheduled works have now been completed.

Your invoice is available using the link below:

{document}

Payment is due upon completion of the works. Please refer to the attached invoice for payment details.

If you have any questions regarding your invoice or payment, please reply to this email or call us on {company_phone}.

Thank you for your business. We appreciate it and look forward to assisting you again in the future.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_payment_reminder",
    category: "Payment / Invoicing",
    name: "Payment – Reminder",
    description: "Payment – Reminder",
    subject: "Payment Reminder – GROUTIX Invoice",
    body: `Dear {customer_name},

We hope you’re doing well.

This is a friendly reminder that payment for your recently completed GROUTIX works is still outstanding.

As payment is due upon completion of the works, we kindly ask that the outstanding invoice be finalised at your earliest convenience.

Your invoice is available using the link below:

{document}

If payment has already been made, please disregard this reminder and allow some time for the payment to appear in our records.

If you have any questions regarding the invoice or payment, please reply to this email or call us on {company_phone}.

Thank you for your prompt attention to this matter.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_payment_overdue_notice",
    category: "Payment / Invoicing",
    name: "Payment – Overdue Notice",
    description: "Payment – Overdue Notice",
    subject: "Overdue Payment – GROUTIX Invoice",
    body: `Dear {customer_name},

We hope you’re doing well.

We’re following up regarding your GROUTIX invoice, which remains outstanding despite our previous payment reminder.

Payment for the completed works was due upon completion, and we kindly ask that the outstanding balance now be finalised as soon as possible.

Your invoice is available using the link below:

{document}

If payment has already been made, please disregard this notice and allow some time for the payment to appear in our records.

If there is an issue preventing payment or you have any questions regarding the invoice, please contact us as soon as possible by replying to this email or calling {company_phone}.

We would appreciate your prompt attention to the outstanding balance.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_payment_received_confirmation",
    category: "Payment / Invoicing",
    name: "Payment – Received Confirmation",
    description: "Payment – Received Confirmation",
    subject: "Payment Received – Thank You",
    body: `Dear {customer_name},

Thank you for your payment.

We confirm that your payment has been successfully received and the invoice is now paid in full.

We appreciate the opportunity to carry out the works for you and thank you for choosing GROUTIX.

If you have any questions regarding your invoice, payment or completed works, please don’t hesitate to reply to this email.

We look forward to assisting you again in the future.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_warranty_customer_concern_received",
    category: "Warranty",
    name: "Warranty – Customer Concern Received",
    description: "Warranty – Customer Concern Received",
    subject: "We’ve Received Your GROUTIX Service Concern",
    body: `Hi {first_name},

Thank you for getting in touch and letting us know about your concern.

We’re sorry to hear that you’ve experienced an issue following the completed works.

To help our team assess the matter, please reply to this email with clear photos of the affected area and a brief description of the issue you have noticed.

Once received, our team will review the information against the original scope of works and applicable warranty conditions and advise you of the next steps.

Where required, we may arrange for a technician to attend the property to inspect the affected area before determining the appropriate course of action.

Please note that reporting an issue does not automatically confirm that the matter is covered under warranty. Warranty coverage will be determined following our assessment of the issue and the original works completed.

We appreciate your cooperation and will work with you to assess the matter appropriately.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_warranty_inspection_booking_confirmation",
    category: "Warranty",
    name: "Warranty – Inspection Booking Confirmation",
    description: "Warranty – Inspection Booking Confirmation",
    subject: "Your GROUTIX Warranty Inspection Is Confirmed",
    body: `Hi {first_name},

Thank you for providing the information regarding your concern.

Following our initial review, we have arranged for a technician to attend the property to inspect the affected area and assess the issue further.

Inspection Details

Date: {inspection_date}

Arrival Time: {booking_time}

Property: {address}

Please ensure the affected area is accessible and any personal belongings are removed from the immediate area before our technician arrives.

If you will not be present, please ensure any keys, building access or other access arrangements are organised in advance.

During the attendance, our technician will inspect the reported issue and document the condition of the affected area. Further testing or assessment may be carried out where appropriate.

Please note that arranging an inspection does not automatically confirm that the reported issue is covered under warranty. Warranty coverage will be determined following the inspection and review of the original scope of works and applicable warranty conditions.

If additional or unrelated issues are identified during the inspection, our team will discuss the recommended next steps with you separately.

If you need to make any changes to the inspection booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to assisting you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_warranty_claim_approved",
    category: "Warranty",
    name: "Warranty – Claim Approved",
    description: "Warranty – Claim Approved",
    subject: "Your GROUTIX Warranty Claim Has Been Approved",
    body: `Hi {first_name},

Thank you for allowing our technician to inspect the reported issue.

Following our assessment and review of the original works, we have confirmed that the reported issue is covered under the applicable GROUTIX warranty.

Our team will arrange the necessary rectification works to address the approved warranty issue.

We will contact you shortly to discuss our available appointment dates and arrange a suitable time for the works to be completed.

Please note that the warranty rectification will apply to the approved issue relating to the original scope of works. Any additional or unrelated work identified will be discussed with you separately before proceeding.

If you have any questions in the meantime, please reply to this email or call us on {company_phone}.

Thank you for your cooperation throughout the assessment process.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_warranty_claim_not_covered",
    category: "Warranty",
    name: "Warranty – Claim Not Covered",
    description: "Warranty – Claim Not Covered",
    subject: "Update Regarding Your GROUTIX Warranty Assessment",
    body: `Hi {first_name},

Thank you for providing us with the information regarding your concern.

Following our assessment and review of the information provided, together with the original scope of works, we have determined that the reported issue does not fall within the applicable GROUTIX warranty coverage.

Our assessment indicates that the issue is outside the original scope of works and/or relates to conditions that are not covered under the applicable warranty.

Where appropriate, our team may be able to recommend a suitable repair solution or provide a separate quotation for the additional works required.

If a quotation is provided, any proposed works will be separate from the original warranty claim, and no additional chargeable work will be carried out without your approval.

If you have any questions regarding the assessment or would like to discuss the recommended next steps, please reply to this email or call us on {company_phone}.

Thank you for your understanding.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
  {
    id: "categorized_warranty_repair_booking_confirmation",
    category: "Warranty",
    name: "Warranty – Repair Booking Confirmation",
    description: "Warranty – Repair Booking Confirmation",
    subject: "Your GROUTIX Warranty Repair Is Confirmed",
    body: `Hi {first_name},

We hope you’re doing well.

We’re pleased to confirm your booking for the approved GROUTIX warranty rectification works.

Booking Details

Date: {booking_date}

Arrival Time: {booking_time}

Property: {address}

Our technician will attend within the scheduled arrival window to complete the approved warranty works.

Before our arrival, please ensure the affected area is clean, dry and easily accessible, with personal belongings removed from the immediate work area.

If you will not be present, please ensure any keys, building access or other access arrangements are organised in advance.

Please note that this appointment relates specifically to the approved warranty rectification. Any additional or unrelated issues identified during attendance will be discussed with you separately before any additional works are carried out.

Following completion, our technician will advise you of any applicable curing or usage instructions relevant to the works completed.

If you need to make any changes to your booking or have any access requirements we should be aware of, please reply to this email or call us on {company_phone}.

We look forward to completing the rectification works for you.

Kind regards,
Alex Lee
Office Manager
{company_phone}
{company_email}
{company_website}`,
  },
];
