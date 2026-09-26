// 'use client'
import React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { signIn, signOut } from "next-auth/react";
import { constant } from "@/config";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { CardMedia } from "@mui/material";
import { Session } from "next-auth";
import theme from "./theme";
import { getNavigationItems } from "./navigation";

const AUTHENTICATION = {
  signIn,
  signOut,
};

const NextjsAppProvider = (props: {
  children: React.ReactNode;
  session?: Session | null;
}) => {
  const NAVIGATION = getNavigationItems(props.session?.user);
  return (
    <NextAppProvider
      theme={theme}
      authentication={AUTHENTICATION}
      navigation={NAVIGATION}
      session={props.session}
      branding={{
        homeUrl: "/",
        logo: (
          <CardMedia
            sx={{ height: 25, mt: {lg: 1, md: 1, sm: 0, xs: 0}, pl: { lg: 0, md: 0, sm: 1, xs: 1} }}
            component="img"
            src="/logo.png"
            alt={constant.siteName}
          />
        ),
        title: "" //constant.siteName,
      }}
    >
      {props.children}
    </NextAppProvider>
  );
};


export default NextjsAppProvider;
