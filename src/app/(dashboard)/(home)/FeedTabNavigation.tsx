"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { tabsClasses } from "@mui/material/Tabs";
import StickyBox from "react-sticky-box";
import { feedTabItems } from "@/data";

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

export default function FeedTabNavigation() {

  const segment = useSelectedLayoutSegment();

  const currIndex = feedTabItems.findIndex((item) => item.id === segment);

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
          <Tabs
            value={value}
            aria-label="feed types action tabs"
            role="navigation"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile={true}
            selectionFollowsFocus={false}

            sx={{
              [`& .${tabsClasses.scrollButtons}`]: {
                "&.Mui-disabled": { opacity: 0.3 },
              },
              [`& .${tabsClasses.list}`]: {
                justifyContent: "space-between",
                // width: "100%",
              },
              // width: "100%",
              // justifyContent: "space-between"
            }}
          >
            {feedTabItems.map((item, index) =>(

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