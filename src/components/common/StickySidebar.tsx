"use client";
import {
  Box,
  Button,
  CardMedia,
  Paper,
  Typography,
} from "@mui/material";
import React from "react";
import StickyBox from "react-sticky-box";
import Link from "next/link";
const StickySidebar = ({pathname, TrendingSection, ConnectionSection}:{pathname?: string; ConnectionSection?: React.ReactNode, TrendingSection?: React.ReactNode}) => {
  return (
    <StickyBox className="page__content_sidebar">
      <Box>
        <Paper sx={{}}>
          <CardMedia
            image="/post.jpg"
            alt="Friends playing a game"
            component={"img"}
            loading="lazy"
            decoding="async"
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
        {TrendingSection}
        {/* connection section */}
        {pathname !== "/connections" &&  ConnectionSection}
      </Box>
    </StickyBox>
  );
};

export default StickySidebar;
