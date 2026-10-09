"use client";
import { Box, CircularProgress, Container, Grid, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Fade } from "react-awesome-reveal";
import { GameEventEnum, GameRoom } from "@/types";
import { toast } from "react-toastify";
import { useNotifications } from "@/providers/NotificationsProvider";
import { useGameSocketIoContext } from "@/context/GameSocketIoContext";

const PageClient = ({
  rooms,
  cat,
}: {
  rooms: GameRoom[];
  cat: { id: string; name: string; mode: string };
}) => {
  const router = useRouter();

  const notif = useNotifications()

  const { gameSocketIo: socketIo, updateSocketState } = useGameSocketIoContext();

  const [state, setState] = useState<{rooms: GameRoom[], clickedRooms: string[], isLoading: boolean  }>({ rooms, clickedRooms: [], isLoading: false });

  useEffect(() => {
    const callback = (args: { roomId: string; count: number }) => {
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          `${cat.mode}-${r.id}` === args.roomId ? { ...r, participants: args.count } : r
        ),
      }));
    };
    socketIo?.on(GameEventEnum.GAME_ROOM_PARTICIPANTS, callback);
    return () => {
      socketIo?.off(GameEventEnum.GAME_ROOM_PARTICIPANTS, callback);
    };
  }, [socketIo, cat.mode]);


  const handleJoinRoom = async (item: GameRoom) => {
    try {
      console.log("room clicked ", item)
      if(state.clickedRooms.includes(item.id)) return;
      console.log("room request sent ", item)
      setState(prev => ({
        ...prev, 
        isLoading: true, 
        clickedRooms: [...prev.clickedRooms, item.id]}
      ))
      const response = await socketIo?.emitWithAck(
        GameEventEnum.PLAYER_JOINED,
        {roomId: item.id, mode: cat.mode}
      );
      
      console.log("Join room response ", response)
      if (response.isError) {
        setState(prev => ({
          ...prev, 
          clickedRooms: prev.clickedRooms.filter(r => r !== item.id)
  
        }))
        return toast.warn(response.message);
      }
      updateSocketState({isJoined: true})
      router.push(`/games/rooms/${item.id}?r_n=${item.name}&r_c=${item.catId}&r_m=${cat.mode}`);
    } catch (error: any) {
      notif.show(error.message, {severity: "error", autoHideDuration: 2500});
      setState(prev => ({
        ...prev, 
        clickedRooms: prev.clickedRooms.filter(r => r !== item.id)
      }))
    }finally{
      setState(prev => ({
        ...prev, 
        isLoading: false, 
      }))
    }
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title={`Rooms`} />
        {/* Bonus section */}
        <Box sx={{ mt: 1 }}>
          <Fade>
            <Box>
              <Grid container spacing={2}>
                {state.rooms.map((item) => (
                  <Grid key={item.id} size={{ lg: 4, md: 4, sm: 12, xs: 12 }}>
                    <Paper
                      onClick={() => state.clickedRooms.includes(item.id) ? {} : handleJoinRoom(item)}
                      sx={[
                        (theme) => ({
                          p: 1,
                          mb: 1,
                          cursor: "pointer",
                          height: "100%",
                          // boxShadow: 5,
                          // background: (state.clickedRooms.includes(item.id) && state.isLoading) ?  theme.vars.palette.gradient[700] : undefined,
                          // color: theme.vars.palette.gradient.contrastText,
                          ...theme.applyStyles("dark", {
                            background: theme.vars.palette.grey[900],
                          }),
                        }),
                      ]}
                    >
                      <Box>
                        <Box sx={{ position: "relative" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 30,
                              height: 30,
                              border: theme => `1px solid ${theme.vars.palette.shades[300]}`,
                              borderRadius: "50%",
                              position: "absolute",
                              right: 1,
                              top: 2,
                            }}
                          >
                            {(state.clickedRooms.includes(item.id) && state.isLoading) ? <Box>
                              <CircularProgress size={20} color="warning" />
                            </Box> : <Typography
                              variant="body1"
                              sx={{ color: "grey.400", fontWeight: "bold" }}
                            >
                              {item.participants}
                            </Typography>}
                            
                          </Box>
                        </Box>
                        <Typography
                          variant="h6"
                          sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: "PlayFair" }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
