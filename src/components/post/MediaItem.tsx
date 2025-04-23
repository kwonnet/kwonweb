"use client";
import {
  Box,
  IconButton,
  Chip,
  CardMedia} from "@mui/material";
import {
  Close,
  BrushOutlined,
} from "@mui/icons-material";
import React, { useState, memo } from "react";
import EditImageDrawer from "./EditImageDrawer";

type PostFile = { file: File; id: string, altText: string, flags: string[];};

enum UpdateFileEnum {
  IMG = "IMG",
  ALT = "ALT",
  FLAG = "FLAG",
}


const MediaItem = memo(({
  item,
  removeFileItem,
  isSingle,
  handleAltTextUpdate,
  handleFlagUpdate,
  handleFileUpdate
}: {
  item: PostFile;
  isSingle: boolean;
  removeFileItem: (id: string) => void;
  handleAltTextUpdate: (id: string, text: string) =>  void;
  handleFlagUpdate: (id: string, flags: string[]) => void;
  handleFileUpdate: (id: string, file: File) => void
}) => {
  const [state, setState] = useState({
    isOpen: false,
    action: UpdateFileEnum.IMG,
  });

  const toggleDrawer = (ev: any, open: boolean) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, isOpen: open, action: UpdateFileEnum.IMG }));
  };

  const toggleAltText = (ev: any) => {
    ev.preventDefault();
    setState((prev) => ({ ...prev, action: UpdateFileEnum.ALT, isOpen: true, }));
  };

  const src = URL.createObjectURL(item.file);

  return (
    <React.Fragment>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "absolute", left: 4, zIndex: 999 }}>
          <IconButton
            disableFocusRipple
            disableRipple
            disableTouchRipple
            color="warning"
            onClick={(ev) => toggleDrawer(ev, true)}
          >
            <BrushOutlined />
          </IconButton>
        </Box>
        <Box sx={{ position: "absolute", right: 4, zIndex: 999 }}>
          <IconButton
            disableFocusRipple
            disableRipple
            disableTouchRipple
            color="error"
            onClick={(ev) => removeFileItem(item.id)}
          >
            <Close />
          </IconButton>
        </Box>
      </Box>
      <Box
        sx={{
          py: 1,
          display: "block",
        }}
      >
        <CardMedia
          component={"img"}
          image={src}
          onClick={(ev) => toggleDrawer(ev, true)}
          sx={{
            cursor: "pointer",
            borderRadius: 3.5,
            position: "relative",
            display: "block",
            minWidth:  "auto",
            width: "auto",
            maxWidth: "100%",
            maxHeight: "320px"
          }}
        />
      </Box>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "absolute", bottom: 14, left: 10, zIndex: 999 }}>
          <Chip
            variant="filled"
            size="small"
            label="Alt"
            clickable
            color="primary"
            onClick={(ev) => toggleAltText(ev)}
            sx={[
              (theme) => ({
                boxShadow: 5,
                borderRadius: 30,
                height: 15,
              }),
            ]}
          />
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
});

export default MediaItem
