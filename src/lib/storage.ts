// Object storage (S3 / Cloudflare R2). Only used when S3_BUCKET is set.
const env = (k: string) => (process.env[k] ?? "").trim().replace(/^["']|["']$/g, "") || undefined; // tolerate pasted whitespace/quotes
const BUCKET = env("S3_BUCKET"), ENDPOINT = env("S3_ENDPOINT")?.replace(/\/+$/, ""), REGION = env("S3_REGION") ?? "auto", KEY = env("S3_ACCESS_KEY_ID"), SECRET = env("S3_SECRET_ACCESS_KEY");
export const storageEnabled = Boolean(BUCKET && KEY && SECRET);

async function client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: REGION, endpoint: ENDPOINT, forcePathStyle: !!ENDPOINT,
    // R2 does not accept the SDK's default CRC32 checksum on presigned browser PUTs.
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED", credentials: { accessKeyId: KEY!, secretAccessKey: SECRET! } });
}
export async function presignPut(key: string, mime: string) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(await client(), new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mime }), { expiresIn: 600 });
}
export async function presignGet(key: string) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(await client(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 3600 });
}

/** Stream an object (used by /api/img to serve admin-uploaded product images). */
export async function getObjectStream(key: string) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const r = await (await client()).send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const body = r.Body ? (r.Body as { transformToWebStream: () => ReadableStream }).transformToWebStream() : null;
  if (!body) throw new Error("No body");
  return { body, contentType: r.ContentType, contentLength: r.ContentLength };
}

/** Server-side round-trip: put a tiny object, read it back, delete it. For /api/health?storage=1. */
export async function storageSelfTest() {
  if (!storageEnabled) return { configured: false };
  const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const c = await client(); const Key = `health/${Date.now()}.txt`; const Bucket = BUCKET!;
  try {
    await c.send(new PutObjectCommand({ Bucket, Key, Body: "ok", ContentType: "text/plain" }));
    const g = await c.send(new GetObjectCommand({ Bucket, Key }));
    const body = await g.Body?.transformToString();
    await c.send(new DeleteObjectCommand({ Bucket, Key }));
    const presigned = await presignPut(`health/presign-${Date.now()}.txt`, "text/plain");
    // Exercise the presigned URL from the server (no CORS involved) to isolate signature problems.
    const put = await fetch(presigned, { method: "PUT", body: "ok", headers: { "content-type": "text/plain" } });
    return { configured: true, endpoint: ENDPOINT, bucket: Bucket, keyLen: KEY?.length, secretLen: SECRET?.length, sdkPut: "ok", readBack: body, presignedPutStatus: put.status, presignedPutBody: put.ok ? undefined : (await put.text()).slice(0, 300) };
  } catch (e) { return { configured: true, endpoint: ENDPOINT, bucket: Bucket, keyLen: KEY?.length, secretLen: SECRET?.length, error: (e as Error).message }; }
}
