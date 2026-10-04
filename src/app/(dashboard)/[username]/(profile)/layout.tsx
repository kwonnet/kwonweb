import React from "react";
import { getServerSession } from "@/lib/server-session";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";
import { UserMiniProfile } from "@/types/user";
import ProfileClient from "./ProfileClient";

type URLParams = {
  username: string;
};

const Layout = async ({
  params,
  children,
}: {
  params: Promise<URLParams>;
  children?: React.ReactNode;
}) => {
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
  return (
    <React.Fragment>
      <ProfileClient user={user} />
      {children}
    </React.Fragment>
  );
};

export default Layout;
