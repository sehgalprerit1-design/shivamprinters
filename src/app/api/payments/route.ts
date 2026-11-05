// Which payment methods are live (lets the cart show the truth without a rebuild).
import { NextResponse } from "next/server";
import { razorpayEnabled } from "@/lib/razorpay";
import { paytmEnabled } from "@/lib/paytm";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ online: razorpayEnabled || paytmEnabled, razorpay: razorpayEnabled, paytm: paytmEnabled, cod: true }, { headers: { "cache-control": "no-store" } }); }
