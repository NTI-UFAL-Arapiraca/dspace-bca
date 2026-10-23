export const VLIBRAS_SCRIPT_ID = 'ufal-vlibras-script';
export const VLIBRAS_SCRIPT_URL = 'https://vlibras.gov.br/app/vlibras-plugin.js';

export interface VLibrasWindow extends Window {
  VLibras?: {
    Widget: new (options: { rootPath: string; position: 'R' }) => unknown;
  };
  VLibrasWidget?: { initBtn?: HTMLButtonElement };
}

/** One loader per browser document, including while the remote script is pending. */
export function initializeVLibras(document: Document, browserWindow: VLibrasWindow): void {
  if (browserWindow.VLibrasWidget?.initBtn || document.getElementById(VLIBRAS_SCRIPT_ID)) {
    return;
  }

  const configure = (): void => {
    if (!browserWindow.VLibrasWidget?.initBtn && browserWindow.VLibras?.Widget) {
      // The official loader also auto-starts. Its constructor configures the
      // position before that startup and shares the same instance guard.
      new browserWindow.VLibras.Widget({ rootPath: 'https://vlibras.gov.br/app', position: 'R' });
    }
    const access = browserWindow.VLibrasWidget?.initBtn?.parentElement;
    if (access?.id === 'vlibras-access') {
      // Raise the whole access control, keeping its hover label with the button.
      // The official default is calc(50vh - 20px); leave the page width intact.
      access.style.top = 'calc(50vh - 60px)';
    }
  };

  if (browserWindow.VLibras?.Widget) {
    configure();
    return;
  }

  const script = document.createElement('script');
  script.id = VLIBRAS_SCRIPT_ID;
  script.src = VLIBRAS_SCRIPT_URL;
  script.async = true;
  script.addEventListener('load', configure, { once: true });
  script.addEventListener('error', () => {
    // Leave navigation usable if the external service or CSP blocks the load.
    // A subsequent root initialization can retry, without a polling loop.
    script.remove();
    console.warn('Não foi possível carregar o VLibras. Verifique a conexão e a CSP.');
  }, { once: true });
  document.body.appendChild(script);
}
