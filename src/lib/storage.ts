// Object storage (S3 / Cloudflare R2). Only used when S3_BUCKET is set.
export const storageEnabled = Boolean(process.env.S3_BUCKET);

async function client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({ region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT, forcePathStyle: !!process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
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
