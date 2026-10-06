"use client";
import { apiBaseUrl, apiUrl, appUrl } from "@/config";
import { useAuthSession } from "@/hooks";
import {
  ChatMessage,
  GameEventEnum,
  GameStatusEnum,
  ThemedGameScore,
  ThemedGameQuestion,
  GamePlayer,
  GameWallet,
  GameEnergy,
  GameRoomInfo,
  GameRoomAnswer,
} from "@/types";
import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {

  socketIo?: Socket;
  gameSocketIo?: Socket
  convoSocketIo?: Socket
};

// const initialState: SocketContextType = {

//   socketIo: undefined,

//   gameSocketIo: undefined,

//   convoSocketIo: undefined

// };

const SocketIoContext = createContext<SocketContextType>({});

const SocketIoProvider = (props: any) => {
  const [state, setState] = useState<SocketContextType>({});

  const { token, user } = useAuthSession();
  const latestToken = useRef(token);
  const activeSockets = useRef<{identity: string; sockets: Socket[]} | null>(null);
  useEffect(() => {latestToken.current = token;}, [token]);
  const identity = token && user?.id ? `${user.id}:${user.sessionId ?? 'legacy'}` : null;

  useEffect(() => {
    if (!identity) {
      setState({});
      return;
    }
    const socketConn = io(apiBaseUrl, {
      withCredentials: true,
      auth: callback => callback({token: latestToken.current}),
    });

     // the "games" namespace
    const gameSocketIo = io(`${apiBaseUrl}/games`, {
      withCredentials: true,
      auth: callback => callback({token: latestToken.current}),
    });
    // the "conversation" namespace
    const convoSocketIo = io(`${apiBaseUrl}/conversations`, {
      withCredentials: true,
      auth: callback => callback({token: latestToken.current}),
    }); 

    setState((prev) => ({ ...prev, socketIo: socketConn, gameSocketIo, convoSocketIo }));

    socketConn?.on("connect", () => {
      console.log("Connected TO SERVER", socketConn.id);
    });
    activeSockets.current = {identity, sockets: [socketConn, gameSocketIo, convoSocketIo]};

    socketConn?.on("connect_error", (ev) => {
      console.log("Socket connection error ", ev )
    })

    return () => {
      activeSockets.current = null;
      socketConn.close();
      gameSocketIo.close();
      convoSocketIo.close();
    };
  }, [identity]);

  useEffect(() => {
    const active = activeSockets.current;
    if (!token || active?.identity !== identity) return;
    // Authentication failures stop automatic Socket.IO retries. Renewed credentials
    // can retry a failed handshake without replacing healthy connections.
    for (const socket of active.sockets) if (!socket.connected && socket.active === false) socket.connect();
  }, [token, identity]);

  return (
    <SocketIoContext.Provider value={state}>
      {props.children}
    </SocketIoContext.Provider>
  );
};

export const useSocketIoContext = (): SocketContextType => useContext(SocketIoContext);

export default SocketIoProvider;
