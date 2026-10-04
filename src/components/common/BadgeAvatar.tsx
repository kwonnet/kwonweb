"use client";
import * as React from "react";
import { keyframes, styled } from "@mui/material/styles";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import VerifiedIcon from "@mui/icons-material/Verified";
import { Box, Stack, Typography } from "@mui/material";
import { Slide } from "react-awesome-reveal";
import { useAuthSession, useBadgeColor } from "@/hooks";
import Link from "next/link";

const PulseBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    width: 18,
    height: 18,
    color: theme.vars.palette.info.light,
    boxShadow: theme.shadows[2],
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "18px",
      height: "18px",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

export default function BadgeAvatar({
  height = "80px",
  width = "80px",
  src = "/static/avatar.jpg",
  alt = "Profile picture",
  title = ""
}: {
  height?: number | string;
  width?: number | string;
  src?: string;
  alt?: string;
  title?: string;
}) {

  const { user } = useAuthSession();

  const metaColor = useBadgeColor(user?.meta?.color)
  
  return (
    <React.Fragment>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2
        }}>
        <Box component={Link} href={`/@${user.username}`}>
          <PulseBadge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={user.meta.isPro ? <VerifiedIcon sx={{ fontSize: 14, color: theme => metaColor === "gold" ? 'gold' : metaColor === "grey" ? theme.vars.palette.grey[500] : theme.vars.palette.info.light }} /> : null}
        >
          <Avatar
            sx={{
              height,
              width,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              border: (theme) => `4px solid ${theme.palette.background.paper}`,
            }}
            alt={user.name}
            src={user?.avatar!}
          >{user?.name[0]}</Avatar>
        </PulseBadge>
        </Box>
        <Box sx={{pl: -2, position: "relative"}}>
          <Slide direction="up">
            <Stack spacing={-1}>
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "1rem",
                  fontFamily: "PlayFair",
                  fontStyle: "italic"
                }}>
              {user.name}
            </Typography>
            <Typography
              sx={{ 
                fontFamily: "PlayFair", 
                fontStyle: "italic", 
                position: "relative", 
              }}
              color="textDisabled"
              variant="caption"
            >
              @{user.username}
            </Typography>
            </Stack>
          </Slide>
        </Box>
      </Box>
    </React.Fragment>
  );
}
