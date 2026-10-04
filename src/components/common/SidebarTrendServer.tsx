import { getServerSession } from "@/lib/server-session";
import { getSidebarTrends } from "@/lib/discover";
import SidebarTrendClient from "./SidebarTrendClient";

const SidebarTrendServer = async () => {
  const session = await getServerSession();
  try {
    const trends = await getSidebarTrends({ country: session?.user?.country?.id, limit: 3 }, session?.user?.accessToken);
    return <SidebarTrendClient trends={trends} />;
  } catch {
    return <SidebarTrendClient trends={[]} initialError />;
  }
};

export default SidebarTrendServer;
