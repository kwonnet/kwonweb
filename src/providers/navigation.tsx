// 'use client'
import React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import { type Navigation } from "@toolpad/core";
import { signIn, signOut } from "next-auth/react";
import { constant } from "@/config";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AdsClickOutlinedIcon from "@mui/icons-material/AdsClickOutlined";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { CardMedia, createTheme } from "@mui/material";
import OfflineBoltOutlinedIcon from "@mui/icons-material/OfflineBoltOutlined";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import BookmarksOutlinedIcon from "@mui/icons-material/BookmarksOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import StreamOutlinedIcon from "@mui/icons-material/StreamOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import Groups3OutlinedIcon from "@mui/icons-material/Groups3Outlined";
import OutlinedFlagOutlinedIcon from "@mui/icons-material/OutlinedFlagOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import PersonPinCircleOutlinedIcon from "@mui/icons-material/PersonPinCircleOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import FeedbackOutlinedIcon from "@mui/icons-material/FeedbackOutlined";
import FeedOutlinedIcon from "@mui/icons-material/FeedOutlined";
import ShopOutlinedIcon from "@mui/icons-material/ShopOutlined";
import PermIdentityOutlinedIcon from "@mui/icons-material/PermIdentityOutlined";
import ExpandCircleDownOutlinedIcon from "@mui/icons-material/ExpandCircleDownOutlined";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import Person3OutlinedIcon from "@mui/icons-material/Person3Outlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CustomThemeSwitcher from "@/components/common/CustomThemeSwitcher";
import { Session } from "next-auth";
import theme from "./theme";
import PsychologyOutlinedIcon from "@mui/icons-material/PsychologyOutlined";
import EarnIcon from "@mui/icons-material/AttachMoneyOutlined";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import InterpreterModeOutlinedIcon from "@mui/icons-material/InterpreterModeOutlined";
// import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';

export const getNavigationItems = (user?: Session["user"]) => {
  const navItems: Navigation = [
    {
      title: "Home",
      icon: <HomeOutlinedIcon key={1} />,
      segment: "",
    },
    // {
    //   segment: "sparks",
    //   title: "Sparks",
    //   icon: <OfflineBoltOutlinedIcon key={2} />,
    // },
    {
      segment: "games",
      title: "Games",
      icon: <SportsEsportsOutlinedIcon key={3} />,
    },
    {
      segment: "discover",
      title: "Discover",
      icon: <ExploreOutlinedIcon key={4} />,
    },
    {
      segment: "store",
      title: "Store",
      icon: <LocalMallOutlinedIcon key={101} />,
    },
    {
      segment: "wallet",
      title: "Wallet",
      icon: <WalletOutlinedIcon key={18} />,
    },
    {
      segment: "connections",
      title: "Connect",
      icon: <GroupAddOutlinedIcon key={100} />,
    },

    // {
    //   segment: "live",
    //   title: "Live",
    //   icon: <LiveTvOutlinedIcon key={5} />,
    // },
    // {
    //   segment: "swem",
    //   title: "Swem",
    //   icon: <PsychologyOutlinedIcon key={6} />,
    // },
    // {
    //   segment: "netwaves",
    //   title: "Netwaves",
    //   icon: <WavingHandIcon key={78} />,
    // },
    // {
    //   segment: "contests",
    //   title: "Contest",
    //   icon: <EmojiEventsOutlinedIcon key={79} />,
    // },
    // {
    //   segment: "spotlight",
    //   title: "Spotlight",
    //   icon: <EmojiEventsOutlinedIcon key={79} />,
    // },
    // {
    //   segment: "spheres",
    //   title: "Spheres",
    //   icon: <InterpreterModeOutlinedIcon key={80} />,
    // },

    // {
    //   segment: "premium",
    //   title: "Premium",
    //   icon: <VerifiedOutlinedIcon key={9} />,
    // },
    // {
    //   segment: "advertise",
    //   title: "Advertise",
    //   icon: <CampaignOutlinedIcon key={10} />,
    // },
    {
      segment: "invite",
      title: "Invite",
      icon: <PersonAddAltOutlinedIcon key={170} />,
    },
    // {
    //   segment: "earn",
    //   title: "Earn",
    //   icon: <EarnIcon key={81} />,
    // },
    
    {
      segment: `@${user?.username}/network/followers`,
      title: "My Network",
      icon: <PeopleAltOutlinedIcon key={102} />,
    },
    {
      segment: `@${user?.username}`,
      title: "My Profile",
      icon: <PermIdentityOutlinedIcon key={13} />,
    },
    {
      segment: "settings",
      title: "Settings",
      icon: <SettingsOutlinedIcon key={11} />,
    },
    // {
    //   segment: "",
    //   title: "See More",
    //   icon: <ExpandCircleDownOutlinedIcon key={90} />,
    //   children: [
    //     {
    //       segment: "store",
    //       title: "Store",
    //       icon: <LocalMallOutlinedIcon key={8} />,
    //     },
    //     // {
    //     //   segment: "advertise",
    //     //   title: "Advertise",
    //     //   icon: <CampaignOutlinedIcon key={10} />,
    //     // },
    //     {
    //       segment: "connections",
    //       title: "Connect",
    //       icon: <GroupAddOutlinedIcon key={91} />,
    //     },
    //     {
    //       segment: "spheres",
    //       title: "Spheres",
    //       icon: <InterpreterModeOutlinedIcon key={92} />,
    //     },
    //     {
    //       segment: "videos",
    //       title: "Videos",
    //       icon: <SmartDisplayOutlinedIcon key={93} />,
    //     },
    //     {
    //       segment: "music",
    //       title: "Music",
    //       icon: <MusicNoteOutlinedIcon key={94} />,
    //     },
    //     {
    //       segment: "books",
    //       title: "Books",
    //       icon: <MenuBookOutlinedIcon key={95} />,
    //     },

    //     {
    //       segment: "articles",
    //       title: "Articles",
    //       icon: <ArticleOutlinedIcon key={96} />,
    //     },
    //     {
    //       segment: "shop",
    //       title: "Shop",
    //       icon: <ShopOutlinedIcon key={97} />,
    //     },
    //     {
    //       segment: "circles",
    //       title: "Circles",
    //       icon: <Groups3OutlinedIcon key={98} />,
    //     },
    //     {
    //       segment: "pages",
    //       title: "Pages",
    //       icon: <OutlinedFlagOutlinedIcon key={99} />,
    //     },

    //     {
    //       segment: "events",
    //       title: "Events",
    //       icon: <EventAvailableOutlinedIcon key={100} />,
    //     },
    //     {
    //       segment: "influencers",
    //       title: "Influencers",
    //       icon: <PersonPinCircleOutlinedIcon key={101} />,
    //     },
    //     {
    //       segment: "celebrities",
    //       title: "Celebrities",
    //       icon: <PersonSearchOutlinedIcon key={102} />,
    //     },
    //     {
    //       segment: "help",
    //       title: "Help",
    //       icon: <HelpOutlineOutlinedIcon key={103} />,
    //     },
    //     {
    //       segment: "feedback",
    //       title: "Feedback",
    //       icon: <FeedbackOutlinedIcon key={104} />,
    //     },
    //   ],
    // },
    // {
    //   segment: "",
    //   title: "My Account",
    //   icon: <AccountCircleOutlinedIcon key={12} />,
    //   children: [
    //     {
    //       segment: `@${user?.username}`,
    //       title: "My Profile",
    //       icon: <PermIdentityOutlinedIcon key={13} />,
    //     },
    //     {
    //       segment: `@${user?.username}/network/followers`,
    //       title: "My Network",
    //       icon: <PeopleAltOutlinedIcon key={14} />,
    //     },
    //     {
    //       segment: `bookings`,
    //       title: "Bookings",
    //       icon: <GroupOutlinedIcon key={14} />,
    //     },
    //     {
    //       segment: "wallet",
    //       title: "Wallet",
    //       icon: <WalletOutlinedIcon key={18} />,
    //     },
    //     {
    //       segment: "invite",
    //       title: "Invite",
    //       icon: <GroupAddOutlinedIcon key={17} />,
    //     },
    //     {
    //       segment: "visitors",
    //       title: "Visitors",
    //       icon: <VisibilityOutlinedIcon key={20} />,
    //     },
    //     {
    //       segment: "activity",
    //       title: "Activity",
    //       icon: <HistoryOutlinedIcon key={21} />,
    //     },
    //     {
    //       segment: "history",
    //       title: "History",
    //       icon: <UpdateOutlinedIcon key={22} />,
    //     },
    //     {
    //       segment: "analytics",
    //       title: "Analytics",
    //       icon: <InsightsOutlinedIcon key={23} />,
    //     },
    //     {
    //       segment: "monetize",
    //       title: "Monetize",
    //       icon: <MonetizationOnOutlinedIcon key={24} />,
    //     },
    //     // {
    //     //   segment: "settings",
    //     //   title: "Settings",
    //     //   icon: <SettingsOutlinedIcon key={11} />,
    //     // },
    //   ],
    // },
    {
      kind: "divider",
    },
    {
      segment: "#",
      title: "",
      icon: <CustomThemeSwitcher key={25} />,
    },
  ];
  return navItems;
};

// Dashboard
// Games
// Discover
// People
// Messages
// Contest
// Market
// Sparks
// Videos
// Music
// Live
// Survey
// Premium
// Advertise
// Settings
// Bookmarks
// Favourites
// Monetize
// Activity
// Followers
// Following
// Visitors
// Analytics
// History

// Shop
// Trending
// Store
// Books
