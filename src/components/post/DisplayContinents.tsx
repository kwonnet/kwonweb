"use client";
import type { Continent } from "@/types";
import VirtualSelectionList from "./VirtualSelectionList";

export default function DisplayContinents({ continents, onToggleContinent, ...props }: {
  continents: Continent[]; onToggleContinent: (id: string) => void; selected: string[]; height?: number;
}) {
  return <VirtualSelectionList items={continents} onToggle={onToggleContinent} {...props} />;
}
