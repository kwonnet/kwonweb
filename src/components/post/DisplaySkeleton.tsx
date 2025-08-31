import { IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, Skeleton } from '@mui/material';
import React from 'react'

const DisplaySkeleton = () => {
  return (
    <React.Fragment>
      {Array.from({ length: 6 }).map((item, index) => (
        <ListItem key={index} disablePadding>
          <ListItemButton dense>
            <ListItemIcon>
              <Skeleton variant="circular" width={24} height={24} />
            </ListItemIcon>
            <ListItemText>
              <Skeleton variant="text" width="80%" height={24} />
            </ListItemText>
            <IconButton edge="start">
              <Skeleton variant="circular" width={32} height={32} />
            </IconButton>
          </ListItemButton>
        </ListItem>
      ))}
    </React.Fragment>
  );
};

export default DisplaySkeleton