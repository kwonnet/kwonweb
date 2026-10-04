import React from "react";
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
  return (
    <CustomLayout
      CustomToolbar={
        // <CustomToolbarActions />
        <CustomToolbarActions NotificationNode={<React.Suspense fallback={null}><NotificationServer /></React.Suspense>} />

      }
    >
      {props.children}
      <AppBottomNav />
    </CustomLayout>
  );
};

export default layout;
