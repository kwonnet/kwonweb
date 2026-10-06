// "use client";
// import * as React from "react";
// import Box from "@mui/material/Box";
// import {
//   Card,
//   CardContent,
//   Container,
//   Grid,
//   IconButton,
//   Paper,
//   Stack,
//   Tooltip,
//   Typography,
//   useColorScheme,
// } from "@mui/material";

// import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
// import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
// import StoreIcon from "@mui/icons-material/Store";
// import { Slide, Fade } from "react-awesome-reveal";
// import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
// import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
// import PlayersOutlinedIcon from "@mui/icons-material/GroupsOutlined";
// import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
// import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";

// import { useRouter } from "next/navigation";
// import BadgeAvatar from "@/components/common/BadgeAvatar";
// import GetVerified from "@/components/common/GetVerified";
// import JoinRoom from "@/components/common/JoinRoom";
// import Link from "next/link";
// import { WalletOutlined } from "@mui/icons-material";
// import { useAuthSession } from "@/hooks";
// import StickyBox from "react-sticky-box";

// // Card data with icons
// const cardItems = [
//   {
//     id: 1,
//     title: "Play Games",
//     url: "/games/categories",
//     icon: <SportsEsportsIcon fontSize="large" />,
//     delay: 400,
//     bg: "500",
//   },
//   {
//     id: 2,
//     title: "Wallet",
//     url: "/wallet",
//     icon: <AccountBalanceWalletIcon fontSize="large" />,
//     delay: 300,
//     bg: "200",
//   },
//   {
//     id: 3,
//     title: "Winners",
//     url: "/games/winners",
//     icon: <PlayersOutlinedIcon fontSize="large" />,
//     delay: 200,
//     bg: "200",
//   },
//   {
//     id: 4,
//     title: "Rankings",
//     url: "/games/leaderboard",
//     icon: <LeaderboardOutlinedIcon fontSize="large" />,
//     delay: 100,
//     bg: "400",
//   },
//   {
//     id: 5,
//     title: "Daily Bonus",
//     url: "/games/reward",
//     icon: <RedeemOutlinedIcon fontSize="large" />,
//     delay: 100,
//     bg: "700",
//   },
//   {
//     id: 6,
//     title: "Tasks",
//     url: "/games/tasks",
//     icon: <TaskAltOutlinedIcon />,
//     delay: 200,
//     bg: "200",
//   },
//   {
//     id: 7,
//     title: "Store",
//     url: "/store",
//     icon: <StoreIcon fontSize="large" />,
//     delay: 200,
//     bg: "200",
//   },
//   {
//     id: 8,
//     title: "Invite",
//     url: "/invite",
//     icon: <GroupAddOutlinedIcon />,
//     delay: 200,
//     bg: "200",
//   },
// ];

// const PageClient = () => {
//   const { mode, systemMode, setMode } = useColorScheme();
//   const toggleDarkTheme = React.useCallback(() => {
//     if (mode) {
//       const currMode = mode === "dark" ? "light" : "dark";
//       setMode(currMode);
//     }
//   }, [mode, setMode]);

//   const { user } = useAuthSession();

//   const router = useRouter();

//   const handleClick = async (
//     ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
//     url: string
//   ) => {
//     ev.preventDefault();
//     ev.stopPropagation();
//     router.push(url);
//   };

//   return (
//     <React.Fragment>
//       {/* Home Top */}
//       <StickyBox style={{ zIndex: 999 }}>
//         <Container
//           maxWidth="xl"
//           sx={[
//             (theme) => ({
//               background: theme.vars.palette.AppBar.defaultBg,
//               ...theme.applyStyles("dark", {
//                 background: theme.vars.palette.AppBar.darkBg,
//               })
//             }),
//           ]}
//         >
//           <Box sx={{ py: 2 }}>
//             <Stack
//               direction={"row"}
//               sx={{ justifyContent: "space-between", alignItems: "center" }}
//             >
//               <Box>
//                 <BadgeAvatar
//                   src={user.image}
//                   alt={user.name}
//                   height={"50px"}
//                   width={"50px"}
//                   title={user.username}
//                 />
//               </Box>
//               <Stack direction={"row"} spacing={1}>
//                 <Box>
//                   <Fade triggerOnce={true} delay={100} direction="left">
//                     <Tooltip title="My Wallet">
//                       <IconButton
//                         size="small"
//                         disableRipple
//                         sx={{
//                           // backgroundColor: "rgba(255, 255, 255, 0.1)",
//                           // color: (theme) =>
//                           //   theme.vars.palette.gradient.contrastText,
//                           padding: 1,
//                           marginBottom: 0,
//                           "&:hover": {
//                             // backgroundColor: "rgba(255, 255, 255, 0.2)",
//                           },
//                         }}
//                         LinkComponent={Link}
//                         href="/wallet"
//                       >
//                         <WalletOutlined />
//                       </IconButton>
//                     </Tooltip>
//                   </Fade>
//                 </Box>
//                 <Box>
//                   <Fade triggerOnce={true} delay={120} direction="right">
//                     <Tooltip title="Buy Coins">
//                       <IconButton
//                         size="small"
//                         disableRipple
//                         sx={{
//                           // backgroundColor: "rgba(255, 255, 255, 0.1)",
//                           // color: (theme) =>
//                           //   theme.vars.palette.gradient.contrastText,
//                           padding: 1,
//                           marginBottom: 0,
//                           "&:hover": {
//                             // backgroundColor: "rgba(255, 255, 255, 0.2)",
//                           },
//                         }}
//                         LinkComponent={Link}
//                         href="/store"
//                       >
//                         <StoreIcon />
//                       </IconButton>
//                     </Tooltip>
//                   </Fade>
//                 </Box>
//                 <Box sx={{}}>
//                   <Slide triggerOnce={true} delay={500}>
//                     <Tooltip title="Toggle theme">
//                       <IconButton
//                         size="large"
//                         aria-label="toggle theme"
//                         aria-controls="menu-appbar"
//                         aria-haspopup="true"
//                         onClick={() => toggleDarkTheme()}
//                         color="inherit"
//                         disableRipple
//                         sx={{
//                           // backgroundColor: "rgba(255, 255, 255, 0.1)",
//                           // color: (theme) =>
//                           //   theme.vars.palette.gradient.contrastText,
//                           padding: 1,
//                           marginBottom: 0,
//                           "&:hover": {
//                             // backgroundColor: "rgba(255, 255, 255, 0.2)",
//                           },
//                         }}
//                       >
//                         {!mode ? null : mode === "dark" ? (
//                           <DarkModeOutlinedIcon />
//                         ) : (
//                           <LightModeOutlinedIcon
//                             sx={
//                               {
//                                 // color: (theme) => theme.vars.palette.common.white,
//                               }
//                             }
//                           />
//                         )}
//                       </IconButton>
//                     </Tooltip>
//                   </Slide>
//                 </Box>
//               </Stack>
//             </Stack>
//           </Box>
//         </Container>
//       </StickyBox>
//       <Box sx={{ pb: 0, overflow: "auto", marginTop: 2, mb: 8 }}>
//         {/* End Home Top */}
//           <Container
//             maxWidth="xl"
//             sx={{
//               width: "100%",
//             }}
//           >
//             <Box>
//               <Grid container spacing={1}>
//                 {cardItems.map((item, index) => (
//                   <React.Fragment key={index}>
//                     {/* Join room section */}
//                     {/* {index === 2 && (
//                     <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
//                       <Fade triggerOnce={true} direction="right">
//                         <JoinRoom />
//                       </Fade>
//                     </Grid>
//                   )} */}
//                     {/*Get verified section */}
//                     {/* {index === 4 && (
//                     <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
//                       <Fade triggerOnce={true} direction="left">
//                         <GetVerified />
//                       </Fade>
//                     </Grid>
//                   )} */}
//                     <Grid size={{ lg: 3, md: 3, sm: 6, xs: 6 }} key={item.id}>
//                       <Slide direction="down" delay={item.delay}>
//                         <Card
//                           raised
//                           onClick={(ev) => handleClick(ev, item.url)}
//                           sx={[
//                             (theme) => ({
//                               // background:
//                               //   theme.vars.palette.gradient[
//                               //     item.bg as keyof typeof theme.vars.palette.gradient
//                               //   ],
//                               // color: theme.vars.palette.gradient.contrastText,
//                               boxShadow:
//                                 "4px 4px 10px rgba(0, 0, 0, 0.2), -4px -4px 10px rgba(3, 29, 55, 0.1)",
//                               borderRadius: 2,
//                               overflow: "hidden",
//                               position: "relative",
//                               height: "150px",
//                               display: "flex",
//                               flexDirection: "column",
//                               alignItems: "center",
//                               justifyContent: "center",
//                               cursor: "pointer",
//                               textDecoration: "none",
//                               ...theme.applyStyles("dark", {
//                                 background: theme.vars.palette.grey[900],
//                               }),
//                             }),
//                           ]}
//                         >
//                           <Box
//                             sx={[
//                               (theme) => ({
//                                 position: "absolute",
//                                 top: -20,
//                                 right: -20,
//                                 width: 100,
//                                 height: 100,
//                                 borderRadius: "50%",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 background: "rgba(0, 0, 0, 0.05)",
//                                 color: "rgba(0, 0, 0, 0.1)",
//                                 ...theme.applyStyles("dark", {
//                                   background: "rgba(0, 0, 0, 0.15)",
//                                   color: theme.vars.palette.grey[800],
//                                 }),
//                               }),
//                             ]}
//                           >
//                             {item.icon}
//                           </Box>
//                           <CardContent>
//                             <Typography
//                               sx={{ fontFamily: "PlayFair" }}
//                               variant="h6"
//                               align="center"
//                             >
//                               {item.title}
//                             </Typography>
//                           </CardContent>
//                         </Card>
//                       </Slide>
//                     </Grid>
//                   </React.Fragment>
//                 ))}
//                 {/* <Grid size={{ lg: 12, md: 12, sm: 12, xs: 12 }}>
//                   <Fade triggerOnce={true} direction="left">
//                     <GetVerified />
//                   </Fade>
//                 </Grid> */}
//               </Grid>
//             </Box>
//           </Container>
//       </Box>
//     </React.Fragment>
//   );
// };

// export default PageClient;



"use client";
import PageHeader from "@/components/common/PageHeader";
import { Game } from "@/types";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

import { Slide, Fade } from "react-awesome-reveal";
import RedeemOutlinedIcon from "@mui/icons-material/RedeemOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import PlayersOutlinedIcon from "@mui/icons-material/GroupsOutlined";


// Card data with icons
const cardItems = [
  {
    id: 3,
    title: "Winners",
    url: "/games/winners",
    icon: <PlayersOutlinedIcon fontSize="large" />,
    delay: 200,
    bg: "200",
  },
  {
    id: 4,
    title: "Rankings",
    url: "/games/leaderboard",
    icon: <LeaderboardOutlinedIcon fontSize="large" />,
    delay: 100,
    bg: "400",
  },
  {
    id: 5,
    title: "Daily Bonus",
    url: "/games/reward",
    icon: <RedeemOutlinedIcon fontSize="large" />,
    delay: 100,
    bg: "700",
  },

];

const GameCard = ({ game }: { game: Game }) => {
  const router = useRouter()
  const handleClick = () => {
    router.push(`/games/${game.id}?g_n=${game.name}`)
  }

  return (
    <Card
      onClick={() => handleClick()}
      raised
      sx={[
        (theme) => ({
          p: 1,
          mb: 1,
          cursor: "pointer",
          height: "100%",
          // background: theme.vars.palette.gradient[700],
          // color: theme.vars.palette.gradient.contrastText,
          ...theme.applyStyles("dark", {
            background: theme.vars.palette.grey[900],
          }),
        }),
      ]}
    >

      <CardContent>
        <Typography
          sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
          variant="h6"
        >
          {game.name}
        </Typography>
        <Typography
          sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
          variant="caption"
        >
          {game.description}
        </Typography>
      </CardContent>
    </Card>
  );
};
const PageClient = ({ games }: { games: Game[] }) => {
  const router = useRouter();
  const handleClick = async (
    ev: React.MouseEvent<HTMLDivElement, MouseEvent>,
    url: string
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    router.push(url);
  };
  return (
    <Box>
      <Container maxWidth="xl">
        <Fade cascade>
          <Grid container spacing={2}>
            {games.map((game) => (
              <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }} key={game.id}>
                <GameCard game={game} />
              </Grid>
            ))}
          </Grid>
        </Fade>

        <Box>
          <Grid container spacing={1} sx={{ mt: 2 }}>
            {cardItems.map((item, index) => (
              <React.Fragment key={index}>
                <Grid size={{ lg: 4, md: 4, sm: 12, xs: 12 }} key={item.id}>
                    <Card
                      raised
                      onClick={(ev) => handleClick(ev, item.url)}
                      sx={[
                        (theme) => ({

                          boxShadow:
                            "4px 4px 10px rgba(0, 0, 0, 0.2), -4px -4px 10px rgba(3, 29, 55, 0.1)",
                          borderRadius: 2,
                          overflow: "hidden",
                          position: "relative",
                          height: "150px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          textDecoration: "none",
                          ...theme.applyStyles("dark", {
                            background: theme.vars.palette.grey[900],
                          }),
                        }),
                      ]}
                    >
                      <Box
                        sx={[
                          (theme) => ({
                            position: "absolute",
                            top: -20,
                            right: -20,
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(0, 0, 0, 0.05)",
                            color: "rgba(0, 0, 0, 0.1)",
                            ...theme.applyStyles("dark", {
                              background: "rgba(0, 0, 0, 0.15)",
                              color: theme.vars.palette.grey[800],
                            }),
                          }),
                        ]}
                      >
                        {item.icon}
                      </Box>
                      <CardContent>
                        <Typography
                          sx={{ fontFamily: "PlayFair" }}
                          variant="h6"
                          align="center"
                        >
                          {item.title}
                        </Typography>
                      </CardContent>
                    </Card>
                </Grid>
              </React.Fragment>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
