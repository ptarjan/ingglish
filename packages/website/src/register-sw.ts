export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  // ?reset-sw escape hatch: unregister SW and clear all caches
  if (location.search.includes('reset-sw')) {
    void navigator.serviceWorker.getRegistration().then((r) => r?.unregister());
    void caches.keys().then((keys) => {
      keys.forEach((k) => void caches.delete(k));
    });
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('SW registration failed:', error);
    });
  });
}
