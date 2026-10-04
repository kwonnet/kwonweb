import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import React from "react";
import ChatBoxClient from "./ChatBoxClient";
import ChatBoxClientAnon from "./ChatBoxClientAnon"
import { UserPublic } from "@/types/user";
import DisplayError from "@/components/common/DisplayError";
import { ChatDevice } from "@/types/sodium";
import { Conversation, EncryptedChatMessage } from "@/types/conversation";

const ChatBoxServer = async ({
  recipientId,
  slug,
}: {
  recipientId: string;
  slug: string;
}) => {
  const session = await getServerSession();
  const user = session?.user;
  if (slug === "anonymous") {
    const result = await fetch(
      `${apiUrl}/anonymous/users/${recipientId}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": `application/json`,
          Authorization: `Bearer ${user?.accessToken}`,
        },
      }
    );

    if (!result.ok) {
      return (
        <DisplayError status={result.status} message={await result.text()} />
      );
    }

    const res: {
      recipient: UserPublic;
      recipientDevices: ChatDevice[];
    } = await result.json();

    console.log("Chat User ", res);

    return <ChatBoxClientAnon params={res} />;
  }
  // normal chat
  const result = await fetch(
    `${apiUrl}/conversations/users/${user?.id}/recipients/${recipientId}/messages?slug=${slug}`,
    {
      method: "GET",
      next: {
        revalidate: 60,
        tags: [`user-${user?.id}-${recipientId}-${slug}-convo`],
      },
      credentials: "include",
      mode: "cors",
      headers: {
        "Content-Type": `application/json`,
        Authorization: `Bearer ${user?.accessToken}`,
      },
    }
  );

  if (!result.ok) {
    return (
      <DisplayError status={result.status} message={await result.text()} />
    );
  }

  const res: {
    recipient: UserPublic;
    convo?: Conversation;
    recipientDevices: ChatDevice[];
    messages: EncryptedChatMessage[];
  } = await result.json();

  console.log("Chat User ", res);

  return <ChatBoxClient params={res} />;
};

export default ChatBoxServer;
