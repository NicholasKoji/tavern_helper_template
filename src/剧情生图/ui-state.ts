import { ref } from 'vue';
import type { PopoverAction, StoryImageSwipeState } from './types';

export type { PopoverAction };

export type PopoverState = {
  visible: boolean;
  messageId: number;
  swipeId: number;
  x?: number;
  y?: number;
  stateHint?: StoryImageSwipeState;
};

export const isModalOpen = ref(false);

export const popoverState = ref<PopoverState>({
  visible: false,
  messageId: -1,
  swipeId: -1,
});

let lastModalTriggerEl: HTMLElement | null = null;
let lastPopoverTriggerEl: HTMLElement | null = null;

let popoverActionHandler:
  | ((
      action: PopoverAction,
      messageId: number,
      swipeId: number,
      stateHint?: StoryImageSwipeState,
    ) => Promise<void> | void)
  | null = null;

export function setPopoverActionHandler(
  handler: (
    action: PopoverAction,
    messageId: number,
    swipeId: number,
    stateHint?: StoryImageSwipeState,
  ) => Promise<void> | void,
): void {
  popoverActionHandler = handler;
}

export function openModal(triggerEl?: HTMLElement | null): void {
  if (triggerEl) {
    lastModalTriggerEl = triggerEl;
  }
  isModalOpen.value = true;
}

export function closeModal(): void {
  isModalOpen.value = false;
  if (lastModalTriggerEl && typeof lastModalTriggerEl.focus === 'function') {
    try {
      if (
        !lastModalTriggerEl.hasAttribute('tabindex') &&
        lastModalTriggerEl.tagName !== 'BUTTON' &&
        lastModalTriggerEl.tagName !== 'A' &&
        lastModalTriggerEl.tagName !== 'INPUT'
      ) {
        lastModalTriggerEl.setAttribute('tabindex', '-1');
      }
      lastModalTriggerEl.focus();
    } catch {
      /* ignore */
    }
    lastModalTriggerEl = null;
  }
}

export function openActionPopover(
  messageId: number,
  swipeId: number,
  coords?: { x?: number; y?: number },
  triggerEl?: HTMLElement | null,
  stateHint?: StoryImageSwipeState,
): void {
  if (triggerEl) {
    lastPopoverTriggerEl = triggerEl;
  }
  popoverState.value = {
    visible: true,
    messageId,
    swipeId,
    x: coords?.x,
    y: coords?.y,
    stateHint,
  };
}

export function closeActionPopover(): void {
  popoverState.value.visible = false;
  if (lastPopoverTriggerEl && typeof lastPopoverTriggerEl.focus === 'function') {
    try {
      lastPopoverTriggerEl.focus();
    } catch {
      /* ignore */
    }
    lastPopoverTriggerEl = null;
  }
}

export function triggerPopoverAction(action: PopoverAction, explicitStateHint?: StoryImageSwipeState | null): void {
  const { messageId, swipeId, stateHint: storedStateHint } = popoverState.value;
  const effectiveHint = explicitStateHint ?? storedStateHint;
  closeActionPopover();
  if (messageId >= 0 && swipeId >= 0 && popoverActionHandler) {
    const res = popoverActionHandler(action, messageId, swipeId, effectiveHint);
    if (res && typeof res.catch === 'function') {
      res.catch(err => {
        console.error('[剧情生图] 浮层菜单动作执行异常:', err);
        if (typeof toastr !== 'undefined' && toastr.error) {
          toastr.error(`剧情生图执行失败: ${String(err?.message ?? err)}`);
        }
      });
    }
  }
}
