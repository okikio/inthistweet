import { writable } from "svelte/store";

export function syncHeight(el: HTMLElement, initial = 0) {
  return writable(initial, (set) => {
    if (!el) {
      return;
    }
    let ro = new ResizeObserver(() => {
      if (el) {
        return set(el.offsetHeight);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  });
}