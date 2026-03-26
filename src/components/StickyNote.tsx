import type { Note } from "../types/notes.ts";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ResizeEdge } from "../types/interactions.ts";

type StickyNoteProps = {
  isDragging: boolean;
  isResizing: boolean;
  note: Note;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>, note: Note) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onResizePointerDown: (
    event: ReactPointerEvent<HTMLElement>,
    note: Note,
    edge: ResizeEdge,
  ) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
};

export function StickyNote({
  isDragging,
  isResizing,
  note,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onResizePointerDown,
  onPointerUp,
}: StickyNoteProps) {
  return (
    <article
      className={`sticky-note${isDragging ? " sticky-note--dragging" : ""}${
        isResizing ? " sticky-note--resizing" : ""
      }`}
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
      <span
        className="sticky-note__edge sticky-note__edge--top"
        data-note-edge="top"
        onPointerDown={(event) => onResizePointerDown(event, note, "top")}
      />
      <span
        className="sticky-note__edge sticky-note__edge--right"
        data-note-edge="right"
        onPointerDown={(event) => onResizePointerDown(event, note, "right")}
      />
      <span
        className="sticky-note__edge sticky-note__edge--bottom"
        data-note-edge="bottom"
        onPointerDown={(event) => onResizePointerDown(event, note, "bottom")}
      />
      <span
        className="sticky-note__edge sticky-note__edge--left"
        data-note-edge="left"
        onPointerDown={(event) => onResizePointerDown(event, note, "left")}
      />
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
