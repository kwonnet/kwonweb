import { getServerSession } from "@/lib/server-session";
import { getSidebarTrends } from "@/lib/discover";
import type { TrendingTopics } from "@/types";
import SidebarTrendClient from "./SidebarTrendClient";

const SidebarTrendServer = async () => {
  const session = await getServerSession();
  let trends: TrendingTopics[] = [];
  let initialError = false;
  try {
    trends = await getSidebarTrends({ country: session?.user?.country?.id, limit: 3 }, session?.user?.accessToken);
  } catch {
    initialError = true;
  }
  return <SidebarTrendClient trends={trends} initialError={initialError} />;
};

export default SidebarTrendServer;
