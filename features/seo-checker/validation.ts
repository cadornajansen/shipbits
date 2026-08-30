import { z } from "zod"

import { websiteUrlSchema } from "@/features/products/validation"

export const seoCheckerInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Enter your website URL.")
    .max(2048, "This URL is too long.")
    .transform((value) => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`))
    .pipe(websiteUrlSchema),
}).strict()
