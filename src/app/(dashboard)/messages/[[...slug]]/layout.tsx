import ConvoSocketIoProvider from "@/context/ConvoSocketIoContext";
import { Box, Grid, Paper } from "@mui/material";
import React, { use } from "react";
import ChatListServer from "./ChatListServer";
import ChatListHeader from "./ChatListHeader";
import { auth } from "@/auth";
import StartConvo from "./StartConvo";

const Layout = async ({
  params,
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ slug?: string[] }>;
}) => {
  const session = await auth()
  
  const _params = await params;

  const recipientId = _params?.slug ? _params.slug[0] : undefined;

  const slug = _params?.slug ? _params.slug[1] : "chat";

  console.log("messages layout ", _params);

  const isCurrentUser = session?.user?.id === recipientId && (slug === "requests" || slug === "anonymous")

  const isShowList = !recipientId || _params?.slug?.includes("list")

  return (
    <React.Fragment>
      <ConvoSocketIoProvider>
        <Box
          sx={{
            height: "100%",
            overflow: "auto",
            position: "fixed",
            width: "100%",
          }}
        >
          <Grid container spacing={1} sx={{ maxWidth: "100vw" }}>
            <Grid
              sx={{
                display: {
                  lg: "block",
                  md: "block",
                  sm: isShowList ? "block" : "none",
                  xs: isShowList ? "block" : "none",
                },
                width: "100%",
              }}
              size={{ lg: 3.5, md: 3.5 }}
            >
              <Paper
                sx={{
                  // height: "calc(100vh - 20px)",
                  overflow: "hidden",
                  maxHeight: "100%",
                  p: 1,
                  position: "relative",
                }}
                elevation={0}
              >
                <ChatListHeader />
                <ChatListServer slug={slug} />
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
                  width: "100%",
                },
              }}
              size={{ lg: 6.3, md: 6.3 }}
            >
              {isCurrentUser ? <StartConvo /> : children}
            </Grid>
          </Grid>
        </Box>
      </ConvoSocketIoProvider>
    </React.Fragment>
  );
};

export default Layout;
