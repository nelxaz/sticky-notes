import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_NOTE_COLOR, NOTE_COLORS, NOTE_COLOR_ORDER } from "../constants/noteColors.ts";
import { useBoardPersistence } from "../hooks/useBoardPersistence.ts";
import { useNoteCreation } from "../hooks/useNoteCreation.ts";
import { useNoteDragging } from "../hooks/useNoteDragging.ts";
import { useNoteResizing } from "../hooks/useNoteResizing.ts";
import { useTrashDrop } from "../hooks/useTrashDrop.ts";
import { promoteNoteToFront, updateNote } from "../hooks/stickyBoardUtils.ts";
import type { BoardSnapshot } from "../types/boardPersistence.ts";
import type { ActiveInteractionKind } from "../types/interactions.ts";
import type { Note, NoteColor } from "../types/notes.ts";
import { StickyNote } from "./StickyNote.tsx";
import { TrashZone } from "./TrashZone.tsx";

function updateStateRef<T>(ref: MutableRefObject<T>, value: T) {
  ref.current = value;
  return value;
}

export function Board() {
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const activeInteractionRef = useRef<ActiveInteractionKind | null>(null);
  const noteIdRef = useRef(0);
  const notesRef = useRef<Note[]>([]);
  const nextZIndexRef = useRef(1);
  const selectedColorRef = useRef<NoteColor>(DEFAULT_NOTE_COLOR);
  const previousMoveActiveRef = useRef(false);
  const previousResizeActiveRef = useRef(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingStarterNotes, setIsLoadingStarterNotes] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [selectedColor, setSelectedColor] = useState<NoteColor>(DEFAULT_NOTE_COLOR);
  const { clearPersistedBoard, hydrateBoard, persistBoardState } = useBoardPersistence();

  function createSnapshot({
    nextNoteId,
    nextZIndex,
    notes,
    selectedColor,
  }: BoardSnapshot): BoardSnapshot {
    return {
      nextNoteId,
      nextZIndex,
      notes,
      selectedColor,
    };
  }

  function persistCurrentBoardState(overrides?: Partial<BoardSnapshot>) {
    persistBoardState(
      createSnapshot({
        nextNoteId: overrides?.nextNoteId ?? noteIdRef.current,
        nextZIndex: overrides?.nextZIndex ?? nextZIndexRef.current,
        notes: overrides?.notes ?? notesRef.current,
        selectedColor: overrides?.selectedColor ?? selectedColorRef.current,
      }),
    );
  }

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
    getDeleteSuccessSnapshot: (nextNotes) => {
      const snapshot = createSnapshot({
        nextNoteId: noteIdRef.current,
        nextZIndex: nextZIndexRef.current,
        notes: nextNotes,
        selectedColor: selectedColorRef.current,
      });

      persistBoardState(snapshot);

      return snapshot;
    },
    setNotes,
  });
  const { handleBoardDoubleClick } = useNoteCreation({
    canCreateNote: editingNoteId === null,
    noteIdRef,
    onNoteCreated: persistBoardState,
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
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    nextZIndexRef.current = nextZIndex;
  }, [nextZIndex]);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrate() {
      setIsLoadingStarterNotes(true);

      try {
        const { snapshot } = await hydrateBoard();

        if (!isCancelled) {
          noteIdRef.current = snapshot.nextNoteId;
          setNotes(updateStateRef(notesRef, snapshot.notes));
          setNextZIndex(updateStateRef(nextZIndexRef, snapshot.nextZIndex));
          setSelectedColor(updateStateRef(selectedColorRef, snapshot.selectedColor));
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingStarterNotes(false);
          setIsHydrated(true);
        }
      }
    }

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, [hydrateBoard]);

  useEffect(() => {
    if (trashDeleteErrorMessage) {
      setDeleteErrorMessage(trashDeleteErrorMessage);
    }
  }, [trashDeleteErrorMessage]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (previousMoveActiveRef.current && moveInteraction === null) {
      persistCurrentBoardState();
    }

    previousMoveActiveRef.current = moveInteraction !== null;
  }, [isHydrated, moveInteraction]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (previousResizeActiveRef.current && resizeInteraction === null) {
      persistCurrentBoardState();
    }

    previousResizeActiveRef.current = resizeInteraction !== null;
  }, [isHydrated, resizeInteraction]);

  function clearAllNotes() {
    noteIdRef.current = 0;
    clearPersistedBoard();
    setNotes(updateStateRef(notesRef, []));
    setNextZIndex(updateStateRef(nextZIndexRef, 1));
    setEditingNoteId(null);
    clearDeleteError();
    setDeleteErrorMessage("");
  }

  function handleColorSelection(color: NoteColor) {
    setSelectedColor(updateStateRef(selectedColorRef, color));
    persistCurrentBoardState({ selectedColor: color });
  }

  function handleDismissDeleteError() {
    clearDeleteError();
    setDeleteErrorMessage("");
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
    persistCurrentBoardState();
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
          <button onClick={handleDismissDeleteError} type="button">
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
            onLostPointerCapture={handlePointerEnd}
            onNoteDoubleClick={handleNoteDoubleClick}
            onPointerCancel={handlePointerEnd}
            onPointerDown={handleNotePointerDown}
            onPointerMove={handleNotePointerMove}
            onPointerUp={handlePointerEnd}
            onResizePointerDown={handleResizePointerDown}
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
