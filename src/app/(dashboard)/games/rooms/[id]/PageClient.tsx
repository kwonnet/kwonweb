"use client";
import {
  ChatBox,
  GameAwards,
  GameInvite,
  GameEnergy,
  GameRoomPlayers,
  GameSubscription,
  LeaderboardTable,
  PlayersTable,
  QuizBox,
  AcronymBox,
  VotingTable,
  TypeManiaBox,
  HangmanBox,
  AnagramBox,
  UnscrambleBox,
  WordMakerBox,
  LuckyWhizBox,
  LuckySpinBox,
  LuckyFlipBox,
  ConfirmDialog,
} from "@/components/games";
import { useSocketIoContext } from "@/context/SocketIoContext";
import {
  ChatMessage,
  GameCatType,
  GameEventEnum,
  GameMode,
  GameStatusEnum,
  GameType,
} from "@/types";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Grid,
  Stack,
  useTheme,
  useMediaQuery,
  Card,
} from "@mui/material";
import { ArrowBackOutlined } from "@mui/icons-material";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import PlayersOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import GamesOutlinedIcon from "@mui/icons-material/GamesOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import { IIdleTimer, useIdleTimer } from "react-idle-timer/legacy";
import { useAuthSession } from "@/hooks";
import PaperLayout from "@/components/games/PaperLayout";
import { useNotifications } from "@/providers/NotificationsProvider";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const buttons = [
  {
    id: 1,
    title: "Play",
    icon: <GamesOutlinedIcon />,
    isSmallOnly: true,
  },
  {
    id: 2,
    title: "Players",
    icon: <PlayersOutlinedIcon />,
    isSmallOnly: false,
  },
  {
    id: 3,
    title: "Ranking",
    icon: <LeaderboardOutlinedIcon />,
    isSmallOnly: false,
  },
  {
    id: 4,
    title: "Rewards",
    icon: <EmojiEventsOutlinedIcon />,
    isSmallOnly: false,
  },
  {
    id: 5,
    title: "Energy",
    icon: <BoltOutlinedIcon />,
    isSmallOnly: false,
  },
  {
    id: 6,
    title: "Wallet",
    icon: <PaidOutlinedIcon />,
    isSmallOnly: false,
  },
  {
    id: 7,
    title: "Invite",
    icon: <GroupAddOutlinedIcon />,
    isSmallOnly: false,
  },
];

const DisplayTabIcons = ({
  activeTab,
  handleTabSelect,
  isSm,
}: {
  activeTab: number;
  handleTabSelect: (tab: number) => void;
  isSm: boolean;
}) => {
  const firstItem = buttons[0];

  return (
    <Stack
      sx={{ justifyContent: "space-between" }}
      direction={"row"}
      spacing={isSm ? 0.1 : 2}
    >
      {isSm && (
        <Stack key={firstItem.id} sx={{ alignItems: "center" }}>
          <IconButton
            sx={[
              (theme) => ({
                boxShadow: 5,
                ...(activeTab === firstItem.id && {
                  background: theme.vars.palette.gradient.D900,
                  color: "common.white",
                }),
              }),
            ]}
            onClick={() => handleTabSelect(firstItem.id)}
            size={isSm ? "medium" : "large"}
          >
            {firstItem.icon}
          </IconButton>
          <Typography
            sx={{ fontFamily: "PlayFair", fontSize: { lg: "auto", md: "auto", sm: "10px", xs: "8px"} }}
            variant="caption"
          >
            {firstItem.title}
          </Typography>
        </Stack>
      )}

      {buttons.slice(1).map((item) => (
        <Stack key={item.id} sx={{ alignItems: "center" }}>
          <IconButton
            sx={[
              (theme) => ({
                boxShadow: 5,
                ...(activeTab === item.id && {
                  background: theme.vars.palette.gradient.D900,
                  color: "common.white",
                }),
              }),
            ]}
            onClick={() => handleTabSelect(item.id)}
            size={isSm ? "medium" : "large"}
          >
            {item.icon}
          </IconButton>
          <Typography
            sx={{ fontFamily: "PlayFair", fontSize: { lg: "auto", md: "auto", sm: "10px", xs: "8px"} }}
            variant="caption"
          >
            {item.title}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

const PageClient = ({
  room,
  buyCoinsComponent,
}: {
  room: { id: string; name: string; catId: string; mode: string };
  buyCoinsComponent: React.ReactNode;
}) => {
  const router = useRouter();
  const {
    gameSocketIo: socketIo,
    status,
    notifMessage,
    countdown,
    messages,
    resetState,
    roomPlayers,
    gameRoomInfo,
    isJoined,
    updateSocketState,
  } = useGameSocketIoContext();

  const notif = useNotifications()
  const notifRef = React.useRef(notif);
  useEffect(() => {notifRef.current = notif;}, [notif]);
  const routerRef = React.useRef(router);
  useEffect(() => {routerRef.current = router;}, [router]);

  const theme = useTheme();

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [state, setState] = useState({
    activeTab: isSmallScreen ? 1 : 2,
    openIdleTimer: false,
    elaspseTimer: 1
  });

  const { user } = useAuthSession();

  const handleSendMessage = (content: string) => {
    if (content.trim()) {
      const newMessage: ChatMessage = {
        id: nanoid(),
        createdAt: new Date().toISOString(),
        playerName: user.username,
        playerId: user.id,
        content,
      };
      socketIo?.emit(GameEventEnum.MESSAGE, newMessage);
    }
  };

  useEffect(() => {
    setState((prev) => ({ ...prev, activeTab: isSmallScreen ? 1 : 2 }));
    return () => {};
  }, [isSmallScreen]);

  useEffect(() => {
    if (!isJoined) {
      socketIo?.emit(
        GameEventEnum.PLAYER_JOINED,
        {roomId: room.id, mode: room.mode},
        (args: { isError: boolean; message: string }) => {
          if (args.isError) return notifRef.current.show(args.message, {severity: "warning", autoHideDuration: 3000});
          console.log("Player joined");
          updateSocketState({isJoined: true});
        }
      );
    }
  }, [socketIo, isJoined, room.id, room.mode, updateSocketState]);

  useEffect(() => {
    const errorCallback = (msg: string) => {
      notifRef.current.show(msg, {severity: "warning", autoHideDuration: 3000});
      routerRef.current.back();
    };
    const actionRejectedCallback = (msg: string) => {
      // A round can close while an answer is in flight. Keep the joined room
      // and its event listeners alive so the player can play the next round.
      notifRef.current.show(msg, {severity: "warning", autoHideDuration: 3000});
    };
    const achievementCallback = (payload: any) => {      
      notifRef.current.show(payload.description, {severity: "success", autoHideDuration: 5000});
    }
    // listen to error callback
    socketIo?.on(GameEventEnum.GAME_ERROR_NOTIFY, errorCallback);
    socketIo?.on(GameEventEnum.GAME_ACTION_REJECTED, actionRejectedCallback);
    // listen to room achievement
    socketIo?.on(GameEventEnum.GAME_ROOM_ACHIEVEMENT, achievementCallback);
    return () => {
      socketIo?.emit(GameEventEnum.DISCONNECTED, room.id);
      socketIo?.off(GameEventEnum.GAME_ERROR_NOTIFY, errorCallback);
      socketIo?.off(GameEventEnum.GAME_ACTION_REJECTED, actionRejectedCallback);
      socketIo?.off(GameEventEnum.GAME_ROOM_ACHIEVEMENT, achievementCallback);
      resetState();
      // updateSocketState({messages: []})
    };
  }, [socketIo, room.id, resetState]);

  

  const onAction = (event?: Event, idleTimer?: IIdleTimer) => {
    if (!idleTimer?.isPrompted()) {
      idleTimer?.activate();
    }
  };

  const onActive = (event?: Event, idleTimer?: IIdleTimer) => {
    if (!idleTimer?.isPrompted()) {
      setState((prev) => ({ ...prev, openIdleTimer: false }));
    }
  };

  const onPrompt = () => {
    setState((prev) => ({ ...prev, openIdleTimer: true }));
  };

  const onIdle = () => {
    updateSocketState({ messages: [] });
    socketIo?.emit(GameEventEnum.DISCONNECTED, room.id);
    setState((prev) => ({ ...prev, openIdleTimer: false }));
    router.back();
  };

  const { activate: activateIdleTimer } = useIdleTimer({
    timeout: 1000 * 60 * state.elaspseTimer,
    promptBeforeIdle: 1000 * 10,
    onAction,
    onActive,
    onPrompt,
    onIdle,
    crossTab: true,
    syncTimers: 200,
    debounce: 1000,
    name: "gm-activity-timer",
  });

  const handleTabSelect = (num: number) => {
    const isWalletTab = num === 6
    setState((prev) => ({ ...prev, elaspseTimer: isWalletTab ? 10 : 1, activeTab: num }));
    // check if user is under wallet tab and increase idle timer and activate
    if(isWalletTab){
      activateIdleTimer();
    }
  };

  const roomViewportRef = useRef<HTMLDivElement>(null);
  const chatPaperRef = useRef<HTMLDivElement>(null);
  const [visibleViewport, setVisibleViewport] = useState<{ height: number; top: number; chatHeight: number }>();

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const top = viewport?.offsetTop ?? 0;
      const roomTop = roomViewportRef.current?.getBoundingClientRect().top ?? 0;
      const chatOffset = (chatPaperRef.current?.getBoundingClientRect().top ?? roomTop + 150) - roomTop;
      const headerHeight = isSmallScreen ? 60 : 70;
      setVisibleViewport({ height, top, chatHeight: Math.max(0, height - headerHeight - chatOffset - 8) });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    if (roomViewportRef.current) observer.observe(roomViewportRef.current);
    schedule();
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isSmallScreen, state.activeTab]);

  const boxHeight = visibleViewport ? `${visibleViewport.chatHeight}px` : "calc(100dvh - 220px)";
  const layoutBoxHeight = `calc(${visibleViewport ? `${visibleViewport.height}px` : "100dvh"} - ${isSmallScreen ? 220 : 250}px)`;
  return (
    <Box
      sx={[
        (theme) => ({
          position: "relative",
          ...theme.applyStyles("dark", {
            background: theme.palette.grey[900],
          }),
        }),
      ]}
    >
      <Container
        maxWidth="xl"
        ref={roomViewportRef}
        sx={{
          height: visibleViewport ? `${Math.max(0, visibleViewport.height - (isSmallScreen ? 60 : 70))}px` : "calc(100dvh - 70px)",
          maxHeight: "100dvh",
          position: "fixed",
          top: (visibleViewport?.top ?? 0) + (isSmallScreen ? 60 : 70),
          overflow: "hidden !important",
        }}
      >
        <Box sx={{}}>
          <Box
            sx={{
              position: "relative",
            }}
          >
            <Grid container spacing={0.5}>
              <Grid sx={{mb: 0}} size={{ lg: 10, md: 10, sm: 12, xs: 12 }}>
                <Box sx={{ position: "relative", mb: 0.5 }}>
                  <Card
                    elevation={3}
                    sx={{
                      borderRadius: 3,
                      boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
                      py: 1,
                      position: "relative",
                      // minHeight: 80,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      <Box sx={{ position: "relative" }}>
                        <IconButton
                          onClick={() => router.back()}
                          sx={{
                            color: "inherit",
                          }}
                        >
                          <ArrowBackOutlined />
                        </IconButton>
                      </Box>
                      <Typography
                        variant="h5"
                        sx={[
                          (theme) => ({
                            fontFamily: "PlayFair",
                            color: (theme) => theme.vars.palette.shades[400],
                            fontWeight: "bold",
                            ...theme.applyStyles("dark", {
                              color: theme.vars.palette.gradient.contrastText,
                            }),
                          }),
                        ]}
                      >
                        {room.name}
                      </Typography>
                      <Box sx={{ pr: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 45,
                            height: 45,
                            border: (theme) =>
                              `1px solid ${theme.palette.primary.light}`,
                            borderRadius: "50%",
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={[
                              (theme) => ({
                                color: theme.vars.palette.shades[400],
                                fontWeight: "bold",
                                ...theme.applyStyles("dark", {
                                  color:
                                    theme.vars.palette.gradient.contrastText,
                                }),
                              }),
                            ]}
                          >
                            {countdown}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        // position: "absolute",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={[
                          (theme) => ({
                            textAlign: "center",
                            fontFamily: "PlayFair",
                            background: theme.vars.palette.primary.dark,
                            backgroundClip: "text",
                            WebkitBackgroundClip: "text",
                            color: "transparent",
                            display: "block",
                            ...theme.applyStyles("dark", {
                              // background: theme.vars.palette.grey[700],
                            }),
                          }),
                        ]}
                      >
                        {notifMessage}
                      </Typography>
                    </Box>
                  </Card>
                </Box>
                <Box
                  sx={{
                    display: {
                      lg: "none",
                      md: "none",
                      sm: "block",
                      xs: "block",
                    },
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
                      borderRadius: 3,
                      py: 1,
                      px: 1,
                    }}
                  >
                    <DisplayTabIcons
                      isSm={true}
                      activeTab={state.activeTab}
                      handleTabSelect={handleTabSelect}
                    />
                  </Card>
                </Box>
              </Grid>
              <Grid
                size={{ lg: 6, md: 6, sm: 12, xs: 12 }}
                sx={{
                  display: "none",
                  order: 1,
                  ...((!isSmallScreen || state.activeTab === 1) && {
                    display: "block",
                  }),
                  ...(isSmallScreen && { order: 2 }),
                }}
              >
                {/* Chat Section */}
                <Paper
                  ref={chatPaperRef}
                  elevation={3}
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
                    height: boxHeight,
                    minHeight: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.TRIVIA && <QuizBox />}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.SPORTS && <QuizBox />}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.COUNTRY && <QuizBox />}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.ACADEMIA && <QuizBox />}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.ACRONYM && (
                      <AcronymBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.TYPEMANIA && (
                      <TypeManiaBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.HANGMAN && (
                      <HangmanBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.ANAGRAM && (
                      <AnagramBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.UNSCRAMBLE && (
                      <UnscrambleBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.WORDMAKER && (
                      <WordMakerBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.LUCKYWHIZ && (
                      <LuckyWhizBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.LUCKYSPIN && (
                      <LuckySpinBox />
                    )}

                  {status === GameStatusEnum.PLAY &&
                    gameRoomInfo?.gameType === GameType.MINDMASH &&
                    gameRoomInfo?.catType === GameCatType.LUCKYFLIP && (
                      <LuckyFlipBox />
                    )}

                  {status === GameStatusEnum.VOTE && <VotingTable />}

                  {status === GameStatusEnum.CHAT && (
                    <ChatBox
                      currentUserId={user.id}
                      onSendMessage={handleSendMessage}
                      hidden={room?.mode?.toUpperCase() === GameMode.SINGLE}
                    />
                  )}
                </Paper>
              </Grid>

              {/* Small Devices */}
              {/* Room players */}
              <Grid
                size={{ lg: 4, md: 4, sm: 12, xs: 12 }}
                sx={{
                  display: "none",
                  order: 2,
                  ...(((isSmallScreen && state.activeTab > 1) ||
                    !isSmallScreen) && { display: "block" }),
                  ...(isSmallScreen && { order: 1 }),
                }}
              >
                <Box sx={{ height: "100%" }}>
                  <Box
                    sx={{
                      display: {
                        lg: "block",
                        md: "block",
                        sm: "none",
                        xs: "none",
                      },
                      mb: 1,
                    }}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.1)",
                        borderRadius: 3,
                        py: 1,
                        px: 1,
                      }}
                    >
                      <DisplayTabIcons
                        isSm={false}
                        activeTab={state.activeTab}
                        handleTabSelect={handleTabSelect}
                      />
                    </Card>
                  </Box>
                  <Box
                    sx={{
                      display: "none",
                      ...(state.activeTab === 2 && { display: "block" }),
                    }}
                  >
                    <PaperLayout boxHeight={layoutBoxHeight}>
                      <GameRoomPlayers
                        players={roomPlayers}
                        currentUserId={user.id}
                      />
                    </PaperLayout>
                  </Box>
                  <Box
                    sx={{
                      display: "none",
                      ...(state.activeTab === 3 && { display: "block" }),
                    }}
                  >
                    <PaperLayout boxHeight={layoutBoxHeight}>
                      <LeaderboardTable
                        currentUserId={user.id}
                        catId={room.catId}
                        mode={room.mode}
                      />
                    </PaperLayout>
                  </Box>

                  <Box
                    sx={{
                      display: "none",
                      ...(state.activeTab === 4 && { display: "block" }),
                    }}
                  >
                    <GameAwards currentUserId={user.id} catId={room.catId} />
                  </Box>

                  <Box
                    sx={{
                      display: "none",
                      ...(state.activeTab === 5 && { display: "block" }),
                    }}
                  >
                    <PaperLayout boxHeight={layoutBoxHeight}>
                      <GameEnergy />
                    </PaperLayout>
                  </Box>

                  <Box
                    sx={{
                      display: "none",
                      ...(state.activeTab === 6 && { display: "block" }),
                    }}
                  >
                    <PaperLayout boxHeight={layoutBoxHeight}>
                      <GameSubscription
                        currentUserId={user.id}
                        catId={room.catId}
                      >
                        {buyCoinsComponent}
                      </GameSubscription>
                    </PaperLayout>
                  </Box>

                  <Box
                    sx={{
                      display: "none",
                      ...(state.activeTab === 7 && { display: "block" }),
                    }}
                  >
                    <PaperLayout boxHeight={layoutBoxHeight}>
                      <GameInvite currentUserId={user.id} catId={room.catId} />
                    </PaperLayout>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
      <ConfirmDialog
        title="User In-activity"
        message="Your session is about to expire. Stay active?"
        cancelText="Leave"
        confirmText="Stay"
        open={state.openIdleTimer}
        onCancel={() => {
          setState((prev) => ({ ...prev, openIdleTimer: false }));
          router.back();
        }}
        onConfirm={() => {
          activateIdleTimer();
          setState((prev) => ({ ...prev, openIdleTimer: false }));
        }}
      />
    </Box>
  );
};

export default PageClient;
