// 'use client'
import React from "react";
import { NextAppProvider } from "@toolpad/core/nextjs";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import { type Navigation } from "@toolpad/core";
import { signIn, signOut } from "next-auth/react";
import { constant } from "@/config";
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined';
import type {} from '@mui/material/themeCssVarsAugmentation';
import { CardMedia, createTheme } from "@mui/material";
import OfflineBoltOutlinedIcon from '@mui/icons-material/OfflineBoltOutlined';
import SmartDisplayOutlinedIcon from '@mui/icons-material/SmartDisplayOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import BookmarksOutlinedIcon from '@mui/icons-material/BookmarksOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import StreamOutlinedIcon from '@mui/icons-material/StreamOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Groups3OutlinedIcon from '@mui/icons-material/Groups3Outlined';
import OutlinedFlagOutlinedIcon from '@mui/icons-material/OutlinedFlagOutlined';
import LiveTvOutlinedIcon from '@mui/icons-material/LiveTvOutlined';
import DynamicFeedOutlinedIcon from '@mui/icons-material/DynamicFeedOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PersonPinCircleOutlinedIcon from '@mui/icons-material/PersonPinCircleOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import ShopOutlinedIcon from '@mui/icons-material/ShopOutlined';
import PermIdentityOutlinedIcon from '@mui/icons-material/PermIdentityOutlined';
import ExpandCircleDownOutlinedIcon from '@mui/icons-material/ExpandCircleDownOutlined';
import WalletOutlinedIcon from '@mui/icons-material/WalletOutlined';
import Person3OutlinedIcon from '@mui/icons-material/Person3Outlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { CustomThemeSwitcher } from "@/components/common";
import { Session } from "next-auth";
import theme from "./theme";


export const NAVIGATION: Navigation = [
    {
      title: "Home",
      icon: <HomeOutlinedIcon />,
    },
    // {
    //   segment: "sparks",
    //   title: "Sparks",
    //   icon: <OfflineBoltOutlinedIcon />,
    // },
    // {
    //   segment: "videos",
    //   title: "Videos",
    //   icon: <SmartDisplayOutlinedIcon />,
    // },
    // {
    //   segment: "music",
    //   title: "Music",
    //   icon: <MusicNoteOutlinedIcon />,
    // },
    {
      segment: "games",
      title: "Games",
      icon: <SportsEsportsOutlinedIcon />,
    },
    {
      segment: "discover",
      title: "Discover",
      icon: <ExploreOutlinedIcon />,
    },
    // {
    //   segment: "live",
    //   title: "Live",
    //   icon: <LiveTvOutlinedIcon />,
    // },
    
    {
      segment: "people",
      title: "People",
      icon: <GroupAddOutlinedIcon />,
    },
    // {
    //   segment: "contests",
    //   title: "Contest",
    //   icon: <EmojiEventsOutlinedIcon />,
    // },
    {
      segment: "store",
      title: "Store",
      icon: <LocalMallOutlinedIcon />,
    },
    {
      segment: "premium",
      title: "Premium",
      icon: <VerifiedOutlinedIcon />,
    },
    {
      segment: "advertise",
      title: "Advertise",
      icon: <CampaignOutlinedIcon />,
    },
    // {
    //   segment: 'more',
    //   title: 'See More',
    //   icon: <ExpandCircleDownOutlinedIcon />,
    //   children: [
    //     {
    //       segment: "feeds",
    //       title: "Feeds",
    //       icon: <FeedOutlinedIcon />,
    //     },
    //     {
    //       segment: "books",
    //       title: "Books",
    //       icon: <MenuBookOutlinedIcon />,
    //     },
        
    //     {
    //       segment: "articles",
    //       title: "Articles",
    //       icon: <ArticleOutlinedIcon />,
    //     },
    //     {
    //       segment: "marketplace",
    //       title: "Market",
    //       icon: <ShopOutlinedIcon />,
    //     },
    //     {
    //       segment: "groups",
    //       title: "Groups",
    //       icon: <Groups3OutlinedIcon />,
    //     },
    //     {
    //       segment: "pages",
    //       title: "Pages",
    //       icon: <OutlinedFlagOutlinedIcon />,
    //     },
        
    //     {
    //       segment: "events",
    //       title: "Events",
    //       icon: <EventAvailableOutlinedIcon />,
    //     },
    //     {
    //       segment: "survey",
    //       title: "Paid Survey",
    //       icon: <PaidOutlinedIcon />,
    //     },
    //     {
    //       segment: "influencers",
    //       title: "Influencers",
    //       icon: <PersonPinCircleOutlinedIcon />,
    //     },
    //     {
    //       segment: "celebrities",
    //       title: "Celebrities",
    //       icon: <PersonSearchOutlinedIcon />,
    //     },
    //     {
    //       segment: "help",
    //       title: "Help",
    //       icon: <HelpOutlineOutlinedIcon />,
    //     },
    //     {
    //       segment: "feedback",
    //       title: "Feedback",
    //       icon: <FeedbackOutlinedIcon />,
    //     },
    //   ]
    // },
    
    {
      segment: 'account',
      title: 'My Account',
      icon: <AccountCircleOutlinedIcon />,
      children: [
        {
          segment: 'profiles',
          title: 'Profiles',
          icon: <PermIdentityOutlinedIcon />,
        },
        {
          segment: 'followers',
          title: 'Followers',
          icon: <PeopleAltOutlinedIcon />,
        },
        {
          segment: 'followings',
          title: 'Followings',
          icon: <PeopleOutlinedIcon />,
        },
        {
          segment: 'friends',
          title: 'Friends',
          icon: <GroupOutlinedIcon />,
        },
        {
          segment: "wallet",
          title: "Wallet",
          icon: <WalletOutlinedIcon />,
        },
        {
          segment: 'bookmarks',
          title: 'Bookmarks',
          icon: <BookmarksOutlinedIcon />,
        },
        {
          segment: 'favourites',
          title: 'Favourites',
          icon: <FavoriteBorderOutlinedIcon />,
        },
        {
          segment: 'visitors',
          title: 'Visitors',
          icon: <VisibilityOutlinedIcon />,
        },
        {
          segment: 'activity',
          title: 'Activity',
          icon: <HistoryOutlinedIcon />,
        },
        {
          segment: 'history',
          title: 'History',
          icon: <UpdateOutlinedIcon />,
        },
        {
          segment: 'analytics',
          title: 'Analytics',
          icon: <InsightsOutlinedIcon />,
        },
        {
          segment: 'monetize',
          title: 'Monetize',
          icon: <MonetizationOnOutlinedIcon />,
        },
  
      ],
    },
    {
      segment: "settings",
      title: "Settings",
      icon: <SettingsOutlinedIcon />,
    },
    {
      kind: "divider",
    },
    {
      segment: "#",
      title: "",
      icon: <CustomThemeSwitcher />,
    },
  ];
  
  
  
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