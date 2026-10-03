import { auth } from "@/auth";
import { createStreamHandlers, streamConfig } from "@/lib/storage/stream";
export const runtime = "nodejs";
export const maxDuration = 30;
export const POST = createStreamHandlers({
  config: streamConfig,
  userId: async () => (await auth())?.user?.id,
}).POST;
