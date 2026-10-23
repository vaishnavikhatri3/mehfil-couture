/** Opens the full-screen image viewer from any zoomable image. */
export type ZoomItem = {
  src: string; // what's already on screen (cached — shows instantly)
  hiSrc?: string; // a larger rendition of the same photo, swapped in once loaded
  alt: string;
};

type Listener = (item: ZoomItem) => void;
const listeners = new Set<Listener>();

export function openZoom(item: ZoomItem) {
  listeners.forEach((l) => l(item));
}

export function onZoom(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
