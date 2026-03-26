import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { BoardSnapshot } from "../types/boardPersistence.ts";
import type { Note } from "../types/notes.ts";
import { deleteNoteRequest } from "../mocks/notesApi.ts";

export function useTrashDrop({
  getDeleteSuccessSnapshot,
  setNotes,
}: {
  getDeleteSuccessSnapshot: (notes: Note[]) => BoardSnapshot;
  setNotes: Dispatch<SetStateAction<Note[]>>;
}) {
  const trashZoneRef = useRef<HTMLDivElement | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");
  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(null);
  const [isTrashTargeted, setIsTrashTargeted] = useState(false);

  function syncTrashTarget(pointerX: number, pointerY: number) {
    const trashZoneRect = trashZoneRef.current?.getBoundingClientRect();

    if (!trashZoneRect) {
      setIsTrashTargeted(false);
      return;
    }

    setIsTrashTargeted(
      pointerX >= trashZoneRect.left &&
        pointerX <= trashZoneRect.right &&
        pointerY >= trashZoneRect.top &&
        pointerY <= trashZoneRect.bottom,
    );
  }

  function clearTrashTarget() {
    setIsTrashTargeted(false);
  }

  function clearDeleteError() {
    setDeleteErrorMessage("");
  }

  async function handleTrashDrop(noteId: string) {
    if (!isTrashTargeted) {
      return;
    }

    setPendingDeleteNoteId(noteId);
    setDeleteErrorMessage("");

    try {
      await deleteNoteRequest();
      setNotes((currentNotes) => {
        const nextNotes = currentNotes.filter((note) => note.id !== noteId);

        getDeleteSuccessSnapshot(nextNotes);

        return nextNotes;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The note could not be deleted. Please try again.";
      setDeleteErrorMessage(message);
    } finally {
      setPendingDeleteNoteId(null);
    }
  }

  return {
    clearDeleteError,
    clearTrashTarget,
    deleteErrorMessage,
    handleTrashDrop,
    isTrashTargeted,
    pendingDeleteNoteId,
    syncTrashTarget,
    trashZoneRef,
  };
}
