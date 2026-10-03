import { auth } from "@/auth";
import { createImageUploadHandler } from "@/lib/storage/image-upload";
import { storeImage } from "@/lib/storage/r2";

export const runtime = "nodejs";
export const maxDuration = 60;
export const POST = createImageUploadHandler({
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL,
  userId: async () => (await auth())?.user?.id,
  store: storeImage,
});
