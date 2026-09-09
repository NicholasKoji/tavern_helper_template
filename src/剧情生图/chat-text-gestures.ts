import { bindTextDoubleTap } from './text-double-tap';

/** Observe only chat-owned frames. Each document has exactly one delegated gesture listener. */
export function bindChatTextGestures(
  host: Document,
  enabled: () => boolean,
  trigger: (text: HTMLElement, target: HTMLElement, coords: { x: number; y: number }) => void,
) {
  type Scope = { dispose: () => void };
  let root: Scope | undefined;
  let disposed = false;
  const attach = (doc: Document, area: HTMLElement, owner?: HTMLElement, frame?: HTMLIFrameElement): Scope => {
    const frames = new Map<HTMLIFrameElement, { load: () => void; child?: Scope }>();
    const unbind = bindTextDoubleTap(
      doc,
      enabled,
      (text, target, point) => {
        // Resolve coordinates through the actual iframe chain, without reading its story content.
        let x = point.x;
        let y = point.y;
        let current = frame;
        while (current) {
          const rect = current.getBoundingClientRect();
          const scaleX = current.offsetWidth ? rect.width / current.offsetWidth : 1;
          const scaleY = current.offsetHeight ? rect.height / current.offsetHeight : 1;
          x = rect.left + (x + current.clientLeft) * scaleX;
          y = rect.top + (y + current.clientTop) * scaleY;
          if (current.ownerDocument === host) break;
          current = current.ownerDocument.defaultView?.frameElement as HTMLIFrameElement | undefined;
        }
        console.debug('[剧情生图] 正文手势已识别', {
          messageId: text.closest('.mes')?.getAttribute('mesid'),
          source: owner ? 'iframe' : 'host',
        });
        trigger(text, owner ? text : target, { x, y });
      },
      owner,
    );
    const add = (iframe: HTMLIFrameElement) => {
      if (frames.has(iframe)) return;
      const text = owner ?? iframe.closest<HTMLElement>('#chat .mes .mes_text');
      if (
        !text ||
        text.closest('.mes')?.matches('[is_user="true"], .is_user') ||
        iframe.closest('.story-image-slot, [data-story-image-slot]')
      )
        return;
      const entry: { load: () => void; child?: Scope } = { load: () => {} };
      entry.load = () => {
        entry.child?.dispose();
        entry.child = undefined;
        if (!iframe.isConnected) return;
        try {
          const childDoc = iframe.contentDocument;
          if (childDoc?.body) entry.child = attach(childDoc, childDoc.body, text, iframe);
          else
            console.debug('[剧情生图] iframe 暂未就绪或不可访问', {
              messageId: text.closest('.mes')?.getAttribute('mesid'),
            });
        } catch {
          /* Cross-origin frames are intentionally not accessed. */
        }
      };
      frames.set(iframe, entry);
      iframe.addEventListener('load', entry.load);
      entry.load();
    };
    const scanAdded = (node: Node) => {
      if (node.nodeType !== 1) return;
      const element = node as HTMLElement;
      if (element.matches('iframe')) add(element as HTMLIFrameElement);
      element.querySelectorAll<HTMLIFrameElement>('iframe').forEach(add);
    };
    const observer = new MutationObserver(records => {
      // MutationObserver batches synchronous DOM edits; do not rescan existing message subtrees.
      for (const record of records) record.addedNodes.forEach(scanAdded);
      for (const [iframe, entry] of frames) {
        if (area.contains(iframe)) continue;
        entry.child?.dispose();
        iframe.removeEventListener('load', entry.load);
        frames.delete(iframe);
      }
    });
    observer.observe(area, { childList: true, subtree: true });
    scanAdded(area);
    return {
      dispose: () => {
        observer.disconnect();
        unbind();
        for (const [iframe, entry] of frames) {
          iframe.removeEventListener('load', entry.load);
          entry.child?.dispose();
        }
        frames.clear();
      },
    };
  };
  const refresh = () => {
    if (disposed) return;
    if (!enabled() || !host.defaultView?.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      root?.dispose();
      root = undefined;
      return;
    }
    const chat = host.getElementById('chat');
    if (!root && chat) root = attach(host, chat);
  };
  refresh();
  const cleanup = () => {
    disposed = true;
    root?.dispose();
    root = undefined;
  };
  cleanup.refresh = refresh;
  return cleanup;
}
