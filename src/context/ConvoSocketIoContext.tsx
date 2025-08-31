"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { useSocketIoContext } from "./SocketIoContext";
import {
  DecryptedChatMessage,
  EncryptedChatMessage,
} from "@/types/conversation";
import { decryptChatMessages } from "@/lib/conversations";
import { useAuthSession } from "@/hooks";
import { initiateSession } from "@/lib/sodium";
import { SessionEvelope } from "@/types/sodium";
import { useNotifications } from "@toolpad/core";
import { usePathname } from "next/navigation";
import { getCurrentSegment } from "@/utils";
import { mutate } from "swr";

type MessageReceiptBody = {
  id: string;
  convoId: string;
  userId: string;
  seen: {
    userId: string;
    seenAt: string;
    _id: string;
    id: string;
  }[];
  read: {
    userId: string;
    readAt: string;
    _id: string;
    id: string;
  }[];
};

type SocketContextType = {
  convoSocketIo?: Socket;
  messages: DecryptedChatMessage[];
  updateMesssages: (payload: EncryptedChatMessage[]) => Promise<void>;
};

const initialState: SocketContextType = {
  convoSocketIo: undefined,
  messages: [],
  updateMesssages: function (_payload: EncryptedChatMessage[]): Promise<void> {
    throw new Error("Function not implemented.");
  },
};

const ConvoSocketIoContext = createContext<SocketContextType>(initialState);

const ConvoSocketIoProvider = (props: any) => {
  const [state, setState] = useState<SocketContextType>(initialState);

  const { user } = useAuthSession();

  const notif = useNotifications();

  const pathname = usePathname();

  const segment = getCurrentSegment(pathname);

  const { convoSocketIo: socketIo } = useSocketIoContext();

  useEffect(() => {
    const localDeviceId = `d_${user.id?.slice(-10)}`;

    async function messageNewCallback(body: EncryptedChatMessage) {
      console.log("new message recived ", body);
      const messagePath = `/messages/${body.fromUserId}`;
      const currentUrl = window.location.pathname;
      console.log("messagePath ", messagePath, " currentUrl - ", currentUrl);
      // check and mark message as read and seen
      if (body.toUserId !== body.fromUserId && messagePath === currentUrl) {
        socketIo?.emit("message:receipt", {
          id: body.id,
          convoId: body.conversation,
          userId: body.toUserId,
        });
      }
      const messages = await decryptChatMessages(user.id, localDeviceId, [
        body,
      ]);
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, ...messages],
      }));
    }

    async function messageAckCallback(body: {
      ok: boolean;
      error?: string;
      sessionId: string;
    }) {
      console.log("message sent acknowledged ", body);
      if (!body.ok) {
        notif.show(body.error, { severity: "error", autoHideDuration: 5000 });
      }
    }

    async function messageReceiptCallback(body: MessageReceiptBody) {
      console.log("message sent receipt ", body);

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === body.id ? { ...m, seen: body.seen, read: body.read } : m
        ),
      }));

      // mutate global user conversation list
      const typeProp = `${user.id}_convo`
      mutate((key: any) => typeof key === "string" && JSON.parse(key)?.type?.startsWith(typeProp),
      (data: DecryptedChatMessage[][] | undefined) => {
        if(!data) return data
        const updateData = data?.map(item => item.map(m => m.id === body.id ? { ...m, seen: body.seen, read: body.read } : m ))
        return updateData
      }
    )

      notif.show("Message receipt", {
        severity: "info",
        autoHideDuration: 5000,
      });
    }

    async function sessionInitCallback(body: SessionEvelope) {
      console.log("session initialized ", body);
      await initiateSession({ localDeviceId, body });
    }

    async function sessionAckCallback(
      body: SessionEvelope & {
        ok: boolean;
        error?: string;
        sessionId: string;
      }
    ) {
      console.log("session acknowledged ", body);
      if (body.ok) {
        // just accept an emit back to the server update current device session
        socketIo?.emit("session:ack", body);
        return;
      }
      notif.show(body.error, { severity: "error", autoHideDuration: 5000 });
    }
    // listen to connection
    socketIo?.on("connection", () => {
      console.log("Conversation namespace connected");
    });
    // when session is initiated
    socketIo?.on("session:init", sessionInitCallback);
    // when session is acknowledged
    socketIo?.on("session:ack", sessionAckCallback);
    // listen to incoming message
    socketIo?.on("message:new", messageNewCallback);
    // acknowledge message sent
    socketIo?.on("message:sent", messageAckCallback);
    // acknowledge message receipt
    socketIo?.on("message:receipt", messageReceiptCallback);

    return () => {
      socketIo?.off("session:init", sessionInitCallback);
      socketIo?.off("session:ack", sessionAckCallback);
      socketIo?.off("message:new", messageNewCallback);
      // socketIo?.close();
    };
    // eslint-disable-next-line
  }, [socketIo]);

  const updateMesssages = async (payload: EncryptedChatMessage[]) => {
    const localDeviceId = `d_${user.id?.slice(-10)}`;
    const messages = await decryptChatMessages(user.id, localDeviceId, payload);
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, ...messages],
    }));
  };

  return (
    <ConvoSocketIoContext.Provider
      value={{ ...state, convoSocketIo: socketIo, updateMesssages }}
    >
      {props.children}
    </ConvoSocketIoContext.Provider>
  );
};

export const useConvoSocketIoContext = (): SocketContextType =>
  useContext(ConvoSocketIoContext);

export default ConvoSocketIoProvider;
