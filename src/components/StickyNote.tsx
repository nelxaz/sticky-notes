import type { Note } from "../types/notes.ts";

type StickyNoteProps = {
  note: Note;
};

export function StickyNote({ note }: StickyNoteProps) {
  return (
    <article
      className="sticky-note"
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
    >
      <div className="sticky-note__surface">
        <p className="sticky-note__text">{note.text}</p>
      </div>
    </article>
  );
}
