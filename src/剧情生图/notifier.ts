import { tavernDocument } from './tavern-dom';

export type FailureStage = 'planning' | 'generation' | 'download' | 'upload' | 'render';

type TaskToastRecord = {
  $toast?: JQuery;
  stage: 'planning' | 'plan-completed' | 'generating' | 'generated' | 'error' | 'canceled';
};

const activeToasts = new Map<string, TaskToastRecord>();

function getTaskKey(chatId: string, messageId: number, swipeId: number): string {
  return `${chatId}:${messageId}:${swipeId}`;
}

export function scrollToMessageFloor(messageId: number, swipeId?: number): void {
  try {
    const slotKey = `${messageId}:${swipeId ?? ''}`;
    const $slot = $(`[data-story-image-slot^="${messageId}:"]`, tavernDocument);
    if ($slot.length && $slot.is(':visible')) {
      $slot[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const $mes = retrieveDisplayedMessage(messageId);
    if ($mes && $mes.length) {
      $mes[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch (err) {
    console.warn('[剧情生图] 滚动到楼层失败:', err);
  }
}

function clearTaskToast(key: string): void {
  const existing = activeToasts.get(key);
  if (existing?.$toast && typeof toastr !== 'undefined' && toastr.clear) {
    try {
      toastr.clear(existing.$toast);
    } catch {
      /* ignore */
    }
  }
  activeToasts.delete(key);
}

export function notifyPlanningStarted(chatId: string, messageId: number, swipeId: number): void {
  if (typeof toastr === 'undefined') return;
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);

  const floor = messageId + 1;
  const msg = `第 ${floor} 楼正在生成提示词…`;
  const $toast = toastr.info(msg, undefined, {
    timeOut: 0,
    extendedTimeOut: 0,
    closeButton: false,
    tapToDismiss: false,
    progressBar: true,
  });

  activeToasts.set(key, { $toast, stage: 'planning' });
}

export function notifyPlanCompleted(chatId: string, messageId: number, swipeId: number): void {
  if (typeof toastr === 'undefined') return;
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);

  const floor = messageId + 1;
  const msg = `第 ${floor} 楼提示词生成完成`;
  const $toast = toastr.success(msg, undefined, {
    timeOut: 4500,
    extendedTimeOut: 1500,
    closeButton: true,
    progressBar: true,
    onclick: () => scrollToMessageFloor(messageId, swipeId),
  });

  activeToasts.set(key, { $toast, stage: 'plan-completed' });
}

export function notifyGeneratingStarted(chatId: string, messageId: number, swipeId: number): void {
  if (typeof toastr === 'undefined') return;
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);

  const floor = messageId + 1;
  const msg = `第 ${floor} 楼正在生成图片…`;
  const $toast = toastr.info(msg, undefined, {
    timeOut: 0,
    extendedTimeOut: 0,
    closeButton: false,
    tapToDismiss: false,
    progressBar: true,
  });

  activeToasts.set(key, { $toast, stage: 'generating' });
}

export function notifyGenerateCompleted(chatId: string, messageId: number, swipeId: number): void {
  if (typeof toastr === 'undefined') return;
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);

  const floor = messageId + 1;
  const msg = `第 ${floor} 楼图片生成完成`;
  const $toast = toastr.success(msg, undefined, {
    timeOut: 5000,
    extendedTimeOut: 1500,
    closeButton: true,
    progressBar: true,
    onclick: () => scrollToMessageFloor(messageId, swipeId),
  });

  activeToasts.set(key, { $toast, stage: 'generated' });
}

export function notifyFailure(
  chatId: string,
  messageId: number,
  swipeId: number,
  stage: FailureStage,
  errorMsg: string,
): void {
  if (typeof toastr === 'undefined') return;
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);

  const floor = messageId + 1;
  const cleanError = (errorMsg || '发生未知错误').replace(/^Error:\s*/i, '').slice(0, 150);

  let msg: string;
  if (stage === 'planning' || stage === 'render') {
    if (/超时|timeout/i.test(cleanError)) {
      msg = `第 ${floor} 楼提示词生成超时`;
    } else {
      msg = `第 ${floor} 楼提示词生成失败：${cleanError}`;
    }
  } else if (stage === 'generation') {
    msg = `第 ${floor} 楼图片生成失败：${cleanError}`;
  } else if (stage === 'download') {
    msg = `第 ${floor} 楼图片下载失败：${cleanError}`;
  } else if (stage === 'upload') {
    msg = `第 ${floor} 楼图片保存到酒馆失败：${cleanError}`;
  } else {
    msg = `第 ${floor} 楼任务失败：${cleanError}`;
  }

  const $toast = toastr.error(msg, undefined, {
    timeOut: 8000,
    extendedTimeOut: 2500,
    closeButton: true,
    progressBar: true,
    onclick: () => scrollToMessageFloor(messageId, swipeId),
  });

  activeToasts.set(key, { $toast, stage: 'error' });
}

export function notifyCanceled(chatId: string, messageId: number, swipeId: number): void {
  if (typeof toastr === 'undefined') return;
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);

  const floor = messageId + 1;
  const msg = `第 ${floor} 楼任务已取消`;
  const $toast = toastr.info(msg, undefined, {
    timeOut: 2500,
    extendedTimeOut: 1000,
    closeButton: false,
  });

  activeToasts.set(key, { $toast, stage: 'canceled' });
}

export function clearTaskNotification(chatId: string, messageId: number, swipeId: number): void {
  const key = getTaskKey(chatId, messageId, swipeId);
  clearTaskToast(key);
}

export function clearAllTaskNotifications(): void {
  for (const key of Array.from(activeToasts.keys())) {
    clearTaskToast(key);
  }
  activeToasts.clear();
}
