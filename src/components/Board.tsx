import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_NOTE_COLOR, NOTE_COLORS, NOTE_COLOR_ORDER } from "../constants/noteColors.ts";
import { useNoteCreation } from "../hooks/useNoteCreation.ts";
import { useNoteDragging } from "../hooks/useNoteDragging.ts";
import { useNoteResizing } from "../hooks/useNoteResizing.ts";
import { useTrashDrop } from "../hooks/useTrashDrop.ts";
import { promoteNoteToFront, updateNote } from "../hooks/stickyBoardUtils.ts";
import { fetchStarterNotes } from "../mocks/notesApi.ts";
import type { ActiveInteractionKind } from "../types/interactions.ts";
import type { Note, NoteColor } from "../types/notes.ts";
import { StickyNote } from "./StickyNote.tsx";
import { TrashZone } from "./TrashZone.tsx";

const STORAGE_KEY = "sticky-notes.board";

type StoredBoardState = {
  nextNoteId: number;
  nextZIndex: number;
  notes: Note[];
  selectedColor: NoteColor;
};

function isStoredBoardState(value: unknown): value is StoredBoardState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<StoredBoardState>;

  return (
    Array.isArray(record.notes) &&
    typeof record.nextNoteId === "number" &&
    typeof record.nextZIndex === "number" &&
    typeof record.selectedColor === "string"
  );
}

function normalizeStoredNotes(notes: Note[]) {
  return notes.map((note) => ({
    ...note,
    color: note.color ?? DEFAULT_NOTE_COLOR,
  }));
}

export function Board() {
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const activeInteractionRef = useRef<ActiveInteractionKind | null>(null);
  const noteIdRef = useRef(0);
  const skipPersistRef = useRef(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingStarterNotes, setIsLoadingStarterNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [selectedColor, setSelectedColor] = useState<NoteColor>(DEFAULT_NOTE_COLOR);
  const {
    clearDeleteError,
    clearTrashTarget,
    deleteErrorMessage: trashDeleteErrorMessage,
    handleTrashDrop,
    isTrashTargeted,
    pendingDeleteNoteId,
    syncTrashTarget,
    trashZoneRef,
  } = useTrashDrop({
    setNotes,
  });
  const { handleBoardDoubleClick } = useNoteCreation({
    canCreateNote: editingNoteId === null,
    noteIdRef,
    nextZIndex,
    selectedColor,
    setNotes,
    setNextZIndex,
  });
  const { endMoveInteraction, handleMovePointerMove, handleNotePointerDown, moveInteraction } =
    useNoteDragging({
      activeInteractionRef,
      boardSurfaceRef,
      clearTrashTarget,
      handleTrashDrop,
      isNoteLocked: (noteId) => editingNoteId === noteId || pendingDeleteNoteId === noteId,
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
    isNoteLocked: (noteId) => editingNoteId === noteId || pendingDeleteNoteId === noteId,
    nextZIndex,
    setNotes,
    setNextZIndex,
  });

  useEffect(() => {
    let isCancelled = false;

    async function hydrateBoard() {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);

      if (storedValue) {
        try {
          const parsed = JSON.parse(storedValue) as unknown;

          if (isStoredBoardState(parsed)) {
            const normalizedNotes = normalizeStoredNotes(parsed.notes);

            if (!isCancelled) {
              noteIdRef.current = parsed.nextNoteId;
              setNotes(normalizedNotes);
              setNextZIndex(parsed.nextZIndex);
              setSelectedColor(parsed.selectedColor);
              setIsHydrated(true);
            }

            return;
          }
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      setIsLoadingStarterNotes(true);

      try {
        const starterNotes = await fetchStarterNotes();

        if (!isCancelled) {
          const normalizedNotes = normalizeStoredNotes(starterNotes);
          const restoredNextZIndex =
            normalizedNotes.reduce(
              (highestZIndex, note) => Math.max(highestZIndex, note.zIndex),
              0,
            ) + 1;

          setNotes(normalizedNotes);
          setNextZIndex(restoredNextZIndex);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStarterNotes(false);
          setIsHydrated(true);
        }
      }
    }

    void hydrateBoard();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const snapshot: StoredBoardState = {
      nextNoteId: noteIdRef.current,
      nextZIndex,
      notes,
      selectedColor,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [isHydrated, nextZIndex, notes, selectedColor]);

  useEffect(() => {
    if (trashDeleteErrorMessage) {
      setDeleteErrorMessage(trashDeleteErrorMessage);
    }
  }, [trashDeleteErrorMessage]);

  function clearAllNotes() {
    skipPersistRef.current = true;
    noteIdRef.current = 0;
    window.localStorage.removeItem(STORAGE_KEY);
    setNotes([]);
    setNextZIndex(1);
    setEditingNoteId(null);
    clearDeleteError();
    setDeleteErrorMessage("");
  }

  function handleColorSelection(color: NoteColor) {
    setSelectedColor(color);
  }

  function handleNoteDoubleClick(note: Note) {
    if (pendingDeleteNoteId === note.id) {
      return;
    }

    promoteNoteToFront({
      noteId: note.id,
      nextZIndex,
      setNotes,
      setNextZIndex,
    });
    setEditingNoteId(note.id);
    clearDeleteError();
    setDeleteErrorMessage("");
  }

  function handleEditChange(event: ChangeEvent<HTMLTextAreaElement>, note: Note) {
    updateNote({
      noteId: note.id,
      setNotes,
      updater: (currentNote) => ({ ...currentNote, text: event.target.value }),
    });
  }

  function handleEditBlur(_event: FocusEvent<HTMLTextAreaElement>, _note: Note) {
    setEditingNoteId(null);
  }

  function handleNotePointerMove(event: ReactPointerEvent<HTMLElement>) {
    handleMovePointerMove(event);
    handleResizePointerMove(event);
  }

  async function handlePointerEnd(event: ReactPointerEvent<HTMLElement>) {
    await endMoveInteraction(event);
    endResizeInteraction(event);
  }

  return (
    <section className="board-frame" aria-labelledby="board-title">
      <header className="board-frame__header">
        <div>
          <p className="board-frame__label">Workspace</p>
          <h2 id="board-title">Board</h2>
        </div>
        <div className="board-frame__tools">
          <div aria-label="Note color selection" className="board-color-picker" role="radiogroup">
            {NOTE_COLOR_ORDER.map((color) => (
              <button
                aria-checked={selectedColor === color}
                className={`board-color-picker__swatch${
                  selectedColor === color ? " board-color-picker__swatch--selected" : ""
                }`}
                key={color}
                onClick={() => handleColorSelection(color)}
                role="radio"
                style={{ "--swatch-color": NOTE_COLORS[color].swatch } as CSSProperties}
                type="button"
              >
                <span className="sr-only">{NOTE_COLORS[color].label}</span>
              </button>
            ))}
          </div>
          <button className="board-frame__action" onClick={clearAllNotes} type="button">
            Clear all notes
          </button>
          <p className="board-frame__status">
            {isLoadingStarterNotes
              ? "Loading starter notes..."
              : `${notes.length} note${notes.length === 1 ? "" : "s"} on board`}
          </p>
        </div>
      </header>

      {deleteErrorMessage ? (
        <div className="board-frame__banner" role="status">
          <p>{deleteErrorMessage}</p>
          <button onClick={() => setDeleteErrorMessage("")} type="button">
            Dismiss
          </button>
        </div>
      ) : null}

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
            isDragging={moveInteraction?.noteId === note.id}
            isEditing={editingNoteId === note.id}
            isResizing={resizeInteraction?.noteId === note.id}
            key={note.id}
            note={note}
            onEditBlur={handleEditBlur}
            onEditChange={handleEditChange}
            onNoteDoubleClick={handleNoteDoubleClick}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handleNotePointerDown}
            onPointerMove={handleNotePointerMove}
            onResizePointerDown={handleResizePointerDown}
            onPointerUp={handlePointerEnd}
          />
        ))}
        {notes.length === 0 && !isLoadingStarterNotes ? (
          <p className="board-surface__hint">Double-clicking empty space will create notes here.</p>
        ) : null}
        <div className="board-surface__trash" ref={trashZoneRef}>
          <TrashZone
            isActive={moveInteraction !== null}
            isPending={pendingDeleteNoteId !== null}
            isTargeted={moveInteraction !== null && isTrashTargeted}
          />
        </div>
        <p className="board-surface__next">Next z-index: {nextZIndex}</p>
      </div>
    </section>
  );
}
