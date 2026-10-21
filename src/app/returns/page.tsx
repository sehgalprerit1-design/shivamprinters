import type { Metadata } from "next";
import { LegalPage } from "@/components/ui/Legal";
import { BIZ } from "@/data/legal";
import { CallUs } from "@/components/ui/CallUs";
export const metadata: Metadata = { title: "Returns, Refunds & Cancellations" };
export default function Returns() {
  return (
    <LegalPage title="Returns, refunds & cancellations">
      <p>Everything we make is personalised for you, so our policy is simple: if it&apos;s our mistake, we fix it; if you change your mind after production starts, we can&apos;t take it back.</p>
      <h2>Cancellation</h2>
      <ul>
        <li>You can cancel for a full refund any time before production starts — usually within 24 hours of ordering. Call {BIZ.phone} or email {BIZ.email} with your order number.</li>
        <li>Once an item is in production it cannot be cancelled.</li>
      </ul>
      <h2>Damaged, defective or wrong items</h2>
      <ul>
        <li>Email a photo of the item and packaging to {BIZ.email} within <b>7 days of delivery</b>.</li>
        <li>We will reprint and reship at no cost, or refund in full — your choice. No need to return the item unless we ask.</li>
        <li>Covers print defects, damage in transit, wrong size/finish, and missing items.</li>
      </ul>
      <h2>Not covered</h2>
      <ul>
        <li>Low-resolution or blurry photos that printed as previewed (the editor warns you if a photo is too small).</li>
        <li>Spelling mistakes or cropping in text and photos you approved in the preview.</li>
        <li>Minor colour differences between your screen and print — screens are backlit, paper is not.</li>
        <li>Change of mind after production has started.</li>
      </ul>
      <h2>Refund timelines</h2>
      <p>Approved refunds are issued to the original payment method within 5–7 working days. Cash on Delivery refunds are made by bank transfer or UPI to details you provide.</p>
      <h2>Undelivered parcels</h2>
      <p>If a parcel is returned to us because it could not be delivered (wrong address, unreachable phone, refused), we will contact you to reship. A second shipping charge may apply.</p>
      <div className="not-prose mt-6"><CallUs /></div>
    </LegalPage>
  );
}
