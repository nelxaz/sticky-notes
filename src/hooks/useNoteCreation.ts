import type { Dispatch, MouseEvent, MutableRefObject, SetStateAction } from "react";
import type { Note } from "../types/notes.ts";
import type { NoteColor } from "../types/notes.ts";
import { clamp } from "./stickyBoardUtils.ts";

const DEFAULT_NOTE_WIDTH = 180;
const DEFAULT_NOTE_HEIGHT = 180;

export function useNoteCreation({
  canCreateNote,
  noteIdRef,
  nextZIndex,
  selectedColor,
  setNotes,
  setNextZIndex,
}: {
  canCreateNote: boolean;
  noteIdRef: MutableRefObject<number>;
  nextZIndex: number;
  selectedColor: NoteColor;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setNextZIndex: Dispatch<SetStateAction<number>>;
}) {
  function handleBoardDoubleClick(event: MouseEvent<HTMLDivElement>) {
    if (!canCreateNote) {
      return;
    }

    const target = event.target;

    if (
      !(target instanceof HTMLElement) ||
      target.closest("[data-note-root='true']") ||
      target.closest("[data-trash-zone='true']")
    ) {
      return;
    }

    const boardRect = event.currentTarget.getBoundingClientRect();
    const maxX = Math.max(0, boardRect.width - DEFAULT_NOTE_WIDTH);
    const maxY = Math.max(0, boardRect.height - DEFAULT_NOTE_HEIGHT);
    const x = clamp({
      input: event.clientX - boardRect.left,
      lowerBound: 0,
      upperBound: maxX,
    });
    const y = clamp({
      input: event.clientY - boardRect.top,
      lowerBound: 0,
      upperBound: maxY,
    });

    noteIdRef.current += 1;

    const nextNote: Note = {
      id: `note-${noteIdRef.current}`,
      x,
      y,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      text: "",
      color: selectedColor,
      zIndex: nextZIndex,
    };

    setNotes((currentNotes) => [...currentNotes, nextNote]);
    setNextZIndex((currentZIndex) => currentZIndex + 1);
  }

  return { handleBoardDoubleClick };
}
