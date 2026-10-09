"use client";
import { Box, IconButton, Chip, CardMedia } from "@mui/material";
import { Close, BrushOutlined } from "@mui/icons-material";
import React, { useState, memo } from "react";
import EditImageDrawer from "./EditImageDrawer";
import MiniVideoPlayer from "@/components/common/MiniVideoPlayer";

type PostFile = { file: File; id: string; altText: string; flags: string[] };

enum UpdateFileEnum {
  IMG = "IMG",
  ALT = "ALT",
  FLAG = "FLAG",
}

const MediaItem = memo(
  ({
    item,
    removeFileItem,
    isSingle,
    handleAltTextUpdate,
    handleFlagUpdate,
    handleFileUpdate,
  }: {
    item: PostFile;
    isSingle: boolean;
    removeFileItem: (id: string) => void;
    handleAltTextUpdate: (id: string, text: string) => void;
    handleFlagUpdate: (id: string, flags: string[]) => void;
    handleFileUpdate: (id: string, file: File) => void;
  }) => {
    const [state, setState] = useState({
      isOpen: false,
      action: UpdateFileEnum.IMG,
    });

    const toggleDrawer = (ev: any, open: boolean) => {
      ev.preventDefault();
      setState((prev) => ({
        ...prev,
        isOpen: open,
        action: UpdateFileEnum.IMG,
      }));
    };

    const toggleAltText = (ev: any) => {
      ev.preventDefault();
      setState((prev) => ({
        ...prev,
        action: UpdateFileEnum.ALT,
        isOpen: true,
      }));
    };

    const src = URL.createObjectURL(item.file);

    const isVideo = item.file.type.startsWith("video")

    return (
      <React.Fragment>
        <Box sx={{ py: 1, display: "block", height: "auto", textAlign: "center" }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            {/* Top Left Brush Button */}
            <Box sx={{ position: "absolute", top: 8, left: 8, zIndex: 999 }}>
              <IconButton aria-label="Edit media"
                disableFocusRipple
                disableRipple
                disableTouchRipple
                color="warning"
                onClick={(ev) => toggleDrawer(ev, true)}
              >
                <BrushOutlined />
              </IconButton>
            </Box>

            {/* Top Right Close Button */}
            <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 999 }}>
              <IconButton aria-label="Close"
                disableFocusRipple
                disableRipple
                disableTouchRipple
                color="error"
                onClick={() => removeFileItem(item.id)}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Bottom Left Chip */}
            <Box
              sx={{ position: "absolute", bottom: 14, left: 10, zIndex: 999 }}
            >
              <Chip
                variant="filled"
                size="small"
                label="Alt"
                clickable
                color="primary"
                onClick={(ev) => toggleAltText(ev)}
                sx={{
                  boxShadow: 5,
                  borderRadius: 30,
                  height: 15,
                }}
              />
            </Box>

            {/* CardMedia */}
            {isVideo  ? <MiniVideoPlayer src={src} /> : <CardMedia
              component="img"
              image={src}
              onClick={(ev) => toggleDrawer(ev, true)}
              sx={{
                cursor: "pointer",
                borderRadius: 3.5,
                position: "relative",
                display: "inline-block", 
                minWidth: "auto",
                width: "auto",
                maxWidth: "100%",
                maxHeight: "320px",
              }}
            />}
          </Box>
        </Box>

        <EditImageDrawer
          isOpen={state.isOpen}
          action={state.action}
          toggleDrawer={toggleDrawer}
          handleAltTextUpdate={handleAltTextUpdate}
          handleFlagUpdate={handleFlagUpdate}
          handleFileUpdate={handleFileUpdate}
          item={item}
        />
      </React.Fragment>
    );
  }
);

MediaItem.displayName = "MediaItem";

export default MediaItem
