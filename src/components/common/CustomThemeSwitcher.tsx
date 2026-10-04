"use client";
import {
  Box,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  useColorScheme,
} from "@mui/material";
import React from "react";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import Brightness4OutlinedIcon from "@mui/icons-material/Brightness4Outlined";

export default function CustomThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { setMode, mode } = useColorScheme();

  const handleThemeChange = React.useCallback(
    (
      ev: React.MouseEvent<HTMLButtonElement, MouseEvent>,
      _mode: "light" | "dark" | "system"
    ) => {
      ev.preventDefault();
      setMode(_mode);
    },
    [setMode]
  );
  return (
    <React.Fragment>
      <Box
        sx={{
          ml: -1,
          position: "sticky",
          bottom: 0,
          left: 0,
          zIndex: 9999
        }}>
        <Tooltip title="Theme" enterDelay={1000}>
          <Stack direction={compact ? "column" : "row"}>
            <IconButton
              onClick={(ev) => handleThemeChange(ev, "light")}
              aria-label="light mode"
            >
              <LightModeOutlinedIcon
                sx={[
                  (theme) => ({
                    color:
                      mode === "light"
                        ? `${theme.vars.palette.info.light} !important`
                        : "",
                  }),
                ]}
              />
            </IconButton>
            <Divider orientation="vertical" />
            <IconButton
              onClick={(ev) => handleThemeChange(ev, "system")}
              aria-label="system mode"
            >
              <Brightness4OutlinedIcon
                sx={[
                  (theme) => ({
                    color:
                      mode === "system"
                        ? `${theme.vars.palette.info.light} !important`
                        : "",
                  }),
                ]}
              />
            </IconButton>
            <Divider orientation="vertical" variant="fullWidth" />
            <IconButton
              onClick={(ev) => handleThemeChange(ev, "dark")}
              aria-label="Dark mode"
            >
              <DarkModeOutlinedIcon
                sx={[
                  (theme) => ({
                    color:
                      mode === "dark"
                        ? `${theme.vars.palette.info.light} !important`
                        : "",
                  }),
                ]}
              />
            </IconButton>
          </Stack>
        </Tooltip>
      </Box>
    </React.Fragment>
  );
}
