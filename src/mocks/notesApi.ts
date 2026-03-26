import { DEFAULT_NOTE_COLOR } from "../constants/noteColors.ts";
import type { Note } from "../types/notes.ts";

const API_DELAY_MS = 420;

const STARTER_NOTES: Note[] = [
  {
    id: "starter-1",
    x: 88,
    y: 76,
    width: 180,
    height: 180,
    text: "Try double-clicking a note to edit text.",
    color: DEFAULT_NOTE_COLOR,
    zIndex: 1,
  },
  {
    id: "starter-2",
    x: 320,
    y: 132,
    width: 180,
    height: 180,
    text: "Drag a note into the trash zone to test async deletion.",
    color: "mint",
    zIndex: 2,
  },
];

function wait(duration: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export async function fetchStarterNotes() {
  await wait(API_DELAY_MS);

  return STARTER_NOTES.map((note) => ({ ...note }));
}

export async function deleteNoteRequest() {
  await wait(280);

  if (Math.random() < 1 / 3) {
    throw new Error("The note could not be deleted. Please try again.");
  }
}
