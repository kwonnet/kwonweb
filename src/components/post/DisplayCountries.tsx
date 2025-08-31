'use client'
import { Country } from '@/types';
import { Box, Checkbox, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import React from 'react'
import { FixedSizeList, ListChildComponentProps } from 'react-window';

const DisplayCountries = ({
  countries,
  onToggleCountry,
  selected,
  height,
}: {
  countries: Country[];
  onToggleCountry: (id: string) => void;
  selected: string[];
  height?: number
}) => {
  const theme = useTheme();
  const isMDDown = useMediaQuery(theme.breakpoints.down("md"));

  const RenderItem = ({ index, style }: ListChildComponentProps) => {
    const item = countries[index];
    return (
      <ListItem
        style={style}
        key={item.id}
        secondaryAction={
          <IconButton edge="start" aria-label={`${item.name} flag`}>
            {item.emoji}
          </IconButton>
        }
        disablePadding
      >
        <ListItemButton
          role={undefined}
          onClick={(ev) => onToggleCountry(item.id)}
          dense
        >
          <ListItemIcon>
            <Checkbox
              edge="end"
              checked={selected.includes(item.id)}
              tabIndex={-1}
              disableRipple
              inputProps={{ "aria-labelledby": item.id }}
            />
          </ListItemIcon>
          <ListItemText id={item.id} primary={item.name} />
        </ListItemButton>
      </ListItem>
    );
  };
  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <FixedSizeList
        height={height ? height : isMDDown ? 250 : 250}
        width={"100%"}
        itemSize={50}
        itemCount={countries.length}
        overscanCount={5}
      >
        {RenderItem}
      </FixedSizeList>
    </Box>
  );
};

export default DisplayCountries