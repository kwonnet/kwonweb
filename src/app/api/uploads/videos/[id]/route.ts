import { auth } from "@/auth";
import { createStreamHandlers, streamConfig } from "@/lib/storage/stream";
export const runtime = "nodejs";
export const maxDuration = 30;
const handlers = createStreamHandlers({
  config: streamConfig,
  userId: async () => (await auth())?.user?.id,
});
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handlers.GET(request, (await context.params).id);
}
