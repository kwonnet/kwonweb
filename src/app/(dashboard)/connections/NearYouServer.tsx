import { auth } from "@/auth";
import { ErrorMessage } from "@/components/common";
import { apiUrl } from "@/config";
import React from "react";
import DisplayClient from "./DisplayClient";
import { UserConnection } from "@/types/user";
import { ConnTypeEnum } from "@/types";
import NearYouLocation from "./NearYouLocation";

const NearYouServer = async () => {
  const date = new Date();

  const session = await auth();

  if (!session) return <ErrorMessage message="Error: Can't serve request" />;

  const result = await fetch(
    `${apiUrl}/users/connections/?type=${ConnTypeEnum.NEAR_YOU}&d=${date.getTime()}&limit=21`,
    {
      method: "GET",
      next: { revalidate: 60, tags: [`user_${session?.user?.id}_suggestions`] },
      credentials: "include",
      mode: "cors",
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    }
  );

  if (!result.ok && result.status !== 404){
      return <ErrorMessage message="Error: Unable to perform request" />;
    }
  
    const users: UserConnection[] = result.status === 404 ? [] : await result.json();
  return (
    <React.Fragment>
      <NearYouLocation />
      <DisplayClient connType={ConnTypeEnum.NEAR_YOU} users={users} />
    </React.Fragment>
  );
};

export default NearYouServer;
