'use client'
import { AppNotification, INotificationKind } from "@/types";
import { genVideoUrlInfo, shortenText } from "@/utils";
import {
  Avatar,
  Box,
  CardMedia,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React from "react";


const NotificationCard = ({ item, close }: { item: AppNotification, close: () => void }) => {
  const { poster } = genVideoUrlInfo(
    item?.video?.videoId,
    item?.video?.thumbnail
  );
  return (
    <React.Fragment>
      <Paper sx={{ p: 1 }} onClick={() => close()}>
        <Link style={{textDecoration: "none"}} href={`/watch/${item.video.videoId}`}>
        <Grid container>
          <Grid size={{ lg: 2, md: 2, sm: 2, xs: 2 }}>
            <Box><Avatar alt={item?.sender?.name} src={item?.sender?.image} /></Box>
          </Grid>
          <Grid size={{ lg: 8, md: 8, sm: 8, xs: 8 }}>
            <Box>
              <Typography>
              <Typography fontWeight={300} component={"span"}>
                {item.sender.name} {" "}
              </Typography>
              <Typography component={"span"}>
                {item.kind === INotificationKind.COMMENT
                  ? "commented:"
                  : item.kind === INotificationKind.REACTION
                    ? "reacted ❤️ to your video "
                    : ""}
              </Typography>
              <Typography component={"span"} variant="body2">
              {item.kind === INotificationKind.COMMENT && shortenText(item.comment?.content)}
              </Typography>
              </Typography>
              <Typography color="textDisabled" fontWeight={300}>{item.video.title}</Typography>
            </Box>
          </Grid>
          <Grid size={{ lg: 2, md: 2, sm: 2, xs: 2 }}>
            <Box sx={{ height: 60 }}>
              <CardMedia
                image={poster}
                component={"img"}
                sx={{ width: "100%", height: "100%", borderRadius: 3 }}
              />
            </Box>
          </Grid>
        </Grid>
        </Link>
      </Paper>
    </React.Fragment>
  );
};

export default NotificationCard;
