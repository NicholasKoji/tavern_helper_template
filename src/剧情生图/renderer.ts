import type {
  PromptRefinementPayload,
  SlotAction,
  SlotActionPayload,
  StoryImageSwipeState,
  SwipeAnchor,
} from './types';
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
type PromptRefinementUiState = {
  requestId: number;
  status: 'idle' | 'loading';
  direction: string;
  draftPrompt?: string;
  message?: string;
  error?: string;
};
const promptRefinementStates = new Map<string, PromptRefinementUiState>();
let promptRefinementRequestId = 0;

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

function renderPromptEditPanel(slotKey: string, state: StoryImageSwipeState, prompt: string, title: string): string {
  const refinement = promptRefinementStates.get(slotKey);
  const isRefining = refinement?.status === 'loading';
  const displayedPrompt = refinement?.draftPrompt ?? prompt;
  const direction = refinement?.direction ?? '';
  const refinementHtml = state.sceneId
    ? `
      <div class="story-image-refinement-row">
        <input
          type="text"
          class="story-image-refinement-input"
          value="${escapeHtml(direction)}"
          placeholder="输入希望 AI 如何优化这个场景"
          aria-label="场景提示词优化方向"
          ${isRefining ? 'readonly aria-busy="true"' : ''}
        />
        <button
          type="button"
          class="story-image-btn story-image-btn-icon story-image-btn-secondary story-image-refinement-btn"
          data-action="${isRefining ? 'cancel-refine' : 'refine-prompt'}"
          title="${isRefining ? '取消 AI 优化' : 'AI 优化场景提示词'}"
          aria-label="${isRefining ? '取消 AI 优化' : 'AI 优化场景提示词'}"
        >
          <i class="fa-solid ${isRefining ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}"></i>
        </button>
      </div>
      ${isRefining ? '<p class="story-image-refinement-status" role="status">AI 正在优化当前草稿，点击右侧图标可取消。</p>' : ''}
      ${refinement?.message ? `<p class="story-image-refinement-status is-success" role="status">${escapeHtml(refinement.message)}</p>` : ''}
      ${refinement?.error ? `<p class="story-image-refinement-status is-error" role="alert">${escapeHtml(refinement.error)}</p>` : ''}
    `
    : '';

  return `
    <div class="story-image-edit-panel">
      <div class="story-image-edit-title">${escapeHtml(title)}</div>
      <textarea class="story-image-textarea" rows="3" ${isRefining ? 'readonly aria-busy="true"' : ''}>${escapeHtml(displayedPrompt)}</textarea>
      ${refinementHtml}
      <div class="story-image-edit-actions">
        <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-primary" data-action="save-prompt" ${isRefining ? 'disabled' : ''}>
          <i class="fa-solid fa-check"></i>
          <span>保存并返回待生成</span>
        </button>
        <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-secondary" data-action="cancel-edit">取消</button>
      </div>
    </div>
  `;
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
            <img src="${escapeHtml(img.path)}" class="story-image-img" tabindex="0" role="button" title="点击放大预览" alt="历史画面" loading="lazy" />
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
  const error = state.status === 'error' ? state.error : undefined;
  const errorStage = error?.stage || 'general';
  const isPlanningError =
    state.status === 'error' && (errorStage === 'planning' || (errorStage === 'render' && !state.sceneId));
  const isSceneError = state.status === 'error' && !isPlanningError;
  const displayStatus = isSceneError ? (state.currentImage ? 'ready' : 'planned') : state.status;

  let bodyHtml = '';

  switch (displayStatus) {
    case 'planning': {
      bodyHtml = '';
      break;
    }

    case 'planned': {
      const summary = escapeHtml(state.sceneSummary || '本楼剧情画面');
      const prompt = state.scenePrompt || '';
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
                <button type="button" class="story-image-btn story-image-btn-primary" data-action="${isSceneError ? 'retry-gen' : 'generate'}">
                  <i class="fa-solid ${isSceneError ? 'fa-arrows-rotate' : 'fa-wand-magic-sparkles'}"></i>
                  <span>${isSceneError ? '重新生图' : '生成图片'}</span>
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
          ${isEditing ? renderPromptEditPanel(slotKey, state, prompt, '修改此场景提示词：') : ''}
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
              <img src="${escapeHtml(current.path || '')}" class="story-image-img" tabindex="0" role="button" title="点击放大预览" alt="剧情插画" loading="lazy" />
            </div>
            <div class="story-image-ready-footer">
              ${summary ? `<div class="story-image-ready-summary">${summary}</div>` : ''}
              <div class="story-image-ready-actions">
                <button type="button" class="story-image-btn story-image-btn-sm" disabled>
                  <i class="fa-solid fa-spinner fa-spin"></i>
                  <span>${state.queued ? '排队等待…' : '正在生成…'}</span>
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
                  <span>${state.queued ? '排队等待…' : '正在生成…'}</span>
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
      const prompt = state.scenePrompt || current?.finalPrompt || '';
      const summary = escapeHtml(state.sceneSummary || '');

      bodyHtml = `
        <div class="story-image-ready-container">
          <div class="story-image-img-box">
            <img src="${escapeHtml(current?.path || '')}" class="story-image-img" tabindex="0" role="button" title="点击放大预览" alt="剧情插画" loading="lazy" />
          </div>
          <div class="story-image-ready-footer">
            ${summary ? `<div class="story-image-ready-summary">${summary}</div>` : ''}
            <div class="story-image-ready-actions">
              <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-accent" data-action="regenerate">
                <i class="fa-solid fa-rotate-right"></i>
                <span>${isSceneError ? '重新生图' : '重新生成'}</span>
              </button>
              <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-icon story-image-btn-secondary" data-action="toggle-edit" title="修改提示词">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
            </div>
          </div>
          ${
            isEditing
              ? renderPromptEditPanel(slotKey, state, prompt, '修改本楼场景提示词（当前图将移入旧图折叠）：')
              : ''
          }
        </div>
      `;
      break;
    }

    case 'error': {
      const msg = escapeHtml(error?.message || '发生未知错误');

      bodyHtml = `
        <div class="story-image-error-box">
          <div class="story-image-error-header">
            <i class="fa-solid fa-triangle-exclamation story-image-error-icon"></i>
            <span class="story-image-error-msg">${isPlanningError ? '提示词生成失败' : '生图失败'}: ${msg}</span>
          </div>
          <div class="story-image-error-actions">
            <button type="button" class="story-image-btn story-image-btn-sm story-image-btn-primary" data-action="retry-plan">
              <i class="fa-solid fa-arrows-rotate"></i>
              <span>重试生成提示词</span>
            </button>
          </div>
        </div>
      `;
      break;
    }
  }

  const rawSceneError = error?.message || '发生未知错误';
  const compactSceneError = rawSceneError.length > 180 ? `${rawSceneError.slice(0, 180)}…` : rawSceneError;
  const sceneErrorHtml = isSceneError
    ? `
      <div class="story-image-error-box story-image-error-inline" role="alert">
        <div class="story-image-error-header">
          <i class="fa-solid fa-triangle-exclamation story-image-error-icon"></i>
          <span class="story-image-error-msg">生图失败：${escapeHtml(compactSceneError)}</span>
        </div>
        ${
          compactSceneError !== rawSceneError
            ? `<details class="story-image-error-details">
                <summary>查看完整错误</summary>
                <div class="story-image-error-detail-text">${escapeHtml(rawSceneError)}</div>
               </details>`
            : ''
        }
      </div>
    `
    : '';
  const historyHtml = renderHistoryHtml(state);
  return `${bodyHtml}${sceneErrorHtml}${historyHtml}`;
}

export function renderSlot(
  messageId: number,
  swipeId: number,
  state: StoryImageSwipeState,
  onAction: (
    action: SlotAction,
    payload?: SlotActionPayload,
    state?: StoryImageSwipeState,
  ) => string | void | Promise<string | void>,
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
  const slotKey = `${messageId}:${swipeId}${state.sceneId ? `:${state.sceneId}` : ''}`;
  const slotSelector = `[data-story-image-slot="${slotKey}"]`;
  let $slot = $(slotSelector, doc);

  const innerHtml =
    (state.anchorWarning
      ? `<p role="status" class="story-image-anchor-warning">${escapeHtml(state.anchorWarning)}</p>`
      : '') + buildSlotInnerHtml(slotKey, state);
  if (!innerHtml.trim()) {
    if ($slot.length) {
      $slot.remove();
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

  $slot.attr('data-scene-order', state.sceneId?.match(/_s(\d+)$/)?.[1] ?? '0');
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
    } else {
      let after = targetBlock;
      const order = Number(state.sceneId?.match(/_s(\d+)$/)?.[1] ?? 0);
      while (
        after.nextElementSibling?.classList.contains('story-image-slot') &&
        after.nextElementSibling !== $slot[0] &&
        Number((after.nextElementSibling as HTMLElement).dataset.sceneOrder ?? 0) < order
      )
        after = after.nextElementSibling as HTMLElement;
      if ($slot.prev()[0] !== after) $slot.insertAfter($(after));
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

  // 保留同一场景尚未保存的编辑草稿，其他场景更新不应清空它。
  const refinementAtRender = promptRefinementStates.get(slotKey);
  const draftPrompt =
    refinementAtRender?.draftPrompt ??
    (editingSlots.has(slotKey) && $slot.data('scene-prompt') === (state.scenePrompt ?? '')
      ? $slot.find('.story-image-textarea').val()
      : undefined);
  const draftDirection = editingSlots.has(slotKey)
    ? ($slot.find('.story-image-refinement-input').val() ?? refinementAtRender?.direction)
    : undefined;
  // 更新内容
  $slot.html(
    (state.sceneId
      ? `<div class="story-image-scene-title">场景 ${escapeHtml(state.sceneId.match(/_s(\d+)$/)?.[1] || '')}</div>`
      : '') + innerHtml,
  );

  $slot.data('scene-prompt', state.scenePrompt ?? '');
  if (draftPrompt !== undefined) $slot.find('.story-image-textarea').val(draftPrompt as string);
  if (draftDirection !== undefined) $slot.find('.story-image-refinement-input').val(draftDirection as string);
  if (refinementAtRender?.draftPrompt !== undefined && refinementAtRender.status !== 'loading') {
    delete refinementAtRender.draftPrompt;
  }
  // 绑定事件
  $slot.off('click').on('click', '[data-action]', async function (e) {
    e.stopPropagation();
    const action = $(this).attr('data-action') as SlotAction;
    if (!action) return;

    if (action === 'toggle-edit') {
      if (editingSlots.has(slotKey)) {
        const refinement = promptRefinementStates.get(slotKey);
        if (refinement?.status === 'loading') {
          void Promise.resolve(onAction('cancel-refine', undefined, state)).catch(() => {});
        }
        promptRefinementStates.delete(slotKey);
        editingSlots.delete(slotKey);
      } else {
        editingSlots.add(slotKey);
      }
      renderSlot(messageId, swipeId, state, onAction);
      return;
    }

    if (action === 'cancel-edit') {
      const refinement = promptRefinementStates.get(slotKey);
      if (refinement?.status === 'loading') {
        void Promise.resolve(onAction('cancel-refine', undefined, state)).catch(() => {});
      }
      promptRefinementStates.delete(slotKey);
      editingSlots.delete(slotKey);
      renderSlot(messageId, swipeId, state, onAction);
      return;
    }

    if (action === 'cancel-refine') {
      const refinement = promptRefinementStates.get(slotKey);
      if (!refinement || refinement.status !== 'loading') return;
      refinement.requestId = ++promptRefinementRequestId;
      refinement.status = 'idle';
      refinement.message = '已取消本次 AI 优化，当前草稿未变。';
      refinement.error = undefined;
      void Promise.resolve(onAction('cancel-refine', undefined, state)).catch(() => {});
      renderSlot(messageId, swipeId, state, onAction);
      return;
    }

    if (action === 'refine-prompt') {
      const scenePrompt = String($slot.find('.story-image-textarea').val() ?? '').trim();
      const direction = String($slot.find('.story-image-refinement-input').val() ?? '').trim();
      if (!scenePrompt) {
        toastr.warning('场景提示词不能为空');
        return;
      }
      if (!direction) {
        toastr.warning('请填写优化方向');
        $slot.find('.story-image-refinement-input').focus();
        return;
      }

      const requestId = ++promptRefinementRequestId;
      promptRefinementStates.set(slotKey, {
        requestId,
        status: 'loading',
        direction,
        draftPrompt: scenePrompt,
      });
      renderSlot(messageId, swipeId, state, onAction);

      const payload: PromptRefinementPayload = { scenePrompt, direction };
      try {
        const result = await onAction('refine-prompt', payload, state);
        const latest = promptRefinementStates.get(slotKey);
        if (!latest || latest.requestId !== requestId) return;
        latest.status = 'idle';
        latest.error = undefined;
        if (typeof result === 'string' && result.trim()) {
          latest.draftPrompt = result.trim();
          latest.message = 'AI 优化结果已填入上方，请确认后保存。';
        } else {
          latest.draftPrompt = scenePrompt;
          latest.message = '场景状态已变化，本次优化结果未采用。';
        }
        renderSlot(messageId, swipeId, state, onAction);
      } catch (error) {
        const latest = promptRefinementStates.get(slotKey);
        if (!latest || latest.requestId !== requestId) return;
        latest.status = 'idle';
        latest.draftPrompt = scenePrompt;
        latest.message = undefined;
        latest.error =
          error instanceof Error && error.name === 'AbortError'
            ? '本次 AI 优化已取消，当前草稿未变。'
            : `AI 优化失败：${String(error instanceof Error ? error.message : error)}`;
        renderSlot(messageId, swipeId, state, onAction);
      }
      return;
    }

    if (action === 'save-prompt') {
      const textareaVal = $slot.find('.story-image-textarea').val();
      const newPrompt = String(textareaVal ?? '').trim();
      if (!newPrompt) {
        toastr.warning('场景提示词不能为空');
        return;
      }
      promptRefinementStates.delete(slotKey);
      editingSlots.delete(slotKey);
      onAction('save-prompt', newPrompt, state);
      return;
    }

    onAction(action, undefined, state);
  });

  $slot
    .off('input.story-image-refinement')
    .on('input.story-image-refinement', '.story-image-textarea, .story-image-refinement-input', () => {
      const refinement = promptRefinementStates.get(slotKey) ?? {
        requestId: 0,
        status: 'idle' as const,
        direction: '',
      };
      refinement.direction = String($slot.find('.story-image-refinement-input').val() ?? '');
      refinement.message = undefined;
      refinement.error = undefined;
      promptRefinementStates.set(slotKey, refinement);
    });
}

export function removeSlot(messageId: number, swipeId?: number, doc?: Document): void {
  const targetDoc = doc || retrieveDisplayedMessage(messageId)?.[0]?.ownerDocument || tavernDocument;
  if (swipeId !== undefined) {
    const slotKey = `${messageId}:${swipeId}`;
    editingSlots.delete(slotKey);
    promptRefinementStates.delete(slotKey);
    $(`[data-story-image-slot="${slotKey}"], [data-story-image-slot^="${slotKey}:"]`, targetDoc).remove();
    for (const key of editingSlots) if (key.startsWith(`${slotKey}:`)) editingSlots.delete(key);
    for (const key of promptRefinementStates.keys())
      if (key.startsWith(`${slotKey}:`)) promptRefinementStates.delete(key);
  } else {
    $(`[data-story-image-slot^="${messageId}:"]`, targetDoc).remove();
    for (const key of promptRefinementStates.keys())
      if (key.startsWith(`${messageId}:`)) promptRefinementStates.delete(key);
  }
}
