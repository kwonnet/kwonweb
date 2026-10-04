import React from "react";
import { getServerSession } from "@/lib/server-session";
import GuestAuthGate from "@/components/auth/GuestAuthGate";
import CustomLayout from "./CustomLayout";
import AppBottomNav from "@/components/common/AppBottomNav";
import CustomToolbarActions from "@/components/common/CustomToolbarActions";
import NotificationServer from "@/components/common/NotificationServer";
import { Metadata } from "next";
import { constant } from "@/config";

export const metadata: Metadata = {
  title: constant.siteName,
  description: constant.siteDescription,
};

const layout = async (props: any) => {
  const session = await getServerSession();
  return (
    <GuestAuthGate guest={!session?.user?.accessToken}>
    <CustomLayout
      CustomToolbar={
        // <CustomToolbarActions />
        <CustomToolbarActions NotificationNode={<React.Suspense fallback={null}><NotificationServer /></React.Suspense>} />

      }
    >
      {props.children}
      <AppBottomNav />
    </CustomLayout>
    </GuestAuthGate>
  );
};

export default layout;
