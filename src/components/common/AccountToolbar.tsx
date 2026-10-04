"use client";
import * as React from "react";
import {
  MenuItem,
  MenuList,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Stack,
} from "@mui/material";
import { signOut } from "next-auth/react";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { useAuthSession } from "@/hooks";

const profiles = [
  {
    id: 1,
    name: "Nguter Agya",
    email: "nguteragya@outlook.com",
    image: "https://avatars.githubusercontent.com/u/19550456",
    username: "nguteragya",
  },
  {
    id: 2,
    name: "Terna John",
    email: "johnterna@mui.com",
    color: "#8B4513", // Brown color
    username: "johnterna",
  },
];

export default function AccountToolbar() {
  const { user } = useAuthSession();
  return (
    <Stack direction="column" spacing={1} sx={{ width: 240 }}>
      <Stack
        direction={"row"}
        spacing={1}
        sx={{
          alignItems: "center",
          px: 2,
          py: 1
        }}>
        <Avatar
          sx={{
            width: 44,
            height: 44,
          }}
          src={user?.avatar ?? ""}
          alt={user?.name ?? ""}
        >
          {user?.name?.[0]}
        </Avatar>
        <Stack
          sx={{ textDecoration: "none", color: "inherit", overflow: "hidden" }}
          href={`/@${user?.username}`}
          component={Link}
          direction={"column"}
          spacing={-0.5}
        >
          <Typography
            sx={{
              color: "text.primary",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            variant="body1"
            noWrap
          >
            {user?.name}
          </Typography>
          <Typography
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            color="textSecondary"
            variant="caption"
            noWrap
          >
            {user?.email}
          </Typography>
          <Typography
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            color="textDisabled"
            variant="caption"
            noWrap
          >
            @{user?.username}
          </Typography>
        </Stack>
      </Stack>
      <Divider />
      <Typography
        variant="subtitle1"
        sx={{
          pl: 1,
          mx: 2,
          mt: 1
        }}>
        My Profiles
      </Typography>
      <Divider />
      <MenuList>
        {profiles.map((item) => (
            <MenuItem
              key={item.id}
              component={Link}
              sx={{
                justifyContent: "flex-start",
                width: "100%",
                columnGap: 2,
                textDecoration: "none",
                color: "inherit",
              }}
              href={`/date/${item.username}`}
              divider={true}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "0.95rem",
                    bgcolor: item.color,
                  }}
                  src={user.image ?? ""}
                  alt={item.name ?? ""}
                >
                  {item.name[0]}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  width: "100%",
                }}
                primary={item.name}
                secondary={item.username}
                slotProps={{
                  primary: { variant: "body2" },
                  secondary: { variant: "caption" },
                }}
              />
            </MenuItem>
        ))}
        <Button
          variant="text"
          sx={{ textTransform: "capitalize", display: "flex", mx: "auto" }}
          size="small"
          startIcon={<AddIcon />}
          disableElevation
        >
          Add new
        </Button>
      </MenuList>
      <Divider />
      <Stack sx={{ p: 2 }}>
        <Button variant="outlined" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>Sign out</Button>
      </Stack>
    </Stack>
  );
}

// import { Stack } from '@mui/material'
// import Link from 'next/link'
// import React from 'react'

// const AccountContent = (props: any) => {
//   return (
//      <Stack>
//         <Link href={"/username"}>
//         {props.children}
//         </Link>
//         </Stack>
//   )
// }

// export default AccountContent
