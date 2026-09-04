import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions | Groutix Australia",
  description:
    "Official Terms and Conditions for Groutix Pty Ltd — covering quotations, shower regrouting services, 10-year warranty, payment terms, and cancellation policies.",
  alternates: { canonical: "/terms-conditions" },
};

export default function TermsConditionsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[73px] min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-800">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-sm text-slate-500 mb-8 pb-4 border-b border-slate-200">
            Groutix Pty Ltd • ACN 687 415 005
          </p>

          <p className="mb-8 leading-relaxed">
            Please review the binding terms and conditions governing all quotations, bookings, shower regrouting works, waterproof warranties, and services provided by Groutix Pty Ltd.
          </p>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed">
            {/* Clause 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Definitions</h2>
              <p className="font-semibold mb-2">1.1 In these terms and conditions:</p>
              <ul className="list-none space-y-2 pl-4">
                <li>
                  <b>(1) Customer</b> means the person purchasing the goods and/or services upon these terms and conditions and any entity acting on behalf of or with the authority of the Customer; and
                </li>
                <li>
                  <b>(2) Supplier</b> means Groutix PTY LTD trading as Groutix and any related body corporate of the Supplier within the meaning of section 50 of the Corporations Act 2001 and any successor or assignee.
                </li>
                <li>
                  <b>(3) Completion Date</b> means the date on which the Supplier finishes the Work in accordance with the Contract.
                </li>
                <li>
                  <b>(4) Contract</b> means the Quotation, these terms and conditions and any written Variation agreed between the parties.
                </li>
                <li>
                  <b>(5) Quotation</b> means the quotation issued by the Supplier for the goods and/or services to be supplied.
                </li>
                <li>
                  <b>(6) Site</b> means the location at which the Work is to be carried out as identified in the Quotation or otherwise agreed in writing.
                </li>
                <li>
                  <b>(7) Variation</b> means an agreed change to the Work in accordance with clause 11.
                </li>
                <li>
                  <b>(8) Work</b> means the goods and/or services to be supplied by the Supplier in accordance with the Contract.
                </li>
              </ul>
            </section>

            {/* Clause 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Binding terms and conditions</h2>
              <p className="font-semibold mb-2">2.1 The only terms which are binding upon the Supplier are:</p>
              <ul className="list-none space-y-2 pl-4">
                <li>(1) those set out in these terms and conditions or otherwise agreed to in writing by the Supplier; and</li>
                <li>(2) those, if any, which are imposed by law and which cannot be excluded.</li>
              </ul>
            </section>

            {/* Clause 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Quotations and scope of work</h2>
              <div className="space-y-3">
                <p>
                  <b>3.1</b> Any prices shown in the Supplier&apos;s quotations are valid for 30 days from the date of the quotation and may be altered by the Supplier before acceptance. Once a Quotation has been accepted, the Price may only be changed in accordance with the Contract, including an agreed Variation under clause 11.
                </p>
                <p>
                  <b>3.2</b> The Customer must check the quotation carefully as the Supplier will only supply the goods and/or services shown in the Supplier&apos;s quotation.
                </p>
                <p>
                  <b>3.3</b> Any variations to the price and/or of the goods and/or services to be supplied as shown in the Supplier&apos;s quotation must be agreed in writing.
                </p>
                <p>
                  <b>3.4</b> To enable the Supplier to supply the goods and/or services as shown in the Supplier&apos;s quotation, the Customer must ensure that at all times the Supplier has free and clear access to the relevant worksite, failing which additional charges may apply.
                </p>
                <p>
                  <b>3.5</b> The Supplier will not be liable if tiles lift and/or come loose during the grout removal process (this is sometimes caused by high moisture levels) and additional charges may apply if re-tiling is required as a result.
                </p>
                <p>
                  <b>3.6</b> Before the Work starts, the Customer must disclose to the Supplier any matter known to the Customer that may affect the Work, including previous repairs, waterproofing or re-grouting work, plumbing or leak issues, and any inspection, building, plumbing or other report relating to the Site or the proposed Work.
                </p>
                <p>
                  <b>3.7</b> Unless the Quotation expressly states that diagnostic or invasive testing is included, any inspection, assessment or quotation by the Supplier is based on a visual and non-invasive assessment of the visible tiled and grouted areas. The Supplier does not, by carrying out such an assessment, certify the condition of concealed membranes, substrates, framing, plumbing or other hidden building elements. If an external or concealed source may be contributing to a leak or defect, the Customer may need to obtain an appropriate plumbing or building inspection.
                </p>
                <p>
                  <b>3.8</b> Where a Quotation is prepared using photographs, measurements, descriptions or other information supplied by or on behalf of the Customer, the Supplier may rely on that information. If the actual Site conditions or scope materially differ from the information supplied, the Supplier may propose a Variation in accordance with clause 11, including any adjustment to the Price or the time for completion. If the Customer does not agree to the proposed Variation, the Supplier may decline to perform the additional or changed Work.
                </p>
                <p>
                  <b>3.9</b> The customer authorizes the supplier to take photographs and video recordings of the site before, during, and after the work, for purposes including record-keeping, quality assurance, warranty administration, training, dispute resolution, and marketing, provided that any marketing use does not identify the customer or disclose personal information without prior written consent.
                </p>
                <p>
                  <b>3.10 Drying Period Requirement:</b> The Customer must keep all areas in which the Work is to be performed dry for at least 24 hours before the Work starts and for at least 24 hours after the Work is completed, unless the Supplier gives different written instructions.
                </p>
                <p>
                  <b>3.11 Shower Use:</b> If the Work includes a shower, the Customer must not use the shower for at least 24 hours before the Work starts, unless the Supplier gives different written instructions.
                </p>
              </div>
            </section>

            {/* Clause 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. Plumbing and painting</h2>
              <div className="space-y-3">
                <p>
                  <b>4.1</b> Unless expressly included in the Quotation, the Price does not include plumbing or drainage work and the Customer is responsible for engaging an appropriately qualified plumber for plumbing issues associated with or affecting the Work.
                </p>
                <p>
                  <b>4.2</b> Unless expressly included in the Quotation, the Supplier will not carry out painting or decorating work in connection with the Work.
                </p>
              </div>
            </section>

            {/* Clause 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Goods and services tax (GST)</h2>
              <div className="space-y-3">
                <p className="font-semibold">5.1 In this clause 5:</p>
                <ul className="list-none space-y-2 pl-4">
                  <li>(1) <b>GST</b> means GST as defined in A New Tax System (Goods and Services Tax) Act 1999 as amended (GST Act) or any replacement or other relevant legislation and regulations;</li>
                  <li>(2) words or expressions used in this clause which have a particular meaning in the GST law (as defined in the GST Act, and also including any applicable legislative determinations and Australian Taxation Office public rulings) have the same meaning, unless the context otherwise requires; and</li>
                  <li>(3) any reference to GST payable by a party includes any corresponding GST payable by the representative member of any GST group of which that party is a member.</li>
                </ul>
                <p>
                  <b>5.2</b> Unless GST is expressly included, the consideration to be paid or provided under any other clause of these terms and conditions for any supply made under or in connection with these terms and conditions (including the price at which the goods and/or services are sold) does not include GST.
                </p>
                <p>
                  <b>5.3</b> To the extent that any supply made under or in connection with these terms and conditions (including the supply of the goods and/or services) is a taxable supply, the GST exclusive consideration otherwise to be paid or provided for that taxable supply is increased by the amount of any GST payable in respect of that taxable supply and that amount must be paid at the same time and in the same manner as the GST exclusive consideration is otherwise to be paid or provided. A party&apos;s right to payment under this clause is subject to a valid tax invoice being delivered to the recipient of the taxable supply.
                </p>
              </div>
            </section>

            {/* Clause 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Acceptance</h2>
              <p>
                <b>6.1</b> The Customer must inspect the goods and/or services immediately upon completion and must within 7 days after the date of inspection give written notice to the Supplier, with particulars, of any claim that the goods and/or services are not in accordance with the contract. If the Customer fails to give that notice, then to the extent permitted by statute the goods and/or services must be treated as having been accepted by the Customer and the Customer must pay for the goods and/or services in accordance with the provisions of these terms and conditions.
              </p>
            </section>

            {/* Clause 7 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Payment</h2>
              <div className="space-y-3">
                <p>
                  <b>7.1</b> Payment for goods and/or services sold by the Supplier to the Customer must be tendered in full no later than the date of sale or as otherwise specified by the Supplier.
                </p>
                <p className="font-semibold">7.2 Payment must be treated as made:</p>
                <ul className="list-none space-y-2 pl-4">
                  <li>(1) if cash, direct credit or credit card is tendered — on the date it is tendered; and</li>
                  <li>(2) if a cheque or other negotiable instrument is tendered — on the date upon which the cheque or other negotiable instrument is negotiated and cleared by the Supplier&apos;s bankers.</li>
                </ul>
                <p>
                  <b>7.3</b> Time is of the essence in respect of the Customer&apos;s obligation to make payment for goods and/or services sold by the Supplier to the Customer.
                </p>
                <p className="font-semibold">7.4 If the Customer defaults in making payment to the Supplier in accordance with these terms and conditions the Supplier may in its absolute discretion:</p>
                <ul className="list-none space-y-2 pl-4">
                  <li>(1) charge a late fee of $30 for each (7) seven day period that payment is not received;</li>
                  <li>(2) charge the Customer interest calculated on the portion of the Customer&apos;s account overdue at the rate of 2% per month from the date on which the default arose; and</li>
                  <li>(3) require the Customer to reimburse the Supplier for all collection costs including legal costs incurred by the Supplier calculated on a solicitor and client basis as a consequence of the Supplier instructing its solicitor to provide advice to it in connection with the default and/or to institute such recovery process as the Supplier in its discretion decides.</li>
                </ul>
                <p className="font-semibold">7.5 Any payments tendered by the Customer to the Supplier must be applied as follows:</p>
                <ul className="list-none space-y-2 pl-4">
                  <li>(1) first as reimbursement for any collection costs incurred by the Supplier in accordance with clause 7.4(3);</li>
                  <li>(2) secondly, in payment of any interest charged to the Customer in accordance with clause 7.4(2); and</li>
                  <li>(3) thirdly, in satisfaction or part satisfaction of the oldest portion of the Customer&apos;s account.</li>
                </ul>
                <p>
                  <b>7.6</b> If the Customer cancels or otherwise does not complete an order for goods and/or services, the Supplier may retain the deposit at its discretion.
                </p>
              </div>
            </section>

            {/* Clause 8 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Cancellation fee</h2>
              <div className="space-y-3">
                <p>
                  <b>8.1 Cancellation within 10 business days:</b> If the customer cancels within 10 business days of the scheduled appointment, a cancellation fee of $350 (including GST) will be payable by the customer to the supplier regardless of the reason for the cancellation.
                </p>
                <p>
                  The customer acknowledges that this fee represents the supplier&apos;s reasonable costs arising from the late cancellation, including reserved labor, subcontractor commitments, scheduling, administration, and associated business costs. Where, before cancellation, the supplier has purchased or specially ordered materials or committed to subcontractor costs specifically for the customer&apos;s booking, the customer must also reimburse those additional reasonable costs.
                </p>
              </div>
            </section>

            {/* Clause 9 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Latent defects, site conditions, access and health and safety</h2>
              <div className="space-y-3">
                <p>
                  <b>9.1</b> Subject to any rights or guarantees that cannot lawfully be excluded, the Supplier is not responsible for faults, defects, deterioration, movement or damage affecting framework, structure, tiles, substrate, waterproofing or other building elements where the condition was not visible or reasonably apparent at the time of the Supplier&apos;s inspection or quotation.
                </p>
                <p>
                  <b>9.2</b> If additional Work is required because of a latent, concealed or previously undisclosed condition, the Supplier may propose a Variation in accordance with clause 11, including any adjustment to the Price or the time required for completion. The Supplier is not required to carry out the additional Work unless the Variation is agreed.
                </p>
                <p>
                  <b>9.3</b> The Supplier may refuse to start, or may suspend, the Work where the Site presents a health or safety risk to the Supplier&apos;s employees, agents or contractors. The Customer must, at the Customer&apos;s cost, remedy the relevant Site condition before the Work is required to start or continue.
                </p>
                <p>
                  <b>9.4</b> The Customer must provide the Supplier and its employees, agents or contractors with reasonable access to the Site as required to carry out the Work during lawful working hours.
                </p>
                <p>
                  <b>9.5</b> The Customer must remove personal property, furniture and other items that are likely to impede the Work or be exposed to a foreseeable risk of damage. To the extent permitted by law, the Supplier is not responsible for loss of or damage to items that the Customer was requested to remove but failed to remove, except to the extent caused by the Supplier&apos;s negligence.
                </p>
                <p>
                  <b>9.6</b> If the Supplier cannot access the Site or cannot reasonably proceed with the Work because of a matter within the Customer&apos;s control and the Customer has not given at least 24 hours&apos; notice, the Supplier may charge a reasonable call-out or attendance fee.
                </p>
                <p>
                  <b>9.7</b> If the Customer or a person acting on the Customer&apos;s behalf provides materially inaccurate or misleading information that causes additional Work, the additional Work may be treated as a Variation and added to the Price. The Supplier may decline to carry out that additional Work.
                </p>
                <p>
                  <b>9.8 Methods and Techniques:</b> The customer acknowledges that the work will be carried out using the methods, techniques, and procedures determined by Groutix PTY LTD, and its employees, contractors, subcontractors, or any other person authorized by Groutix PTY LTD. The customer must not direct, supervise, interfere with, or require any such person to carry out the work in a manner contrary to Groutix PTY LTD&apos;s recommended methods. Groutix PTY LTD may refuse to comply with any such direction. If the customer continues to interfere or prevent the work from being carried out in accordance with those methods, Groutix PTY LTD may suspend or cease the work, and any resulting delay, return visit, or additional costs may be treated as a variation and charged to the customer. If Groutix PTY LTD agrees to carry out the work in accordance with the customer&apos;s requested method or instruction, Groutix PTY LTD will not be liable for any resulting reduction in quality, appearance, durability, or performance, and any contractual warranty will not apply to the extent any issue results from that instruction.
                </p>
                <p>
                  <b>9.9 Safe Workplace:</b> The supplier may immediately suspend or cease the work if, in the supplier&apos;s reasonable opinion, any employee, contractor, subcontractor, or other authorized person is subjected to abusive, threatening, intimidating, aggressive or unsafe behavior by the customer or any other person at the site, or if the site otherwise becomes unsafe. The supplier will not be liable for any delay arising from such suspension or cessation of the work. Any additional attendance, return visit, or other costs may be treated as a variation and charged to the customer. If the conduct continues or the site remains unsafe, the supplier may terminate under Clause 14.
                </p>
                <p>
                  <b>9.10 Parking Provision:</b> The Customer must provide suitable and lawful parking for the supplier and its representatives as close as reasonably practicable to the site for the duration of the works. Where paid parking, permit parking, or any other parking charges are required, the customer must reimburse the supplier for those costs. If suitable parking is unavailable or restricted or otherwise prevents the supplier from carrying out the works efficiently, any resulting delay, additional labour, travel time, parking costs, return visit, or other reasonable costs may be treated as a variation and charged to the customer.
                </p>
                <p>
                  <b>9.11 Utilities:</b> The customer must ensure that safe access to the site, electricity, running water, and any other utilities reasonably required to carry out the work are available for the duration of the work. If the required utilities or access are unavailable, or the supplier is otherwise prevented from carrying out the work efficiently due to a matter within the customer&apos;s control, any resulting delay, additional labor, return visit, or other reasonable costs may be treated as a variation and charged to the customer.
                </p>
              </div>
            </section>

            {/* Clause 10 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Time for completion</h2>
              <div className="space-y-3">
                <p>
                  <b>10.1</b> The Supplier will undertake and complete the Work within a reasonable time, subject to the Contract and any agreed completion date.
                </p>
                <p>
                  <b>10.2</b> The Supplier is entitled to a reasonable extension of time for delay caused by matters beyond the Supplier&apos;s reasonable control, including adverse weather, material unavailability, industrial disputes, Variations, restricted Site access, latent conditions or delay caused by other trades or the Customer.
                </p>
              </div>
            </section>

            {/* Clause 11 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Variations</h2>
              <div className="space-y-3">
                <p>
                  <b>11.1</b> The Work may be varied by written agreement between the Customer and the Supplier.
                </p>
                <p>
                  <b>11.2</b> A party requesting a Variation must make the request in writing and describe the proposed change with sufficient detail.
                </p>
                <p>
                  <b>11.3</b> An agreed Variation must be recorded in writing and, where applicable, state the additional or reduced cost and any change to the expected completion date or time for completion.
                </p>
                <p>
                  <b>11.4</b> The cost of extra Work under an agreed Variation will be added to the Price, and the value of omitted Work under an agreed Variation will be deducted from the Price.
                </p>
                <p>
                  <b>11.5</b> A Variation may also be required where Site conditions, required materials or other matters affecting completion could not reasonably have been identified from the information available to the Supplier when the Contract was entered into.
                </p>
              </div>
            </section>

            {/* Clause 12 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">12. Warranties, exclusions and limitations</h2>
              <div className="space-y-3">
                <p className="font-semibold">12.1 Contractual Warranties for Work Completed by Groutix:</p>
                <ul className="list-none space-y-2 pl-4">
                  <li>
                    <b>(1) Qualifying full shower epoxy re-grouting: 10 years</b> from the Completion Date, covering failure of the epoxy grout caused by defective application or workmanship by the Supplier.
                  </li>
                  <li>
                    <b>(2) Polymer or cement-based grout: 2 years</b> from the Completion Date, covering failure of the grout caused by defective application or workmanship by the Supplier.
                  </li>
                  <li>
                    <b>(3) Silicone or caulking supplied and applied by the Supplier: 2 years</b> from the Completion Date, covering failure caused by defective application or workmanship by the Supplier.
                  </li>
                </ul>
                <p>
                  <b>12.2</b> For the purposes of clause 12.1(1), the 10-year epoxy grout warranty applies only to a <b>full shower epoxy re-grout</b> completed by the Supplier within the agreed scope of Work. Unless expressly stated otherwise in writing, partial re-grouting or isolated repairs are not covered by the 10-year epoxy grout warranty.
                </p>
                <p>
                  <b>12.3 Cracked, Loose, Hollow or Drummy Tiles Exclusion:</b> The warranty in clause 12.1 does not apply where cracked, loose, hollow or drummy tiles are present in the shower or relevant work area, whether identified before, during or after the works and whether or not those conditions were visible at the time of quotation.
                </p>
                <p>
                  <b>12.4</b> The exclusion in clause 12.3 applies even if any affected tile is repaired, replaced, injected, re-bonded or otherwise stabilised by the Supplier or any other person, and also applies if the Customer instructs the Supplier to proceed after being advised of the condition.
                </p>
                <p>
                  <b>12.5</b> Any repair, replacement, injection, re-bonding or stabilisation of a cracked, loose, hollow or drummy tile is a remedial measure only. It does not constitute a representation or guarantee that the tile, adjoining tiles, substrate or surrounding area will remain stable or free from future movement, cracking, loosening, hollowing or drummy conditions, or that any concealed or underlying defect has been rectified.
                </p>
                <p>
                  <b>12.6</b> Where clause 12.3 applies, the contractual warranty in clause 12.1 is excluded for the shower/project as a whole, and not merely for the individual affected tile or location, to the extent permitted by law.
                </p>
                <p>
                  <b>12.7</b> The warranty in clause 12.1 does not cover failure caused or contributed to by pre-existing or concealed defects, structural or building movement, substrate failure, waterproofing membrane failure, plumbing leaks, excessive moisture, or other conditions outside the Supplier&apos;s workmanship.
                </p>
                <p>
                  <b>12.8</b> The contractual warranty in clause 12.1 does not cover damage, fault or failure caused or contributed to by accident, misuse, tampering, unauthorised interference, failure to carry out required maintenance, normal wear and tear, fire, flood or similar events, or adjustment, alteration or repair by a person other than the Supplier or a person authorised by the Supplier, to the extent permitted by law.
                </p>
                <p>
                  <b>12.9</b> Any inspection, repair or rectification carried out after the Completion Date does not restart or extend the original contractual warranty period in clause 12.1, except to the extent required by law or expressly agreed by the Supplier in writing.
                </p>
                <p>
                  <b>12.10</b> Nothing in these terms and conditions excludes, restricts or modifies any guarantee, warranty, right or remedy that cannot lawfully be excluded, restricted or modified under applicable law, including the Australian Consumer Law.
                </p>
                <p>
                  <b>12.11</b> The only other conditions and warranties which are binding on the Supplier in respect of (1) the state, quality or condition of the goods and/or services supplied by it to the Customer; or (2) advice, recommendations, information or services supplied by it, its employees, servants or agents to the Customer regarding the goods, their use and application; are those imposed and required to be binding by statute.
                </p>
                <p>
                  <b>12.12 Limitation of Liability:</b> To the extent permitted by statute the liability, if any, of the Supplier arising from the breach of the conditions or warranties referred to in clause 12 is, at the Supplier&apos;s option, limited to and completely discharged: (1) in the case of the goods, by either (a) the supply by the Supplier of equivalent goods; or (b) the replacement by the Supplier of the goods supplied to the Customer; and (2) in the case of advice, recommendations, information or services, by supplying the advice, recommendations, information or services again.
                </p>
                <p>
                  <b>12.13</b> Except as provided in this clause 12 all conditions and warranties implied by law in respect of the state, quality or condition of the goods and/or services which may apart from this clause be binding on the Supplier are excluded.
                </p>
                <p>
                  <b>12.14</b> The Customer acknowledges that the Customer does not rely and it is unreasonable for the Customer to rely on the skill or judgment of the Supplier as to whether the goods supplied are reasonably fit for any purpose for which they are being acquired, and that the sale is not a sale of goods by description or sample. Whilst the Supplier will endeavour to ensure that the colour and texture of the grout supplied will match any description or sample that may be provided, it does not warrant that it will be an exact match.
                </p>
                <p>
                  <b>12.15</b> Except to the extent provided in this clause 12 the Supplier has no liability (including liability in negligence) to any person for (1) any loss or damage consequential or otherwise suffered or incurred by that person in relation to the goods or advice, recommendations, information or services; and (2) In particular without limiting clause 12.15(1) any loss or damage consequential or otherwise suffered or incurred by that person caused by or resulting directly or indirectly from any failure, defect or deficiency of any kind of or in the goods or advice, recommendations, information or services.
                </p>
                <p>
                  <b>12.16</b> The Customer acknowledges and agrees that whilst the Supplier will take all due care, some tile types are susceptible to chipping and nibbling during the grout removal process and this can result in chipping of tiles, appearance changes to the tile glazes and/or edges and uneven grout line finishes. The Supplier will not be liable for any such changes or damage to tiles and the Customer acknowledges and agrees that this is a risk of the supply of the goods and/or services by the Supplier.
                </p>
                <p>
                  <b>12.17</b> If the Supplier replaces any tiles or other items, whilst it will endeavour to ensure that any replacement items will be an exact match to the existing item with respect to colour and texture, it does not warrant that such replacement item will be an exact match.
                </p>
                <p>
                  <b>12.18 Purpose of Works:</b> The customer acknowledges that the purpose of the work is to repair, restore, seal, or maintain the tiled area, not to achieve a new, renovated, or cosmetically perfect finish. Whilst the supplier will use reasonable care and skill in carrying out the works, it does not warrant that stains, scratches, chips, pitting, etching, discoloration, uneven grout lines, uneven tile edges, previous repairs, age-related wear, existing damage, or other cosmetic imperfections will be removed, improved, or made uniform unless expressly stated in the quotation.
                </p>
                <p>
                  <b>12.19 Non-Payment:</b> The Supplier will have no liability to the Customer whatsoever if the Customer has not paid the Supplier for the relevant goods and/or services.
                </p>
              </div>
            </section>

            {/* Clause 13 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">13. Notice of warranty claim</h2>
              <div className="space-y-3">
                <p>
                  <b>13.1</b> For a claim under the Supplier&apos;s contractual warranty in clause 12.1, the Customer must notify the Supplier in writing within 10 business days after becoming aware of the matter or circumstance giving rise to the claim and provide reasonable details of the alleged defect.
                </p>
                <p>
                  <b>13.2</b> After receiving a notice under clause 13.1, the Supplier will respond within a reasonable period and may request photographs, information and a suitable date and time to inspect the Work at the Site.
                </p>
                <p>
                  <b>13.3</b> If the Supplier accepts that rectification is required under the contractual warranty, the Customer must give the Supplier a reasonable opportunity to inspect and rectify the relevant Work before permitting another person to alter, remove or repair that Work, except where urgent action is reasonably required to prevent injury or further property damage or where applicable law requires otherwise.
                </p>
                <p>
                  <b>13.4</b> Any accepted rectification Work will be arranged for a mutually reasonable date and completed within a reasonable time having regard to Site access, materials and the nature of the rectification.
                </p>
                <p>
                  <b>13.5</b> If an inspection establishes that the alleged defect is not covered by the Supplier&apos;s contractual warranty, the Supplier may charge a reasonable call-out or inspection fee where the Customer was informed of that possibility before the inspection.
                </p>
                <p>
                  <b>13.6</b> Nothing in this clause 13 limits any right or remedy that the Customer has under the Australian Consumer Law or any other law that cannot be excluded, restricted or modified.
                </p>
              </div>
            </section>

            {/* Clause 14 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">14. Termination and suspension</h2>
              <div className="space-y-3">
                <p>
                  <b>14.1</b> If the Supplier materially breaches the Contract and the breach is capable of remedy, the Customer may give written notice requiring the Supplier to remedy the breach within 10 business days or another reasonable period agreed by the parties.
                </p>
                <p>
                  <b>14.2</b> If a breach notified under clause 14.1 is not remedied within the required period, or is not capable of remedy, the Customer may terminate the Contract by written notice, subject to applicable law.
                </p>
                <p>
                  <b>14.3</b> If the Customer fails to make a payment when due, denies or prevents reasonable access to the Site, or otherwise materially breaches the Contract, the Supplier may give written notice requiring the Customer to remedy the breach within 10 business days or another reasonable period stated in the notice.
                </p>
                <p>
                  <b>14.4</b> If a breach notified under clause 14.3 is not remedied within the required period, the Supplier may suspend the Work or terminate the Contract by written notice, subject to applicable law and any amounts properly due for Work already performed.
                </p>
              </div>
            </section>

            {/* Clause 15 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">15. Authority</h2>
              <div className="space-y-3">
                <p>
                  <b>15.1</b> A person who accepts a Quotation or otherwise enters into the Contract on behalf of the Customer warrants that the person has authority to bind the Customer.
                </p>
                <p>
                  <b>15.2</b> To the extent permitted by law, a person who breaches the warranty in clause 15.1 is responsible for loss or damage reasonably suffered by the Supplier as a direct result of that lack of authority.
                </p>
              </div>
            </section>

            {/* Clause 16 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">16. Disputes</h2>
              <div className="space-y-3">
                <p>
                  <b>16.1</b> If either party considers that a dispute has arisen in connection with the Contract, that party should promptly give the other party written notice identifying the matters in dispute.
                </p>
                <p>
                  <b>16.2</b> The parties will first attempt to resolve the dispute directly and in good faith.
                </p>
                <p>
                  <b>16.3</b> If the dispute is not resolved directly, the parties may agree to use an independent mediator before commencing court proceedings, except where urgent relief or another statutory process is required.
                </p>
              </div>
            </section>

            {/* Clause 17 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">17. Privacy</h2>
              <p>
                <b>17.1</b> Where goods are supplied to the Customer on credit the Customer irrevocably authorises the Supplier, its employees and agents to make such enquiries as it considers necessary to investigate the credit worthiness of the Customer including (without limitation) making enquiries from persons nominated as trade referees, the bankers of the Customer or any other credit providers (Information Sources) and the Customer authorises the Information Sources to disclose to the Supplier all information concerning the Customer which is within their possession and which is requested by the Supplier.
              </p>
            </section>

            {/* Clause 18 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">18. Severability</h2>
              <p>
                <b>18.1</b> If any provision of the Contract is illegal, void or unenforceable, that provision is to be severed to the extent necessary and the remaining provisions continue in force.
              </p>
            </section>

            {/* Clause 19 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">19. Entire understanding</h2>
              <div className="space-y-3">
                <p>
                  <b>19.1</b> These terms and conditions are the entire agreement and understanding between the Supplier and the Customer on everything connected with the subject matter of these terms and conditions.
                </p>
                <p>
                  <b>19.2</b> Subject to any rights that cannot lawfully be excluded, the parties acknowledge that the Contract records their agreement concerning the Work and supersedes prior discussions, understandings or representations concerning the same subject matter, except for any matter expressly incorporated into the Contract.
                </p>
              </div>
            </section>

            {/* Clause 20 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-3">20. Governing law and jurisdiction</h2>
              <div className="space-y-3">
                <p>
                  <b>20.1</b> The law of the State or Territory where the Supplier supplies the goods and/or services to the Customer governs these terms and conditions.
                </p>
                <p>
                  <b>20.2</b> The parties submit to the non-exclusive jurisdiction of the courts of the State or Territory where the Supplier supplies the goods and/or services to the Customer and of the Commonwealth of Australia.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="pt-6 border-t border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Questions or Contact</h2>
              <p className="text-slate-700">
                For questions regarding these Terms and Conditions, please contact Groutix Pty Ltd:
              </p>
              <p className="text-slate-700 mt-1">
                Phone: <a href="tel:0370238094" className="text-blue-700 underline">(03) 7023 8094</a>
                {" • "}
                Email: <a href="mailto:info@groutix.com" className="text-blue-700 underline">info@groutix.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
