'use client'
import { Box, CircularProgress, ClickAwayListener, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material';
import React, { useState } from 'react'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SearchVideoCard from './SearchVideoCard';
import { useNotifications } from '@toolpad/core';
import debounce  from 'lodash/debounce';
// import { searchVideos } from '@/lib/actions/stream';

type LocalState = {
  open: boolean;
  searchValue: string;
  searchResult: any[];
  total: number;
  message: string;
  searching?: boolean;
};
const initialState: LocalState = {
  open: false,
  searching: false,
  searchValue: "",
  searchResult: [],
  total: 0,
  message: "",
};
const SearchToolbar = () => {
  const [state, setState] = React.useState<LocalState>(initialState);

  const notif = useNotifications();

  const debounceSearch = React.useRef(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 3) {
        setState((prev) => ({
          ...prev,
          total: 0,
          searchResult: [],
          message: "Type 3 chars & above ",
        }));
        return
      }
      setState((prev) => ({ ...prev, searching: true }));
      // const result = await searchVideos(searchTerm);
      // if (!result.data) {
      //   setState((prev) => ({
      //     ...prev,
      //     total: 0,
      //     searchResult: [],
      //     message: result.message,
      //     searching: false,
      //   }));
      //   return notif.show(result.message, {
      //     severity: "error",
      //     autoHideDuration: 3000,
      //   });
      // }
      // setState((prev) => ({
      //   ...prev,
      //   total: result.data.total,
      //   searchResult: result.data.videos,
      //   message: `We have ${result.data.total} result`,
      //   searching: false,
      // }));
    }, 700)
  ).current;

  const handleClick = (open: boolean) => {
    setState((prev) => ({ ...prev, open }));
  };

  const handleClickAway = () => {
    setState((prev) => ({ ...prev, ...initialState, open: false }));
  };

  const handleSearch = (text: string) => {
    setState((prev) => ({ ...prev, searchValue: text }));
    debounceSearch(text);
  };
  return (
   <React.Fragment>
      <ClickAwayListener onClickAway={() => handleClickAway()}>
      <Box>
        <Box
          sx={{
            display: { xs: state.open ? "none" : "inline", md: "none" },
          }}
          onClick={() => handleClick(true)}
        >
          <Tooltip title="Search" enterDelay={1000}>
              <IconButton type="button" aria-label="search" size="small">
                <SearchOutlinedIcon />
              </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: { xs: state.open ? "flex" : "none", md: "flex" },
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
            position: "absolute",
            width: {lg: "50%", md: "50%", sm: "100%", xs: "100%"},
            left: "50%",
            right: "50%",
            transform: "translate(-50%, 0%)",
            zIndex: 9999,
            top: 10,
            px: { lg: 0, md: 0, sm: 2, xs: 2}
          }}
        >
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            onFocus={() => !state.open && handleClick(true)}
            onClick={() => !state.open && handleClick(true)}
            onChange={(ev) => handleSearch(ev.target.value)}
            value={state.searchValue}
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={(ev) => {
                      ev.stopPropagation()
                      ev.preventDefault();
                      handleClickAway()
                    }}
                    type="button"
                    aria-label="search"
                    size="small"
                  >
                    {state.open  ? <CloseOutlinedIcon /> :<SearchOutlinedIcon />}
                  </IconButton>
                ),
                sx: { pr: 0.5 },
              },
            }}
          />
        </Box>
        {state.open && (
          <Paper
            sx={{
              mt: {lg: 3, md: 3, sm: -10, xs: -10},
              zIndex: 10,
              borderRadius: 1,
              minHeight: "250px",
              maxHeight: "100vh",
              overflowY: "auto",
              position: "absolute",
              width: {lg: "50%", md: "50%", sm: "100%", xs: "100%"},
              left: "50%",
              right: "50%",
              transform: "translate(-50%, 0%)",
              px: 1,
              pb: 10,
              pt: { lg: 0, md: 0, sm: 13, xs: 13}
            }}
            elevation={3}
          >
            <Typography textAlign={"center"}>{state.message}</Typography>
            {state.searching && (
              <Box sx={{ display: "block", textAlign: "center" }}>
                <CircularProgress size={16} color="info" />
              </Box>
            )}
            {state.searchResult.map((item) => (
              <SearchVideoCard
                key={item.id}
                item={item}
                searchQuery={state.searchValue}
                handleClickAway={handleClickAway}
              />
            ))}
          </Paper>
        )}
      </Box>
        </ClickAwayListener>
      
   </React.Fragment>
  )
}

export default SearchToolbar