"use client";
import { AppNotification, INotificationKind, NotifAction, NotifTypeEnum, PostKind, PostType } from "@/types";
import { formatDateTime, formatRelativeTime, genVideoUrlInfo, shortenText } from "@/utils";
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
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import RepeatOutlinedIcon from '@mui/icons-material/RepeatOutlined';
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks";
import dynamic from "next/dynamic";

const ContentEditor = dynamic(
  () => import("@/components/post/ContentEditor"), // Your ContentEditor component path
  { ssr: false }
);

const NotificationCard = ({
  item,
  close,
}: {
  item: AppNotification;
  close: () => void;
}) => {
  // const { poster } = genVideoUrlInfo(
  //   item?.video?.videoId,
  //   item?.video?.thumbnail
  // );

  const { user } = useAuthSession()

  const router = useRouter()

  const isPost = (item.type === NotifTypeEnum.POST) && item.post

  const isReply = (isPost && item?.post?.kind === PostKind.REPLY) && (item?.post?.user?.id !== user.id)


  const handleViewPost = () => {
    // if(isParent){
    // router.push(`/@${item?.post?.parent?.user?.username}/feed/${item?.post?.id}`)
    //   return 
    // }
    router.push(`/@${item?.post?.user?.username}/feed/${item?.post?.id}`)
  }


  return (
    <React.Fragment>
      <Box
        sx={[
          (theme) => ({
            borderBottom: `0.1px solid #b9b9c9ff`,
            ...theme.applyStyles("dark", {
              borderBottom: `0.1px solid #423f40ff`,
            }),
          }),
        ]}
      >
        <Box sx={{ p: 1 }} onClick={() => close()}>
          {/* <Link
            style={{ textDecoration: "none" }}
            href={`/@${item?.sender?.username}`}
          > */}
            <Grid container>
              <Grid size={{ lg: 2, md: 2, sm: 2, xs: 2 }}>
                <Box component={Link} href={`/@${item.sender.username}`}>
                  <Avatar alt={item?.sender?.name} src={item?.sender?.avatar} />
                </Box>
              </Grid>
              <Grid size={{ lg: 10, md: 10, sm: 10, xs: 10 }}>
                <Box onClick={ev => isPost ? handleViewPost() : {}}>
                  {!isPost && <Typography color="textPrimary" fontWeight={300}>
                    {/* {item?.title} */} {item?.sender?.name}
                  </Typography>}
                  <Stack direction={"row"}  alignItems={"center"} spacing={0.5}>
                    <Typography
                    variant="body2"
                    color={item.isSeen ? "textDisabled" : "textPrimary"}
                    sx={{ alignItems: "center" }}
                  >
                    {item.message} 
                    {" "}
                    {(isPost &&  item?.action === NotifAction.LIKE) && <FavoriteOutlinedIcon color="error" sx={{height: 14, width: 14}} />}
                    {(isPost &&  item?.action === NotifAction.REPOST) && <RepeatOutlinedIcon color="success" sx={{height: 14, width: 14}} />}
                  </Typography>
                  
                  </Stack>
                  {isReply && <Stack direction={"row"} spacing={0.5}>
                    <Typography variant="caption" color="textDisabled">Replying to </Typography>
                    <Typography component={Link} href={`/@${item?.post?.parent?.user?.username}`} sx={{textDecoration: "none"}} variant="caption" color="info">@{item?.post?.parent?.user?.username}</Typography>
                    </Stack>}
                  {isPost && <Box 
                  
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2, // Number of lines before truncating
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    maxWidth: "100%", // Ensures it adapts to container width
                  }}>
                    {<ContentEditor disablePadding={true} readOnly={true} content={item?.post.content} />}
                  </Box>}
                  <Stack spacing={0.5} direction={"row"}>
                    <Typography style={{fontStyle: "italic"}} variant="caption" color="textDisabled">{formatRelativeTime(item.createdAt)}</Typography>
                    <Typography variant="caption" color="textDisabled">•</Typography>
                  <Typography style={{fontStyle: "italic"}} variant="caption" color="textDisabled">{formatDateTime(item.createdAt, "short", "medium")}</Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid size={{ lg: 2, md: 2, sm: 2, xs: 2 }}>
                {/* <Box sx={{ height: 60 }}>
              <CardMedia
                image={poster}
                component={"img"}
                sx={{ width: "100%", height: "100%", borderRadius: 3 }}
              />
            </Box> */}
                {/* {item.kind === INotificationKind.COMMENT && shortenText(item.comment?.content)} */}
                {/* <Typography fontWeight={300} component={"span"}>
                    {item.sender.name}{" "}
                  </Typography>
                  <Typography component={"span"}>
                    {item.kind === INotificationKind.COMMENT
                      ? "commented:"
                      : item.kind === INotificationKind.REACTION
                        ? "reacted ❤️ to your video "
                        : ""}
                  </Typography> */}
              </Grid>
            </Grid>
          {/* </Link> */}
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default NotificationCard;
