export let tavernDocument: Document = document;
export let tavernWindow: Window = window;

export function initTavernDom(rootEl: HTMLElement): void {
  if (rootEl && rootEl.ownerDocument) {
    tavernDocument = rootEl.ownerDocument;
    tavernWindow = (tavernDocument.defaultView || window) as Window;
  }
}

export function getTavernViewport(): { width: number; height: number } {
  if (tavernWindow.visualViewport) {
    return {
      width: tavernWindow.visualViewport.width,
      height: tavernWindow.visualViewport.height,
    };
  }
  return {
    width: tavernWindow.innerWidth || 1024,
    height: tavernWindow.innerHeight || 768,
  };
}

export function clearTavernSelection(): void {
  try {
    const sel = tavernWindow.getSelection ? tavernWindow.getSelection() : window.getSelection();
    sel?.removeAllRanges();
  } catch {
    /* ignore */
  }
}
