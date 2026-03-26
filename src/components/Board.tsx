import { useState } from "react";
import { StickyNote } from "./StickyNote.tsx";
import type { Note } from "../types/notes.ts";

const SEEDED_NOTES: Note[] = [
  {
    id: "seed-1",
    x: 72,
    y: 56,
    width: 180,
    height: 180,
    text: "Scope the board before adding gestures.",
    zIndex: 1,
  },
  {
    id: "seed-2",
    x: 288,
    y: 138,
    width: 204,
    height: 168,
    text: "Static notes first. Creation arrives in Slice 3.",
    zIndex: 2,
  },
  {
    id: "seed-3",
    x: 546,
    y: 86,
    width: 188,
    height: 196,
    text: "Board owns note geometry and layering state.",
    zIndex: 3,
  },
];

export function Board() {
  const [notes] = useState<Note[]>(SEEDED_NOTES);
  const [nextZIndex] = useState(() => Math.max(...SEEDED_NOTES.map((note) => note.zIndex)) + 1);

  return (
    <section className="board-frame" aria-labelledby="board-title">
      <header className="board-frame__header">
        <div>
          <p className="board-frame__label">Workspace</p>
          <h2 id="board-title">Board</h2>
        </div>
        <p className="board-frame__status">
          {notes.length} note{notes.length === 1 ? "" : "s"} staged
        </p>
      </header>

      <div className="board-surface" aria-label="Sticky notes board" role="presentation">
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
