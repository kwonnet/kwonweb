import React from "react";
import { getServerSession } from "@/lib/server-session";
import GuestAuthGate from "@/components/auth/GuestAuthGate";
import CustomLayout from "./CustomLayout";
import AppBottomNav from "@/components/common/AppBottomNav";
import CustomToolbarActions from "@/components/common/CustomToolbarActions";
import NotificationServer from "@/components/common/NotificationServer";



const layout = async (props: any) => {
  const session = await getServerSession();
  const notificationNode = await NotificationServer();
  return (
    <GuestAuthGate guest={!session?.user?.accessToken}>
    <CustomLayout
      CustomToolbar={
        // <CustomToolbarActions />
        <CustomToolbarActions initialStats={notificationNode?.props.stats} initialUserId={session?.user?.id} NotificationNode={notificationNode} />

      }
    >
      {props.children}
      <AppBottomNav />
    </CustomLayout>
    </GuestAuthGate>
  );
};

export default layout;
