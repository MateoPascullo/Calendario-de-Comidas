
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('addToHome').style.display = 'inline-block';
});

document.getElementById('addToHome').addEventListener('click', () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      deferredPrompt = null;
    });
  } else {
    alert("👉 En Safari tocá Compartir → 'Agregar a pantalla de inicio'.");
  }
});

  window.addEventListener('load', () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInStandalone) {
      document.getElementById('ios-install-hint').style.display = 'block';
    }
  });
