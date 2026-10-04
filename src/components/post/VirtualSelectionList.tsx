"use client";
import { Checkbox, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { List, type RowComponentProps } from "react-window";
import type { ReactNode } from "react";

type Item = { id: string; name: string; emoji?: string; code?: string };
type RowProps = { items: Item[]; selected: string[]; onToggle: (id: string) => void };

function SelectionRow({ index, style, ariaAttributes, items, selected, onToggle }: RowComponentProps<RowProps>) {
  const item = items[index];
  return <ListItem component="div" style={style} {...ariaAttributes} disablePadding secondaryAction={item.emoji ?? item.code as ReactNode}>
    <ListItemButton onClick={() => onToggle(item.id)} dense>
      <ListItemIcon><Checkbox edge="end" checked={selected.includes(item.id)} tabIndex={-1} disableRipple slotProps={{ input: { "aria-label": item.name } }} /></ListItemIcon>
      <ListItemText primary={item.name} />
    </ListItemButton>
  </ListItem>;
}

export default function VirtualSelectionList({ height = 250, ...rowProps }: RowProps & { height?: number }) {
  return <List style={{ height, width: "100%" }} defaultHeight={height} rowHeight={50} rowCount={rowProps.items.length}
    rowComponent={SelectionRow} rowProps={rowProps} overscanCount={5} />;
}
