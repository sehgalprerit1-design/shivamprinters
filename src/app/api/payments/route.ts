// Which payment methods are live (lets the cart show the truth without a rebuild).
import { NextResponse } from "next/server";
import { razorpayEnabled } from "@/lib/razorpay";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ online: razorpayEnabled, cod: true }, { headers: { "cache-control": "no-store" } }); }
