import { z } from "zod"


export const TransferZodSchema = z.object({
    senderId: z.string({error: "senderId must be a string"}).trim(),
    recipientId: z.string({error: "recipientId must be a string"}).trim(),
    amount: z.number({error: "Amount must be a number"}).min(100, {message: "Minimum amount is 100 Coins"}),
  })