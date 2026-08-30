export type PayMongoResource<T> = {
  data: {
    attributes: T
    id: string
    type: string
  }
}

export type PayMongoPaymentIntent = {
  amount: number
  client_key: string
  currency: string
  next_action?: {
    code?: {
      image_url?: string
    }
  } | null
  payments?: Array<{
    id: string
  }>
  status:
    | "awaiting_payment_method"
    | "awaiting_next_action"
    | "processing"
    | "succeeded"
    | string
}

export type PayMongoPayment = {
  amount?: number
  currency?: string
  payment_intent_id?: string
  status?: string
}

export type PayMongoWebhookEvent = {
  data: {
    attributes: {
      data?: {
        attributes?: PayMongoPaymentIntent | PayMongoPayment
        id?: string
        type?: string
      }
      type?: string
    }
    id?: string
  }
}
