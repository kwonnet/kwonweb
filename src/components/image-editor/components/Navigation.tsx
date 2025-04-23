"use client";
import React, { ChangeEvent, FC, useRef, useState } from "react";
import cn from "classnames";
import CropOutlinedIcon from "@mui/icons-material/CropOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import ContrastOutlinedIcon from "@mui/icons-material/ContrastOutlined";
import AdjustOutlinedIcon from "@mui/icons-material/AdjustOutlined";
import DoneAllOutlinedIcon from "@mui/icons-material/DoneAllOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";

interface Props {
  className?: string;
  mode?: string;
  onReset?: () => void;
  onChange?: (mode: string) => void;
  onDownload?: () => void;
}

export const Navigation: FC<Props> = ({
  className,
  onChange,
  onDownload,
  onReset,
  mode,
}) => {
  const [loading, setLoading] = useState(false);

  const setMode = (mode: string) => {
    onChange && onChange(mode);
  };

  const onSaveFile = () => {
    setLoading(true);
    onDownload && onDownload();
    setTimeout(() => {
      setLoading(false);
    }, 700);
  };

  return (
    <Paper
      elevation={2}
      sx={[
        (theme) => ({
          // background: `#1b1a21`,
          height: "60px",
          // borderTop: "1px solid #2b2a30",
          // display: "flex",
          // alignItems: "center",
          // justifyContent: "space-between",
          paddingLeft: "8px",
          paddingRight: "8px",
        }),
      ]}
      className={cn(className)}
    >
      <Stack
        spacing={1}
        direction={"row"}
        sx={{
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          alignItems: "center",
        }}
      >
        <Box>
          <Tooltip title="Crop" sx={{zIndex: 9999999}}>
            <IconButton
              size="medium"
              onClick={() => setMode("crop")}
              focusRipple={mode === "crop"}
              autoFocus={mode === "crop"}
              sx={{
                color: (theme) => theme.vars.palette.grey[400],
                ...(mode === "crop" && {
                  backgroundColor: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`,
                }),
                zIndex: 99999
              }}
            >
              <CropOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title="Saturation">
            <IconButton
              size="medium"
              onClick={() => setMode("saturation")}
              focusRipple={mode === "saturation"}
              autoFocus={mode === "saturation"}
              sx={{
                color: (theme) => theme.vars.palette.grey[400],
                ...(mode === "saturation" && {
                  backgroundColor: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`,
                }),
              }}
            >
              <WaterDropOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title="Brightness">
            <IconButton
              size="medium"
              onClick={() => setMode("brightness")}
              focusRipple={mode === "brightness"}
              autoFocus={mode === "brightness"}
              sx={{
                color: (theme) => theme.vars.palette.grey[400],
                ...(mode === "brightness" && {
                  backgroundColor: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`,
                }),
              }}
            >
              <LightModeOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title="Contrast">
            <IconButton
              size="medium"
              focusRipple={mode === "contrast"}
              autoFocus={mode === "contrast"}
              onClick={() => setMode("contrast")}
              sx={{
                color: (theme) => theme.vars.palette.grey[400],
                ...(mode === "contrast" && {
                  backgroundColor: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`,
                }),
              }}
            >
              <ContrastOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title="Hue">
            <IconButton
              size="medium"
              focusRipple={mode === "hue"}
              autoFocus={mode === "hue"}
              onClick={() => setMode("hue")}
              sx={{
                color: (theme) => theme.vars.palette.grey[400],
                ...(mode === "hue" && {
                  backgroundColor: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`,
                }),
              }}
            >
              <AdjustOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Reset">
            <IconButton
              sx={{ color: (theme) => theme.vars.palette.grey[400] }}
              size="medium"
              onClick={onReset}
            >
              <ReplayOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Save">
            <IconButton
              disableRipple
              disableFocusRipple
              disableTouchRipple
              sx={{ color: (theme) => theme.vars.palette.grey[400] }}
              size="medium"
              onClick={() => onSaveFile()}
            >
              {loading ? (
                <CircularProgress color="warning" size={16} />
              ) : (
                <DoneAllOutlinedIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  );
};
