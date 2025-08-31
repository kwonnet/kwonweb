"use client";
import React, { useEffect, useState } from "react";
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
import { PageHeader } from "@/components/common";
// import { init, shareStory, shareURL } from '@telegram-apps/sdk';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
// import { useAuthContext } from "@/context/AuthContext";
import { useUserStats } from "@/lib/swrHooks";
import { useAuthSession } from "@/hooks";

const getText = (total: number, amount: number) => {

   return `You've invited ${formatNumber(total)} ${total === 1 ? " friend " : " friends "} & earned 🎁 ${formatNumber(amount)} coins`
}

const InviteClient = () => {

  const [isLoading, setIsLoading] = useState(false);

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
    <Container maxWidth="xl">
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
          {(stats && stats?.totalInvites > 0)  && (<Typography variant="h6" sx={{ fontWeight: 600 }}>
            {getText(stats?.totalInvites, stats?.totalEarned ?? 0)}
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
            <Typography>🎁{formatNumber(stats?.totalEarned ?? 0)}</Typography>
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
            <IconButton
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












// "use client";
// import React, { useState } from "react";
// import {
//   Button,
//   Box,
//   Typography,
//   IconButton,
//   Card,
//   CardContent,
//   Stack,
//   CircularProgress,
//   Divider,
//   Container,
// } from "@mui/material";
// import {
//   Check,
//   CopyAll as CopyIcon,
//   Share as ShareIcon,
// } from "@mui/icons-material";
// import { toast } from "react-toastify";
// import { getInviteLink } from "@/utils";
// import Reveal, { Bounce, Fade, Slide } from "react-awesome-reveal";
// import { PageHeader } from "@/components/common";

// const InviteClient = () => {
//   const currentUserId = "1234567890"; // Replace with the actual user ID from the user's profile
//   const [isLoading, setIsLoading] = useState(false);
//   const [state, setState] = useState({ isCopied: false });
//   const inviteLink = getInviteLink(currentUserId.slice(-10));
//   // const inviteLink = process.env.NEXT_PUBLIC_BASE_URL + `/auth/?r_c=${currentUserId.slice(-10)}`; // Example invite link

//   const handleCopyClick = async () => {
//     setState((prev) => ({ ...prev, isCopied: true }));
//     await navigator.clipboard.writeText(inviteLink);
//     toast.info("Link copied to clipboard!");
//     setTimeout(() => {
//       setState((prev) => ({ ...prev, isCopied: false }));
//     }, 700);
//   };

//   const handleInviteClick = async () => {
//     // Handle the invite action logic (e.g., sharing, sending invites, etc.)
//     await navigator.share({
//       url: inviteLink,
//       text: "Join me to play Torazone game and win amazing cash prizes 🎁. Don't miss out. Play, learn & earn!",
//     });
//     // toast.info("Invite sent!");
//   };

//   return (
//     <Container maxWidth="xl">
//       <PageHeader title="Invite Friends & Earn" />
//       <Box sx={{ p: 2, position: "relative" }}>
//         <Box
//           sx={{
//             fontWeight: 600,
//             textAlign: "center",
//             alignItems: "center",
//             display: "flex",
//             gap: 1,
//           }}
//         >
//           <Stack direction={"row"} sx={{alignItems: "center"}}>
//           <Slide direction="right">
//             <ShareIcon sx={{ fontSize: 20, color: "#fff" }} />
//           </Slide>
//           <Slide direction="up">
//             <Typography variant="body1">
//               Invite your friends & family & earn coins rewards
//             </Typography>
//           </Slide>
//           </Stack>
//         </Box>
//         <Slide direction="down">
//           <Typography variant="body2" sx={{ pt: 1, fontFamily: "PlayFair" }}>
//             Share your invite link with friends and earn rewards to boost your
//             game!
//           </Typography>
//         </Slide>
//         {/* Invite Stats */}
//         <Box
//           sx={{
//             mt: 4,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             gap: 2,
//           }}
//         >
//           <Fade direction="bottom-right">
//             <Typography variant="h6" sx={{ fontWeight: 600 }}>
//               You've invited {20} friends & earned
//             </Typography>
//           </Fade>
//         </Box>
//         <Fade direction="top-right">
//           <Box
//             sx={{
//               display: "flex",
//               alignItems: "center",
//               flexDirection: "column",
//               gap: 2,
//               position: "relative",
//             }}
//           >
//             <Box
//               sx={{
//                 width: 150,
//                 height: 150,
//                 padding: 3,
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 // border: "1px solid transparent", // Set border width
//                 borderRadius: "50%",
//                 position: "relative",
//                 // Inset and outset shadow
//                 boxShadow:
//                   "inset 0px 0px 15px rgba(0, 0, 0, 0.3), 0px 4px 15px rgba(0, 0, 0, 0.2)",
//                 // Transparent border to allow gradient to show
//                 border: (theme) =>
//                   `10px double ${theme.vars.palette.tints[500]}`,
//               }}
//             >
//               <Fade direction="bottom-left" delay={500}>
//                 <Typography>💰{200}</Typography>
//               </Fade>
//             </Box>
//           </Box>
//         </Fade>

//         {/* Buttons */}
//         <Box
//           sx={{
//             display: "flex",
//             flexDirection: "column",
//             gap: 2,
//             mt: 3,
//             alignItems: "center",
//           }}
//         >
//           <Stack spacing={2} direction={"row"}>
//             {/* Invite Button */}
//             <Fade direction="left">
//               <Button
//                 variant="outlined"
//                 sx={{
//                   width: "100%",
//                   border: (theme) =>
//                     `2px solid ${theme.vars.palette.tints[300]}`,
//                   color: (theme) => `${theme.vars.palette.tints[300]}`,
//                   borderRadius: "50px",
//                   fontWeight: "bold",
//                   padding: "10px 20px",
//                   fontSize: "16px",
//                   boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)",
//                   transition:
//                     "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
//                   "&:hover": {
//                     background: (theme) => theme.vars.palette.gradient[100],
//                     transition:
//                       "transform 2s ease, box-shadow 1s ease, background 1s ease, border-color 1.2s ease",
//                     border: (theme) =>
//                       `2px solid ${theme.vars.palette.shades[300]}`, // Outline on hover
//                     color: "#fff",
//                     transform: "scale(1.05)",
//                     boxShadow: "0px 8px 12px rgba(0, 0, 0, 0.3)",
//                   },
//                   "&:active": {
//                     transform: "scale(1.02)",
//                   },
//                 }}
//                 onClick={handleInviteClick}
//                 startIcon={<ShareIcon />}
//               >
//                 Invite Now
//               </Button>
//             </Fade>

//             {/* Copy Invite Link Button */}
//             <Fade direction="right">
//               <IconButton
//                 sx={{
//                   background: (theme) =>
//                     `linear-gradient(135deg, ${theme.vars.palette.shades[500]} 30%, ${theme.vars.palette.tints[200]} 90%)`,
//                   color: "#fff",
//                   borderRadius: "50%",
//                   padding: "12px",
//                   height: 50,
//                   width: 50,
//                   boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.9)",
//                   "&:hover": {
//                     background: (theme) =>
//                       `linear-gradient(135deg, ${theme.vars.palette.tints[200]}  30%, ${theme.vars.palette.shades[400]} 90%)`,
//                   },
//                 }}
//                 onClick={() => handleCopyClick()}
//               >
//                 {state.isCopied ? (
//                   <Check sx={{ fontSize: 24 }} />
//                 ) : (
//                   <CopyIcon sx={{ fontSize: 24 }} />
//                 )}
//               </IconButton>
//             </Fade>
//           </Stack>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default InviteClient;
