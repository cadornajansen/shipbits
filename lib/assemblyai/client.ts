import "server-only"

import { z } from "zod"

export const generatedProductSchema = z.object({
  long_description: z.string().max(5000),
  name: z.string().max(120),
  short_description: z.string().max(280),
  suggested_category: z.string().max(120),
  tags: z.array(z.string().max(80)).min(2).max(5),
  tagline: z
    .string()
    .min(1)
    .max(120)
    .refine((value) => value.trim().split(/\s+/).length <= 15),
})

export type GeneratedProduct = z.infer<typeof generatedProductSchema>

const distributionProfileSchema = z.object({
  audiences: z.array(z.string()).max(5),
  categories: z.array(z.string()).max(5),
  platforms: z.array(z.string()).max(5),
  productTypes: z.array(z.string()).max(5),
  regions: z.array(z.string()).max(5),
})

export type AssemblyAiDistributionProfile = z.infer<
  typeof distributionProfileSchema
>

export type DistributionTaxonomySlugs = {
  audiences: string[]
  categories: string[]
  platforms: string[]
  productTypes: string[]
  regions: string[]
}

type GatewayErrorPayload = {
  code?: number
  error?: string
  message?: string
  metadata?: { errors?: unknown }
  request_id?: string
}

function getApiKey() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY

  if (!apiKey) {
    throw new Error("ASSEMBLYAI_API_KEY is not configured.")
  }

  return apiKey
}

const responseSchema = {
  additionalProperties: false,
  properties: {
    long_description: { type: "string" },
    name: { type: "string" },
    short_description: { type: "string" },
    suggested_category: { type: "string" },
    tags: { items: { type: "string" }, type: "array" },
    tagline: { type: "string" },
  },
  required: [
    "name",
    "short_description",
    "long_description",
    "suggested_category",
    "tagline",
    "tags",
  ],
  type: "object",
}

function getValidationErrors(payload: GatewayErrorPayload) {
  const errors = payload.metadata?.errors

  if (!Array.isArray(errors)) {
    return []
  }

  return errors.filter((error): error is string => typeof error === "string")
}

function taxonomyArraySchema(values: string[]) {
  return {
    items: {
      enum: values.length ? values : ["__unavailable__"],
      type: "string",
    },
    type: "array",
  }
}

function distributionResponseSchema(taxonomy: DistributionTaxonomySlugs) {
  return {
    additionalProperties: false,
    properties: {
      audiences: taxonomyArraySchema(taxonomy.audiences),
      categories: taxonomyArraySchema(taxonomy.categories),
      platforms: taxonomyArraySchema(taxonomy.platforms),
      productTypes: taxonomyArraySchema(taxonomy.productTypes),
      regions: taxonomyArraySchema(taxonomy.regions),
    },
    required: [
      "productTypes",
      "categories",
      "audiences",
      "platforms",
      "regions",
    ],
    type: "object",
  }
}

function formatGatewayError({
  payload,
  requestId,
  status,
}: {
  payload: GatewayErrorPayload | null
  requestId: string | null
  status: number
}) {
  const message = payload?.message || payload?.error || "Request failed."
  const validationErrors = payload ? getValidationErrors(payload) : []
  const details = validationErrors.length
    ? ` Details: ${validationErrors.join("; ")}`
    : ""
  const supportRequestId = payload?.request_id || requestId
  const trace = supportRequestId ? ` Request ID: ${supportRequestId}.` : ""

  return `AssemblyAI generation failed (HTTP ${status}): ${message}.${details}${trace}`
}

export async function generateProductFromEvidence({
  domain,
  evidence,
}: {
  domain: string
  evidence: string
}): Promise<GeneratedProduct> {
  const model = process.env.ASSEMBLYAI_LLM_MODEL || "gpt-5.6-luna"
  const response = await fetch(
    "https://llm-gateway.assemblyai.com/v1/chat/completions",
    {
      body: JSON.stringify({
        max_tokens: 1_200,
        messages: [
          {
            content:
              "You write factual product-directory metadata. Use only the supplied website evidence. Do not invent claims, metrics, customers, integrations, or features. Return concise, factual copy. tagline must be a factual phrase of 15 words or fewer. For suggested_category, return one ShipBits category name when supported by the evidence; otherwise return Other. Return 2-5 concise, specific tags supported by the evidence. Tags must not duplicate the category or use generic filler such as software, website, app, or SaaS.",
            role: "system",
          },
          {
            content: `Domain: ${domain}\n\nWebsite evidence:\n${evidence.slice(0, 24_000)}`,
            role: "user",
          },
        ],
        model,
        response_format: {
          json_schema: {
            name: "shipbits_product_metadata",
            schema: responseSchema,
            strict: true,
          },
          type: "json_schema",
        },
      }),
      headers: {
        Authorization: getApiKey(),
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(45_000),
    }
  )

  const responseText = await response.text()
  const payload = (() => {
    try {
      return JSON.parse(responseText)
    } catch {
      return null
    }
  })() as
    | (GatewayErrorPayload & {
        choices?: Array<{ message?: { content?: string } }>
      })
    | null

  if (!response.ok) {
    const errorMessage = formatGatewayError({
      payload,
      requestId: response.headers.get("x-request-id"),
      status: response.status,
    })

    console.error("AssemblyAI product generation request failed", {
      error: errorMessage,
      model,
    })
    throw new Error(errorMessage)
  }

  const content = payload?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("AssemblyAI returned no product metadata.")
  }

  const parsedJson = JSON.parse(content) as unknown
  const parsed = generatedProductSchema.safeParse(parsedJson)

  if (!parsed.success) {
    throw new Error("AssemblyAI returned invalid product metadata.")
  }

  return parsed.data
}

export async function classifyDistributionEvidence({
  domain,
  evidence,
  taxonomy,
}: {
  domain: string
  evidence: string
  taxonomy: DistributionTaxonomySlugs
}): Promise<AssemblyAiDistributionProfile> {
  const model = process.env.ASSEMBLYAI_LLM_MODEL || "gpt-5.6-luna"
  const response = await fetch(
    "https://llm-gateway.assemblyai.com/v1/chat/completions",
    {
      body: JSON.stringify({
        max_tokens: 500,
        messages: [
          {
            content:
              "Classify a product using only the supplied public website evidence. Select only the exact controlled taxonomy slugs allowed by the response schema. Omit uncertain matches. Do not infer customer claims, pricing, geography, or integrations. This output classifies the product only; it must never rank distribution channels.",
            role: "system",
          },
          {
            content: `Domain: ${domain}\n\nWebsite evidence:\n${evidence.slice(0, 12_000)}`,
            role: "user",
          },
        ],
        model,
        response_format: {
          json_schema: {
            name: "shipbits_distribution_profile",
            schema: distributionResponseSchema(taxonomy),
            strict: true,
          },
          type: "json_schema",
        },
      }),
      headers: {
        Authorization: getApiKey(),
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(20_000),
    }
  )

  const responseText = await response.text()
  const payload = (() => {
    try {
      return JSON.parse(responseText)
    } catch {
      return null
    }
  })() as
    | (GatewayErrorPayload & {
        choices?: Array<{ message?: { content?: string } }>
      })
    | null

  if (!response.ok) {
    throw new Error(
      formatGatewayError({
        payload,
        requestId: response.headers.get("x-request-id"),
        status: response.status,
      })
    )
  }

  const content = payload?.choices?.[0]?.message?.content
  if (!content) throw new Error("AssemblyAI returned no distribution profile.")
  const parsed = distributionProfileSchema.safeParse(
    JSON.parse(content) as unknown
  )
  if (!parsed.success)
    throw new Error("AssemblyAI returned an invalid distribution profile.")
  return parsed.data
}
