import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { NOTE_COLORS } from "../constants/noteColors.ts";
import type { ResizeEdge } from "../types/interactions.ts";
import type { Note } from "../types/notes.ts";

type StickyNoteProps = {
  isDragging: boolean;
  isEditing: boolean;
  isResizing: boolean;
  note: Note;
  onEditBlur: (event: FocusEvent<HTMLTextAreaElement>, note: Note) => void;
  onEditChange: (event: ChangeEvent<HTMLTextAreaElement>, note: Note) => void;
  onNoteDoubleClick: (note: Note) => void;
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
  isEditing,
  isResizing,
  note,
  onEditBlur,
  onEditChange,
  onNoteDoubleClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onResizePointerDown,
  onPointerUp,
}: StickyNoteProps) {
  const palette = NOTE_COLORS[note.color];

  return (
    <article
      className={`sticky-note${isDragging ? " sticky-note--dragging" : ""}${
        isEditing ? " sticky-note--editing" : ""
      }${isResizing ? " sticky-note--resizing" : ""}`}
      data-note-root="true"
      onDoubleClick={() => onNoteDoubleClick(note)}
      onPointerCancel={isEditing ? undefined : onPointerCancel}
      onPointerDown={isEditing ? undefined : (event) => onPointerDown(event, note)}
      onPointerMove={isEditing ? undefined : onPointerMove}
      onPointerUp={isEditing ? undefined : onPointerUp}
      style={
        {
          "--note-background": palette.background,
          "--note-border": palette.border,
          "--note-line": palette.line,
          "--note-shadow": palette.shadow,
          "--note-sheen": palette.sheen,
          "--note-text": palette.text,
          left: note.x,
          top: note.y,
          width: note.width,
          height: note.height,
          zIndex: note.zIndex,
        } as CSSProperties
      }
    >
      {!isEditing ? (
        <>
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
        </>
      ) : null}
      <div className="sticky-note__surface">
        {isEditing ? (
          <textarea
            autoFocus
            className="sticky-note__editor"
            onBlur={(event) => onEditBlur(event, note)}
            onChange={(event) => onEditChange(event, note)}
            onPointerDown={(event) => event.stopPropagation()}
            value={note.text}
          />
        ) : note.text ? (
          <p className="sticky-note__text">{note.text}</p>
        ) : (
          <span className="sticky-note__blank" aria-hidden="true" />
        )}
      </div>
    </article>
  );
}
