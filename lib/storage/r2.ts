import "server-only"

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { safeFetchBuffer } from "@/lib/security/safe-fetch"

const imageExtensions = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const
const managedObjectKey = /^(products|profiles|submissions)\/[0-9a-f-]+\/(?:avatar|cover|logo)\.(?:gif|jpe?g|png|webp)$/i

export const acceptedImageTypes = Object.keys(imageExtensions) as Array<
  keyof typeof imageExtensions
>
export const maxProductImageSizeBytes = 5 * 1024 * 1024

export function isManagedProductObjectKey(objectKey: string) {
  return managedObjectKey.test(objectKey)
}

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "")

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl
  ) {
    throw new Error("Cloudflare R2 environment variables are not configured.")
  }

  return { accountId, accessKeyId, bucketName, publicUrl, secretAccessKey }
}

function createR2Client(config: ReturnType<typeof getR2Config>) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  })
}

function matchesImageSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    )
  }

  if (mimeType === "image/gif") {
    return (
      String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" ||
      String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a"
    )
  }

  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
}

export async function validateProductImage(file: File, label: string) {
  if (!file.size) {
    return `${label} is empty.`
  }

  if (!acceptedImageTypes.includes(file.type as keyof typeof imageExtensions)) {
    return `${label} must be a PNG, JPG, WebP, or GIF image.`
  }

  if (file.size > maxProductImageSizeBytes) {
    return `${label} must be 5 MB or smaller.`
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (!matchesImageSignature(file.type, bytes)) {
    return `${label} content does not match its image type.`
  }

  return null
}

export async function uploadProductImage({
  file,
  productId,
  type,
}: {
  file: File
  productId: string
  type: "logo" | "cover"
}) {
  const config = getR2Config()
  const extension = imageExtensions[file.type as keyof typeof imageExtensions]
  const objectKey = `products/${productId}/${type}.${extension}`
  const client = createR2Client(config)

  await client.send(
    new PutObjectCommand({
      Body: Buffer.from(await file.arrayBuffer()),
      Bucket: config.bucketName,
      ContentLength: file.size,
      ContentType: file.type,
      Key: objectKey,
    })
  )

  return {
    mimeType: file.type,
    objectKey,
    publicUrl: `${config.publicUrl}/${objectKey}`,
    sizeBytes: file.size,
  }
}

export async function uploadSubmissionImage({
  file,
  submissionId,
  type,
}: {
  file: File
  submissionId: string
  type: "logo" | "cover"
}) {
  const config = getR2Config()
  const extension = imageExtensions[file.type as keyof typeof imageExtensions]
  const objectKey = `submissions/${submissionId}/${type}.${extension}`
  const client = createR2Client(config)

  await client.send(
    new PutObjectCommand({
      Body: Buffer.from(await file.arrayBuffer()),
      Bucket: config.bucketName,
      ContentLength: file.size,
      ContentType: file.type,
      Key: objectKey,
    })
  )

  return {
    mimeType: file.type,
    objectKey,
    publicUrl: `${config.publicUrl}/${objectKey}`,
    sizeBytes: file.size,
  }
}

export async function uploadProfileImage({
  file,
  userId,
}: {
  file: File
  userId: string
}) {
  const config = getR2Config()
  const extension = imageExtensions[file.type as keyof typeof imageExtensions]
  const objectKey = `profiles/${userId}/avatar.${extension}`
  const client = createR2Client(config)

  await client.send(
    new PutObjectCommand({
      Body: Buffer.from(await file.arrayBuffer()),
      Bucket: config.bucketName,
      ContentLength: file.size,
      ContentType: file.type,
      Key: objectKey,
    })
  )

  return {
    mimeType: file.type,
    objectKey,
    publicUrl: `${config.publicUrl}/${objectKey}`,
    sizeBytes: file.size,
  }
}

export async function uploadRemoteProductImage({
  imageUrl,
  maxBytes = maxProductImageSizeBytes,
  productId,
  type,
}: {
  imageUrl: string
  maxBytes?: number
  productId: string
  type: "logo" | "cover"
}) {
  const response = await safeFetchBuffer(imageUrl, {
    accept: "image/*",
    maxBytes,
    maxRedirects: 3,
    timeoutMs: 10_000,
  })
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Image download failed with status ${response.status}.`)
  }

  const mimeType = String(response.headers["content-type"] ?? "").split(";")[0]
  const file = new File([new Uint8Array(response.body)], `imported-${type}`, { type: mimeType })
  const validationError = await validateProductImage(file, "Imported image")

  if (validationError) {
    throw new Error(validationError)
  }

  return uploadProductImage({ file, productId, type })
}

export async function uploadRemoteSubmissionImage({
  imageUrl,
  submissionId,
  type,
}: {
  imageUrl: string
  submissionId: string
  type: "logo" | "cover"
}) {
  const response = await safeFetchBuffer(imageUrl, {
    maxBytes: maxProductImageSizeBytes,
    maxRedirects: 3,
    timeoutMs: 10_000,
  })
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Image download failed with status ${response.status}.`)
  }

  const mimeType = String(response.headers["content-type"] ?? "").split(";")[0]
  const file = new File([new Uint8Array(response.body)], `imported-${type}`, { type: mimeType })
  const validationError = await validateProductImage(file, "Imported image")

  if (validationError) {
    throw new Error(validationError)
  }

  return uploadSubmissionImage({ file, submissionId, type })
}

export async function deleteProductObject(objectKey: string) {
  if (!isManagedProductObjectKey(objectKey)) {
    throw new Error("Refusing to delete an unmanaged storage object.")
  }
  const config = getR2Config()
  const client = createR2Client(config)

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    })
  )
}
