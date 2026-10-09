"use client";
import { searchHref } from "@/utils/post-text";
import {
  Box,
  Button,
  CardMedia,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import Link from "next/link";
import { TrendingTopics } from "@/types";
import useSWR from "swr";
import { getTrendingTopics } from "@/lib/discover";
import { useAuthSession, useContinentsCountries } from "@/hooks";
import { formatNumber } from "@/utils";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  slotProps: { paper: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  } },
};

const DisplayClient = ({ country, trends }: { trends: TrendingTopics[], country?: string }) => {
  const { token, user } = useAuthSession()
  const { data, error, isLoading, mutate } =
    useSWR({ country: country === "Worldwide" ? null : country, limit: 50, id: user.id }, ({ id, ...rest }) => getTrendingTopics(rest, token), {
      keepPreviousData: true,
      refreshWhenOffline: false,
      revalidateOnReconnect: true,
      fallbackData: trends,
      revalidateOnMount: false,
    });

  return (
    <Box
    >
      {(!data || data.length === 0) && <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          overflow: "hidden",
          width: "100%",
        }}
      >
        <CardMedia
          component={"img"}
          image={"/no-data.svg"}
          sx={{ height: 300, width: 300 }}
        />
        {/* <Typography>{!isError404 ? await result.text() : null} </Typography> */}
      </Box>}
      <Grid container spacing={1}>
        {data.map((item, index) => (
          <Grid key={index} size={{ xs: 12, md: 12, lg: 6, xl: 6 }} sx={[
            (theme) => ({
              border: `1px solid ${theme.vars.palette.divider}`,
              mt: 1,
              borderRadius: 2,
            }),
          ]}>
            <Box sx={{ margin: 1 }}>
              <Stack
                direction={"row"}
                sx={{
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                <Typography
                  color="textDisabled"
                  variant="caption"
                >{`${index + 1} . Trending in ${item.country}`}</Typography>
                <IconButton aria-label="More options" size="small">
                  <MoreHorizOutlinedIcon />
                </IconButton>
              </Stack>
              <Typography component={Link} href={searchHref(item.trend)} variant="subtitle1" sx={{ display: "block", color: "text.primary", textDecoration: "none", "&:hover": { color: "primary.main" } }}>{item.trend}</Typography>
              <Typography
                color="textDisabled"
                variant="caption"
              >{`${formatNumber(item.mentions)} Posts - ${formatNumber(item.users)} Users`}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};


const PageClient = ({ trends }: { trends: TrendingTopics[] }) => {
  const [state, setState] = useState<{ country?: string }>({ country: "Worldwide" })

  const { countries } = useContinentsCountries()

  const handleChange = (val: string) => {
    setState(prev => ({ ...prev, country: val }))
  }

  return (
    <Box
      sx={{ mt: 1 }}
    >
      <Grid
        container
        sx={{
          alignItems: "center",
          my: 2
        }}>
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              fontWeight: 600
            }}>
            Check What's Happening Worldwide
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
          <Box sx={{ minWidth: 120 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="country-simple-select-label">Country</InputLabel>
              <Select
                labelId="country-simple-select-label"
                id="country-simple-select"
                value={state.country}
                label="Country"
                onChange={ev => handleChange(ev.target.value)}
                MenuProps={MenuProps}
              >
                <MenuItem value={"Worldwide"}>Worldwide</MenuItem>
                {countries.map(item => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>
      <DisplayClient trends={trends} country={state.country} />
    </Box>
  );
};

export default PageClient;
