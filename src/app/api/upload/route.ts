// Presigned upload. The browser PUTs the original straight to object storage;
// only the key comes back to us. Works with S3, R2 or any S3-compatible bucket.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { filename, mime, bytes } = (await req.json()) as { filename: string; mime: string; bytes: number };
  if (!/^image\//.test(mime) || bytes > 40 * 1024 * 1024) return NextResponse.json({ error: "Images up to 40 MB only" }, { status: 400 });
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${filename.replace(/[^\w.-]/g, "_")}`;
  if (!process.env.S3_BUCKET) return NextResponse.json({ key, url: null, note: "S3 not configured; editor keeps the file in-browser" });
  // Lazy import so the app builds without the SDK configured.
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const s3 = new S3Client({ region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
  const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: mime }), { expiresIn: 600 });
  return NextResponse.json({ key, url });
}
