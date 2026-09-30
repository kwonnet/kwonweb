"use client";
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
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { useSocketIoContext } from "./SocketIoContext";

type SocketContextType = {
  isJoined: boolean;
  messages: ChatMessage[];
  status?: GameStatusEnum;
  countdown: number;
  gameSocketIo?: Socket;
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
  isJoined: false,
  gameSocketIo: undefined
};

const GameSocketIoContext = createContext<SocketContextType>(initialState);

const GameSocketIoProvider = (props: any) => {
    
  const [state, setState] = useState<SocketContextType>(initialState);

  const { gameSocketIo } = useSocketIoContext()


  useEffect(() => {

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

    gameSocketIo?.on("connection", () =>{
        console.log("game namespace connected")
    })

    gameSocketIo?.on(GameEventEnum.MESSAGE, messageCallback);

    gameSocketIo?.on(GameEventEnum.NOTIFY_MESSAGE, notificationCallback);

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_CHAT, () => {});

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_SCORE, roomScoreCallback);

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_STATE, roomStateCallback);

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_PLAYERS, roomPlayersCallback);

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_QUESTION, questionCallback);

    gameSocketIo?.on(GameEventEnum.GAME_TOTAL_PLAYERS, countPlayersCallback);

    gameSocketIo?.on(GameEventEnum.GAME_PLAYER_DATA, playerDataCallback);

    gameSocketIo?.on(GameEventEnum.GAME_PLAYER_ENERGY, gamePowerCallback);

    gameSocketIo?.on(
      GameEventEnum.GAME_PLAYER_WALLET_UPDATE,
      walletUpdateCallback
    );

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_INFO, roomInfoCallback);

    gameSocketIo?.on(GameEventEnum.GAME_ROOM_ANSWERS, roomAnswersCallback);


    return () => {
      gameSocketIo?.off(GameEventEnum.MESSAGE, messageCallback);
      gameSocketIo?.off(GameEventEnum.NOTIFY_MESSAGE, notificationCallback);
      gameSocketIo?.off(GameEventEnum.GAME_ROOM_CHAT, () => {});
      gameSocketIo?.off(GameEventEnum.GAME_ROOM_SCORE, roomScoreCallback);
      gameSocketIo?.off(GameEventEnum.GAME_ROOM_STATE, roomStateCallback);
      gameSocketIo?.off(GameEventEnum.GAME_ROOM_PLAYERS, roomPlayersCallback);
      gameSocketIo?.off(GameEventEnum.GAME_ROOM_QUESTION, questionCallback);
      gameSocketIo?.off(GameEventEnum.GAME_TOTAL_PLAYERS, countPlayersCallback);
      gameSocketIo?.off(GameEventEnum.GAME_PLAYER_DATA, playerDataCallback);
      gameSocketIo?.off(GameEventEnum.GAME_PLAYER_ENERGY, gamePowerCallback);
      gameSocketIo?.off(
        GameEventEnum.GAME_PLAYER_WALLET_UPDATE,
        walletUpdateCallback
      );
      gameSocketIo?.off(GameEventEnum.GAME_ROOM_INFO, roomInfoCallback);

      gameSocketIo?.off(GameEventEnum.GAME_ROOM_ANSWERS, roomAnswersCallback);

      // gameSocketIo?.close();
    };
  }, [gameSocketIo]);

  const updateSocketState = useCallback((params: Partial<SocketContextType>) => {
    setState(prev => ({...prev, ...params}))
  }, [])

  const resetState = useCallback(() => {
    setState((prev) => ({
      ...initialState,
      resetState: prev.resetState,
    }));
    // window?.location?.reload()
  }, [])

  return (
    <GameSocketIoContext.Provider value={{ ...state, resetState, updateSocketState, gameSocketIo }}>
      {props.children}
    </GameSocketIoContext.Provider>
  );
};

export const useGameSocketIoContext = (): SocketContextType => useContext(GameSocketIoContext);

export default GameSocketIoProvider;
