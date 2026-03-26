import type { Note } from "../types/notes.ts";
import type { MouseEvent } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import { StickyNote } from "./StickyNote.tsx";
import { TrashZone } from "./TrashZone.tsx";

const DEFAULT_NOTE_WIDTH = 180;
const DEFAULT_NOTE_HEIGHT = 180;
const MIN_NOTE_SIZE = 56;

type ResizeEdge = "top" | "right" | "bottom" | "left";

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

type ResizeInteraction = {
  type: "resize";
  noteId: string;
  pointerId: number;
  edge: ResizeEdge;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

export function Board() {
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const trashZoneRef = useRef<HTMLDivElement | null>(null);
  const noteIdRef = useRef(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [moveInteraction, setMoveInteraction] = useState<MoveInteraction | null>(null);
  const [resizeInteraction, setResizeInteraction] = useState<ResizeInteraction | null>(null);
  const [isTrashTargeted, setIsTrashTargeted] = useState(false);

  function isPointerInsideTrashZone(pointerX: number, pointerY: number) {
    const trashZoneRect = trashZoneRef.current?.getBoundingClientRect();

    if (!trashZoneRect) {
      return false;
    }

    return (
      pointerX >= trashZoneRect.left &&
      pointerX <= trashZoneRect.right &&
      pointerY >= trashZoneRect.top &&
      pointerY <= trashZoneRect.bottom
    );
  }

  function handleBoardDoubleClick(event: MouseEvent<HTMLDivElement>) {
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
    if (event.button !== 0 || !event.isPrimary || moveInteraction || resizeInteraction) {
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

    setMoveInteraction(nextInteraction);
    setNotes((currentNotes) =>
      currentNotes.map((currentNote) =>
        currentNote.id === note.id ? { ...currentNote, zIndex: nextZIndex } : currentNote,
      ),
    );
    setNextZIndex((currentZIndex) => currentZIndex + 1);
  }

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLElement>,
    note: Note,
    edge: ResizeEdge,
  ) {
    if (event.button !== 0 || !event.isPrimary || moveInteraction || resizeInteraction) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    const nextInteraction: ResizeInteraction = {
      type: "resize",
      noteId: note.id,
      pointerId: event.pointerId,
      edge,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: note.x,
      startY: note.y,
      startWidth: note.width,
      startHeight: note.height,
    };

    setResizeInteraction(nextInteraction);
    setNotes((currentNotes) =>
      currentNotes.map((currentNote) =>
        currentNote.id === note.id ? { ...currentNote, zIndex: nextZIndex } : currentNote,
      ),
    );
    setNextZIndex((currentZIndex) => currentZIndex + 1);
  }

  function handleNotePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const boardRect = boardSurfaceRef.current?.getBoundingClientRect();

    if (!boardRect) {
      return;
    }

    if (moveInteraction && moveInteraction.pointerId === event.pointerId) {
      const activeNote = notes.find((note) => note.id === moveInteraction.noteId);

      if (!activeNote) {
        return;
      }

      const maxX = Math.max(0, boardRect.width - activeNote.width);
      const maxY = Math.max(0, boardRect.height - activeNote.height);
      const nextX = Math.min(
        Math.max(0, event.clientX - boardRect.left - moveInteraction.grabOffsetX),
        maxX,
      );
      const nextY = Math.min(
        Math.max(0, event.clientY - boardRect.top - moveInteraction.grabOffsetY),
        maxY,
      );

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === moveInteraction.noteId ? { ...note, x: nextX, y: nextY } : note,
        ),
      );
      setIsTrashTargeted(isPointerInsideTrashZone(event.clientX, event.clientY));

      return;
    }

    if (!resizeInteraction || resizeInteraction.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - resizeInteraction.startPointerX;
    const deltaY = event.clientY - resizeInteraction.startPointerY;

    setNotes((currentNotes) =>
      currentNotes.map((note) => {
        if (note.id !== resizeInteraction.noteId) {
          return note;
        }

        let nextX = resizeInteraction.startX;
        let nextY = resizeInteraction.startY;
        let nextWidth = resizeInteraction.startWidth;
        let nextHeight = resizeInteraction.startHeight;

        if (resizeInteraction.edge === "right") {
          const maxWidth = boardRect.width - resizeInteraction.startX;
          nextWidth = Math.min(
            Math.max(MIN_NOTE_SIZE, resizeInteraction.startWidth + deltaX),
            maxWidth,
          );
        }

        if (resizeInteraction.edge === "bottom") {
          const maxHeight = boardRect.height - resizeInteraction.startY;
          nextHeight = Math.min(
            Math.max(MIN_NOTE_SIZE, resizeInteraction.startHeight + deltaY),
            maxHeight,
          );
        }

        if (resizeInteraction.edge === "left") {
          const unclampedX = resizeInteraction.startX + deltaX;
          const maxX = resizeInteraction.startX + resizeInteraction.startWidth - MIN_NOTE_SIZE;
          nextX = Math.min(Math.max(0, unclampedX), maxX);
          nextWidth = resizeInteraction.startWidth + (resizeInteraction.startX - nextX);
        }

        if (resizeInteraction.edge === "top") {
          const unclampedY = resizeInteraction.startY + deltaY;
          const maxY = resizeInteraction.startY + resizeInteraction.startHeight - MIN_NOTE_SIZE;
          nextY = Math.min(Math.max(0, unclampedY), maxY);
          nextHeight = resizeInteraction.startHeight + (resizeInteraction.startY - nextY);
        }

        return {
          ...note,
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };
      }),
    );
  }

  function endPointerInteraction(event: ReactPointerEvent<HTMLElement>) {
    if (moveInteraction && moveInteraction.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      if (isTrashTargeted) {
        setNotes((currentNotes) =>
          currentNotes.filter((note) => note.id !== moveInteraction.noteId),
        );
      }

      setMoveInteraction(null);
      setIsTrashTargeted(false);
    }

    if (resizeInteraction && resizeInteraction.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      setResizeInteraction(null);
      setIsTrashTargeted(false);
    }
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
            isDragging={moveInteraction?.noteId === note.id}
            isResizing={resizeInteraction?.noteId === note.id}
            note={note}
            onPointerCancel={endPointerInteraction}
            onPointerDown={handleNotePointerDown}
            onPointerMove={handleNotePointerMove}
            onResizePointerDown={handleResizePointerDown}
            onPointerUp={endPointerInteraction}
          />
        ))}
        {notes.length === 0 ? (
          <p className="board-surface__hint">Double-clicking empty space will create notes here.</p>
        ) : null}
        <div className="board-surface__trash" ref={trashZoneRef}>
          <TrashZone
            isActive={moveInteraction !== null}
            isTargeted={moveInteraction !== null && isTrashTargeted}
          />
        </div>
        <p className="board-surface__next">Next z-index: {nextZIndex}</p>
      </div>
    </section>
  );
}
