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
import { createContext, useContext, useEffect, useState } from "react";
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

  const { token } = useAuthSession();

  useEffect(() => {
    const socketConn = io(apiBaseUrl, {
      withCredentials: true,
      auth: { token },
    });

     // the "games" namespace
    const gameSocketIo = io(`${apiBaseUrl}/games`, {
      withCredentials: true,
      auth: { token },
    });
    // the "conversation" namespace
    const convoSocketIo = io(`${apiBaseUrl}/conversations`, {
      withCredentials: true,
      auth: { token },
    }); 

    setState((prev) => ({ ...prev, socketIo: socketConn, gameSocketIo, convoSocketIo }));

    socketConn?.on("connect", () => {
      console.log("Connected TO SERVER", socketConn.id);
    });

    socketConn?.on("error", (ev) => {
      console.log("Socket connection error ", ev )
    })

    return () => {

      socketConn.close();
    };
  // eslint-disable-next-line
  }, []);

  return (
    <SocketIoContext.Provider value={{ ...state }}>
      {props.children}
    </SocketIoContext.Provider>
  );
};

export const useSocketIoContext = (): SocketContextType => useContext(SocketIoContext);

export default SocketIoProvider;
