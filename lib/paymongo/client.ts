import "server-only"

const paymongoApiUrl = "https://api.paymongo.com/v1"

function getSecretKey() {
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!secretKey) {
    throw new Error("PAYMONGO_SECRET_KEY is not configured.")
  }

  return secretKey
}

export function getPaymongoPublicKey() {
  const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY
  if (!publicKey) {
    throw new Error("NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY is not configured.")
  }

  return publicKey
}

export async function paymongoRequest<T>({
  apiKey = getSecretKey(),
  body,
  idempotencyKey,
  method = "GET",
  path,
}: {
  apiKey?: string
  body?: unknown
  idempotencyKey?: string
  method?: "GET" | "POST"
  path: string
}): Promise<T> {
  const response = await fetch(`${paymongoApiUrl}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    method,
  })

  const payload = (await response.json().catch(() => null)) as
    T | { errors?: Array<{ detail?: string; message?: string }> } | null

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "errors" in payload
        ? (payload.errors?.[0]?.detail ?? payload.errors?.[0]?.message)
        : null
    throw new Error(message || `PayMongo request failed (${response.status}).`)
  }

  return payload as T
}
