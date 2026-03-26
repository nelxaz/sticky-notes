import { useCallback } from "react";
import { DEFAULT_NOTE_COLOR } from "../constants/noteColors.ts";
import { fetchStarterNotes } from "../mocks/notesApi.ts";
import type { BoardSnapshot } from "../types/boardPersistence.ts";
import type { Note } from "../types/notes.ts";

const STORAGE_KEY = "sticky-notes.board";

function isBoardSnapshot(value: unknown): value is BoardSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<BoardSnapshot>;

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

export function useBoardPersistence() {
  const persistBoardState = useCallback((snapshot: BoardSnapshot) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, []);

  const clearPersistedBoard = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hydrateBoard = useCallback(async () => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue) as unknown;

        if (isBoardSnapshot(parsed)) {
          return {
            snapshot: {
              ...parsed,
              notes: normalizeStoredNotes(parsed.notes),
            },
            source: "storage" as const,
          };
        }
      } catch {
        clearPersistedBoard();
      }
    }

    const starterNotes = normalizeStoredNotes(await fetchStarterNotes());
    const starterSnapshot: BoardSnapshot = {
      nextNoteId: starterNotes.length,
      nextZIndex:
        starterNotes.reduce((highestZIndex, note) => Math.max(highestZIndex, note.zIndex), 0) + 1,
      notes: starterNotes,
      selectedColor: DEFAULT_NOTE_COLOR,
    };

    persistBoardState(starterSnapshot);

    return {
      snapshot: starterSnapshot,
      source: "starter" as const,
    };
  }, [clearPersistedBoard, persistBoardState]);

  return {
    clearPersistedBoard,
    hydrateBoard,
    persistBoardState,
  };
}
