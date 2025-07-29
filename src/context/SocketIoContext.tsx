"use client";
import { apiBaseUrl, apiUrl, appUrl } from "@/config";
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
  isJoined: boolean;
  messages: ChatMessage[];
  status?: GameStatusEnum;
  countdown: number;
  socketIo: Socket | null;
  roomPlayers: GamePlayer[];
  leaderboard: GamePlayer[];
  notifMessage: string;
  question?: ThemedGameQuestion;
  gameScores: ThemedGameScore[];
  gameRoomInfo?: GameRoomInfo;
  roomAnswers: GameRoomAnswer[]
  monthTotalPlayers: number;
  weekTotalPlayers: number;
  todayTotalPlayers: number;
  energy?: GameEnergy;
  wallet?: GameWallet;
  resetState: () => void;
  updateSocketState: (params: Partial<SocketContextType>) => void;
};

const initialState: SocketContextType = {
  messages: [],
  countdown: 0,
  socketIo: null,
  roomPlayers: [],
  leaderboard: [],
  gameScores: [],
  roomAnswers: [],
  notifMessage: "",
  monthTotalPlayers: 0,
  weekTotalPlayers: 0,
  todayTotalPlayers: 0,
  resetState: () => {},
  updateSocketState: ({}) => {},
  energy: undefined,
  wallet: undefined,
  isJoined: false
};

const SocketIoContext = createContext<SocketContextType>(initialState);

const SocketIoProvider = (props: any) => {
  const [state, setState] = useState<SocketContextType>(initialState);

  const { data: session } = useSession();

  const user = session?.user
  const token  = user?.accessToken

  useEffect(() => {
    const socketConn = io(apiBaseUrl, {
      withCredentials: true,
      auth: { token },
    });


    console.log("socket.io connected ", socketConn.active)


    setState((prev) => ({ ...prev, socketIo: socketConn }));

    function messageCallback(arg: ChatMessage) {
      console.log(arg);
      setState((prev) => ({ ...prev, messages: [...prev.messages, arg] }));
    }

    function roomStateCallback(args: {
      status: GameStatusEnum;
      countdown: number;
    }) {
      setState((prev) => ({
        ...prev,
        ...args,
      }));
    }

    function roomPlayersCallback(roomPlayers: GamePlayer[]) {
      setState((prev) => ({ ...prev, roomPlayers }));
    }

    function notificationCallback(msg: string) {
      setState((prev) => ({ ...prev, notifMessage: msg }));
    }

    function questionCallback(args: {
      question: ThemedGameQuestion;
      message: string;
    }) {
      setState((prev) => ({
        ...prev,
        messages: [],
        question: args.question,
        notifMessage: args.message,
        gameScores: [],
      }));
    }

    function roomScoreCallback(scores: ThemedGameScore[]) {
      setState((prev) => ({ ...prev, gameScores: scores }));
    }

    function countPlayersCallback(arg: {
      monthTotalPlayers: number;
      weekTotalPlayers: number;
      todayTotalPlayers: number;
    }) {
      setState((prev) => ({ ...prev, ...arg }));
    }

    function playerDataCallback(params: {
      energy: GameEnergy;
      wallet: GameWallet;
    }) {
      console.log("GAME_PLAYER_DATA ", params);
      setState((prev) => ({ ...prev, ...params }));
    }

    function gamePowerCallback(params: {
      amount: number;
      gauge: number;
      turbo: number;
      playerId: string;
      catId: string;
    }) {
      console.log("GAME_PLAYER_POWER ", params);
      setState((prev) => ({
        ...prev,
        energy: prev?.energy ? { ...prev.energy, ...params } : prev?.energy,
      }));
    }

    function walletUpdateCallback(params: GameWallet) {
      console.log("GAME_PLAYER_DATA ", params);
      setState((prev) => ({
        ...prev,
        wallet: prev?.wallet ? { ...prev.wallet, ...params } : prev?.wallet,
      }));
    }

    function roomInfoCallback(arg: GameRoomInfo) {
      console.log("GAME_ROOM_INFO ", arg);
      setState((prev) => ({ ...prev, gameRoomInfo: arg }));
    }

    function roomAnswersCallback(answers: GameRoomAnswer[]) {
      console.log("GAME_ROOM_ANSWERS ", answers);
      setState((prev) => ({ ...prev, roomAnswers: answers }));
    }

    socketConn?.on("connect", () => {
      console.log("Connected TO SERVER", socketConn.id);
    });

    socketConn?.on("error", (ev) => {
      console.log("Socket connection error ", ev )
    })

    socketConn?.on(GameEventEnum.MESSAGE, messageCallback);

    socketConn?.on(GameEventEnum.NOTIFY_MESSAGE, notificationCallback);

    socketConn?.on(GameEventEnum.GAME_ROOM_CHAT, () => {});

    socketConn?.on(GameEventEnum.GAME_ROOM_SCORE, roomScoreCallback);

    socketConn?.on(GameEventEnum.GAME_ROOM_STATE, roomStateCallback);

    socketConn?.on(GameEventEnum.GAME_ROOM_PLAYERS, roomPlayersCallback);

    socketConn?.on(GameEventEnum.GAME_ROOM_QUESTION, questionCallback);

    socketConn?.on(GameEventEnum.GAME_TOTAL_PLAYERS, countPlayersCallback);

    socketConn?.on(GameEventEnum.GAME_PLAYER_DATA, playerDataCallback);

    socketConn?.on(GameEventEnum.GAME_PLAYER_ENERGY, gamePowerCallback);

    socketConn?.on(
      GameEventEnum.GAME_PLAYER_WALLET_UPDATE,
      walletUpdateCallback
    );

    socketConn?.on(GameEventEnum.GAME_ROOM_INFO, roomInfoCallback);

    socketConn?.on(GameEventEnum.GAME_ROOM_ANSWERS, roomAnswersCallback);

    // socketConn?.on(GameEventEnum.DISCONNECTED, () => {
    //     setTimeout(() => {

    //     socketConn.connect()

    //     setState((prev) => ({ ...prev, socketIo: socketConn }));
    //     }, 2000);
    // });

    return () => {
      socketConn?.off(GameEventEnum.MESSAGE, messageCallback);
      socketConn?.off(GameEventEnum.NOTIFY_MESSAGE, notificationCallback);
      socketConn?.off(GameEventEnum.GAME_ROOM_CHAT, () => {});
      socketConn?.off(GameEventEnum.GAME_ROOM_SCORE, roomScoreCallback);
      socketConn?.off(GameEventEnum.GAME_ROOM_STATE, roomStateCallback);
      socketConn?.off(GameEventEnum.GAME_ROOM_PLAYERS, roomPlayersCallback);
      socketConn?.off(GameEventEnum.GAME_ROOM_QUESTION, questionCallback);
      socketConn?.off(GameEventEnum.GAME_TOTAL_PLAYERS, countPlayersCallback);
      socketConn?.off(GameEventEnum.GAME_PLAYER_DATA, playerDataCallback);
      socketConn?.off(GameEventEnum.GAME_PLAYER_ENERGY, gamePowerCallback);
      socketConn?.off(
        GameEventEnum.GAME_PLAYER_WALLET_UPDATE,
        walletUpdateCallback
      );
      socketConn?.off(GameEventEnum.GAME_ROOM_INFO, roomInfoCallback);

      socketConn?.off(GameEventEnum.GAME_ROOM_ANSWERS, roomAnswersCallback);


      socketConn.close();
    };
  // eslint-disable-next-line
  }, []);

  const updateSocketState = (params: Partial<SocketContextType>) => {
    setState(prev => ({...prev, ...params}))
  }

  const resetState = () => {
    setState((prev) => ({
      ...initialState,
      resetState: prev.resetState,
      socketIo: prev.socketIo,
    }));
    // window?.location?.reload()
  };

  return (
    <SocketIoContext.Provider value={{ ...state, resetState, updateSocketState }}>
      {props.children}
    </SocketIoContext.Provider>
  );
};

export const useSocketIoContext = (): SocketContextType => useContext(SocketIoContext);

export default SocketIoProvider;
