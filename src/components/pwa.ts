import { writable } from 'svelte/store';
import { registerSW, type RegisterSWOptions } from 'virtual:pwa-register';

export function createServiceWorker(options: RegisterSWOptions = {}) {
  const {
    immediate = true,
    onNeedRefresh,
    onOfflineReady,
    onRegisteredSW,
    onRegisterError,
  } = options;

  const needRefresh = writable(false);
  const offlineReady = writable(false);

  const refreshSW = registerSW({
    immediate,
    onOfflineReady() {
      needRefresh.set(true);
      onOfflineReady?.();
    },
    onNeedRefresh() {
      needRefresh.set(true);
      onNeedRefresh?.();
    },
    onRegisteredSW,
    onRegisterError,
  })

  return {
    needRefresh,
    offlineReady,
    refreshSW,
  };
}