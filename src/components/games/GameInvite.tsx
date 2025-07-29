"use client";
import PaperLayout from "./PaperLayout";
import React, { useEffect, useState } from "react";
import {
  Button,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  CircularProgress,
} from "@mui/material";
import { Check, CopyAll as CopyIcon, Share as ShareIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { formatNumber, getInviteLink } from "@/utils";
// import { useAuthContext } from "@/context/AuthContext";
// import { init, shareStory, shareURL } from '@telegram-apps/sdk';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import { useUserStats } from "@/lib/swrHooks";
import { useAuthSession } from "@/hooks";

const GameInvite = ({
  currentUserId,
  catId,
}: {
  currentUserId?: string;
  catId?: string;
}) => {

  const { user, token } = useAuthSession()

  const [state, setState] = useState({isCopied: false})

  const inviteLink = getInviteLink(user.id.slice(-12))

  const handleCopyClick = async() => {
    setState(prev => ({...prev, isCopied: true}))
    await navigator.clipboard.writeText(inviteLink);
    toast.info("Link copied to clipboard!");
    setTimeout(() => {
      setState(prev => ({...prev, isCopied: false}))
    }, 700);
  };

  const handleInviteClick = async() => {
    // if (shareURL.isAvailable()) {
    //   shareURL(inviteLink, "Join me to play Torazone game and win amazing cash prizes 🎁. Don't miss out. Play, learn & earn!");
    // }
    // Handle the invite action logic (e.g., sharing, sending invites, etc.)
    // await navigator.share({url: inviteLink, text: "Join me to play Torazone game and win amazing cash prizes 🎁. Don't miss out. Play, learn & earn!"});
    // toast.info("Invite sent!");
  };

  const handleShareStoryClick = async() => {
    // if (shareStory.isAvailable()) {
    //   shareStory(`${process.env.NEXT_PUBLIC_APP_URL}/logo_523_x_523.png`, {
    //     text: "Join me to play Torazone game and win amazing cash prizes 🎁. Don't miss out. Play, learn & earn!",
    //     widgetLink: {
    //       url: inviteLink,
    //       name: 'Torazone app',
    //     }
    //   });
    // }
    // if (shareURL.isAvailable()) {
    //   shareURL(inviteLink, "Join me to play Torazone game and win amazing cash prizes 🎁. Don't miss out. Play, learn & earn!");
    // }
    // Handle the invite action logic (e.g., sharing, sending invites, etc.)
    // await navigator.share({url: inviteLink, text: "Join me to play Torazone game and win amazing cash prizes 🎁. Don't miss out. Play, learn & earn!"});
    // toast.info("Invite sent!");
  };

  useEffect(() => {
    
    // init()
    return () => {
      
    }
  }, [])

  const stats = useUserStats(user.id, token)
  

  return (
    <React.Fragment>
      <Box sx={{ p: 2, position: "relative" }}>
        <Stack direction={"row"} sx={{alignItems: "center"}} spacing={0.5}>
        <ShareIcon sx={{ fontSize: 20, color: "#fff" }} />
        <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center" }}>
          Invite Friends & Earn Coins!
        </Typography>
        </Stack>
        <Typography variant="h5" sx={{ pt: 1, fontFamily: "PlayFair" }}>
          Share your invite link with friends and earn rewards to boost your
          game!
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
          {(stats && stats?.totalInvites > 0)  && (<Typography variant="h6" sx={{ fontWeight: 600 }}>
            You've invited {formatNumber(stats?.totalInvites)} friends & earned
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
              width: 100,
              height: 100,
              padding: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // border: "1px solid transparent", // Set border width
              borderRadius: "50%",
              position: "relative",
              // Inset and outset shadow
              boxShadow: "inset 0px 0px 15px rgba(0, 0, 0, 0.3), 0px 4px 15px rgba(0, 0, 0, 0.2)",
              // Transparent border to allow gradient to show
              border: `10px solid ${theme.vars.palette.shades[300]}`,


            })]}
          >
            <Typography>💰{formatNumber(stats?.totalEarned ?? 0)}</Typography>
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
              sx={[(theme) => ({
                width: "100%",
                border: `2px solid ${theme.vars.palette.shades[500]}`,
                // background: "linear-gradient(135deg, #FE6B8B 30%, #FF8E53 90%)",
                color: theme.vars.palette.shades[700],
                borderRadius: "50px",
                fontWeight: "bold",
                padding: "5px 10px",
                fontSize: "14px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
                transition:
                  "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                "&:hover": {
                  background: theme.vars.palette.gradient.E900,
                  transition:
                    "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                  border: `2px solid ${theme.vars.palette.shades[500]}`, // Outline on hover
                  color: "#fff",
                  transform: "scale(1.05)",
                  boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",
                },
                "&:active": {
                  transform: "scale(1.02)",
                },
                ...theme.applyStyles("dark", {
                  color: theme.vars.palette.gradient.contrastText
                })
              })]}
              onClick={() => handleInviteClick()}
              startIcon={<ShareIcon />}
            >
              Invite Now
            </Button>

            {/* Copy Invite Link Button */}
            <IconButton
              sx={{
                background: theme =>  theme.vars.palette.gradient.E900,
                color: "#fff",
                borderRadius: "50%",
                padding: "12px",
                height: 50,
                width: 50,
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
                "&:hover": {
                  background: theme =>  theme.vars.palette.gradient.E900,
                },
              }}
              onClick={() => handleCopyClick()}
            >
              {state.isCopied ? <Check sx={{ fontSize: 24 }} />: <CopyIcon sx={{ fontSize: 24 }} />}
            </IconButton>
          </Stack>
          <Box>
          <Button
              variant="outlined"
              size="small"
              sx={[(theme) => ({
                width: "100%",
                border: `2px solid ${theme.vars.palette.shades[500]}`,
                // background: "linear-gradient(135deg, #FE6B8B 30%, #FF8E53 90%)",
                color: theme.vars.palette.shades[700],
                borderRadius: "50px",
                fontWeight: "bold",
                padding: "5px 10px",
                fontSize: "14px",
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
                transition:
                  "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                "&:hover": {
                  background: theme.vars.palette.gradient.E900,
                  transition:
                    "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
                  border: `2px solid ${theme.vars.palette.shades[500]}`, // Outline on hover
                  color: "#fff",
                  transform: "scale(1.05)",
                  boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",
                },
                "&:active": {
                  transform: "scale(1.02)",
                },
                ...theme.applyStyles("dark", {
                  color: theme.vars.palette.gradient.contrastText
                })
              })]}
              onClick={() => handleShareStoryClick()}
              startIcon={<IosShareOutlinedIcon />}
            >
              Share Story
            </Button>
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  );
};

export default GameInvite;
