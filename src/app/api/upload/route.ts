// Presigned upload. The browser PUTs the original straight to object storage;
// only the key comes back to us.
import { NextResponse } from "next/server";
import { presignPut, storageEnabled } from "@/lib/storage";

export async function POST(req: Request) {
  const { filename, mime, bytes } = (await req.json()) as { filename: string; mime: string; bytes: number };
  if (!/^(image\/|application\/pdf$)/.test(mime) || bytes > 40 * 1024 * 1024) return NextResponse.json({ error: "Images or PDFs up to 40 MB only" }, { status: 400 });
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${filename.replace(/[^\w.-]/g, "_")}`;
  if (!storageEnabled) return NextResponse.json({ key, url: null, note: "S3 not configured; originals are not stored" });
  const url = await presignPut(key, mime);
  return NextResponse.json({ key, url });
}
