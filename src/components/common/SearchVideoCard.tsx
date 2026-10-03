"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardMedia,
  Box,
  CardContent,
  Typography,
  Stack,
  Grid,
} from "@mui/material";
// import { AppVideo } from "@/types";
import { genVideoUrlInfo } from "@/utils";

const highlightText = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi"); // Case-insensitive match
  return text.replace(regex, `<span class="highlight">$1</span>`);
};

interface VideoCardProps {
  // item: AppVideo;
  item: any;
  searchQuery: string;
  handleClickAway?: () => void;
}

const SearchVideoCard: React.FC<VideoCardProps> = ({
  item,
  searchQuery,
  handleClickAway,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const { poster, previewUrl, videoId } = genVideoUrlInfo(
    item.fileId || item.videoId,
    item.thumbnailUrl || item.thumbnail,
    item.url
  );

  return (
    <Card
      sx={{
        // height: 100,
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        p: 1,
        mb: 1,
      }}
      onClick={() => {
        handleClickAway && handleClickAway();
        router.push(`/watch/${videoId}`);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Grid container spacing={1}>
        <Grid size={{ lg: 2, md: 2, sm: 12, xs: 12 }} sx={{ mb: 1 }}>
          <Box sx={{ width: "100%", height: {lg: 100, md: 100, sm: 200, xs: 200} }}>
            <CardMedia
              component="img"
              image={isHovered ? previewUrl : poster} // Swap image on hover
              alt="Video Thumbnail"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          </Box>
        </Grid>
        <Grid size={{ lg: 10, md: 10, sm: 12, xs: 12 }}>
          <CardContent>
            <Box sx={{ width: "100%" }}>
              <Typography
                title={item.title}
                sx={[
                  (theme) => ({
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2, // Limit to 3 lines
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "normal",
                    maxHeight: "4.4rem",
                    fontSize: "1rem",
                    lineHeight: "1.2rem",
                    "& .highlight": {
                      backgroundColor: theme.vars.palette.warning.light,
                      padding: "2px 4px",
                      borderRadius: "4px",
                      ...theme.applyStyles("dark", {
                        backgroundColor: theme.vars.palette.warning.dark,
                      }),
                    },
                  }),
                ]}
                variant="subtitle1"
                dangerouslySetInnerHTML={{
                  __html: highlightText(item.title, searchQuery),
                }}
              />
              <Typography
                color="textDisabled"
                sx={[(theme) => ({
                    "& .highlight": {
                      backgroundColor: theme.vars.palette.warning.light,
                      padding: "2px 4px",
                      borderRadius: "4px",
                      ...theme.applyStyles("dark", {
                        backgroundColor: theme.vars.palette.warning.dark,
                      })
                    },
                })]}
                dangerouslySetInnerHTML={{
                  __html: highlightText(
                    item.description.length > 300
                      ? `${item.description.slice(0, 300)}...`
                      : item.description,
                    searchQuery
                  ),
                }}
              />
            </Box>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  );
};

export default SearchVideoCard;
