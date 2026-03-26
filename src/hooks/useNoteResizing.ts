import { useEffect, useRef, useState } from "react";
import type { Dispatch, PointerEvent as ReactPointerEvent, RefObject, SetStateAction } from "react";
import type { ActiveInteractionKind, ResizeEdge } from "../types/interactions.ts";
import type { Note } from "../types/notes.ts";
import { clamp, getElementRect, promoteNoteToFront, updateNote } from "./stickyBoardUtils.ts";

const MIN_NOTE_SIZE = 56;

type ResizeInteraction = {
  type: "resize";
  noteId: string;
  pointerId: number;
  edge: ResizeEdge;
  startPointerX: number;
  startPointerY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
};

function getNoteRootElement(element: HTMLElement) {
  const noteRoot = element.closest<HTMLElement>("[data-note-root='true']");

  return noteRoot ?? element;
}

export function useNoteResizing({
  activeInteractionRef,
  boardSurfaceRef,
  clearTrashTarget,
  isNoteLocked,
  nextZIndex,
  setNotes,
  setNextZIndex,
}: {
  activeInteractionRef: RefObject<ActiveInteractionKind | null>;
  boardSurfaceRef: RefObject<HTMLDivElement | null>;
  clearTrashTarget: () => void;
  isNoteLocked: (noteId: string) => boolean;
  nextZIndex: number;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setNextZIndex: Dispatch<SetStateAction<number>>;
}) {
  const [resizeInteraction, setResizeInteraction] = useState<ResizeInteraction | null>(null);
  const pointerCaptureTargetRef = useRef<HTMLElement | null>(null);

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLElement>,
    note: Note,
    edge: ResizeEdge,
  ) {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      activeInteractionRef.current ||
      isNoteLocked(note.id)
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const pointerCaptureTarget = getNoteRootElement(event.currentTarget);

    pointerCaptureTarget.setPointerCapture(event.pointerId);
    pointerCaptureTargetRef.current = pointerCaptureTarget;
    activeInteractionRef.current = "resize";

    setResizeInteraction({
      type: "resize",
      noteId: note.id,
      pointerId: event.pointerId,
      edge,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startX: note.x,
      startY: note.y,
      startWidth: note.width,
      startHeight: note.height,
    });

    promoteNoteToFront({
      noteId: note.id,
      nextZIndex,
      setNotes,
      setNextZIndex,
    });
  }

  function handleResizePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const boardRect = getElementRect(boardSurfaceRef);

    if (!boardRect || !resizeInteraction || resizeInteraction.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - resizeInteraction.startPointerX;
    const deltaY = event.clientY - resizeInteraction.startPointerY;

    updateNote({
      noteId: resizeInteraction.noteId,
      setNotes,
      updater: (note) => {
        let nextX = resizeInteraction.startX;
        let nextY = resizeInteraction.startY;
        let nextWidth = resizeInteraction.startWidth;
        let nextHeight = resizeInteraction.startHeight;

        if (resizeInteraction.edge === "right") {
          const maxWidth = boardRect.width - resizeInteraction.startX;
          nextWidth = clamp({
            input: resizeInteraction.startWidth + deltaX,
            lowerBound: MIN_NOTE_SIZE,
            upperBound: maxWidth,
          });
        }

        if (resizeInteraction.edge === "bottom") {
          const maxHeight = boardRect.height - resizeInteraction.startY;
          nextHeight = clamp({
            input: resizeInteraction.startHeight + deltaY,
            lowerBound: MIN_NOTE_SIZE,
            upperBound: maxHeight,
          });
        }

        if (resizeInteraction.edge === "left") {
          const maxX = resizeInteraction.startX + resizeInteraction.startWidth - MIN_NOTE_SIZE;
          nextX = clamp({
            input: resizeInteraction.startX + deltaX,
            lowerBound: 0,
            upperBound: maxX,
          });
          nextWidth = resizeInteraction.startWidth + (resizeInteraction.startX - nextX);
        }

        if (resizeInteraction.edge === "top") {
          const maxY = resizeInteraction.startY + resizeInteraction.startHeight - MIN_NOTE_SIZE;
          nextY = clamp({
            input: resizeInteraction.startY + deltaY,
            lowerBound: 0,
            upperBound: maxY,
          });
          nextHeight = resizeInteraction.startHeight + (resizeInteraction.startY - nextY);
        }

        return {
          ...note,
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };
      },
    });
  }

  function endResizeInteraction(_event: ReactPointerEvent<HTMLElement>) {
    if (!resizeInteraction || activeInteractionRef.current !== "resize") {
      return;
    }

    const pointerCaptureTarget = pointerCaptureTargetRef.current;

    if (pointerCaptureTarget?.hasPointerCapture(resizeInteraction.pointerId)) {
      pointerCaptureTarget.releasePointerCapture(resizeInteraction.pointerId);
    }

    activeInteractionRef.current = null;
    pointerCaptureTargetRef.current = null;
    setResizeInteraction(null);
    clearTrashTarget();
  }

  useEffect(() => {
    if (!resizeInteraction) {
      return;
    }

    const activeResizeInteraction = resizeInteraction;

    function handleWindowPointerEnd(event: PointerEvent) {
      if (
        event.pointerId !== activeResizeInteraction.pointerId ||
        activeInteractionRef.current !== "resize"
      ) {
        return;
      }

      const pointerCaptureTarget = pointerCaptureTargetRef.current;

      if (pointerCaptureTarget?.hasPointerCapture(activeResizeInteraction.pointerId)) {
        pointerCaptureTarget.releasePointerCapture(activeResizeInteraction.pointerId);
      }

      activeInteractionRef.current = null;
      pointerCaptureTargetRef.current = null;
      setResizeInteraction(null);
      clearTrashTarget();
    }

    window.addEventListener("pointerup", handleWindowPointerEnd);
    window.addEventListener("pointercancel", handleWindowPointerEnd);

    return () => {
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [activeInteractionRef, clearTrashTarget, resizeInteraction]);

  return {
    endResizeInteraction,
    handleResizePointerDown,
    handleResizePointerMove,
    resizeInteraction,
  };
}
