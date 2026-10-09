"use client";
import {Box, Grid, Paper} from '@mui/material';
import React from 'react';
import {usePathname} from 'next/navigation';
import ChatListHeader from './[[...slug]]/ChatListHeader';
import NewConversationButton from './[[...slug]]/NewConversationButton';
import StartConvo from './[[...slug]]/StartConvo';

export default function MessagingShell({children, chats, requests}: {children: React.ReactNode; chats: React.ReactNode; requests: React.ReactNode}) {
  const pathname = usePathname() ?? '/messages';
  const segments = pathname.split('/').filter(Boolean);
  const requestView = segments.includes('requests');
  const isShowList = segments.length === 1 || segments.includes('list');
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
                <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pb: { xs: 9, md: 0 } }}><Box sx={{display: requestView ? "none" : "block"}}>{chats}</Box><Box sx={{display: requestView ? "block" : "none"}}>{requests}</Box></Box>
                <NewConversationButton floating />
              </Paper>
            </Grid>
            <Grid
              sx={{
                display: {
                  lg: "block",
                  md: "block",
                  sm: isShowList ? "none" : "block",
                  xs: isShowList ? "none" : "block",
                },
                minWidth: 0,
                minHeight: 0,
                height: "100%",
              }}
              size={{ xs: 12, md: 8 }}
            >
              {isShowList ? <StartConvo /> : children}
            </Grid>
          </Grid>
        </Box>
    </React.Fragment>
  );
}
