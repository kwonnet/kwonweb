import { Box, Grid, Paper } from "@mui/material";
import React from "react";
import ChatListServer from "./ChatListServer";
import ChatListHeader from "./ChatListHeader";
import { getServerSession } from "@/lib/server-session";
import NewConversationButton from "./NewConversationButton";
import StartConvo from "./StartConvo";

const Layout = async ({
  params,
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) => {
  const session = await getServerSession()
  
  const _params = await params;

  const recipientId = _params?.slug ? _params.slug[0] : undefined;

  const slug = _params?.slug ? _params.slug[1] : "chat";


  const isCurrentUser = session?.user?.id === recipientId && slug === "requests"

  const isShowList = !recipientId || _params?.slug?.includes("list")

  return (
    <React.Fragment>
        <Box
          sx={{
            height: "100%",
            minHeight: 0,
            minWidth: 0,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <Grid container spacing={1} sx={{ width: "100%", height: "100%", minHeight: 0 }}>
            <Grid
              sx={{
                display: {
                  lg: "block",
                  md: "block",
                  sm: isShowList ? "block" : "none",
                  xs: isShowList ? "block" : "none",
                },
                minWidth: 0,
                minHeight: 0,
                height: "100%",
              }}
              size={{ xs: 12, md: 4 }}
            >
              <Paper
                sx={{
                  // height: "calc(100vh - 20px)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  height: "100%",
                  p: 1,
                  position: "relative",
                }}
                elevation={0}
              >
                <ChatListHeader />
                <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: 9 }}><ChatListServer slug={slug} /></Box>
                <NewConversationButton />
              </Paper>
            </Grid>
            <Grid
              sx={{
                display: {
                  lg: "block",
                  md: "block",
                  // sm: recipientId ? "block" : "none",
                  // xs: recipientId ? "block" : "none",
                  sm: isShowList ? "none" : "block",
                  xs: isShowList ? "none" : "block",
                },
                minWidth: 0,
                minHeight: 0,
                height: "100%",
              }}
              size={{ xs: 12, md: 8 }}
            >
              {isCurrentUser ? <StartConvo /> : children}
            </Grid>
          </Grid>
        </Box>
    </React.Fragment>
  );
};

export default Layout;
