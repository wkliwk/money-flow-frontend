export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .catch(() => {
          // SW registration failed — app still works without it
        });
    });
  }
}
