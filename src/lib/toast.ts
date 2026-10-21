type Listener = (msg: { id: number; text: string }) => void;
const listeners = new Set<Listener>();
let id = 0;

export function toast(text: string) {
  id += 1;
  listeners.forEach((l) => l({ id, text }));
}

export function onToast(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
