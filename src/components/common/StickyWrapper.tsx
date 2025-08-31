"use client";
import React from "react";
import { ArrowBackIosNewOutlined, HomeOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import StickyBox from "react-sticky-box";
import { getCurrentSegment } from "@/utils";

const StickyWrapper = (props: { children?: React.ReactNode, showTitle?: boolean; title?: string; backPageUrl?: string}) => {

  const router = useRouter();

  const handleGoBack = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    ev.preventDefault();
    if(props.backPageUrl){
      return router.push(props.backPageUrl, {scroll: false})
    }else{
      router.back();
    }
  };
  const pathname = usePathname()

  const segment = getCurrentSegment(pathname, true)
  
  return (
    <Box
      sx={{
        "& .post_appbar": {
          position: {
            lg: "sticky !important",
            md: "sticky !important",
            sm: "fixed !important",
            xs: "fixed !important",
          },
          width: {
            lg: "auto",
            md: "auto",
            sm: "100%",
            xs: "100%",
          },
          zIndex: {
            lg: 99,
            md: 99,
            sm: 99999,
            xs: 99999
          }
        },
      }}
    >
      <React.Fragment>
        <StickyBox className="post_appbar">
          <Box
            sx={[
              (theme) => ({
                mt: 0,
                borderRadius: 0,
                py: 1.5,
                mb: 1,
                px: 1,
                width: "100%",
                position: {
                  lg: "relative",
                  md: "relative",
                  sm: "absolute",
                  xs: "absolute",
                },
                bgcolor: theme.vars.palette.AppBar.defaultBg,
                ...theme.applyStyles("dark", {
                  bgcolor: theme.vars.palette.AppBar.darkBg,
                }),
              }),
            ]}
          >
            <Stack
              direction={"row"}
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Stack onClick={(ev) => handleGoBack(ev)} alignItems={"center"} direction={"row"} spacing={1}>
                <IconButton  size="small">
                <ArrowBackIosNewOutlined />
              </IconButton>
              <Typography>{((props.showTitle && props.title) || props.title) ? props.title : segment}</Typography>
              </Stack>
              <IconButton
                onClick={(ev) => {
                  ev.preventDefault();
                  router.push("/", { scroll: false });
                }}
                size="small"
              >
                <HomeOutlined />
              </IconButton>
            </Stack>
          </Box>
        </StickyBox>
      </React.Fragment>

      {props.children}
    </Box>
  );
};

export default StickyWrapper;
