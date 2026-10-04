"use client";
import type { Country } from "@/types";
import VirtualSelectionList from "./VirtualSelectionList";

export default function DisplayCountries({ countries, onToggleCountry, ...props }: {
  countries: Country[]; onToggleCountry: (id: string) => void; selected: string[]; height?: number;
}) {
  return <VirtualSelectionList items={countries} onToggle={onToggleCountry} {...props} />;
}
