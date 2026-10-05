import React from "react";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PermIdentityOutlinedIcon from "@mui/icons-material/PermIdentityOutlined";
import WalletOutlinedIcon from "@mui/icons-material/WalletOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CustomThemeSwitcher from "@/components/common/CustomThemeSwitcher";
import { Session } from "next-auth";
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';

export const getNavigationItems = (user?: Session["user"]) => {
  const navItems: Array<{ kind: "divider" } | { kind?: "page"; segment: string; title: string; icon: React.ReactNode }> = [
    {
      title: "Home",
      icon: <HomeOutlinedIcon key={1} />,
      segment: "",
    },
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
      segment: "tasks",
      title: "Tasks",
      icon: <TaskAltOutlinedIcon key={180} />,
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


    {
      segment: "invite",
      title: "Invite",
      icon: <PersonAddAltOutlinedIcon key={170} />,
    },

    {
      segment: user?.username ? `@${user.username}/network/followers` : "?auth=signin&intent=network",
      title: "My Network",
      icon: <PeopleAltOutlinedIcon key={102} />,
    },
    {
      segment: user?.username ? `@${user.username}` : "?auth=signin&intent=profile",
      title: "My Profile",
      icon: <PermIdentityOutlinedIcon key={13} />,
    },
    {
      segment: "settings",
      title: "Settings",
      icon: <SettingsOutlinedIcon key={11} />,
    },


    {
      kind: "divider",
    },
    {
      segment: "#",
      title: "",
      icon: <CustomThemeSwitcher key={25} />,
    },
  ];
  return navItems.filter(item => item.kind === "divider" || !item.segment.startsWith("@") || Boolean(user?.username));
};
