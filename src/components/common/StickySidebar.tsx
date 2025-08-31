"use client";
import {
  Box,
  Button,
  CardMedia,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React from "react";
import StickyBox from "react-sticky-box";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import Link from "next/link";
const StickySidebar = ({pathname, ConnectionSection}:{pathname?: string; ConnectionSection?: React.ReactNode}) => {
  // const matches = useMediaQuery((theme) => theme.breakpoints.down('md'));
  return (
    <StickyBox className="page__content_sidebar">
      <Box>
        <Paper sx={{}}>
          <CardMedia
            image="/post.jpg"
            component={"img"}
            sx={{
              maxHeight: 150,
              borderTopRightRadius: 3,
              borderTopLeftRadius: 3,
              objectPosition: "50% 50%",
              objectFit: "cover"
            }}
          />
          <Box sx={{ p: 2 }}>
            <Typography>
              Participate in our games & win rewards upto $5000
            </Typography>
            <Box sx={{ display: "block", textAlign: "center", my: 1 }}>
              <Button
                sx={{ borderRadius: 30 }}
                variant="outlined"
                size="small"
                LinkComponent={Link}
                href="/games"
              >
                Play Now
              </Button>
            </Box>
          </Box>
        </Paper>
        {/* subscribe */}
        {/* <Paper sx={{ p: 2, my: 1 }}>
          <Typography textAlign={"center"} fontWeight={600} variant="h6">
            Subscribe to Premium
          </Typography>
          <Typography>
            Subscribe to unlock new features and if eligible, start receiving a
            share of revenue.
          </Typography>
          <Box sx={{ display: "block", textAlign: "center", my: 1 }}>
            <Button
              sx={{ borderRadius: 30 }}
              variant="outlined"
              size="small"
              LinkComponent={Link}
              href="/premium"
            >
              Subscribe
            </Button>
          </Box>
        </Paper> */}
        {/* what's happening section */}
        <Box
          sx={[
            (theme) => ({
              border: `1px solid ${theme.vars.palette.divider}`,
              mt: 1,
              borderRadius: 2,
            }),
          ]}
        >
          <Typography textAlign={"center"} fontWeight={600} variant="h6">
            Check What's happening
          </Typography>
          {Array.from({ length: 3 }).map((_, index) => (
            <Box key={index} sx={{ margin: 1 }}>
              <Stack
                direction={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
              >
                <Typography
                  color="textDisabled"
                  variant="caption"
                >{`Trending in Nigeria`}</Typography>
                <IconButton size="small">
                  <MoreHorizOutlinedIcon />
                </IconButton>
              </Stack>
              <Typography variant="subtitle1">{`Feature ${index + 1}`}</Typography>
              <Typography
                color="textDisabled"
                variant="caption"
              >{`13.k posts`}</Typography>
              <Divider />
            </Box>
          ))}
          <Box sx={{ textAlign: "center", display: "block", my: 1 }}>
            <Button
              sx={{ borderRadius: 30 }}
              LinkComponent={Link}
              href="/discover"
              variant="outlined"
            >
              See More
            </Button>
          </Box>
        </Box>
        {/* connection section */}
        {pathname !== "/connections" &&  ConnectionSection}
      </Box>
    </StickyBox>
  );
};

export default StickySidebar;
