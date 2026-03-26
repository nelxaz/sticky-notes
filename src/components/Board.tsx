import type { Note } from "../types/notes.ts";
import type { MouseEvent } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import { StickyNote } from "./StickyNote.tsx";

const DEFAULT_NOTE_WIDTH = 180;
const DEFAULT_NOTE_HEIGHT = 180;

type MoveInteraction = {
  type: "move";
  noteId: string;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  grabOffsetX: number;
  grabOffsetY: number;
};

export function Board() {
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const noteIdRef = useRef(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [interaction, setInteraction] = useState<MoveInteraction | null>(null);

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

  function handleNotePointerDown(event: ReactPointerEvent<HTMLElement>, note: Note) {
    if (event.button !== 0 || !event.isPrimary || interaction) {
      return;
    }

    const boardRect = boardSurfaceRef.current?.getBoundingClientRect();

    if (!boardRect) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const nextInteraction: MoveInteraction = {
      type: "move",
      noteId: note.id,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: note.x,
      startY: note.y,
      grabOffsetX: event.clientX - boardRect.left - note.x,
      grabOffsetY: event.clientY - boardRect.top - note.y,
    };

    setInteraction(nextInteraction);
    setNotes((currentNotes) =>
      currentNotes.map((currentNote) =>
        currentNote.id === note.id ? { ...currentNote, zIndex: nextZIndex } : currentNote,
      ),
    );
    setNextZIndex((currentZIndex) => currentZIndex + 1);
  }

  function handleNotePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    const boardRect = boardSurfaceRef.current?.getBoundingClientRect();

    if (!boardRect) {
      return;
    }

    const activeNote = notes.find((note) => note.id === interaction.noteId);

    if (!activeNote) {
      return;
    }

    const maxX = Math.max(0, boardRect.width - activeNote.width);
    const maxY = Math.max(0, boardRect.height - activeNote.height);
    const nextX = Math.min(
      Math.max(0, event.clientX - boardRect.left - interaction.grabOffsetX),
      maxX,
    );
    const nextY = Math.min(
      Math.max(0, event.clientY - boardRect.top - interaction.grabOffsetY),
      maxY,
    );

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === interaction.noteId ? { ...note, x: nextX, y: nextY } : note,
      ),
    );
  }

  function endMoveInteraction(event: ReactPointerEvent<HTMLElement>) {
    if (!interaction || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setInteraction(null);
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
        ref={boardSurfaceRef}
      >
        <div className="board-surface__grid" aria-hidden="true" />
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            isDragging={interaction?.noteId === note.id}
            note={note}
            onPointerCancel={endMoveInteraction}
            onPointerDown={handleNotePointerDown}
            onPointerMove={handleNotePointerMove}
            onPointerUp={endMoveInteraction}
          />
        ))}
        {notes.length === 0 ? (
          <p className="board-surface__hint">Double-clicking empty space will create notes here.</p>
        ) : null}
        <p className="board-surface__next">Next z-index: {nextZIndex}</p>
      </div>
    </section>
  );
}
