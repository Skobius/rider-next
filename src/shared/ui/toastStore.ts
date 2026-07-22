import { useSyncExternalStore } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
}

const listeners = new Set<() => void>();
let currentToast: ToastMessage | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  listeners.forEach((listener) => listener());
}

export function showToast(text: string) {
  currentToast = { id: Date.now(), text };
  emit();

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    currentToast = null;
    emit();
  }, 1800);
}

export function useToastMessage() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => currentToast,
    () => null,
  );
}
