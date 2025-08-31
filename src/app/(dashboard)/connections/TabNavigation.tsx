"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { tabsClasses } from "@mui/material/Tabs";
import StickyBox from "react-sticky-box";

const tabItems = [
  { id: "connections", path: "/connections", name: "Connections" },
  { id: "suggested", path: "/connections/suggested", name: "Suggested Accounts" },
  { id: "mutual-follows", path: "/connections/mutual-follows", name: "You May Know" },
  { id: "near-you", path: "/connections/near-you", name: "Near You" },
  { id: "popular-creators", path: "/connections/popular-creators", name: "Popular Creators" },
  { id: "interests", path: "/connections/interests", name: "Interests" },
];

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

export default function TabNavigation() {
  const segment = useSelectedLayoutSegment();

  const currIndex = tabItems.findIndex((item) => item.id === segment);

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
    const currIndex = tabItems.findIndex((item) => item.id === segment);
    setValue(currIndex >= 0 ? currIndex : 0);
    return () => {};
  }, [segment]);

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
            variant="scrollable"
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
                href={item.path}
                selected={value === index}
              />
            ))}
          </Tabs>
        </Box>
      </StickyBox>
    </React.Fragment>
  );
}

