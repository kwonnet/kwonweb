import { getServerSession } from "@/lib/server-session";
import { getTrendingTopics } from "@/lib/discover";
import PageClient from "./PageClient";

const Page = async () => {
  const session = await getServerSession();
  const trends = await getTrendingTopics({ mode: "foryou", limit: 50 }, session?.user?.accessToken).catch(() => []);
  return <PageClient trends={trends} />;
};

export default Page;
