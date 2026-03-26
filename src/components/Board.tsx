import type { Note } from "../types/notes.ts";
import type { MouseEvent } from "react";
import { useRef, useState } from "react";
import { StickyNote } from "./StickyNote.tsx";

const DEFAULT_NOTE_WIDTH = 180;
const DEFAULT_NOTE_HEIGHT = 180;

export function Board() {
  const noteIdRef = useRef(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);

  function handleBoardDoubleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;

    if (!(target instanceof HTMLElement) || target.closest("[data-note-root='true']")) {
      return;
    }

    const boardRect = event.currentTarget.getBoundingClientRect();
    const maxX = Math.max(0, boardRect.width - DEFAULT_NOTE_WIDTH);
    const maxY = Math.max(0, boardRect.height - DEFAULT_NOTE_HEIGHT);
    const x = Math.min(Math.max(0, event.clientX - boardRect.left), maxX);
    const y = Math.min(Math.max(0, event.clientY - boardRect.top), maxY);

    noteIdRef.current += 1;

    const nextNote: Note = {
      id: `note-${noteIdRef.current}`,
      x,
      y,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      text: "",
      zIndex: nextZIndex,
    };

    setNotes((currentNotes) => [...currentNotes, nextNote]);
    setNextZIndex((currentZIndex) => currentZIndex + 1);
  }

  return (
    <section className="board-frame" aria-labelledby="board-title">
      <header className="board-frame__header">
        <div>
          <p className="board-frame__label">Workspace</p>
          <h2 id="board-title">Board</h2>
        </div>
        <p className="board-frame__status">
          {notes.length} note{notes.length === 1 ? "" : "s"} on board
        </p>
      </header>

      <div
        className="board-surface"
        aria-label="Sticky notes board"
        role="presentation"
        onDoubleClick={handleBoardDoubleClick}
      >
        <div className="board-surface__grid" aria-hidden="true" />
        {notes.map((note) => (
          <StickyNote key={note.id} note={note} />
        ))}
        {notes.length === 0 ? (
          <p className="board-surface__hint">Double-clicking empty space will create notes here.</p>
        ) : null}
        <p className="board-surface__next">Next z-index: {nextZIndex}</p>
      </div>
    </section>
  );
}
