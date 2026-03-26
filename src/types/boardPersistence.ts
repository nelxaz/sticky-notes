import type { Note, NoteColor } from "./notes.ts";

export type BoardSnapshot = {
  nextNoteId: number;
  nextZIndex: number;
  notes: Note[];
  selectedColor: NoteColor;
};
