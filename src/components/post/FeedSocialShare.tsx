"use client";
import {
  Box,
  Container,
  IconButton,
  SwipeableDrawer,
  Stack,
  Grid2,
  Typography,
} from "@mui/material";
import { ArrowBack, Check } from "@mui/icons-material";
import React, { useState } from "react";
// import {ShareSocial} from 'react-share-social' 
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import {
    EmailShareButton,
    FacebookShareButton,
    FacebookMessengerShareButton,
    GabShareButton,
    HatenaShareButton,
    InstapaperShareButton,
    LineShareButton,
    LinkedinShareButton,
    LivejournalShareButton,
    MailruShareButton,
    OKShareButton,
    PinterestShareButton,
    PocketShareButton,
    RedditShareButton,
    TelegramShareButton,
    ThreadsShareButton,
    TumblrShareButton,
    TwitterShareButton,
    ViberShareButton,
    VKShareButton,
    WhatsappShareButton,
    WorkplaceShareButton,
    BlueskyShareButton,
    
  } from "react-share";
  import {
    EmailIcon,
    FacebookIcon,
    FacebookMessengerIcon,
    GabIcon,
    HatenaIcon,
    InstapaperIcon,
    LineIcon,
    LinkedinIcon,
    LivejournalIcon,
    MailruIcon,
    OKIcon,
    PinterestIcon,
    PocketIcon,
    RedditIcon,
    TelegramIcon,
    ThreadsIcon,
    TumblrIcon,
    TwitterIcon,
    ViberIcon,
    VKIcon,
    WeiboIcon,
    WhatsappIcon,
    WorkplaceIcon,
    XIcon,
    BlueskyIcon,
  } from "react-share";
import { toast } from "react-toastify";
import { useNotifications } from "@toolpad/core";
const FeedSocialShare = ({
  isOpen,
  toggleDrawer,
  url,
  onSocialClick,
  postId
}: {
  isOpen: boolean;
  toggleDrawer: (ev: any, open: boolean) => void;
  url: string;
  postId: string;
  onSocialClick: (id: string) => void;
}) => {

  const notif = useNotifications()

  const open = React.useMemo(() => isOpen, [isOpen]);

  const [state, setState] = useState({ isCopied: false})

  const handleShare = (ev: any, kind?: string) => {
    onSocialClick(postId)
    toggleDrawer(ev, false)
  };

  const handleCopy = async(ev: any, kind?: string) => {
    setState(prev => ({...prev, isCopied: true}))
    await navigator.clipboard.writeText(url);
    notif.show("Link copied to clipboard!", {severity: 'info', autoHideDuration: 2500});
    setTimeout(() => {
        setState(prev => ({...prev, isCopied: false}))
    }, 700);
    onSocialClick(postId)
    toggleDrawer(ev, false)
  }

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
          height: {lg: "30vh", md: "30vh", sm: "30vh", xs: "30vh"},
          // top: "70%", 
          // borderTopLeftRadius: "8px",
          // borderTopRightRadius: "8px",
          // zIndex: 999,
          // overflow: "hidden",
        },
      }}}
    >
      <Box sx={{ width: "auto" }} role="presentation">
        <Stack
          direction={"row"}
          sx={{ alignItems: "center", mb: 1, mx: 1, gap: 12  }}
        >
          <IconButton color="inherit" onClick={(ev) => toggleDrawer(ev, false)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="subtitle1" sx={{fontFamily: "PlayFair", alignSelf: 'center', alignContent: "center"}}>Social Share</Typography>
        </Stack>
        <Container maxWidth="xl" sx={{ mt: 0, pb: 2 }}>
            <Grid2 container spacing={2}>
            <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <IconButton onClick={ev => {
                      ev.preventDefault()
                      ev.stopPropagation()
                      handleCopy(ev)
                    }}>
                        {state.isCopied ? <Check /> : <ContentCopyOutlinedIcon />}
                    </IconButton>
                </Grid2>
                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <WhatsappShareButton onClick={ev => handleShare(ev)} url={url}>
                        <WhatsappIcon size={32} round={false} />
                    </WhatsappShareButton>
                </Grid2>
                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <FacebookShareButton onClick={ev => handleShare(ev)} url={url}>
                        <FacebookIcon size={32} round={false} />
                    </FacebookShareButton>
                </Grid2>
                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <FacebookMessengerShareButton appId="" onClick={ev => handleShare(ev)} url={url}>
                        <FacebookMessengerIcon size={32} round={false} />
                    </FacebookMessengerShareButton>
                </Grid2>
                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <TwitterShareButton onClick={ev => handleShare(ev)} url={url}>
                        <XIcon size={32} round={false} />
                    </TwitterShareButton>
                </Grid2>
                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <TelegramShareButton onClick={ev => handleShare(ev)} url={url}>
                        <TelegramIcon size={32} round={false} />
                    </TelegramShareButton>
                </Grid2>
                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <EmailShareButton onClick={ev => handleShare(ev)} url={url}>
                        <EmailIcon size={32} round={false} />
                    </EmailShareButton>
                </Grid2>

                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <LinkedinShareButton onClick={ev => handleShare(ev)} url={url}>
                        <LinkedinIcon size={32} round={false} />
                    </LinkedinShareButton>
                </Grid2>

                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <RedditShareButton onClick={ev => handleShare(ev)} url={url}>
                        <RedditIcon size={32} round={false} />
                    </RedditShareButton>
                </Grid2>

                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <ThreadsShareButton onClick={ev => handleShare(ev)} url={url}>
                        <ThreadsIcon size={32} round={false} />
                    </ThreadsShareButton>
                </Grid2>

                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <LivejournalShareButton onClick={ev => handleShare(ev)} url={url}>
                        <LivejournalIcon size={32} round={false} />
                    </LivejournalShareButton>
                </Grid2>

                <Grid2 size={{lg: 2, md: 2, sm: 2, xs: 2}}>
                    <ViberShareButton onClick={ev => handleShare(ev)} url={url}>
                        <ViberIcon size={32} round={false} />
                    </ViberShareButton>
                </Grid2>

                

               
            </Grid2>
        {/* <ShareSocial 
            title="Social Share"
            url={url}
            socialTypes={['whatsapp','telegram','facebook','twitter','email','linkedin','reddit', 'instapaper']}
            onSocialButtonClicked={handleShare}
        /> */}
        </Container>
      </Box>
    </SwipeableDrawer>
  );
};

export default FeedSocialShare;
