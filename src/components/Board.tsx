import type { Note } from "../types/notes.ts";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";
import { useNoteCreation } from "../hooks/useNoteCreation.ts";
import { useNoteDragging } from "../hooks/useNoteDragging.ts";
import { useNoteResizing } from "../hooks/useNoteResizing.ts";
import { useTrashDrop } from "../hooks/useTrashDrop.ts";
import type { ActiveInteractionKind } from "../types/interactions.ts";
import { StickyNote } from "./StickyNote.tsx";
import { TrashZone } from "./TrashZone.tsx";

export function Board() {
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const activeInteractionRef = useRef<ActiveInteractionKind | null>(null);
  const noteIdRef = useRef(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const { clearTrashTarget, handleTrashDrop, isTrashTargeted, syncTrashTarget, trashZoneRef } =
    useTrashDrop({
      setNotes,
    });
  const { handleBoardDoubleClick } = useNoteCreation({
    noteIdRef,
    nextZIndex,
    setNotes,
    setNextZIndex,
  });
  const { endMoveInteraction, handleMovePointerMove, handleNotePointerDown, moveInteraction } =
    useNoteDragging({
      activeInteractionRef,
      boardSurfaceRef,
      clearTrashTarget,
      handleTrashDrop,
      nextZIndex,
      notes,
      setNotes,
      setNextZIndex,
      syncTrashTarget,
    });
  const {
    endResizeInteraction,
    handleResizePointerDown,
    handleResizePointerMove,
    resizeInteraction,
  } = useNoteResizing({
    activeInteractionRef,
    boardSurfaceRef,
    clearTrashTarget,
    nextZIndex,
    setNotes,
    setNextZIndex,
  });

  function handleNotePointerMove(event: ReactPointerEvent<HTMLElement>) {
    handleMovePointerMove(event);
    handleResizePointerMove(event);
  }

  function handlePointerEnd(event: ReactPointerEvent<HTMLElement>) {
    endMoveInteraction(event);
    endResizeInteraction(event);
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
            onPointerCancel={handlePointerEnd}
            onPointerDown={handleNotePointerDown}
            onPointerMove={handleNotePointerMove}
            onResizePointerDown={handleResizePointerDown}
            onPointerUp={handlePointerEnd}
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
