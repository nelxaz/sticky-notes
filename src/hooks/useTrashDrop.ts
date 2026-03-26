import { useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Note } from "../types/notes.ts";

export function useTrashDrop({ setNotes }: { setNotes: Dispatch<SetStateAction<Note[]>> }) {
  const trashZoneRef = useRef<HTMLDivElement | null>(null);
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

  function handleTrashDrop(noteId: string) {
    if (!isTrashTargeted) {
      return;
    }

    setNotes((currentNotes) => currentNotes.filter((note) => note.id !== noteId));
  }

  return {
    clearTrashTarget,
    handleTrashDrop,
    isTrashTargeted,
    syncTrashTarget,
    trashZoneRef,
  };
}
