"use client";
import { CoinsSvgIcon } from "@/components/svg";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "@/components/common/PageHeader";
import { Task } from "@/types";
import { rewardTask } from "@/lib/tasks";
import { getErrorMessage } from "@/utils";
import { useAuthSession } from "@/hooks";


function hasElapsedGivenMinutes(fromTime: string | Date, minutes: number) {
  const now = new Date(); // Current time

  const givenTime = new Date(fromTime); // Convert the provided time to a Date object

  // Calculate the difference in minutes
  const elapsedMinutes = (now.getTime() - givenTime.getTime()) / (1000 * 60);

  // Check if the elapsed time is greater than or equal to the given minutes
  return elapsedMinutes >= minutes;
}

const TaskClient = ({ task }: { task: Task }) => {
  const router = useRouter();

  const { token } = useAuthSession()

  const [state, setState] = useState<{ timer?: string; code?: string, loading?: boolean }>({});

  const handlePerformTask = () => {
    setState((prev) => ({ ...prev, timer: new Date().toISOString() }));
  };

  const handleVerifyTask = async () => {
    try {
      // check timer and reward user
      const isElapsed = hasElapsedGivenMinutes(
        state.timer ?? new Date().toISOString(),
        1
      );
      if (!isElapsed)
        return toast.warn(`Task not completed, wait for a minute & try again`);

      if (task.code && state.code !== task.code) {
        return toast.error(`Invalid code, try again`);
      }
      setState((prev) => ({ ...prev, loading: true }));
      await rewardTask({id: task.id, code: task.code }, token) 
      toast.info(`Task completed & rewarded successfully `);
      router.push("/tasks")
    } catch (error) {
      toast.error(getErrorMessage(error));
    }finally{
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const displayForm = () => {
    if ((!task.code && !state.timer) || (task.code && !state.timer)) {
      return (
        <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
          <Button
            size="large"
            color="error"
            variant="contained"
            disabled={true}
          >
            Verify Task
          </Button>
        </Box>
      );
    }
    if (state.timer && !task.code) {
      return (
        <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
          <Button
            color="inherit"
            variant="outlined"
            size="large"
            onClick={() => handleVerifyTask()}
            disabled={state.loading}
            loading={state.loading}
          >
            Verify Task
          </Button>
        </Box>
      );
    }

    return (
      <Box>
        <Box sx={{ my: 1 }}>
          <TextField
            value={state.code}
            onChange={(ev) =>
              setState((prev) => ({ ...prev, code: ev.target.value }))
            }
            fullWidth
            placeholder="Enter code..."
            // sx={{
            //   "& .MuiInputBase-input": {
            //     color: (theme) => theme.vars.palette.gradient.contrastText, // Input text color
            //   },
            // }}
          />
        </Box>

        <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
          <Button
            size="large"
            onClick={() => handleVerifyTask()}
            color="warning"
            variant="outlined"
            disabled={state.loading}
            loading={state.loading}
          >
            Verify Task
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title="Task" />
        <Box>
          <Paper
            sx={[
              (theme) => ({
                p: 2,
                mb: 1,
                // background: theme.vars.palette.gradient[700],
                // color: theme.vars.palette.gradient.contrastText,
                ...theme.applyStyles("dark", {
                  background: theme.vars.palette.shades[500],
                }),
              }),
            ]}
            key={task.id}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontFamily: "PlayFair", fontWeight: "bold" }}
              >
                {task.title}
              </Typography>
              <Typography sx={{ fontFamily: "PlayFair" }} variant="caption">
                {task.description}
              </Typography>
              <Stack direction={"row"} sx={{ alignItems: "center" }}>
                <CoinsSvgIcon style={{ fontSize: 16 }} />
                <Typography color="warning">+{task.reward}</Typography>
              </Stack>
              <Box sx={{ display: "block", textAlign: "center", my: 2 }}>
                <Button
                  target="_blank"
                  color="inherit"
                  variant="outlined"
                  size="large"
                  LinkComponent={Link}
                  href={task.url}
                  onClick={() => handlePerformTask()}
                >
                  Perform Task
                </Button>
              </Box>
              {displayForm()}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default TaskClient;
