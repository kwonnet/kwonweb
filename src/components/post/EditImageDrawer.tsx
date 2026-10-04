"use client";
import {
  Box,
  Container,
  FormControl,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Checkbox,
  ListItemText,
  SwipeableDrawer,
  CardMedia,
  Button,
} from "@mui/material";
import { ArrowBack, Flag } from "@mui/icons-material";
import React, { useState, useRef, memo } from "react";
import { ImageEditor } from "../image-editor";
import CropOutlinedIcon from "@mui/icons-material/CropOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import { debounce } from "lodash";
// import { toast } from "react-toastify";

type PostFile = { file: File; id: string; altText: string; flags: string[] };

enum UpdateFileEnum {
  IMG = "IMG",
  ALT = "ALT",
  FLAG = "FLAG",
}

const UpdateAltText = memo(
  ({
    handleAltTextUpdate,
    item
  }: {
    item: PostFile;
    handleAltTextUpdate: (id: string, text: string) => void;
  }) => {
    const [state, setState] = useState({
      text: item.altText,
      loading: false,
    });
    const textRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const onTextChange = (
      ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      setState((prev) => ({ ...prev, text: ev.target.value }));
    };

    const onAltTextDone = (
      ev: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
      ev.preventDefault();
      setState((prev) => ({ ...prev, loading: true }));
      handleAltTextUpdate(item.id, state.text);
      setTimeout(() => setState((prev) => ({ ...prev, loading: false })), 1000);
    };
    const src = URL.createObjectURL(item.file);

    return (
      <Box>
        <CardMedia
          component={"img"}
          image={src}
          sx={{
            cursor: "pointer",
            borderRadius: 5,
            position: "relative",
            display: "block",
            minWidth: "100%",
            width: "auto",
            maxWidth: "100%",
            maxHeight: "320px"
          }}
        />
        <Box sx={{mt: 1}}>
          <FormControl fullWidth>
            <TextField
              value={state.text}
              inputRef={textRef}
              onChange={(ev) => onTextChange(ev)}
              minRows={3}
              multiline
              placeholder="Describe media"
            />
            <Box>
              <Typography variant="caption" color="textDisabled">
                Describing your media files will make more accessible to people
                with disablity and more exposure to search engines
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center", display: "block", my: 1 }}>
              <Button
                loading={state.loading}
                onClick={(ev) => onAltTextDone(ev)}
                variant="contained"
                sx={{ borderRadius: 30 }}
              >
                Save
              </Button>
            </Box>
          </FormControl>
        </Box>
      </Box>
    );
  }
);
UpdateAltText.displayName = "UpdateAltText"

const FlagContent = memo(
  ({
    item,
    handleFlagUpdate,
  }: {
    item: PostFile;
    handleFlagUpdate: (id: string, flags: string[]) => void;
  }) => {
    const [selected, setSelected] = React.useState(item.flags);

    const debounceFlagUpdate = useRef(debounce((flags: string[]) =>{
        handleFlagUpdate(item.id, flags);
    },700)).current


    const handleToggle = (value: string) => () => {
      const currentIndex = selected.indexOf(value);
      const newChecked = [...selected];

      if (currentIndex === -1) {
        newChecked.push(value);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setSelected(newChecked);
      debounceFlagUpdate(newChecked)
    };
    const src = URL.createObjectURL(item.file);
    return (
      <Box>
        <CardMedia
          component={"img"}
          image={src}
          sx={{
            cursor: "pointer",
            borderRadius: 5,
            position: "relative",
            display: "block",
            minWidth: "100%",
            width: "auto",
            maxWidth: "100%",
            maxHeight: "320px"
          }}
        />
        <Box sx={{mt: 1}}>
        <Typography variant="h5" sx={{ fontFamily: "PlayFair", textAlign: "center" }}>
          Put a content warning on this post
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: "PlayFair" }}>
          Select a category, and we&apos;ll add a content warning to this post.
          This helps others steer clear of content they prefer not to view.
        </Typography>
        </Box>
        <List
          sx={{ width: "100%",}}
        >
          {flags.map((value) => {
            const labelId = `checkbox-list-label-${value}`;
            return (
              <ListItem
                key={value}
                secondaryAction={
                  <Checkbox
                    edge="end"
                    onChange={handleToggle(value)}
                    checked={selected.includes(value)}
                    slotProps={{
                      input: { "aria-labelledby": labelId }
                    }}
                  />
                }
                // disablePadding
              >
                <ListItemButton
                  role={undefined}
                  onClick={handleToggle(value)}
                  dense
                >
                  {/* <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={checked.includes(value)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon> */}
                  <ListItemText id={labelId} primary={value} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  }
);

FlagContent.displayName = "FlagContent"


const flags = ["Nudity", "Violence", "Sensitive"];
const EditImageDrawer =
  ({
    item,
    isOpen,
    toggleDrawer,
    action,
    handleAltTextUpdate,
    handleFlagUpdate,
    handleFileUpdate
  }: {
    item: PostFile;
    isOpen: boolean;
    action: UpdateFileEnum;
    toggleDrawer: (ev: any, open: boolean) => void;
    handleAltTextUpdate: (id: string, text: string) => void;
    handleFlagUpdate: (id: string, flags: string[]) => void;
    handleFileUpdate: (id: string, file: File) => void
  }) => {
    const open = React.useMemo(() => isOpen, [isOpen]);

    const updateAction = React.useMemo(() => action, [action]);

    const [state, setState] = useState({
      action: updateAction,
      loading: false,
    });

    const toggleAction = (action: UpdateFileEnum) => {
      setState((prev) => ({ ...prev, action }));
    };

    const onSaveFile = (file: File) => {
        handleFileUpdate(item.id, file)
    }

    const src = URL.createObjectURL(item.file);

    return (
      <SwipeableDrawer
        sx={{
          zIndex: 999999999,
          height: "100vh",
          overflow: "hidden",
        }}
        anchor={"bottom"}
        open={open}
        onClose={(ev) => toggleDrawer(ev, false)}
        onOpen={(ev) => {}}
        slotProps={{paper: {
          sx: {
            // top: { lg: "50%", md: "50%", sm: "30%", xs: "30%" },
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            zIndex: 999,
            overflow: "hidden",
            width: { lg: 600, md: 600, sm: "100%", width: "100%" },
            maxWidth: "100%",
            margin: "0 auto",
            height: {lg: "80vh", md: "80vh", sm: "90vh", xs: "90vh"},
          },
          // sx: {
          //   top: "0",
          //   borderTopLeftRadius: "8px",
          //   borderTopRightRadius: "8px",
          //   zIndex: 999999,
          //   height: "100vh",
          //   overflow: "hidden",
          // },
        }}}
      >
        <Box sx={{ width: "auto" }} role="presentation">
          <Grid container sx={{ alignItems: "center" }}>
            <Grid size={{ lg: 2, md: 2, sm: 2, xl: 2, xs: 2 }}>
              <IconButton
                color="inherit"
                onClick={(ev) => toggleDrawer(ev, false)}
              >
                <ArrowBack />
              </IconButton>
            </Grid>
            <Grid size={{ lg: 10, md: 10, sm: 10, xl: 10, xs: 10 }}>
              <Typography
                sx={{
                  alignSelf: "center",
                  alignContent: "center",
                  display: "block",
                  fontFamily: "PlayFair",
                }}
                variant="h6"
              >
                {state.action === UpdateFileEnum.ALT
                  ? "Update Media Description"
                  : state.action === UpdateFileEnum.FLAG
                  ? "Content warning"
                  : "Edit Media"}
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ position: "relative", mb: 1 }}>
            <Stack
              sx={{
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
              direction={"row"}
              spacing={2}
            >
              <Box>
                <IconButton
                  color="inherit"
                  size="small"
                  sx={{
                    fontSize: "10px",
                    color: (theme) => theme.vars.palette.grey[400],
                    ...(state.action === UpdateFileEnum.IMG && {
                      background: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`,
                    }),
                  }}
                  onClick={(ev) => toggleAction(UpdateFileEnum.IMG)}
                >
                  <CropOutlinedIcon />
                </IconButton>
              </Box>
              <Box>
                <IconButton
                  color="inherit"
                  size="small"
                  sx={{
                    fontSize: "10px",
                    color: (theme) => theme.vars.palette.grey[400],
                    ...(state.action === UpdateFileEnum.ALT && {
                      background: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`
                    }),
                  }}
                  onClick={(ev) => toggleAction(UpdateFileEnum.ALT)}
                >
                  <EditNoteOutlinedIcon />
                </IconButton>
              </Box>
              <Box>
                <IconButton
                  color="inherit"
                  size="small"
                  sx={{
                    fontSize: "10px",
                    color: (theme) => theme.vars.palette.grey[400],
                    ...(state.action === UpdateFileEnum.FLAG && {
                      background: `rgba(var(--mui-palette-action-activeChannel) / var(--mui-palette-action-hoverOpacity))`
                    }),
                  }}
                  onClick={(ev) => toggleAction(UpdateFileEnum.FLAG)}
                >
                  <Flag />
                </IconButton>
              </Box>
            </Stack>
          </Box>
          <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
            {state.action === UpdateFileEnum.ALT ? (
              <UpdateAltText
                item={item}
                handleAltTextUpdate={handleAltTextUpdate}
              />
            ) : state.action === UpdateFileEnum.FLAG ? (
              <FlagContent
                item={item}
                handleFlagUpdate={handleFlagUpdate}
              />
            ) : (
              <ImageEditor imgSrc={src} onSaveFile={onSaveFile} />
            )}
          </Container>
        </Box>
      </SwipeableDrawer>
    );
  }



export default EditImageDrawer;
