"use client";
import { useAuthSession } from "@/hooks";
import { Box } from "@mui/material";
import React from "react";
import { tabsClasses } from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import type { FeedPost } from "@/types";
import { UserMiniProfile } from "@/types/user";
import dynamic from "next/dynamic";
const UserBookmarksFeed = dynamic(() => import("@/components/post/UserBookmarksFeed"));
const UserHighlightsFeed = dynamic(() => import("@/components/post/UserHighlightsFeed"));
const UserLikesFeed = dynamic(() => import("@/components/post/UserLikesFeed"));
const UserMediaFeed = dynamic(() => import("@/components/post/UserMediaFeed"));
const UserPostsFeed = dynamic(() => import("@/components/post/UserPostsFeed"));
const UserRepliesFeed = dynamic(() => import("@/components/post/UserRepliesFeed"));
import { usePathname } from "next/navigation";
import { getCurrentSegment, updateUrl } from "@/utils";
import StickyBox from "react-sticky-box";

type TabItems = {
  id: string;
  name: string;
  isPrivate: boolean;
};

const tabItems: TabItems[] = [
  {
    id: "posts",
    name: "Posts",
    isPrivate: false,
  },
  {
    id: "replies",
    name: "Replies",
    isPrivate: false,
  },
  {
    id: "scheduled",
    name: "Scheduled",
    isPrivate: true,
  },
  {
    id: "highlights",
    name: "Highlights",
    isPrivate: false,
  },
  {
    id: "likes",
    name: "Likes",
    isPrivate: true,
  },
  {
    id: "media",
    name: "Media",
    isPrivate: false,
  },
  {
    id: "bookmarks",
    name: "bookmarks",
    isPrivate: true,
  },
];

const getTabItems = (user: UserMiniProfile, visitorId?: string) => {
  const result: TabItems[] = [];
  for (let index = 0; index < tabItems.length; index++) {
    const element = tabItems[index];
    if (element.id === "highlights" && !user?.meta?.isPro) {
      continue;
    } else if (user?.id !== visitorId && element.isPrivate) {
      continue;
    } else {
      result.push(element);
    }
  }
  return result;
};

const PostsTabWrapper: React.FC<{ userId: string; kind: string; posts?: FeedPost[] }> = ({
  userId,
  kind,
  posts,
}) => {
  return <UserPostsFeed posts={posts} userId={userId} kind={kind} />;
};

const ScheduledTabWrapper: React.FC<{ userId: string; kind: string; posts?: FeedPost[] }> = ({
  userId,
  kind,
  posts,
}) => {
  return <UserPostsFeed posts={posts} userId={userId} kind={kind} />;
};

const RepliesTabWrapper: React.FC<{ userId: string; posts?: FeedPost[] }> = ({ userId, posts }) => {
  return <UserRepliesFeed posts={posts} userId={userId} />;
};

const HighlightsTabWrapper: React.FC<{ userId: string; posts?: FeedPost[] }> = ({ userId, posts }) => {
  return <UserHighlightsFeed posts={posts} userId={userId} />;
};

const LikesTabWrapper: React.FC<{ userId: string; posts?: FeedPost[] }> = ({ userId, posts }) => {
  return <UserLikesFeed posts={posts} userId={userId} />;
};

const MediaTabWrapper: React.FC<{ userId: string; posts?: FeedPost[] }> = ({ userId, posts }) => {
  return <UserMediaFeed posts={posts} userId={userId} />;
};

const BookmarksTabWrapper: React.FC<{ userId: string; posts?: FeedPost[] }> = ({ userId, posts }) => {
  return <UserBookmarksFeed posts={posts} userId={userId} />;
};

const getComponents = (user: UserMiniProfile, visitorId?: string) => {
  if (user?.id !== visitorId) {
    const tabComponents: Record<
      string,
      React.ComponentType<{ userId: string; kind: string; posts?: FeedPost[] }>
    > = {
      posts: PostsTabWrapper,
      replies: RepliesTabWrapper,
      ...(user?.meta?.isPro && { ["highlights"]: HighlightsTabWrapper }),
      media: MediaTabWrapper,
    };
    return tabComponents;
  } else {
    const tabComponents: Record<
      string,
      React.ComponentType<{ userId: string; kind: string; posts?: FeedPost[] }>
    > = {
      posts: PostsTabWrapper,
      replies: RepliesTabWrapper,
      scheduled: ScheduledTabWrapper,
      ...(user?.meta?.isPro && { ["highlights"]: HighlightsTabWrapper }),
      likes: LikesTabWrapper,
      media: MediaTabWrapper,
      bookmarks: BookmarksTabWrapper,
    };
    return tabComponents;
  }
};

const PageClient = (params: { user: UserMiniProfile; slug: string; posts?: FeedPost[] }) => {
  const { user } = useAuthSession();

  const pathname = usePathname();

  const segment = getCurrentSegment(pathname);

  const filterTabItems = React.useMemo(
    () => getTabItems(params.user, user?.id),
    [params.user, user?.id]
  );

  const tabComponents = getComponents(params.user, user?.id);

  const checkSlug = filterTabItems.find((t) => t.id === segment);

  const initItem = filterTabItems[0];

  const value = checkSlug ? segment : initItem.id;

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    updateUrl(`/@${params.user.username}/${newValue}`);
  };

  return (
    <Box>
      <Box sx={{ typography: "body1" }}>
        <TabContext value={value}>
          <StickyBox style={{ zIndex: 999 }} offsetTop={50}>
            <Box
              sx={[
                (theme) => ({
                  borderBottom: 1,
                  borderColor: "divider",
                  background: theme.vars.palette.common.background,
                  ...theme.applyStyles("dark", {
                    background: theme.vars.palette.AppBar.darkBg,
                  }),
                }),
              ]}
            >
              <TabList
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile={true}
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
          </StickyBox>

          {filterTabItems.map((tab) => (
            <TabPanel key={tab.id} value={tab.id}>
              {tabComponents[tab.id]
                ? React.createElement(tabComponents[tab.id], {
                    userId: params.user?.id,
                    kind: tab.id,
                    posts: tab.id === params.slug ? params.posts : undefined,
                  })
                : null}
            </TabPanel>
          ))}
        </TabContext>
      </Box>
    </Box>
  );
};

export default PageClient;
