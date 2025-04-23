'use client'
import { Box, Stack, Typography } from '@mui/material';
import React, { useState } from 'react'

const updateUrl = (url: string) => {
  // const url = new URL(window.location.href);
  // url.searchParams.set("t", Math.floor(time).toString());
  window.history.replaceState(null, "", url);
};

const tabItems = [
  {
    id: "quotes",
    name: "Quotes",
  },
  {
    id: "reposts",
    name: "Reposts",
  },
]

type URLParams = {
  kind: string;
  username: string;
  id: string;
};

const PageClient = ({ QuotesNode, RepostsNode, params }:{ QuotesNode: React.ReactNode, RepostsNode: React.ReactNode, params: URLParams }) => {
  const [state, setState] = useState({
      active: params.kind,
    });
  
    const toggleTab = (active: string) => {
      updateUrl(`/${params.username}/feed/${params.id}/${active}`)
      setState((prev) => ({ ...prev, active }));
    };
  return (
    <React.Fragment>
      <Box sx={{ width: "100wv", mb: 1 }}>
        <Stack
          direction="row"
          alignItems={"center"}
          justifyContent={"space-around"}
          spacing={0.5}
          sx={{ px: 1, py: 2, overflowX: "auto" }}
        >
          {tabItems.map((item) => (
            <Typography
              key={item.id}
              color={state.active === item.id ? "textPrimary" : "textDisabled"}
              sx={{
                cursor: "pointer",
              }}
              onClick={(ev) => toggleTab(item.id)}
            >
              {item.name}
            </Typography>
          ))}
        </Stack>
      </Box>
      {state.active === "quotes" && QuotesNode}
      {state.active === "reposts" && RepostsNode}
    </React.Fragment>
  )
}

export default PageClient