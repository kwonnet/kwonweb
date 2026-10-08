"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import { Container, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeIcon from '@mui/icons-material/Home';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { usePathname } from "next/navigation";
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import ExploreIcon from '@mui/icons-material/Explore';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EmailIcon from '@mui/icons-material/Email';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';



const buttons = (pathname: string) => {
  const paths = { home: "/", shortz: "/shorts", videos: "/videos", games: "/games", tasks: "/tasks", profile: "/profile", invite: "/invite", people: "/people", explore: "/explore", contests: "/contests",}

  return  [
    {
      id: 1,
      title: "Home",
      icon: pathname === paths.home ? <HomeIcon /> : <HomeOutlinedIcon />,
      isSmallOnly: true,
      path: paths.home,
    },
    {
      id: 2,
      title: "Shortz",
      icon: pathname === paths.shortz ? <SlideshowIcon /> : <SlideshowOutlinedIcon />,
      isSmallOnly: false,
      path: paths.shortz,
    },
    {
      id: 3,
      title: "Games",
      icon: pathname === paths.games ? <SportsEsportsIcon /> : <SportsEsportsOutlinedIcon />,
      isSmallOnly: false,
      path: paths.games,
    },
    // {
    //   id: 4,
    //   title: "Videos",
    //   icon: pathname === paths.videos ? <OndemandVideoIcon /> : <OndemandVideoOutlinedIcon />,
    //   isSmallOnly: false,
    //   path: paths.videos,
    // },
    // {
    //   id: 5,
    //   title: "Contests",
    //   icon: pathname === paths.contests ? <EmojiEventsIcon /> : <EmojiEventsOutlinedIcon />,
    //   isSmallOnly: false,
    //   path: paths.contests,
    // },
    {
      id: 6,
      title: "Explore",
      icon: pathname === paths.explore ? <ExploreIcon /> : <ExploreOutlinedIcon />,
      isSmallOnly: false,
      path: paths.explore,
    },
    {
      id: 7,
      title: "Network",
      icon: pathname === paths.people ? <PeopleAltIcon /> : <PeopleAltOutlinedIcon />,
      isSmallOnly: false,
      path: paths.people,
    },
    {
      id: 8,
      title: "Invite",
      icon: <GroupAddOutlinedIcon />,
      isSmallOnly: false,
      path: "/invite",
    }
  ];
}

const AppBottomNav = () => {
  const pathname = usePathname();
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        sx={[
          (theme) => ({
            position: "fixed",
            bottom: 0,
            zIndex: 999,
            width: "100%",
            maxWidth: "100vw",
            borderTop: "1px solid grey",
            background: theme.vars.palette.tints[900],
            color: theme.vars.palette.gradient.contrastText,
            ...theme.applyStyles("dark", {
              background: theme.vars.palette.grey[900],
            }),
          }),
        ]}
      >
        {/* <Container maxWidth="xl"> */}
          <Stack
            sx={{
              justifyContent: "space-evenly",
              // alignItems: "center",
              width: "100%",
            }}
            direction={"row"}
          >
            {buttons(pathname).map((item) => (
              <Stack
                key={item.id}
                sx={[(theme) => (
                  {
                    alignItems: "center",
                    color: (theme) => theme.vars.palette.tints[200],
                    ...(pathname === item.path && {
                      // background: (theme) => theme.vars.palette.gradient.D900,
                      // color: (theme) => theme.vars.palette.common.white,
                      // boxShadow: 10,
                      // px: 2,
                      ...theme.applyStyles("dark", {
                        // background: theme.vars.palette.grey[800],
                      })
                    }),
                  }
                )]}
              >
                <IconButton
                  sx={[(theme) => ({
                    // boxShadow: 0,
                    // ...(pathname === item.path && {
                    //   boxShadow: 1,
                    //   ...theme.applyStyles("dark", {
                    //     background: theme.vars.palette.grey[800],
                    //   })
                    // }),
                  })]}
                  size={"large"}
                  LinkComponent={Link}
                  href={item.path}
                >
                  {item.icon}
                </IconButton>
                <Typography sx={[(theme) => ({ 
                  fontFamily: "PlayFair",
                  // fontSize: "8px",
                  ...(pathname === item.path && {  
                    color: theme.vars.palette.primary.main,                  
                    ...theme.applyStyles("dark", {
                      color: theme.vars.palette.primary.contrastText,
                    })
                  }),
                  })]} variant="caption">
                  {item.title}
                </Typography>
              </Stack>
            ))}
          </Stack>
        {/* </Container> */}
      </Box>
    </Box>
  );
};

export default AppBottomNav;
