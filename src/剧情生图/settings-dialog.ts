/** Top-layer settings surface, sized to the host document's visible mobile viewport. */
export function bindSettingsDialog(dialog: HTMLDialogElement): () => void {
  const doc = dialog.ownerDocument;
  const win = doc.defaultView!;
  const viewport = win.visualViewport;
  const resize = () => {
    Object.assign(dialog.style, {
      left: `${viewport?.offsetLeft ?? 0}px`,
      top: `${viewport?.offsetTop ?? 0}px`,
      right: 'auto',
      bottom: 'auto',
      width: `${viewport?.width || win.innerWidth}px`,
      height: `${viewport?.height || win.innerHeight}px`,
    });
  };
  resize();
  dialog.showModal();
  win.addEventListener('resize', resize);
  viewport?.addEventListener('resize', resize);
  viewport?.addEventListener('scroll', resize);

  // Tavern toasts must stay visible above the native modal. Restore their host on close.
  let toast: HTMLElement | null = null;
  let originalParent: Node | null = null;
  let originalNext: ChildNode | null = null;
  const moveToast = () => {
    const found = doc.getElementById('toast-container');
    if (!found || dialog.contains(found)) return;
    toast = found;
    originalParent = found.parentNode;
    originalNext = found.nextSibling;
    dialog.append(found);
  };
  const observer = new win.MutationObserver(moveToast);
  observer.observe(doc.body, { childList: true });
  moveToast();
  return () => {
    observer.disconnect();
    win.removeEventListener('resize', resize);
    viewport?.removeEventListener('resize', resize);
    viewport?.removeEventListener('scroll', resize);
    if (toast && originalParent && dialog.contains(toast)) {
      originalParent.insertBefore(toast, originalNext?.parentNode === originalParent ? originalNext : null);
    }
    if (dialog.open) dialog.close();
  };
}
