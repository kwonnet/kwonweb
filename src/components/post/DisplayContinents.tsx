import React from 'react'
import { Box, Checkbox, IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Continent } from '@/types';

const DisplayContinents = ({
  continents,
  onToggleContinent,
  selected,
  height
}: {
  continents: Continent[];
  onToggleContinent: (id: string) => void;
  selected: string[];
  height?: number
}) => {
  const theme = useTheme();
  const isMDDown = useMediaQuery(theme.breakpoints.down("md"));
  const RenderItem = ({ index, style }: ListChildComponentProps) => {
    const item = continents[index];
    return (
      <ListItem
        style={style}
        key={item.id}
        secondaryAction={
          <IconButton
            size="small"
            edge="start"
            aria-label={`${item.name} code`}
          >
            {item.code}
          </IconButton>
        }
        disablePadding
      >
        <ListItemButton
          role={undefined}
          onClick={(ev) => onToggleContinent(item.id)}
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
        itemCount={continents.length}
        overscanCount={5}
      >
        {RenderItem}
      </FixedSizeList>
    </Box>
  );
};

export default DisplayContinents