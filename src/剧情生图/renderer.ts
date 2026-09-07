import type { SlotAction, StoryImageSwipeState, SwipeAnchor } from './types';
import { tavernDocument } from './tavern-dom';

export const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'BLOCKQUOTE',
  'LI',
  'UL',
  'OL',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'PRE',
  'HR',
  'TABLE',
  'TR',
  'SECTION',
  'ARTICLE',
]);

function isBlockElement(el: HTMLElement, root: HTMLElement): boolean {
  if (el === root) return false;
  if (BLOCK_TAGS.has(el.tagName)) return true;
  try {
    const win = (el.ownerDocument?.defaultView || window) as Window;
    const display = win.getComputedStyle(el).display;
    return (
      display === 'block' || display === 'list-item' || display === 'table' || display === 'flex' || display === 'grid'
    );
  } catch {
    return false;
  }
}

function findClosestBlock(node: Node, root: HTMLElement): HTMLElement {
  let curr = node.parentElement;
  let lastValid: HTMLElement | null = null;

  while (curr && curr !== root) {
    if (isBlockElement(curr, root)) {
      return curr;
    }
    lastValid = curr;
    curr = curr.parentElement;
  }

  return lastValid || root;
}

export function normalizeSearchText(text: string): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

export function extractVisibleTextAndCharMap(root: HTMLElement): {
  normText: string;
  charMap: { node: Text | null; offset: number }[];
} {
  let normText = '';
  const charMap: { node: Text | null; offset: number }[] = [];
  let lastTextNode: Text | null = null;
  let lastOffset = -1;

  function appendSpace() {
    if (normText.length > 0 && normText[normText.length - 1] !== ' ') {
      normText += ' ';
      charMap.push({ node: lastTextNode, offset: lastOffset });
    }
  }

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const textNode = node as Text;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (/\s/.test(char)) {
          appendSpace();
        } else {
          normText += char;
          lastTextNode = textNode;
          lastOffset = i;
          charMap.push({ node: textNode, offset: i });
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (
        el.hasAttribute('data-story-image-slot') ||
        el.classList.contains('story-image-slot') ||
        el.tagName === 'SCRIPT' ||
        el.tagName === 'STYLE'
      ) {
        return;
      }

      const isBlock = BLOCK_TAGS.has(el.tagName);
      if (isBlock) {
        appendSpace();
      }

      for (let child = el.firstChild; child; child = child.nextSibling) {
        traverse(child);
      }

      if (isBlock) {
        appendSpace();
      }
    }
  }

  traverse(root);

  if (normText.endsWith(' ')) {
    normText = normText.slice(0, -1);
    charMap.pop();
  }

  return { normText, charMap };
}

export function getNormalizedVisibleText(messageId: number, rawText: string): string {
  try {
    const $mes = retrieveDisplayedMessage(messageId);
    const $mesText = $mes?.hasClass('mes_text')
      ? $mes
      : $mes?.find('.mes_text').first().length
        ? $mes.find('.mes_text').first()
        : $mes;
    if ($mesText && $mesText.length && $mesText[0]) {
      return extractVisibleTextAndCharMap($mesText[0]).normText;
    }
  } catch {
    /* ignore */
  }

  try {
    const html = formatAsDisplayedMessage(rawText, { message_id: messageId });
    const targetDoc = tavernDocument || document;
    const tempDiv = targetDoc.createElement('div');
    tempDiv.innerHTML = html;
    return extractVisibleTextAndCharMap(tempDiv).normText;
  } catch {
    /* ignore */
  }

  return normalizeSearchText(rawText);
}

export function findOccurrenceOffsets(text: string, pattern: string): number[] {
  const offsets: number[] = [];
  if (!text || !pattern) return offsets;
  let idx = 0;
  while (true) {
    const found = text.indexOf(pattern, idx);
    if (found === -1) break;
    offsets.push(found);
    idx = found + pattern.length;
  }
  return offsets;
}

export function findAnchorTargetElement($mesText: JQuery, anchor: SwipeAnchor): HTMLElement | null {
  const root = $mesText[0];
  if (!root) return null;

  const { normText, charMap } = extractVisibleTextAndCharMap(root);
  const normQuote = normalizeSearchText(anchor.quote);
  if (!normQuote) return null;

  const occurrences = findOccurrenceOffsets(normText, normQuote);
  const targetOffsetIndex = anchor.occurrence - 1;
  if (targetOffsetIndex < 0 || targetOffsetIndex >= occurrences.length) {
    return null;
  }

  const startCharIdx = occurrences[targetOffsetIndex];
  const targetEndCharIdx = startCharIdx + normQuote.length - 1;

  if (targetEndCharIdx === -1 || !charMap[targetEndCharIdx]) {
    return null;
  }

  const endNode = charMap[targetEndCharIdx].node;
  if (!endNode) return null;

  return findClosestBlock(endNode, root);
}

// 记录处于提示词编辑展开态的槽位
const editingSlots = new Set<string>();

export function openSlotPromptEditor(messageId: number, swipeId: number): void {
  editingSlots.add(`${messageId}:${swipeId}`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHistoryHtml(state: StoryImageSwipeState): string {
  if (!state.history || state.history.length === 0) {
    return '';
  }

  const items = state.history
    .slice()
    .reverse()
    .map((img, idx) => {
      const reasonBadge = img.staleReason
        ? `<span class="story-image-badge">${
            img.staleReason === 'message-edited'
              ? '正文修改后归档'
              : img.staleReason === 'prompt-edited'
                ? '提示词修改后归档'
                : '重新生成归档'
          }</span>`
        : '';
      const dateStr = new Date(img.createdAt).toLocaleTimeString();
      return `
        <div class="story-image-history-item">
          <div class="story-image-history-meta">
            <span class="story-image-history-time">#${idx + 1} ${dateStr}</span>
            ${reasonBadge}
          </div>
          <div class="story-image-history-img-wrap">
            <img src="${escapeHtml(img.path)}" class="story-image-img" alt="历史画面" loading="lazy" />
          </div>
          ${img.finalPrompt ? `<div class="story-image-history-prompt">${escapeHtml(img.finalPrompt)}</div>` : ''}
        </div>
      `;
    })
    .join('');

  return `
    <details class="story-image-history">
      <summary class="story-image-history-summary">旧图 (${state.history.length})</summary>
      <div class="story-image-history-list">
        ${items}
      </div>
    </details>
  `;
}

function buildSlotInnerHtml(slotKey: string, state: StoryImageSwipeState): string {
  const isEditing = editingSlots.has(slotKey);

  let bodyHtml = '';

  switch (state.status) {
    case 'planning': {
      bodyHtml = '';
      break;
    }

    case 'planned': {
      const summary = escapeHtml(state.sceneSummary || '本楼剧情画面');
      const prompt = escapeHtml(state.scenePrompt || '');
      const hasPrompt = Boolean(state.scenePrompt?.trim());

      bodyHtml = `
        <div class="story-image-card">
          <div class="story-image-card-header">
            <div class="story-image-summary">
              <i class="fa-solid fa-clapperboard story-image-icon"></i>
              <span class="story-image-summary-text">${summary}</span>
            </div>
            <div class="story-image-actions">
              ${
                hasPrompt
                  ? `
                <button type="button" class="story-image-btn story-image-btn-primary" data-action="generate">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  <span>生成图片</span>
                </button>
                <button type="button" class="story-image-btn story-image-btn-icon story-image-btn-secondary" data-action="toggle-edit" title="编辑提示词">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
              `
                  : `
                <button type="button" class="story-image-btn story-image-btn-primary" data-action="toggle-edit">
                  <i class="fa-solid fa-pen-to-square"></i>
                  <span>填写提示词</span>
                </button>
              `
              }
            </div>
          </div>
          ${
            isEditing
              ? `
            <div class="story-image-edit-panel">
              <div class="story-image-edit-title">修改本楼场景提示词：</div>
              <textarea class="story-image-textarea" rows="3">${prompt}</textarea>
              <div class="story-image-edit-actions">
                <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-primary" data-action="save-prompt">
                  <i class="fa-solid fa-check"></i>
                  <span>保存并返回待生成</span>
                </button>
                <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-secondary" data-action="cancel-edit">取消</button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
      break;
    }

    case 'generating': {
      if (state.currentImage) {
        const current = state.currentImage;
        const summary = escapeHtml(state.sceneSummary || '');
        bodyHtml = `
          <div class="story-image-ready-container story-image-generating-state">
            <div class="story-image-img-box">
              <img src="${escapeHtml(current.path || '')}" class="story-image-img" alt="剧情插画" loading="lazy" />
            </div>
            <div class="story-image-ready-footer">
              ${summary ? `<div class="story-image-ready-summary">${summary}</div>` : ''}
              <div class="story-image-ready-actions">
                <button type="button" class="story-image-btn story-image-btn-sm" disabled>
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  <span>正在生成…</span>
                </button>
                <button type="button" class="story-image-btn story-image-btn-danger story-image-btn-sm" data-action="cancel" title="取消当前任务">
                  <i class="fa-solid fa-xmark"></i>
                  <span>取消</span>
                </button>
              </div>
            </div>
          </div>
        `;
      } else if (state.scenePrompt) {
        const summary = escapeHtml(state.sceneSummary || '本楼剧情画面');
        bodyHtml = `
          <div class="story-image-card story-image-generating-state">
            <div class="story-image-card-header">
              <div class="story-image-summary">
                <i class="fa-solid fa-clapperboard story-image-icon"></i>
                <span class="story-image-summary-text">${summary}</span>
              </div>
              <div class="story-image-actions">
                <button type="button" class="story-image-btn story-image-btn-primary" disabled>
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  <span>正在生成…</span>
                </button>
                <button type="button" class="story-image-btn story-image-btn-danger story-image-btn-sm" data-action="cancel" title="取消当前任务">
                  <i class="fa-solid fa-xmark"></i>
                  <span>取消</span>
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        bodyHtml = '';
      }
      break;
    }

    case 'ready': {
      const current = state.currentImage;
      const prompt = escapeHtml(state.scenePrompt || current?.finalPrompt || '');
      const summary = escapeHtml(state.sceneSummary || '');

      bodyHtml = `
        <div class="story-image-ready-container">
          <div class="story-image-img-box">
            <img src="${escapeHtml(current?.path || '')}" class="story-image-img" alt="剧情插画" loading="lazy" />
          </div>
          <div class="story-image-ready-footer">
            ${summary ? `<div class="story-image-ready-summary">${summary}</div>` : ''}
            <div class="story-image-ready-actions">
              <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-accent" data-action="regenerate">
                <i class="fa-solid fa-rotate-right"></i>
                <span>重新生成</span>
              </button>
              <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-icon story-image-btn-secondary" data-action="toggle-edit" title="修改提示词">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
          </div>
          ${
            isEditing
              ? `
            <div class="story-image-edit-panel">
              <div class="story-image-edit-title">修改本楼场景提示词（当前图将移入旧图折叠）：</div>
              <textarea class="story-image-textarea" rows="3">${prompt}</textarea>
              <div class="story-image-edit-actions">
                <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-primary" data-action="save-prompt">
                  <i class="fa-solid fa-check"></i>
                  <span>保存并返回待生成</span>
                </button>
                <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-secondary" data-action="cancel-edit">取消</button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
      break;
    }

    case 'error': {
      const error = state.error;
      const stage = error?.stage || 'general';
      const isPlanningError = stage === 'planning' || stage === 'render';
      const msg = escapeHtml(error?.message || '发生未知错误');

      bodyHtml = `
        <div class="story-image-error-box">
          <div class="story-image-error-header">
            <i class="fa-solid fa-triangle-exclamation story-image-error-icon"></i>
            <span class="story-image-error-msg">${isPlanningError ? '提示词生成失败' : '生图失败'}: ${msg}</span>
          </div>
          <div class="story-image-error-actions">
            ${
              isPlanningError
                ? `<button type="button" class="story-image-btn story-image-btn-sm story-image-btn-primary" data-action="retry-plan">
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>重试生成提示词</span>
                   </button>`
                : `<button type="button" class="story-image-btn story-image-btn-sm story-image-btn-primary" data-action="retry-gen">
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>重试生成</span>
                   </button>`
            }
          </div>
        </div>
      `;
      break;
    }
  }

  const historyHtml = renderHistoryHtml(state);
  return `${bodyHtml}${historyHtml}`;
}

export function renderSlot(
  messageId: number,
  swipeId: number,
  state: StoryImageSwipeState,
  onAction: (action: SlotAction, newPrompt?: string, state?: StoryImageSwipeState) => void,
): void {
  const $mes = retrieveDisplayedMessage(messageId);
  if (!$mes || !$mes.length) {
    return;
  }

  const $mesText = $mes.hasClass('mes_text')
    ? $mes
    : $mes.find('.mes_text').first().length
      ? $mes.find('.mes_text').first()
      : $mes;

  if (!$mesText.length) {
    return;
  }

  const doc = $mes[0].ownerDocument || tavernDocument;
  const slotKey = `${messageId}:${swipeId}`;
  const slotSelector = `[data-story-image-slot="${slotKey}"]`;
  let $slot = $(slotSelector, doc);

  const innerHtml = buildSlotInnerHtml(slotKey, state);
  if (!innerHtml.trim()) {
    if ($slot.length) {
      removeSlot(messageId, swipeId, doc);
    }
    return;
  }

  // 重复节点保留一个
  if ($slot.length > 1) {
    $slot.slice(1).remove();
    $slot = $slot.first();
  }

  if ($slot.length === 0) {
    $slot = $(`<div class="story-image-slot" data-story-image-slot="${slotKey}"></div>`, doc);
  }

  // 定位目标锚点
  let targetBlock: HTMLElement | null = null;
  if (state.anchor) {
    targetBlock = findAnchorTargetElement($mesText, state.anchor);
  }

  if (targetBlock) {
    // 存在有效锚点块
    if (targetBlock === $mesText[0]) {
      // 若返回根 mes_text，append 到其内部，不能插到外部
      if ($slot.parent()[0] !== $mesText[0] || !$slot.is(':last-child')) {
        $mesText.append($slot);
      }
    } else if ($slot.prev()[0] !== targetBlock) {
      $slot.insertAfter($(targetBlock));
    }
    if (state.anchor) {
      onAction('anchor-resolved', undefined, state);
    }
  } else {
    // 锚点未规划或定位失败，挂载在正文末尾内部
    if ($slot.parent()[0] !== $mesText[0] || !$slot.is(':last-child')) {
      $mesText.append($slot);
    }
    // 已存在 anchor 但定位失败时，通知调度层处理失效重选
    if (state.anchor && (state.status === 'planned' || state.status === 'ready')) {
      onAction('anchor-failed', undefined, state);
    }
  }

  // 更新内容
  $slot.html(innerHtml);

  // 绑定事件
  $slot.off('click').on('click', '[data-action]', function (e) {
    e.stopPropagation();
    const action = $(this).attr('data-action') as SlotAction;
    if (!action) return;

    if (action === 'toggle-edit') {
      if (editingSlots.has(slotKey)) {
        editingSlots.delete(slotKey);
      } else {
        editingSlots.add(slotKey);
      }
      renderSlot(messageId, swipeId, state, onAction);
      return;
    }

    if (action === 'cancel-edit') {
      editingSlots.delete(slotKey);
      renderSlot(messageId, swipeId, state, onAction);
      return;
    }

    if (action === 'save-prompt') {
      const textareaVal = $slot.find('.story-image-textarea').val();
      const newPrompt = String(textareaVal ?? '').trim();
      if (!newPrompt) {
        toastr.warning('场景提示词不能为空');
        return;
      }
      editingSlots.delete(slotKey);
      onAction('save-prompt', newPrompt, state);
      return;
    }

    onAction(action, undefined, state);
  });
}

export function removeSlot(messageId: number, swipeId?: number, doc?: Document): void {
  const targetDoc = doc || retrieveDisplayedMessage(messageId)?.[0]?.ownerDocument || tavernDocument;
  if (swipeId !== undefined) {
    const slotKey = `${messageId}:${swipeId}`;
    editingSlots.delete(slotKey);
    $(`[data-story-image-slot="${slotKey}"]`, targetDoc).remove();
  } else {
    $(`[data-story-image-slot^="${messageId}:"]`, targetDoc).remove();
  }
}
