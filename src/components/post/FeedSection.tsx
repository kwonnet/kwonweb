"use client";
import { Stack, Typography } from "@mui/material";
import React from "react";
import Box from "@mui/material/Box";
// import { useAppContext } from "@/contexts/AppContext";
import debounce from "lodash/debounce";
import ForYouNewsfeed from "./ForYouNewsfeed";
import { FeedPost } from "@/types";

export default function FeedSection({ posts }: { posts: FeedPost[] }) {
  const data = [
    { id: "1", name: "For You" },
    { id: "2", name: "Following" },
    { id: "3", name: "Friends" },
    { id: "4", name: "Latest" },
  ];

  // const { setCategory } = useAppContext();

  const [state, setState] = React.useState({ active: "1" });

  const deboundUpdate = React.useRef(
    debounce((val: string) => {
      console.log("debounced value", val);
      // setCategory(val === 0 ? null : data[val]?.id);
    }, 1000)
  ).current;

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    event.preventDefault();
    event.stopPropagation();
    setState((prev) => ({ ...prev, active: newValue }));
    deboundUpdate(newValue);
    console.log(newValue);
  };

  return (
    <Box sx={{ width: "100wv", mb: 1 }}>
      <Stack
        direction="row"
        alignItems={"center"}
        justifyContent={"space-between"}
        spacing={0.5}
        sx={{ px: 1 }}
      >
        {data.map((feed) => (
          <Typography
            key={feed.id}
            color={state.active === feed.id ? "textPrimary" : "textDisabled"}
            sx={{
              fontWeight: state.active === feed.id ? 600 : undefined,
              cursor: "pointer",
            }}
            onClick={(ev) => handleChange(ev, feed.id)}
          >
            {feed.name}
          </Typography>
        ))}
      </Stack>
      {state.active === "1" && <ForYouNewsfeed posts={posts} />}
    </Box>
  );
}
