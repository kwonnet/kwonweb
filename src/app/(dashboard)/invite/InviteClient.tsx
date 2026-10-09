"use client";
import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  IconButton,
  Stack,
  Container,
} from "@mui/material";
import {
  Check,
  CopyAll as CopyIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { getInviteLink, formatNumber } from "@/utils";
import PageHeader from "@/components/common/PageHeader";
// import { init, shareStory, shareURL } from '@telegram-apps/sdk';
import FeedSocialShare from "@/components/post/FeedSocialShare";
// import { useAuthContext } from "@/context/AuthContext";
import { useUserStats } from "@/lib/swrHooks";
import { useAuthSession } from "@/hooks";

const getText = (total: number, amount: number) => {

   return `You've invited ${formatNumber(total)} ${total === 1 ? " friend " : " friends "} & earned 🎁 ${formatNumber(amount)} coins`
}

const InviteClient = () => {

  const [shareOpen, setShareOpen] = useState(false);

  const { user, token } = useAuthSession()

  const [state, setState] = useState({isCopied: false})


  const handleCopyClick = async() => {
    const inviteLink = getInviteLink(user.id.slice(-12))
    setState(prev => ({...prev, isCopied: true}))
    await navigator.clipboard.writeText(inviteLink);
    toast.info("Link copied to clipboard!");
    setTimeout(() => {
      setState(prev => ({...prev, isCopied: false}))
    }, 700);
  };

  const handleInviteClick = () => setShareOpen(true);

  const stats = useUserStats({userId: user.id, token})


  return (
    <Container maxWidth="xl">
      {shareOpen && <FeedSocialShare
        isOpen={shareOpen}
        url={getInviteLink(user.id.slice(-12))}
        postId=""
        onSocialClick={() => {}}
        toggleDrawer={(_event, open) => setShareOpen(open)}
      />}
      <PageHeader title="Invite Friends & Earn" />
      <Box sx={{ p: 2, position: "relative" }}>
        {/* <Stack direction={"row"} sx={{alignItems: "center"}} spacing={0.5}>
        <ShareIcon sx={{ fontSize: 20, color: "#fff" }} />
        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center" }}>
          Invite Friends & Earn Coins!
        </Typography>
        </Stack> */}
        <Typography variant="h5" sx={{ pt: 1, fontFamily: "PlayFair" }}>
          Share your invite link with friends and earn rewards to boost your
          account!
        </Typography>

        {/* Invite Stats */}
        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {(stats && stats?.data?.totalInvites > 0)  && (<Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getText(stats?.data?.totalInvites, stats?.data?.totalEarned ?? 0)}
          </Typography>) }
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
            position: "relative",
          }}
        >
          <Box
            sx={[(theme) => ({
              width: 150,
                height: 150,
                padding: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // border: "1px solid transparent", // Set border width
                borderRadius: "50%",
                position: "relative",
                // Inset and outset shadow
                boxShadow:
                  "inset 0px 0px 15px rgba(0, 0, 0, 0.3), 0px 4px 15px rgba(0, 0, 0, 0.2)",
                // Transparent border to allow gradient to show
                border: (theme) =>
                  `10px double ${theme.vars.palette.tints[500]}`,

            })]}
          >
            <Typography>🎁{formatNumber(stats?.data?.totalEarned ?? 0)}</Typography>
          </Box>
        </Box>

        {/* Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 3,
            alignItems: "center",
          }}
        >
          <Stack spacing={2} direction={"row"}>
            {/* Invite Button */}
            <Button
              variant="outlined"
              size="small"
              sx={{
                width: "100%",
                border: (theme) =>
                  `2px solid ${theme.vars.palette.tints[300]}`,
                color: (theme) => `${theme.vars.palette.tints[300]}`,
                borderRadius: "50px",
                fontWeight: "bold",
                padding: "10px 20px",
                fontSize: "16px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
                transition:
                  "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                "&:hover": {
                  background: (theme) => theme.vars.palette.gradient[100],
                  transition:
                    "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                  border: (theme) =>
                    `2px solid ${theme.vars.palette.shades[300]}`, // Outline on hover
                  color: "#fff",
                  transform: "scale(1.05)",
                  boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",
                },
                "&:active": {
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleInviteClick()}
              startIcon={<ShareIcon />}
            >
              Invite Now
            </Button>

            {/* Copy Invite Link Button */}
            <IconButton aria-label="Copy link"
              sx={{
                background: (theme) =>
                  `linear-gradient(135deg, ${theme.vars.palette.shades[500]} 30%, ${theme.vars.palette.tints[200]} 90%)`,
                color: "#fff",
                borderRadius: "50%",
                padding: "12px",
                height: 50,
                width: 50,
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.9)",
                "&:hover": {
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.vars.palette.tints[200]}  30%, ${theme.vars.palette.shades[400]} 90%)`,
                },
              }}
              onClick={() => handleCopyClick()}
            >
              {state.isCopied ? <Check sx={{ fontSize: 24 }} />: <CopyIcon sx={{ fontSize: 24 }} />}
            </IconButton>
          </Stack>
          <Box>
          {/* <Button
              variant="outlined"
              size="small"
              sx={{
                width: "100%",
                border: (theme) =>
                  `2px solid ${theme.vars.palette.tints[300]}`,
                color: (theme) => `${theme.vars.palette.tints[300]}`,
                borderRadius: "50px",
                fontWeight: "bold",
                padding: "10px 20px",
                fontSize: "16px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
                transition:
                  "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                "&:hover": {
                  background: (theme) => theme.vars.palette.gradient[100],
                  transition:
                    "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                  border: (theme) =>
                    `2px solid ${theme.vars.palette.shades[300]}`, // Outline on hover
                  color: "#fff",
                  transform: "scale(1.05)",
                  boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",
                },
                "&:active": {
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleShareStoryClick()}
              startIcon={<IosShareOutlinedIcon />}
            >
              Share Story
            </Button> */}
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default InviteClient;