import React from "react";
import PageClient from "./PageClient";
import { ErrorMessage } from "@/components/common";
import { apiUrl } from "@/config";
import { auth } from "@/auth";
import { UserConnection, UserMiniProfile } from "@/types/user";
import { IconButton, Stack, Typography } from "@mui/material";
import { Lock, WarningOutlined } from "@mui/icons-material";
import { getUserConnInfo } from "@/utils/connections";

type URLParams = {
  username: string;
  slug: string[];
};

const page = async ({ params }: { params: Promise<URLParams> }) => {
  const _params = await params;

  const session = await auth();

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

  const { isConnected } = getUserConnInfo(user?.conn);

  const isCurrentUser = session?.user?.id === user.id;

  const isPrivate = user.meta.isPrivate;

  const isActive = user?.meta.isActive;

  const canView =
    (isPrivate && isConnected) || (isActive && !isPrivate) || isCurrentUser;

  if(!canView) return null


  const slug = _params.slug ? _params.slug[0] : "followers";

  // get connections

  const result2 = await fetch(
    `${apiUrl}/users/${user.id}/${slug}?limit=${21}&page=${1}`,
    {
      method: "GET",
      next: { revalidate: false, tags: [`user-${identifier}-conn`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  const connections: UserConnection[] = !result2.ok ? [] : await result2.json();

  

  return (<PageClient slug={slug} user={user} connections={connections} />)

//   return (
//     <React.Fragment>
//       {canView ? (
//         <PageClient slug={slug} user={user} connections={connections} />
//       ) : (
//         <Stack
//           sx={{}}
//           direction={{ lg: "row", md: "row", sm: "column", xs: "column" }}
//           alignItems={"center"}
//           justifyContent={"center"}
//         >
//           <IconButton disabled={true} size="large">
//             {isPrivate ? <Lock /> : <WarningOutlined />}
//           </IconButton>
//           <Typography
//             sx={{ p: 1, textAlign: "center", fontFamily: "PlayFair" }}
//             variant="h5"
//           >
//             {user.meta.message}
//           </Typography>
//         </Stack>
//       )}
//     </React.Fragment>
//   );
// };
}

export default page;
