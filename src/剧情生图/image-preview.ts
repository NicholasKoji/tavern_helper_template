/** One top-layer viewer shared by message images, references and the gallery. */
const viewers = new WeakMap<Document, () => void>();

export function openImagePreview(src: string, alt: string, doc: Document): void {
  if (!src) return;
  viewers.get(doc)?.();
  const win = doc.defaultView!;
  const previousFocus = doc.activeElement as HTMLElement | null;
  const dialog = doc.createElement('dialog');
  dialog.className = 'story-image-preview';
  dialog.setAttribute('aria-label', '图片预览');
  dialog.innerHTML = `<div class="story-image-preview-stage"><img draggable="false" /></div>
    <div class="story-image-preview-tools"><button type="button" data-reset>重置缩放</button>
    <span data-scale>100%</span><button type="button" data-close aria-label="关闭图片预览">关闭 ×</button></div>
    <div class="story-image-preview-hint" role="status">单击关闭 · 滚轮 / 双指缩放 · 放大后拖动</div>`;
  const img = dialog.querySelector('img')!;
  const stage = dialog.querySelector<HTMLElement>('.story-image-preview-stage')!;
  const status = dialog.querySelector<HTMLElement>('.story-image-preview-hint')!;
  img.alt = alt || '图片预览';
  let scale = 1,
    x = 0,
    y = 0,
    moved = false;
  const pointers = new Map<number, { x: number; y: number }>();
  let start = { x: 0, y: 0 };
  const render = () => {
    const maxX = Math.max(0, (img.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * scale - stage.clientHeight) / 2);
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    dialog.querySelector('[data-scale]')!.textContent = `${Math.round(scale * 100)}%`;
  };
  const zoom = (ratio: number, from: { x: number; y: number }, to = from) => {
    const next = Math.max(0.5, Math.min(8, scale * ratio));
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2,
      cy = rect.top + rect.height / 2;
    x = to.x - cx - ((from.x - cx - x) * next) / scale;
    y = to.y - cy - ((from.y - cy - y) * next) / scale;
    scale = next;
    render();
  };
  const resize = () => {
    const viewport = win.visualViewport;
    Object.assign(dialog.style, {
      left: `${viewport?.offsetLeft ?? 0}px`,
      top: `${viewport?.offsetTop ?? 0}px`,
      width: `${viewport?.width || win.innerWidth}px`,
      height: `${viewport?.height || win.innerHeight}px`,
    });
    render();
  };
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    win.removeEventListener('resize', resize);
    win.visualViewport?.removeEventListener('resize', resize);
    win.visualViewport?.removeEventListener('scroll', resize);
    if (dialog.open) dialog.close();
    dialog.remove();
    viewers.delete(doc);
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  };
  viewers.set(doc, close);
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    close();
  });
  // Keep Esc / Tab away from the settings window and Tavern's global handlers.
  dialog.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });
  const reset = () => {
    scale = 1;
    x = y = 0;
    render();
  };
  for (const [selector, action] of [
    ['[data-close]', close],
    ['[data-reset]', reset],
  ] as const) {
    const button = dialog.querySelector<HTMLButtonElement>(selector)!;
    button.addEventListener('click', action);
    button.addEventListener('pointerup', e => {
      if (e.pointerType === 'touch') {
        e.preventDefault();
        e.stopPropagation();
        action();
      }
    });
  }
  dialog.addEventListener('click', e => {
    e.stopPropagation();
    if (!(e.target as Element).closest('.story-image-preview-tools') && !moved) close();
  });
  dialog.addEventListener(
    'wheel',
    e => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.clientHeight : 1);
      zoom(Math.exp(-Math.max(-500, Math.min(500, delta)) * 0.002), { x: e.clientX, y: e.clientY });
    },
    { passive: false },
  );
  dialog.addEventListener('pointerdown', e => {
    if (e.button !== 0 || (e.target as Element).closest('.story-image-preview-tools')) return;
    if (!pointers.size) {
      moved = false;
      start = { x: e.clientX, y: e.clientY };
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size > 1) moved = true;
    dialog.setPointerCapture(e.pointerId);
  });
  dialog.addEventListener('pointermove', e => {
    const old = pointers.get(e.pointerId);
    if (!old) return;
    const before = [...pointers.values()];
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const after = [...pointers.values()];
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) moved = true;
    if (after.length >= 2) {
      const distance = (p: typeof after) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const midpoint = (p: typeof after) => ({ x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 });
      if (distance(before) > 0) zoom(distance(after) / distance(before), midpoint(before), midpoint(after));
    } else if (moved) {
      x += e.clientX - old.x;
      y += e.clientY - old.y;
      render();
    }
  });
  const release = (e: PointerEvent) => {
    const tracked = pointers.has(e.pointerId);
    pointers.delete(e.pointerId);
    if (e.type === 'pointercancel') moved = true;
    // A touch tap is not guaranteed to synthesize click after a captured pinch gesture.
    if (tracked && e.type === 'pointerup' && e.pointerType === 'touch' && !moved && !pointers.size) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  };
  dialog.addEventListener('pointerup', release);
  dialog.addEventListener('pointercancel', release);
  dialog.addEventListener('lostpointercapture', release);
  img.addEventListener('load', render);
  img.addEventListener('error', () => {
    status.textContent = '图片加载失败，文件可能已被移走。单击关闭后可重试。';
  });
  doc.body.append(dialog);
  img.src = src;
  resize();
  dialog.showModal();
  render();
  win.addEventListener('resize', resize);
  win.visualViewport?.addEventListener('resize', resize);
  win.visualViewport?.addEventListener('scroll', resize);
}

export function bindImagePreviews(doc: Document): () => void {
  const selector = '.story-image-slot img.story-image-img, .story-image-root .reference-library img';
  const open = (e: Event) => {
    const target = e.target as Element | null;
    const img = target?.closest?.<HTMLImageElement>(selector);
    if (!img) return;
    if (e.type === 'keydown' && !['Enter', ' '].includes((e as KeyboardEvent).key)) return;
    e.preventDefault();
    e.stopPropagation();
    openImagePreview(img.currentSrc || img.src, img.alt, doc);
  };
  doc.addEventListener('click', open, true);
  doc.addEventListener('keydown', open, true);
  return () => {
    doc.removeEventListener('click', open, true);
    doc.removeEventListener('keydown', open, true);
    viewers.get(doc)?.();
  };
}
