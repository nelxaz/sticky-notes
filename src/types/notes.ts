export type NoteColor = "butter" | "peach" | "mint" | "sky" | "lilac" | "pink";

export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: NoteColor;
  zIndex: number;
};
