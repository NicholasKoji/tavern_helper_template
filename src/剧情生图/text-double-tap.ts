const excluded =
  'button, a, input, textarea, select, img, video, audio, pre, code, [contenteditable]:not([contenteditable="false"]), .story-image-slot, [data-story-image-slot], .extraMesButtons, .mes_buttons, .story-image-quick-btn';

/** Native capture avoids child bubble handlers; only a completed eligible gesture is consumed. */
export function bindTextDoubleTap(
  doc: Document,
  enabled: () => boolean,
  trigger: (text: HTMLElement, target: HTMLElement, coords: { x: number; y: number }) => void,
  ownerText?: HTMLElement,
): () => void {
  const resolve = (event: Event) => {
    if (!enabled()) return null;
    const node = event.target as Node | null;
    const target = (node?.nodeType === 1 ? node : node?.parentElement) as HTMLElement | null;
    const text = ownerText ?? target?.closest<HTMLElement>('#chat .mes .mes_text');
    if (ownerText && !ownerText.isConnected) return null;
    const message = text?.closest('.mes');
    if (!target || !text || !message || target.closest(excluded) || message.matches('[is_user="true"], .is_user'))
      return null;
    const id = message.getAttribute('mesid');
    return id !== null && id !== '' && Number.isFinite(Number(id)) ? { target, text } : null;
  };
  const doubleClick = (event: MouseEvent) => {
    // Ignore touch-synthesized mouse events even on hybrid devices.
    if (
      !doc.defaultView?.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      (event as MouseEvent & { sourceCapabilities?: { firesTouchEvents?: boolean } }).sourceCapabilities
        ?.firesTouchEvents
    )
      return;
    const hit = resolve(event);
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    trigger(hit.text, hit.target, { x: event.clientX, y: event.clientY });
  };
  doc.addEventListener('dblclick', doubleClick, true);
  return () => doc.removeEventListener('dblclick', doubleClick, true);
}
