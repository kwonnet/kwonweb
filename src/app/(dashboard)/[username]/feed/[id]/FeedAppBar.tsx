"use client";
import { FeedPost } from "@/types";
import { ArrowBackIosNewOutlined, HomeOutlined } from "@mui/icons-material";
import { IconButton, Paper, Stack } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import StickyBox from "react-sticky-box";

const FeedAppBar = ({ item }: { item: FeedPost }) => {
  const router = useRouter();
  const handleGoBack = (
    ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    ev.preventDefault();
    router.back()
    // if (!item.parentId) {
      
    //   router.replace("/", { scroll: false });
    // } else {
    //   router.replace(`/${item?.author?.username}/feed/${item?.parentId}`, {
    //     scroll: false,
    //   });
    // }
  };
  return (
    <React.Fragment>
      <StickyBox className="post_appbar" style={{ zIndex: 9999999 }}>
        <Paper
          sx={{
            mt: 0,
            borderRadius: 0,
            py: 1.5,
            mb: 1,
            width: "100%",
            position: {
              lg: "relative",
              md: "relative",
              sm: "absolute",
              xs: "absolute",
            },
          }}
        >
          <Stack
            direction={"row"}
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            {/* <Link scroll={false} href={!item.parentId ? `/`: `/${item?.author?.username}/feed/${item?.parentId}`}>
            <IconButton size="small" >
              <ArrowBackIosNewOutlined />
            </IconButton>
            </Link> */}
            
            <IconButton onClick={ev => handleGoBack(ev)} size="small">
              <ArrowBackIosNewOutlined />
            </IconButton>
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
        </Paper>
      </StickyBox>
    </React.Fragment>
  );
};

export default FeedAppBar;
