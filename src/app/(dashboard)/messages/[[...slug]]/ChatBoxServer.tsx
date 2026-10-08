import { getServerSession } from "@/lib/server-session";
import { apiUrl } from "@/config";
import React from "react";
import ChatBoxClient from "./ChatBoxClient";
import { UserPublic } from "@/types/user";
import DisplayError from "@/components/common/DisplayError";
import type {MessagingDevice} from "@/lib/signal/contracts";
import { Conversation, EncryptedChatMessage } from "@/types/conversation";
const ChatBoxServer = async ({ recipientId, slug, }: {
    recipientId: string;
    slug: string;
}) => {
    const session = await getServerSession();
    const user = session?.user;
    if (!["chat", "requests"].includes(slug)) {
        return <DisplayError status={404} message="Messaging page not found."/>;
    }
    // normal chat
    const result = await fetch(`${apiUrl}/conversations/users/${user?.id}/recipients/${recipientId}/messages?slug=${slug}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        mode: "cors",
        headers: {
            "Content-Type": `application/json`,
            Authorization: `Bearer ${user?.accessToken}`,
        },
    });
    if (!result.ok) {
        return (<DisplayError status={result.status} message={await result.text()}/>);
    }
    const res: {
        recipient: UserPublic;
        convo?: Conversation;
        recipientDevices: MessagingDevice[];
        messages: EncryptedChatMessage[];
    } = await result.json();
    return <ChatBoxClient key={recipientId} params={res}/>;
};
export default ChatBoxServer;
