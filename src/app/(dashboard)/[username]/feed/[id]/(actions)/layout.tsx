import { StickyWrapper } from "@/components/common";
import React from "react";
import TopTabNavigation from "./TopTabNavigation";

const Layout = async ({
  children,
  params,
}: {
  children?: React.ReactNode;
  params: Promise<{ username: string; id: string }>;
}) => {
  const args = await params;

  return (
    <React.Fragment>
      <StickyWrapper backPageUrl={`/${args.username}/feed/${args.id}`} title="Post">
        <TopTabNavigation />
        {children}
      </StickyWrapper>
    </React.Fragment>
  );
};

export default Layout;
