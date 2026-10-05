import { getServerSession } from "@/lib/server-session";
import { getPostGifters } from "@/lib/posts";
import ErrorMessage from "@/components/common/ErrorMessage";
import PageClient from "./PageClient";
import type {PostGiftersPage} from "@/types/post";

export default async function Page({params}: {params: Promise<{id: string}>}) {
  const [{id}, session] = await Promise.all([params, getServerSession()]);
  if (!session?.user?.accessToken) return <ErrorMessage message="Sign in to view this post’s gifters" />;
  let initialPage: PostGiftersPage;
  try {
    initialPage = await getPostGifters(id, 1, session.user.accessToken);
  } catch (error) {
    return <ErrorMessage message={error instanceof Error ? error.message : "Unable to load gifters"} />;
  }
  return <PageClient postId={id} initialPage={initialPage} />;
}
