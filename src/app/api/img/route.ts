// Serves an image uploaded through the admin (stored in R2) so new products can use it.
// Keys are unguessable; responses are cached hard because a key never changes content.
import { NextResponse } from "next/server";
import { storageEnabled, getObjectStream } from "@/lib/storage";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!/^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-[\w.-]+$/.test(key)) return new NextResponse("Bad key", { status: 400 });
  if (!storageEnabled) return new NextResponse("Storage not configured", { status: 404 });
  try {
    const { body, contentType, contentLength } = await getObjectStream(key);
    return new NextResponse(body, { headers: { "content-type": contentType ?? "image/jpeg", ...(contentLength ? { "content-length": String(contentLength) } : {}), "cache-control": "public, max-age=31536000, immutable" } });
  } catch { return new NextResponse("Not found", { status: 404 }); }
}
