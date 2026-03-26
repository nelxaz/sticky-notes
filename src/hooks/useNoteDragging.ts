import { useEffect, useRef, useState } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent, RefObject, SetStateAction } from "react";
import type { ActiveInteractionKind } from "../types/interactions.ts";
import type { Note } from "../types/notes.ts";
import { clamp, getElementRect, promoteNoteToFront, updateNote } from "./stickyBoardUtils.ts";

type MoveInteraction = {
  type: "move";
  noteId: string;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  grabOffsetX: number;
  grabOffsetY: number;
};

export function useNoteDragging({
  activeInteractionRef,
  boardSurfaceRef,
  clearTrashTarget,
  isNoteLocked,
  handleTrashDrop,
  nextZIndex,
  notes,
  setNotes,
  setNextZIndex,
  syncTrashTarget,
}: {
  activeInteractionRef: RefObject<ActiveInteractionKind | null>;
  boardSurfaceRef: RefObject<HTMLDivElement | null>;
  clearTrashTarget: () => void;
  handleTrashDrop: (noteId: string) => Promise<void>;
  isNoteLocked: (noteId: string) => boolean;
  nextZIndex: number;
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setNextZIndex: Dispatch<SetStateAction<number>>;
  syncTrashTarget: (pointerX: number, pointerY: number) => void;
}) {
  const [moveInteraction, setMoveInteraction] = useState<MoveInteraction | null>(null);
  const pointerCaptureTargetRef = useRef<HTMLElement | null>(null);

  function releaseMovePointerCapture(pointerId: number) {
    const pointerCaptureTarget = pointerCaptureTargetRef.current;

    if (pointerCaptureTarget?.hasPointerCapture(pointerId)) {
      pointerCaptureTarget.releasePointerCapture(pointerId);
    }

    pointerCaptureTargetRef.current = null;
  }

  function handleNotePointerDown(event: ReactPointerEvent<HTMLElement>, note: Note) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      activeInteractionRef.current ||
      isNoteLocked(note.id)
    ) {
      return;
    }

    const boardRect = getElementRect(boardSurfaceRef);

    if (!boardRect) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerCaptureTargetRef.current = event.currentTarget;
    activeInteractionRef.current = "move";

    setMoveInteraction({
      type: "move",
      noteId: note.id,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: note.x,
      startY: note.y,
      grabOffsetX: event.clientX - boardRect.left - note.x,
      grabOffsetY: event.clientY - boardRect.top - note.y,
    });

    promoteNoteToFront({
      noteId: note.id,
      nextZIndex,
      setNotes,
      setNextZIndex,
    });
  }

  function handleMovePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const boardRect = getElementRect(boardSurfaceRef);

    if (!boardRect || !moveInteraction || moveInteraction.pointerId !== event.pointerId) {
      return;
    }

    const activeNote = notes.find((note) => note.id === moveInteraction.noteId);

    if (!activeNote) {
      return;
    }

    const maxX = Math.max(0, boardRect.width - activeNote.width);
    const maxY = Math.max(0, boardRect.height - activeNote.height);
    const nextX = clamp({
      input: event.clientX - boardRect.left - moveInteraction.grabOffsetX,
      lowerBound: 0,
      upperBound: maxX,
    });
    const nextY = clamp({
      input: event.clientY - boardRect.top - moveInteraction.grabOffsetY,
      lowerBound: 0,
      upperBound: maxY,
    });

    updateNote({
      noteId: moveInteraction.noteId,
      setNotes,
      updater: (note) => ({ ...note, x: nextX, y: nextY }),
    });
    syncTrashTarget(event.clientX, event.clientY);
  }

  async function endMoveInteraction(_event: ReactPointerEvent<HTMLElement>) {
    if (!moveInteraction || activeInteractionRef.current !== "move") {
      return;
    }

    releaseMovePointerCapture(moveInteraction.pointerId);
    activeInteractionRef.current = null;
    await handleTrashDrop(moveInteraction.noteId);
    setMoveInteraction(null);
    clearTrashTarget();
  }

  useEffect(() => {
    if (!moveInteraction) {
      return;
    }

    const activeMoveInteraction = moveInteraction;

    function handleWindowPointerEnd(event: PointerEvent) {
      if (
        event.pointerId !== activeMoveInteraction.pointerId ||
        activeInteractionRef.current !== "move"
      ) {
        return;
      }

      releaseMovePointerCapture(activeMoveInteraction.pointerId);
      activeInteractionRef.current = null;
      void handleTrashDrop(activeMoveInteraction.noteId);
      setMoveInteraction(null);
      clearTrashTarget();
    }

    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [activeInteractionRef, clearTrashTarget, handleTrashDrop, moveInteraction]);

  return {
    endMoveInteraction,
    handleMovePointerMove,
    handleNotePointerDown,
    moveInteraction,
  };
}
