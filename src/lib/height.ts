import { useSignal } from "@builder.io/qwik";

export function syncHeight(el: HTMLElement, initial = 0) {
  const signal = useSignal(initial);
  if (!el) return;
  
  let ro = new ResizeObserver(() => {
    if (el) {
      return (signal.value = el.offsetHeight);
    }
  });
  ro.observe(el);
  
  // return () => ro.disconnect();
  return signal;
}