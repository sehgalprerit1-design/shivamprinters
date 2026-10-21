import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/Legal";
import { BIZ } from "@/data/legal";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>This policy explains what {BIZ.legalName} (“we”) collects when you use {BIZ.site}, why, and the choices you have. It is drafted in line with the Information Technology Act, 2000, the SPDI Rules, 2011 and the Digital Personal Data Protection Act, 2023.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Order details</b> — name, delivery address, mobile number, email, and what you ordered.</li>
        <li><b>Your photos and text</b> — the images and captions you upload to personalise a product. These are stored only so we can print your order and let you reorder.</li>
        <li><b>Payment</b> — handled entirely by Razorpay. We never see or store your card, UPI or bank details; we receive only a payment reference.</li>
        <li><b>Usage</b> — pages visited and basic device information, to keep the site working and improve it.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To make, pack and deliver your order and to send order updates by email or SMS.</li>
        <li>To answer support requests and handle reprints or refunds.</li>
        <li>To show you your past orders so you can reorder a design.</li>
        <li>We do not sell your data. We do not use your photos for marketing or AI training.</li>
      </ul>
      <h2>Your photos</h2>
      <p>Uploaded photos are stored on secure cloud storage in encrypted form and are accessible only to the production team working on your order. They are retained for 12 months after delivery so you can reorder, then deleted. You can ask us to delete them sooner at any time.</p>
      <h2>Who we share with</h2>
      <p>Only the partners needed to fulfil your order: our courier partners (name, address, phone), Razorpay (payment), our email/SMS provider (order notifications) and our cloud hosting providers. Each is bound to use the data only for that purpose.</p>
      <h2>Cookies</h2>
      <p>We use essential cookies to keep your cart and sign-in working. We do not use third-party advertising cookies.</p>
      <h2>Your rights</h2>
      <p>You may ask to access, correct or delete your personal data, or withdraw consent, by emailing {BIZ.email} or calling {BIZ.phone}. We respond within 30 days.</p>
      <h2>Grievance officer</h2>
      <p>As required under Indian law: {BIZ.grievanceOfficer}, {BIZ.legalName}, {BIZ.address}, {BIZ.city}. Email: {BIZ.grievanceEmail}. Phone: {BIZ.phone}. Grievances are acknowledged within 48 hours and resolved within one month.</p>
    </LegalPage>
  );
}
