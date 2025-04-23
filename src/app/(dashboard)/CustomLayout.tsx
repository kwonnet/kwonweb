"use client";
import React from "react";
import {
  DashboardLayout,
  SidebarFooterProps,
} from "@toolpad/core/DashboardLayout";
import { Typography } from "@mui/material";
import { PageContainer } from "@toolpad/core";
import { constant } from "@/config";

const SidebarFooter = ({ mini }: SidebarFooterProps) => {
  return (
    <Typography
      variant="caption"
      sx={{ overflow: "hidden", textWrap: "nowrap", display: "inline-block", textAlign: "center"}}
    >
      {mini
        ? `© ${constant.siteName}`
        : `©  ${constant.siteName} ${new Date().getFullYear()}`}
    </Typography>
  );
};

const CustomLayout = (props: {
  children: React.ReactNode;
  CustomToolbar: React.ReactNode;
}) => {
  return (
    <DashboardLayout
      sidebarExpandedWidth={240}
      slots={{
        sidebarFooter: SidebarFooter,
        toolbarAccount: () => null,
        toolbarActions: () => props.CustomToolbar,
      }}
    >
      <PageContainer sx={{mt: -3, paddingLeft: {lg: 2, md: 2, sm: 0, xs: 0}, paddingRight: {lg: 2, md: 2, sm: 0, xs: 0}}} title="" breadcrumbs={[]}>
        {props.children}
      </PageContainer>
    </DashboardLayout>
  );
};

export default CustomLayout;
