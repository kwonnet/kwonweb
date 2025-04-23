"use client";
import { useAuthSession } from "@/hooks";
import { getSuggestedConnections, updateUserFollower } from "@/lib/users";
import { UserConnection } from "@/types/user";
import {
  Box,
  Button,
  CardMedia,
  Grid2,
  Paper,
  Typography,
} from "@mui/material";
import React, {  } from "react";
import useSWR from "swr";

import Stack from "@mui/material/Stack";
import { shortenText } from "@/utils";
import { ConnTypeEnum } from "@/types";

const ConnectionCard = ({
  conn,
  onFollowUser,
}: {
  conn: UserConnection;
  onFollowUser: (ev: any, userId: string) => void;
}) => {
  return (
    <Paper sx={{ pb: 2, height: "100%" }}>
      <CardMedia
        image={conn.avatar ?? "/avatar.jpeg"}
        component={"img"}
        sx={{
          height: 200,
          borderTopRightRadius: 5,
          borderTopLeftRadius: 5,
          objectFit: "cover",
          objectPosition: "50% 50%",
        }}
      />
      <Box sx={{ px: 2, py: 1 }}>
        <Stack>
          <Typography variant="subtitle1">{conn.name}</Typography>
          <Stack direction={"row"} spacing={2}>
            <Typography variant="caption">@{conn.username}</Typography>
            {/* <Typography color="textDisabled" variant="caption">{34}k</Typography> */}
          </Stack>
        </Stack>
        <Typography color="textDisabled" component={"p"} variant="caption">
          {shortenText(
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Deleniti ratione alias eveniet corporis rem saepe consectetur hic ipsam ea cum! Blanditiis deserunt totam",
            60
          )}{" "}
        </Typography>
      </Box>
      <Box sx={{ display: "block", textAlign: "center" }}>
        <Button
          onClick={(ev) => onFollowUser(ev, conn.id)}
          disabled={conn.hasFollowed}
          variant="outlined"
          sx={{ borderRadius: 30 }}
          size="small"
        >
          {conn.followBack ? "Follow Back" : "Follow"}
        </Button>
      </Box>
    </Paper>
  );
};

const DisplaySection = ({users}: { users: UserConnection[];}) => {
    const { token, user } = useAuthSession();

    const onFollowUser = (
      ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      userId: string
    ) => {
      ev.preventDefault();
      // send to api
      updateUserFollower({ senderId: user.id, recipientId: userId }, token);
    };
    
  return (<React.Fragment>
    <Box>
      <Grid2 container spacing={2}>
        {users.map((conn) => (
          <Grid2 key={conn.id} size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
            <ConnectionCard conn={conn} onFollowUser={onFollowUser} />
          </Grid2>
        ))}
      </Grid2>
    </Box>
  </React.Fragment>)
}

const DisplayClient = ({
  users,
  connType,
}: {
  users: UserConnection[];
  connType: ConnTypeEnum;
}) => {
  const { token, user } = useAuthSession();
  const swrKey = `${user.id}_connections_${connType}`;
  const { data, error } = useSWR(
    swrKey,
    () => getSuggestedConnections({ limit: 21, type: connType }, token),
    {
      fallbackData: users,
      keepPreviousData: true,
      refreshWhenOffline: false,
    }
  );

  return (
    <React.Fragment>
      {((error && !data) || data.length === 0 )&& <Box sx={{display: "flex", alignContent: 'center', justifyContent: 'center', height: "100%", overflow: "hidden"}}><CardMedia component={"img"} image="/no-data.svg" sx={{ height: 300, width: 300}} /></Box>}
      <DisplaySection users={data} />
    </React.Fragment>
  );
};

export default DisplayClient;
