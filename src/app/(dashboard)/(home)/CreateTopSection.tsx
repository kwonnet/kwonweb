"use client";
import { CreatePostDrawer } from "@/components/post";
import { useAuthSession } from "@/hooks";
import { FeedTypeEnum } from "@/types/post";
import { Avatar, Box, Card, Stack, TextField } from "@mui/material";
import Link from "next/link";
import React, { useState } from "react";

const CreateTopSection = () => {
  const { user } = useAuthSession();

  const [state, setState] = useState({
    isOpen: false,
    feedType: FeedTypeEnum.FORYOU,
  });

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpen: open }));
  };

  return (
    <React.Fragment>
      <Box sx={{ px: 1, my: 1 }}>
        <Card
          elevation={0}
          sx={[
            (theme) => ({
              p: 2,
              mb: 1,
              boxShadow: theme.shadows[1],
              ...theme.applyStyles("dark", {
                boxShadow: theme.shadows[8],
              }),
            }),
          ]}
        >
          <Stack
            direction={"row"}
            alignItems={"center"}
            spacing={0.5}
            sx={{ pb: 1 }}
          >
            <Link href={`/@${user?.username}`} style={{textDecoration: "none"}}>
              <Avatar src={user?.avatar!} alt={user?.name}>
              {user?.name[0]}
            </Avatar>
            </Link>
            <TextField
              onClick={(ev) => toggleDrawer(ev, true)}
              size="small"
              placeholder={`${user?.name?.split(" ")[0]}, what's happening?`}
              fullWidth
              sx={{ borderRadius: 5 }}
              slotProps={{
                input: {
                  type: "text",
                  autoComplete: "off",
                  style: {
                    borderRadius: 30,
                  },
                },
              }}
            />
          </Stack>
        </Card>
      </Box>
      <CreatePostDrawer isOpen={state.isOpen} toggleDrawer={toggleDrawer} />
    </React.Fragment>
  );
};

export default CreateTopSection;
