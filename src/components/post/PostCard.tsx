"use client";
import React, {  } from "react";
import {
  Avatar,
  Box,
  CardMedia,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import shuffle from "lodash/shuffle";

const PostCard = ({ index }: { index: number }) => {
  const image = shuffle(["/story.jpg", "/post.jpg", "/story2.jpg"])[0]
  return (
    <Paper sx={{ mb: 1, minHeight: 120, p: 0.5 }}>
      <Stack direction={"row"} sx={{
        justifyContent: "space-between"
      }}>
        <Stack direction={"row"} spacing={0.5}>
          <Avatar src="/avatar.jpeg" alt={"user"} />
          <Stack>
            <Typography>John Kenneth Doe</Typography>
            <Typography variant="caption" color="text.secondary">
              @johnkennethdoe
            </Typography>
          </Stack>
        </Stack>
        <Box>
          <IconButton aria-label="More options" size="small">
            <MoreHorizOutlinedIcon />
          </IconButton>
        </Box>
      </Stack>
      <Stack direction={"row"} sx={{
        justifyContent: "space-between"
      }}>
        <Box sx={{ width: "12.2%" }} />
        <Box>
          <Typography>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Suscipit,
            ea quos eligendi quaerat, aliquam eos vitae impedit veniam possimus
            velit rem iure porro beatae tempore voluptates quis architecto rerum
            sapiente.
          </Typography>
          {index % 2 == 0 ? (
            <CardMedia
              sx={{
                borderRadius: 3,
                objectPosition: "50% 50%",
                maxHeight: 500,
                overflow: "hidden",
                position: "relative",
                display: "block",
              }}
              image={image}
              component={"img"}
            />
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
};

export default PostCard