import React from "react";
import PageClient from "./PageClient";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";
import { getServerSession } from "@/lib/server-session";
import { UserMiniProfile } from "@/types/user";
import ProfileSection from "../ProfileClient";
import { IconButton, Stack, Typography } from "@mui/material";
import { Lock, WarningOutlined } from "@mui/icons-material";
import { getUserConnInfo } from "@/utils/connections";

type URLParams = {
  username: string;
  slug: string[];
};

const page = async ({ params }: { params: Promise<URLParams> }) => {
  const _params = await params;

  const session = await getServerSession();

  const identifier = _params?.username?.replace("%40", "");

  if (!identifier) return <ErrorMessage message="Invalid user identifier" />;

  const result = await fetch(`${apiUrl}/users/${identifier}/overview`, {
    method: "GET",
    next: { revalidate: 60, tags: [`user-${identifier}`] },
    credentials: "include",
    mode: "cors",
    headers: {
      "Content-Type": `application/json`,
      Authorization: `Bearer ${session?.user?.accessToken}`,
    },
  });

  if (!result.ok) {
    const message = await result.text();
    return <ErrorMessage message={message} />;
  }

  const user: UserMiniProfile = await result.json();

    // check if target or current user block the other

  const isBlocked = (user?.actions?.hasBlockedUser || user?.actions?.isBlockedByUser) 

  if(isBlocked) return null 

  const slug = _params.slug ? _params.slug[0] : "posts";

  const { isConnected } = getUserConnInfo(user?.conn);

  const isCurrentUser = session?.user?.id === user.id;

  const isPrivate = user.meta.isPrivate;

  const isActive = user?.meta.isActive;

  const canView =
    (isPrivate && isConnected) || (isActive && !isPrivate) || isCurrentUser;

  if(!canView) return null

  return (<PageClient slug={slug} user={user} key={378} />)

  // return (
  //   <React.Fragment>
  //     {canView ? (
  //       <PageClient slug={slug} user={user} key={378} />
  //     ) : (
  //       <Stack
  //         sx={{ }}
  //         direction={{lg: "row", md: "row", sm: 'column', xs: "column"}}
  //         alignItems={"center"}
  //         justifyContent={"center"}
  //       >
  //         <IconButton disabled={true} size="large">
  //           {isPrivate ? <Lock /> : <WarningOutlined />}
  //         </IconButton>
  //         <Typography
  //           sx={{ p: 1, textAlign: "center", fontFamily: "PlayFair" }}
  //           variant="h5"
  //         >
  //           {user.meta.message}
  //         </Typography>
  //       </Stack>
  //     )}
  //   </React.Fragment>
  // );
};

export default page;
