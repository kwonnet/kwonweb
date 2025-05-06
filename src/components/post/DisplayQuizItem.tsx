"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { FeedPost } from "@/types";
import Link from "next/link";
import Countdown from "react-countdown";
import { voteQuizPost } from "@/lib/posts";
import { useAuthSession } from "@/hooks";
import { formatDateTime, formatNumber } from "@/utils";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import NotInterestedOutlinedIcon from "@mui/icons-material/NotInterestedOutlined";

function calVotes(votes: number, totalVotes: number) {
  if (votes === 0 || totalVotes === 0) return `0%`;
  const percent = (votes / totalVotes) * 100;
  const round = Math.round(percent);
  return round !== 0 ? round + "%" : percent.toFixed(2) + "%";
}

function updateQuiz(quiz: FeedPost['quiz'], optionId: string, userId: string){
  if(!quiz) return quiz
  return {quiz: {...quiz, hasVoted: true, options: quiz?.options.map((opt) =>
    opt.id === optionId
      ? {
          ...opt,
          votes: opt.votes + 1,
          participants: [{ ...opt, optionId: opt.id, userId }],
        }
      : opt
  )} }
}

const DisplayQuizItem = ({
  post,
  fullwidth,
}: {
  post: FeedPost;
  fullwidth?: boolean;
}) => {
  const { token, user } = useAuthSession();

  const [state, setState] = useState<{
    elasped: boolean;
    post: FeedPost;
    showConfetti: boolean;
  }>({
    elasped: false,
    showConfetti: false,
    post,
  });

  const quiz = state.post?.quiz;

  const handleSelect = async (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>,
    id: string
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => {
      return {
        ...prev,
        post: {
          ...prev.post,
          ...(prev?.post?.quiz && updateQuiz(prev.post.quiz, id, user.id)),
        },
      };
       
    });
    await voteQuizPost(post.id, id, token);
  };
  if (!quiz) return <div />;

  const quizOptions = fullwidth ? quiz.options : quiz?.options?.slice(0, 5);

  const isNotVoting = quiz?.canVote ? false : true;

  const totalVotes = quiz?.options.reduce((acc, curr) => acc + curr.votes, 0);

  const isCreator = post.userId === user.id;

  return (
    <React.Fragment>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" color={quiz.isPaid ? "info" : "warning"}>
          {quiz.isPaid
            ? `This is a rewarded quiz. Reward of ${formatNumber(quiz.rewardAmount)} coins will be randomly shared to ${formatNumber(quiz.maxWinners)} winners. Good luck`
            : "This quiz is free. No reward for participants. Good luck."}
        </Typography>
        {quizOptions?.map((item) => (
          <ListItem
            key={item.id}
            onClick={(ev) =>
              quiz.isExpired ||
              quiz.hasVoted ||
              isNotVoting ||
              state.elasped ||
              item.participants.length > 0 ||
              isCreator
                ? {}
                : handleSelect(ev, item.id)
            }
            disableGutters
            disablePadding
            dense={true}
            sx={{ pb: 0.5 }}
            secondaryAction={
              state.post.userId === user.id || quiz.isExpired ? (
                <Typography
                  variant="caption"
                  color="textDisabled"
                  sx={{ px: 1 }}
                >
                  {item.votes > 0
                    ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                    : null}
                </Typography>
              ) : quiz.hasVoted ? (
                item.participants.map((p) => {
                  if (p.userId !== user.id) return null;
                  if (p.isCorrect && item.id === p.optionId) {
                    return (
                      <Stack key={p.id} direction="row" sx={{ alignItems: "center" }}>
                        <DoneAllOutlinedIcon
                          color="success"
                          fontSize="small"
                        />
                        <Typography
                          variant="caption"
                          color="textDisabled"
                          sx={{ px: 1 }}
                        >
                          {item.votes > 0
                            ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                            : null}
                        </Typography>
                      </Stack>
                    );
                  }
                  return (
                    <Stack key={p.id} direction="row" sx={{ alignItems: "center" }}>
                      <NotInterestedOutlinedIcon
                        color="error"
                        fontSize="small"
                        key={p.id}
                      />
                      <Typography
                        variant="caption"
                        color="textDisabled"
                        sx={{ px: 1 }}
                      >
                        {item.votes > 0
                          ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                          : null}
                      </Typography>
                    </Stack>
                  );
                })
              ) : null
            }
          >
            <ListItemButton
              disabled={
                quiz.hasVoted ||
                quiz.isExpired ||
                state.elasped ||
                isNotVoting ||
                isCreator
              }
              sx={{ border: "0.5px solid grey" }}
              role={undefined}
              dense={true}
            >
              <ListItemIcon>
                <Checkbox
                  color="default"
                  edge="end"
                  checked={
                    (quiz.isExpired && item.isCorrect) ||
                    item.participants.length > 0 || (post.userId === user.id && item.isCorrect)
                  }
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ "aria-labelledby": item.id }}
                />
              </ListItemIcon>
              <ListItemText id={item.id} primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        <Box sx={{ left: 0, position: "absolute" }}>
          {totalVotes > 0 && (
            <Stack direction={"row"} sx={{ alignItems: "center" }} gap={1}>
              <Typography
                sx={{ fontSize: 10 }}
                color="textDisabled"
                variant="caption"
              >
                Participants
              </Typography>
              <Typography
                sx={{ fontSize: 10 }}
                color="textDisabled"
                variant="caption"
              >
                {formatNumber(totalVotes)}
              </Typography>
            </Stack>
          )}
        </Box>

        <Box sx={{ right: 5, position: "absolute" }}>
          {!quiz.isExpired ? (
            <Stack direction={"row"} sx={{ alignItems: "center" }} gap={1}>
              <Typography
                color="textDisabled"
                variant="caption"
                sx={{ fontSize: 10 }}
              >
                Ends:
              </Typography>
              <Typography sx={{ fontSize: 10 }}>
                <Countdown
                  date={quiz?.expireAt}
                  onComplete={() =>
                    setState((prev) => ({ ...prev, elasped: true }))
                  }
                />
              </Typography>
            </Stack>
          ) : (
            <Stack direction={"row"} sx={{ alignItems: "center" }} gap={1}>
              <Typography
                color="textDisabled"
                variant="caption"
                sx={{ fontSize: 10 }}
              >
                Ended:
              </Typography>
              <Typography
                suppressHydrationWarning
                color="textDisabled"
                variant="caption"
                sx={{ fontSize: 10 }}
              >
                {formatDateTime(quiz?.expireAt)}
              </Typography>
            </Stack>
          )}
        </Box>

        {!fullwidth && (
          <Box sx={{ py: 0.7 }}>
            {quiz?.options?.length > 5 && (
              <Button
                variant="text"
                color="inherit"
                sx={{ textTransform: "lowercase" }}
                size="small"
                href={`/${post?.author?.username}/feed/${post.id}}`}
                LinkComponent={Link}
              >
                Show more
              </Button>
            )}
          </Box>
        )}
      </Box>
    </React.Fragment>
  );
};

export default DisplayQuizItem;
