"use client";
import { MessagingOptionsButton } from "@/context/ConvoSocketIoContext";
import * as React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabsClasses } from "@mui/material/Tabs";
import StickyBox from "react-sticky-box";
import { useAuthSession } from "@/hooks";




interface LinkTabProps {
  label?: string;
  href: string;
  selected?: boolean;
  sx?: Record<string, any>
}

function LinkTab(props: LinkTabProps) {
  return (
    <Tab component={Link} aria-current={props.selected && "page"} {...props} />
  );
}

const getTabItems= (userId: string) => {
    return [
  { id: "chat", pathname: `/messages`, name: "Chat" },
  { id: "requests", pathname: `/messages/${userId}/requests/list`, name: "Requests" },
];
}

export default function ChatListHeader() {

    const { user } = useAuthSession()

    const pathname = usePathname()


  const tabItems = React.useMemo(() => getTabItems(user.id), [user.id]);

  const currIndex = tabItems.findIndex((item) => pathname.includes(item.id));

  const value = currIndex >= 0 ? currIndex : 0;


  return (
    <React.Fragment>
      <StickyBox style={{ zIndex: 999 }}>
        <Box
          sx={[
            (theme) => ({
              width: "100%",
              bgcolor: theme.vars.palette.AppBar.defaultBg,
              ...theme.applyStyles("dark", {
                bgcolor: theme.vars.palette.AppBar.darkBg,
              })
            }),
          ]}
        >

          <Box sx={{ display: "flex", alignItems: "center" }}><Tabs
            value={value}
            aria-label="Message folders"
            role="navigation"
            variant="fullWidth"
            selectionFollowsFocus={true}
            scrollButtons="auto"
            allowScrollButtonsMobile={true}
            sx={{
              flex: 1, minWidth: 0,
              [`& .${tabsClasses.scrollButtons}`]: {
                "&.Mui-disabled": { opacity: 0.3 },
              },
              [`& .${tabsClasses.list}`]: {
                justifyContent: "space-between",
              }
            }}
          >
            {tabItems.map((item, index) =>(

              <LinkTab
                key={item.id}
                label={item.name}
                href={item.pathname}
                selected={value === index}
              />
            ))}
          </Tabs><MessagingOptionsButton /></Box>
        </Box>
      </StickyBox>
    </React.Fragment>
  );
}
