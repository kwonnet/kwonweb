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
import { votePollPost } from "@/lib/posts";
import { useAuthSession } from "@/hooks";
import { formatDateTime, formatNumber } from "@/utils";

function calVotes(votes: number, totalVotes: number) {
  if (votes === 0 || totalVotes === 0) return `0%`;
  const percent = (votes / totalVotes) * 100;
  const round = Math.round(percent);
  return round !== 0 ? round + "%" : percent.toFixed(2) + "%";
}

const DisplayPollItem = ({
  post,
  fullwidth,
}: {
  post: FeedPost;
  fullwidth?: boolean;
}) => {
  const { token, user } = useAuthSession();

  const [state, setState] = useState<{ selected: string[]; elasped: boolean }>({
    selected: [],
    elasped: false,
  });

  const poll = post?.poll;

  const handleSelect = async (
    ev: React.MouseEvent<HTMLLIElement, MouseEvent>,
    id: string
  ) => {
    ev.preventDefault();
    ev.stopPropagation();
    setState((prev) => {
      if (prev.selected.includes(id)) {
        return { ...prev, selected: prev.selected.filter((el) => el !== id) };
      }
      return { ...prev, selected: [...prev.selected, id] };
    });
    await votePollPost(post.id, id, token);
  };
  if (!poll) return <div />;

  const pollOptions = fullwidth ? poll.options : poll?.options?.slice(0, 5);

  const isNotVoting = poll?.canVote ? false : true;

  const totalVotes = poll?.options.reduce((acc, curr) => acc + curr.votes, 0);

  const isCreator = post.userId === user.id;

  if (poll?.isMultiVote) {
    return (
      <React.Fragment>
        <Box sx={{ mb: 1 }}>
          {pollOptions.map((item) => (
            <ListItem
              key={item.id}
              onClick={(ev) =>
                state.selected.includes(item.id) ||
                poll.isExpired ||
                isNotVoting ||
                poll.hasVoted ||
                state.elasped ||
                isCreator ||
                item.voters.length > 0
                  ? {}
                  : handleSelect(ev, item.id)
              }
              disableGutters
              disablePadding
              dense={true}
              sx={{ pb: 0.5 }}
              secondaryAction={
                post.userId === user.id || poll.isExpired ? (
                  <Typography
                    variant="caption"
                    color="textDisabled"
                    sx={{ px: 1 }}

                  >
                    {item.votes > 0
                      ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                      : null}
                  </Typography>
                ) : poll.hasVoted ? (
                  item.voters.map((voter) => {
                    if (voter.userId !== user.id) return null;
                    return (
                      <Typography
                        variant="caption"
                        color="textDisabled"
                        sx={{ px: 1 }}
                        key={voter.id}
                      >
                        {item.votes > 0
                          ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                          : null}
                      </Typography>
                    );
                  })
                ) : null
              }
            >
              <ListItemButton
                disabled={
                  state.selected.includes(item.id) ||
                  poll.hasVoted ||
                  poll.isExpired ||
                  isNotVoting ||
                  state.elasped ||
                  isCreator ||
                  item.voters.length > 0
                }
                sx={{
                  border: "0.5px solid grey",
                  borderRadius: 30,
                  ...(poll?.isMultiVote && { p: 0 }),
                }}
                role={undefined}
                dense={true}
              >
                {poll?.isMultiVote && (
                  <ListItemIcon>
                    <Checkbox
                      edge="end"
                      color="default"
                      checked={
                        (poll.isExpired && item.votes > 0) ||
                        state.selected.includes(item.id) ||
                        item.voters.length > 0
                      }
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ "aria-labelledby": item.id }}
                    />
                  </ListItemIcon>
                )}
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
            {!poll.isExpired ? (
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
                    date={poll?.expireAt}
                    onComplete={() =>
                      setState((prev) => ({ ...prev, elasped: true }))
                    }
                  />
                </Typography>
              </Stack>
            ) : (
              <Stack direction={"row"} sx={{ alignItems: "center" }}>
                <Typography
                  color="textDisabled"
                  variant="caption"
                  sx={{ fontSize: 10 }}
                >
                  Ended:
                </Typography>
                <Typography
                  color="textDisabled"
                  variant="caption"
                  sx={{ fontSize: 10 }}
                >
                  {formatDateTime(poll?.expireAt)}
                </Typography>
              </Stack>
            )}
          </Box>

          {!fullwidth && (
            <Box sx={{ py: 0.7 }}>
              {poll?.options?.length > 5 && (
                <Button
                  variant="text"
                  color="inherit"
                  sx={{ textTransform: "lowercase" }}
                  size="small"
                  href={`/${post?.user?.username}/feed/${post.id}`}
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
  }

  const isMax = state.selected.length === 1;

  return (
    <React.Fragment>
      <Box sx={{ mb: 1 }}>
        {pollOptions?.map((item) => (
          <ListItem
            key={item.id}
            onClick={(ev) =>
              poll.isExpired ||
              isMax ||
              poll.hasVoted ||
              isNotVoting ||
              state.elasped ||
              state.selected.includes(item.id) ||
              isCreator ||
              item.voters.length > 0
                ? {}
                : handleSelect(ev, item.id)
            }
            disableGutters
            disablePadding
            dense={true}
            sx={{ pb: 0.5 }}
            secondaryAction={
              post.userId === user.id || poll.isExpired ? (
                <Typography
                  variant="caption"
                  color="textDisabled"
                  sx={{ px: 1 }}
                >
                  {item.votes > 0
                    ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                    : null}
                </Typography>
              ) : poll.hasVoted ? (
                item.voters.map((voter) => {
                  if (voter.userId !== user.id) return null;
                  return (
                    <Typography
                      variant="caption"
                      color="textDisabled"
                      sx={{ px: 1 }}
                      key={voter.id}
                    >
                      {item.votes > 0
                        ? `${formatNumber(item.votes)} ~ ${calVotes(item.votes, totalVotes)}`
                        : null}
                    </Typography>
                  );
                })
              ) : null
            }
          >
            <ListItemButton
              disabled={
                state.selected.includes(item.id) ||
                poll.hasVoted ||
                isMax ||
                poll.isExpired ||
                state.elasped ||
                isCreator ||
                isNotVoting
              }
              sx={{ border: "0.5px solid grey", borderRadius: 30 }}
              role={undefined}
              dense={true}
            >
              <ListItemIcon>
                <Checkbox
                  color="default"
                  edge="end"
                  checked={
                    (poll.isExpired && item.votes > 0) ||
                    state.selected.includes(item.id) ||
                    item.voters.length > 0
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
          {!poll.isExpired ? (
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
                  date={poll?.expireAt}
                  onComplete={() =>
                    setState((prev) => ({ ...prev, elasped: true }))
                  }
                />
              </Typography>
            </Stack>
          ) : (
            <Stack direction={"row"} sx={{ alignItems: "center" }}>
              <Typography
                color="textDisabled"
                variant="caption"
                sx={{ fontSize: 10 }}
              >
                Ended:
              </Typography>
              <Typography
                color="textDisabled"
                variant="caption"
                sx={{ fontSize: 10 }}
              >
                {formatDateTime(poll?.expireAt)}
              </Typography>
            </Stack>
          )}
        </Box>

        {!fullwidth && (
          <Box sx={{ py: 0.7 }}>
            {poll?.options?.length > 5 && (
              <Button
                variant="text"
                color="inherit"
                sx={{ textTransform: "lowercase" }}
                size="small"
                href={`/${post?.user?.username}/feed/${post.id}?u=${user.id}`}
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

export default DisplayPollItem;
