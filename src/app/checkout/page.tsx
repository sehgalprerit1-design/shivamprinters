import type { Metadata } from "next";
import { razorpayEnabled } from "@/lib/razorpay";
import { paytmEnabled } from "@/lib/paytm";
import { Checkout } from "./Checkout";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";
export default function Page() { return <Checkout razorpay={razorpayEnabled} paytm={paytmEnabled} />; }
