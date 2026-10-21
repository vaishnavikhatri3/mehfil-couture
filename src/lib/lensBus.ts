import type { Look } from "../data/mixmatch";

/** Opens the Try-on Lens from anywhere (e.g. with the current Sketchbook look). */
export const OPEN_LENS = "mehfil:open-lens";

export function openLens(look?: Look) {
  window.dispatchEvent(new CustomEvent<Look | undefined>(OPEN_LENS, { detail: look }));
}
