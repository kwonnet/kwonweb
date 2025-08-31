import React from "react";
import CustomLayout from "./CustomLayout";
import { AppBottomNav, CustomToolbarActions, NotificationServer } from "@/components/common";
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
        <CustomToolbarActions NotificationNode={<NotificationServer />} />

      }
    >
      {props.children}
      <AppBottomNav />
    </CustomLayout>
  );
};

export default layout;
