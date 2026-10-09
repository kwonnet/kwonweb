import { Box, ListItem, ListItemIcon, ListItemText, Skeleton } from '@mui/material';
import React from 'react'

const DisplaySkeleton = () => {
  return (
    <React.Fragment>
      {Array.from({ length: 6 }).map((item, index) => (
        <ListItem key={index} disablePadding aria-hidden="true">
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", py: 0.5, px: 2 }}>
            <ListItemIcon>
              <Skeleton variant="circular" width={24} height={24} />
            </ListItemIcon>
            <ListItemText>
              <Skeleton variant="text" width="80%" height={24} />
            </ListItemText>
            <Box sx={{ ml: 1 }}>
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
          </Box>
        </ListItem>
      ))}
    </React.Fragment>
  );
};

export default DisplaySkeleton