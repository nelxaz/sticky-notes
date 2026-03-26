import type { Note } from "../types/notes.ts";
import type { PointerEvent as ReactPointerEvent } from "react";

type StickyNoteProps = {
  isDragging: boolean;
  note: Note;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, note: Note) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
};

export function StickyNote({
  isDragging,
  note,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: StickyNoteProps) {
  return (
    <article
      className={`sticky-note${isDragging ? " sticky-note--dragging" : ""}`}
      data-note-root="true"
      onPointerCancel={onPointerCancel}
      onPointerDown={(event) => onPointerDown(event, note)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
    >
      <div className="sticky-note__surface">
        {note.text ? (
          <p className="sticky-note__text">{note.text}</p>
        ) : (
          <span className="sticky-note__blank" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}
