import type { NoteColor } from "../types/notes.ts";

export type NoteColorDefinition = {
  background: string;
  border: string;
  label: string;
  line: string;
  sheen: string;
  shadow: string;
  swatch: string;
  text: string;
};

export const NOTE_COLOR_ORDER: NoteColor[] = ["butter", "peach", "mint", "sky", "lilac", "pink"];

export const DEFAULT_NOTE_COLOR: NoteColor = "butter";

export const NOTE_COLORS: Record<NoteColor, NoteColorDefinition> = {
  butter: {
    background: "#fff1a6",
    border: "rgba(176, 145, 44, 0.18)",
    label: "Butter",
    line: "rgba(128, 111, 61, 0.18)",
    sheen: "rgba(255, 255, 255, 0.28)",
    shadow: "rgba(120, 92, 26, 0.16)",
    swatch: "#f7df61",
    text: "#272012",
  },
  peach: {
    background: "#ffd8b8",
    border: "rgba(174, 112, 54, 0.18)",
    label: "Peach",
    line: "rgba(136, 94, 60, 0.18)",
    sheen: "rgba(255, 255, 255, 0.26)",
    shadow: "rgba(156, 98, 47, 0.16)",
    swatch: "#f8b27d",
    text: "#271b12",
  },
  mint: {
    background: "#d9f2cf",
    border: "rgba(74, 139, 78, 0.18)",
    label: "Mint",
    line: "rgba(82, 123, 85, 0.18)",
    sheen: "rgba(255, 255, 255, 0.24)",
    shadow: "rgba(74, 139, 78, 0.16)",
    swatch: "#9fd895",
    text: "#182513",
  },
  sky: {
    background: "#d7ebff",
    border: "rgba(77, 118, 164, 0.18)",
    label: "Sky",
    line: "rgba(84, 117, 152, 0.18)",
    sheen: "rgba(255, 255, 255, 0.24)",
    shadow: "rgba(68, 105, 149, 0.16)",
    swatch: "#9cc6f2",
    text: "#15202d",
  },
  lilac: {
    background: "#eadcff",
    border: "rgba(123, 90, 168, 0.18)",
    label: "Lilac",
    line: "rgba(116, 93, 145, 0.18)",
    sheen: "rgba(255, 255, 255, 0.24)",
    shadow: "rgba(122, 88, 165, 0.16)",
    swatch: "#c6a5f1",
    text: "#21192c",
  },
  pink: {
    background: "#ffd9e7",
    border: "rgba(180, 94, 127, 0.18)",
    label: "Pink",
    line: "rgba(149, 85, 107, 0.18)",
    sheen: "rgba(255, 255, 255, 0.26)",
    shadow: "rgba(180, 94, 127, 0.16)",
    swatch: "#f2a6bf",
    text: "#28161c",
  },
};
