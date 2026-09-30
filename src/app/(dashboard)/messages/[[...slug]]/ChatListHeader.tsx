"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { tabsClasses } from "@mui/material/Tabs";
import StickyBox from "react-sticky-box";
import { useAuthSession } from "@/hooks";
import { getCurrentSegment } from "@/utils";



function samePageLinkNavigation(
  event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

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
  { id: "anonymous", pathname: `/messages/${userId}/anonymous/list`, name: "Anonymous" },
];
}

export default function ChatListHeader() {

    const { user } = useAuthSession()

    const pathname = usePathname()

  const segment = getCurrentSegment(pathname) //useSelectedLayoutSegment();

  const tabItems = React.useMemo(() => getTabItems(user.id), [user.id]);

  const currIndex = tabItems.findIndex((item) => pathname.includes(item.id));

  const [value, setValue] = React.useState(currIndex >= 0 ? currIndex : 0);


  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (
      event.type !== "click" ||
      (event.type === "click" &&
        samePageLinkNavigation(
          event as React.MouseEvent<HTMLAnchorElement, MouseEvent>
        ))
    ) {
      const currIndex = tabItems.findIndex(
        (_item, index) => index === newValue
      );
      setValue(currIndex);
    }
  };

  React.useEffect(() => {
    const currIndex = tabItems.findIndex((item) => pathname.includes(item.id));
    setValue(currIndex >= 0 ? currIndex : 0);
    return () => {};
  }, [pathname, tabItems]);

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
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="connections action tabs"
            role="navigation"
            variant="fullWidth"
            selectionFollowsFocus={true}
            scrollButtons="auto"
            allowScrollButtonsMobile={true}
            sx={{
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
          </Tabs>
        </Box>
      </StickyBox>
    </React.Fragment>
  );
}