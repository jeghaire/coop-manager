import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadFileToR2(
  file: File,
  folder: string = "receipts"
): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
  try {
    // Validate
    if (!file) throw new Error("No file provided")
    if (file.size > 10 * 1024 * 1024) throw new Error("File too large (max 10MB)")
    
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, PDF allowed")
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split(".").pop()
    const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to R2
    const buffer = await file.arrayBuffer()
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: Buffer.from(buffer),
      ContentType: file.type,
      Metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    })

    await s3Client.send(command)

    // Return R2 URL
    // Two URL options:
    // Option 1 (with custom domain - best):
    // https://receipts.yourdomain.com/{fileName}
    
    // Option 2 (Cloudflare default):
    const url = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`

    return {
      url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }
  } catch (error) {
    throw new Error(`Upload failed: ${(error as Error).message}`)
  }
}

export async function deleteFileFromR2(r2Url: string): Promise<void> {
  try {
    const key = r2Url.split(".r2.cloudflarestorage.com/")[1]
    if (!key) throw new Error("Invalid R2 URL")

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key
    })

    await s3Client.send(command)
  } catch (error) {
    console.error("Delete failed:", error)
  }
}

export function buildReceiptKey(ext: string): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `receipts/${year}/${month}/${Date.now()}-${randomHex}.${ext}`
}

export async function generatePresignUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  return awsGetSignedUrl(s3Client, command, { expiresIn })
}

export async function generatePresignedGetUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  })
  return awsGetSignedUrl(s3Client, command, { expiresIn })
}

export function getPublicUrl(key: string): string {
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
  }
  return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
}