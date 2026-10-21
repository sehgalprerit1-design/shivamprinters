import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/Legal";
import { BIZ } from "@/data/legal";
export const metadata: Metadata = { title: "Terms of Use" };
export default function Terms() {
  return (
    <LegalPage title="Terms of use">
      <p>By placing an order on {BIZ.site} you agree to these terms. {BIZ.legalName} is the seller of record for every product on this site. GSTIN: {BIZ.gstin}.</p>
      <h2>Orders and pricing</h2>
      <ul>
        <li>All prices are in Indian Rupees and include GST. Shipping is shown separately at checkout.</li>
        <li>An order is confirmed when payment succeeds, or when you choose Cash on Delivery and the order is accepted. We may cancel and refund an order if a product is unavailable or a price was displayed in error.</li>
        <li>We deliver within India only.</li>
      </ul>
      <h2>Personalised products</h2>
      <ul>
        <li>You confirm you own or have permission to use any photo or text you upload, and that it does not infringe anyone&apos;s rights or contain unlawful content. We may refuse to print content we consider offensive or infringing.</li>
        <li>The preview shown in the editor is what we print. Please check spelling, cropping and photo quality before ordering; we cannot correct these after production starts.</li>
        <li>Because each item is made to order, personalised products cannot be cancelled once in production (usually within 24 hours of ordering) and cannot be returned for change of mind.</li>
      </ul>
      <h2>Delivery</h2>
      <p>Express delivery is typically 4–6 working days and economy 10–12 working days from order confirmation, to most PIN codes in India. Timelines are estimates; delays due to courier, weather or festival load are not grounds for cancellation. Cash on Delivery is available on most PIN codes and may require OTP confirmation.</p>
      <h2>Defects and damage</h2>
      <p>If an item arrives damaged or with a print defect, email a photo to {BIZ.email} within 7 days of delivery. We will reprint or refund in full — see our Returns & Refunds policy.</p>
      <h2>Intellectual property</h2>
      <p>The site, its design, text and product imagery belong to {BIZ.legalName}. You retain all rights to the photos you upload and grant us a licence to reproduce them only to fulfil your order.</p>
      <h2>Limitation of liability</h2>
      <p>Our liability for any order is limited to the amount paid for that order. We are not liable for indirect or consequential loss.</p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Courts at {BIZ.city.split(",")[0]} have exclusive jurisdiction. Consumers retain rights under the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.</p>
      <h2>Contact and grievances</h2>
      <p>{BIZ.legalName}, {BIZ.address}, {BIZ.city}. Email {BIZ.email}, phone {BIZ.phone}. Grievance officer: {BIZ.grievanceOfficer} ({BIZ.grievanceEmail}).</p>
    </LegalPage>
  );
}
