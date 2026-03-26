import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Note } from "../types/notes.ts";

export function clamp({
  input,
  lowerBound,
  upperBound,
}: {
  input: number;
  lowerBound: number;
  upperBound: number;
}) {
  return Math.min(Math.max(input, lowerBound), upperBound);
}

export function getElementRect(ref: RefObject<HTMLElement | null>) {
  return ref.current?.getBoundingClientRect() ?? null;
}

export function promoteNoteToFront({
  noteId,
  nextZIndex,
  setNotes,
  setNextZIndex,
}: {
  noteId: string;
  nextZIndex: number;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setNextZIndex: Dispatch<SetStateAction<number>>;
}) {
  setNotes((currentNotes) =>
    currentNotes.map((currentNote) =>
      currentNote.id === noteId ? { ...currentNote, zIndex: nextZIndex } : currentNote,
    ),
  );
  setNextZIndex((currentZIndex) => currentZIndex + 1);
}

export function updateNote({
  noteId,
  setNotes,
  updater,
}: {
  noteId: string;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  updater: (note: Note) => Note;
}) {
  setNotes((currentNotes) =>
    currentNotes.map((note) => (note.id === noteId ? updater(note) : note)),
  );
}
