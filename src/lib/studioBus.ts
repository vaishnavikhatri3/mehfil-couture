import type { StudioSelection } from "../data/studio";

/** Lets other sections (occasions, lehenga reveal) pre-select Style Studio options. */
export const STUDIO_PRESET = "mehfil:studio-preset";

export function presetStudio(partial: Partial<StudioSelection>) {
  window.dispatchEvent(new CustomEvent<Partial<StudioSelection>>(STUDIO_PRESET, { detail: partial }));
}
