import {pageMetadata} from '@/lib/seo';
import { getServerSession } from "@/lib/server-session";
import { getTrendingTopics } from "@/lib/discover";
import DisplayError from '@/components/common/DisplayError';
import PageClient from "./PageClient";

const Page = async () => {
  const session = await getServerSession();
  const trends = await getTrendingTopics({ mode: "foryou", limit: 50 }, session?.user?.accessToken).catch(() => undefined);
  if (!trends) return <DisplayError status={503} message="Unable to load trends. Please try again." />;
  return <PageClient trends={trends} />;
};

export default Page;

export const metadata = pageMetadata('Discover', 'Discover on Kwonnet. Connect with your community and manage your experience.', '/discover', false);
