"use client";
import { useAuthSession } from "@/hooks";
import { useUserStats } from "@/lib/swrHooks";
import { DecryptedConversation } from "@/types/conversation";
import { formatRelativeTime, getCurrentSegment } from "@/utils";
import { CheckOutlined, DoneAllOutlined } from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Box,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import React from "react";


const ConvoListItem = ({ item }: { item: DecryptedConversation }) => {
  const { user, token } = useAuthSession();

  const { mutate: mutateStats } = useUserStats({ userId: user.id, token });

  const router = useRouter();

  const pathname = usePathname();

  const segment = getCurrentSegment(pathname);

  const isUserInitiator = item?.initiator?.id === user?.id;
  const isUserResponder = item.responder.id === user.id;
  const isCurrentUser = isUserInitiator && isUserResponder;

  const convoUser =
    isCurrentUser || isUserResponder
      ? item.initiator.user
      : item.responder.user;

  const lastChat = item.lastMessage;

  const handleChatClick = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    ev.preventDefault();
    if(pathname?.includes("requests")){
      return router.push(`/messages/${convoUser.id}/requests`);
    }
    router.push(`/messages/${convoUser.id}/${item.kind}`);
  };

  const handleProfileClick = (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    ev.preventDefault();
    router.push(`/@${convoUser.username}`);
  };

  const isActiveChat = pathname?.includes(convoUser.id)

  const isSender = lastChat?.fromUserId === user.id;

  const isRecipientRead = !!lastChat?.read.find(
    (el) => el.userId === lastChat?.toUserId
  );
  const isRecipientSeen = !!lastChat?.seen.find(
    (el) => el.userId === lastChat?.toUserId
  );
  const isSeenAndRead = isRecipientRead && isRecipientSeen;
  const isSameUser = lastChat?.fromUserId === lastChat?.toUserId;

  const ReceiptMessageIcon = () => {
    if (!isSender) return null;
    if (isSeenAndRead || isRecipientRead || isSameUser) {
      return <DoneAllOutlined color="info" sx={{ height: 16, width: 16 }} />;
    }
    if (isRecipientSeen) {
      return (
        <DoneAllOutlined color="disabled" sx={{ height: 16, width: 16 }} />
      );
    }
    return <CheckOutlined sx={{ height: 16, width: 16 }} />;
  };

  return (
    <Box
      sx={[
        (theme) => ({
          borderBottom: `0.1px solid #b9b9c9ff`,
          background:
            isActiveChat
              ? theme.vars.palette.AppBar.defaultBg
              : undefined,
          ...theme.applyStyles("dark", {
            borderBottom: `0.1px solid #2f2f39ff`,
            background:
              isActiveChat
                ? theme.vars.palette.AppBar.defaultBg
                : undefined,
          }),
          width: "100%",
        }),
      ]}
    >
      <Stack
        // component={Link}
        // href={`/messages/${convoUser.id}`}
        direction={"row"}
        sx={{
          justifyContent: "space-between",
          p: 1,
          width: "100%",
          cursor: "pointer",
          textDecoration: "none"
        }}>
        <Stack direction={"row"} spacing={0.5}>
          <Avatar
            onClick={(ev) => handleProfileClick(ev)}
            src={convoUser?.avatar!}
            alt={convoUser?.name}
            sx={{
              width: 50,
              height: 50,
              borderRadius: "50%",
            }}
          >
            {convoUser?.name[0]}
          </Avatar>
          <div onClick={(ev) => handleChatClick(ev)}>
            <Stack
              direction={"row"}
              sx={{
                justifyContent: "space-between",
                width: "100%"
              }}>
              <Stack direction="column" spacing={-1}>
                <Typography
                  color="textSecondary"
                  style={{ fontWeight: "bold" }}
                  variant="subtitle2"
                >
                  {convoUser.name}
                </Typography>
                <Typography variant="caption" color="textDisabled">
                  @{convoUser.username}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction={"row"} spacing={0.5} sx={{
              alignItems: "center"
            }}>
              <ReceiptMessageIcon />
              <Box
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 1, // Number of lines before truncating
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  maxWidth: "100%", // Ensures it adapts to container width
                }}
              >
                <Typography variant="caption" color="textSecondary">
                  {item?.lastMessage?.content} Hello world this is the best time
                  socket handlers so that all messages and sessions alive
                </Typography>
              </Box>
            </Stack>
          </div>
        </Stack>
        <Box>
          <Stack spacing={1.5}>
            <Typography
              color={item.unreadCount > 0 ? "info" : "textSecondary"}
              variant="caption"
            >
              {lastChat && formatRelativeTime(lastChat?.createdAt)}
            </Typography>
            {item.unreadCount > 0 && (
              <Badge
                showZero={false}
                sx={{ height: 5, width: 5 }}
                max={99}
                badgeContent={item.unreadCount}
                color={"primary"}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

const DisplayChatList = ({
  convoList,
}: {
  convoList: DecryptedConversation[];
}) => {

  return (
    <Box
      sx={{
        overflow: "auto",
        height: "calc(100vh - 126px)",
        boxShadow: "inset 0px 0px 5px rgba(0,0,0,0.1)",
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "transparent",
        },
        scrollbarWidth: "thin", // Firefox
        scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
      }}
    >
      <Grid container>
        {convoList.map((item) => (
          <Grid key={item.id} size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
            <ConvoListItem item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DisplayChatList;
