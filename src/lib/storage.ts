// Object storage (S3 / Cloudflare R2). Only used when S3_BUCKET is set.
export const storageEnabled = Boolean(process.env.S3_BUCKET);

async function client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT, forcePathStyle: !!process.env.S3_ENDPOINT,
    // R2 does not accept the SDK's default CRC32 checksum on presigned browser PUTs.
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED", credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
}
export async function presignPut(key: string, mime: string) {
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(await client(), new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: mime }), { expiresIn: 600 });
}
export async function presignGet(key: string) {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return getSignedUrl(await client(), new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }), { expiresIn: 3600 });
}

/** Server-side round-trip: put a tiny object, read it back, delete it. For /api/health?storage=1. */
export async function storageSelfTest() {
  if (!storageEnabled) return { configured: false };
  const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const c = await client(); const Key = `health/${Date.now()}.txt`; const Bucket = process.env.S3_BUCKET!;
  try {
    await c.send(new PutObjectCommand({ Bucket, Key, Body: "ok", ContentType: "text/plain" }));
    const g = await c.send(new GetObjectCommand({ Bucket, Key }));
    const body = await g.Body?.transformToString();
    await c.send(new DeleteObjectCommand({ Bucket, Key }));
    const presigned = await presignPut(`health/presign-${Date.now()}.txt`, "text/plain");
    // Exercise the presigned URL from the server (no CORS involved) to isolate signature problems.
    const put = await fetch(presigned, { method: "PUT", body: "ok", headers: { "content-type": "text/plain" } });
    return { configured: true, endpoint: process.env.S3_ENDPOINT, bucket: Bucket, sdkPut: "ok", readBack: body, presignedPutStatus: put.status, presignedPutBody: put.ok ? undefined : (await put.text()).slice(0, 300) };
  } catch (e) { return { configured: true, endpoint: process.env.S3_ENDPOINT, bucket: Bucket, error: (e as Error).message }; }
}
