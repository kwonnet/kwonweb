import { z } from "zod";

// Schema for PollOption
export const FollowUserSchema = z.object({
  senderId: z.string({message: "Sender must be a string"}),
  recipientId: z.string({message: "Recipient must be a string"}),
});