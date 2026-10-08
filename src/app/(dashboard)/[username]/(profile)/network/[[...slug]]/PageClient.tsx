"use client";
import { Box, Stack, Typography } from "@mui/material";
import React, { useState } from "react";
import DisplayClient from "./DisplayClient";
import { UserConnection, UserMiniProfile } from "@/types/user";
import { useAuthSession } from "@/hooks";
import { tabsClasses } from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { usePathname } from "next/navigation";
import { getCurrentSegment, updateUrl } from "@/utils";


type TabItems = {
  id: string;
  name: string;
  isPrivate: boolean;
};

const tabItems: TabItems[] = [
  {
    id: "followers",
    name: "Followers",
    isPrivate: false,
  },
  {
    id: "following",
    name: "Followings",
    isPrivate: false,
  },
  {
    id: "friends",
    name: "Friends",
    isPrivate: false,
  },
  {
    id: "verified-followers",
    name: "Verified",
    isPrivate: false,
  },
  {
    id: "follow-requests",
    name: "Requests",
    isPrivate: true,
  },
  {
    id: "blocked",
    name: "Blocked",
    isPrivate: true,
  },
  {
    id: "muted",
    name: "Muted",
    isPrivate: true,
  },
];

const getTabItems = (visitedId: string, visitorId: string) => {
  const result: TabItems[] = [];
  for (let index = 0; index < tabItems.length; index++) {
    const element = tabItems[index];
    if (visitedId !== visitorId && element.isPrivate) {
      continue;
    } else {
      result.push(element);
    }
  }
  return result;
};


const PageClient = (params: {
  connections: UserConnection[];
  slug: string;
  user: UserMiniProfile;
}) => {
  const [state, setState] = useState({
    slug: params.slug,
    connections: params.connections,
  });

  const { user } = useAuthSession();

  const pathname = usePathname();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setState((prev) => ({ ...prev, slug: newValue, connections: [] }));
    updateUrl(`/@${params.user.username}/network/${newValue}`);
  };

  const filterTabItems = React.useMemo(
    () => getTabItems(params.user.id, user.id),
    [params.user.id, user.id]
  );

  const initItem = filterTabItems[0]

  React.useEffect(() => {
      const segment = getCurrentSegment(pathname)
      const currItem = filterTabItems.find((item) => item.id === segment);
      setState(prev => ({...prev, slug: currItem ? segment : initItem.id}) );
      return () => {};
      }, [pathname, filterTabItems, initItem.id]);

  return (
    <React.Fragment>
      <Box sx={{ typography: "body1" }}>
        <TabContext value={state.slug}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile={true}
              selectionFollowsFocus={true}
              aria-label={`user post action tabs`}
              onChange={handleChange}
              sx={{
                [`& .${tabsClasses.scrollButtons}`]: {
                  "&.Mui-disabled": { opacity: 0.3 },
                },
              }}
            >
              {filterTabItems.map((tab) => (
                <Tab key={tab.id} label={tab.name} value={tab.id} />
              ))}
            </TabList>
          </Box>
          {filterTabItems.map((tab) => (
            <TabPanel sx={{ py: 1, px: 0 }} key={tab.id} value={tab.id}>
              <DisplayClient
                initialSlug={params.slug}
                connections={state.connections}
                slug={tab.id}
                userId={params.user.id}
              />
            </TabPanel>
          ))}
        </TabContext>
      </Box>
    </React.Fragment>
  );
};

export default PageClient;
