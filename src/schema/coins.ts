import { z } from "zod"


export const TransferZodSchema = z.object({
    senderId: z.string({required_error: "senderId must be a string"}).trim(),
    recipientId: z.string({required_error: "recipientId must be a string"}).trim(),
    amount: z.number({required_error: "Amount must be a number"}).min(100, {message: "Minimum amount is 100 Coins"}),
  })