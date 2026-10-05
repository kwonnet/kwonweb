import StickyWrapper from "@/components/common/StickyWrapper";
import React from "react";
import TopTabNavigation from "./TopTabNavigation";
import { getServerSession } from "@/lib/server-session";
import { getPostEngagementsOverview } from "@/lib/posts";

const Layout = async ({
  children,
  params,
}: {
  children?: React.ReactNode;
  params: Promise<{ username: string; id: string }>;
}) => {
  const [args, session] = await Promise.all([params, getServerSession()]);
  const ownership = session?.user?.accessToken ? await getPostEngagementsOverview(args.id, session.user.accessToken).catch(() => ({isOwner: false})) : {isOwner: false};

  return (
    <React.Fragment>
      <StickyWrapper backPageUrl={`/${args.username}/feed/${args.id}`} title="Post">
        <TopTabNavigation isOwner={ownership.isOwner} />
        {children}
      </StickyWrapper>
    </React.Fragment>
  );
};

export default Layout;
