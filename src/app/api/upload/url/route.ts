// Short-lived read URL for a customer's own upload (used by the editor to
// restore photos when editing a cart line). Keys are unguessable UUID paths.
import { NextResponse } from "next/server";
import { presignGet, storageEnabled } from "@/lib/storage";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!/^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-[\w.-]+$/.test(key)) return NextResponse.json({ error: "Bad key" }, { status: 400 });
  if (!storageEnabled) return NextResponse.json({ url: null });
  return NextResponse.json({ url: await presignGet(key) });
}
