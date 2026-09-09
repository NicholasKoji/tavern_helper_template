import { klona } from 'klona';
import type { StoryImageMessageData, StoryImageSwipeState, StoredImage } from './types';

export function createSourceFingerprint(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
  }
  return `${text.length}_${(hash >>> 0).toString(16)}`;
}

export function getMessageCurrentSwipeId(messageId: number): number {
  try {
    const swiped = getChatMessages(messageId, { include_swipes: true })[0];
    if (swiped && typeof swiped.swipe_id === 'number') {
      return swiped.swipe_id;
    }
  } catch {
    /* ignore */
  }
  try {
    const stChat = (SillyTavern as any)?.chat;
    if (Array.isArray(stChat) && stChat[messageId]?.swipe_id !== undefined) {
      return Number(stChat[messageId].swipe_id) || 0;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function getMessageText(messageId: number, swipeId?: number): string {
  if (swipeId !== undefined) {
    try {
      const swiped = getChatMessages(messageId, { include_swipes: true })[0];
      if (swiped && Array.isArray(swiped.swipes) && swiped.swipes[swipeId] !== undefined) {
        return swiped.swipes[swipeId] ?? '';
      }
    } catch {
      /* ignore */
    }
  }
  try {
    const msg = getChatMessages(messageId)[0];
    return msg?.message ?? '';
  } catch {
    return '';
  }
}

export function getStoryImageData(messageId: number): StoryImageMessageData {
  try {
    const messages = getChatMessages(messageId);
    const msg = messages[0];
    const data = msg?.extra?.story_image_v1;
    if (data && data.version === 1 && typeof data.swipes === 'object') {
      return klona(data);
    }
  } catch (error) {
    console.warn(`[剧情生图] 读取楼层 ${messageId} 状态失败:`, error);
  }
  return {
    version: 1,
    swipes: {},
  };
}

export async function saveStoryImageData(messageId: number, data: StoryImageMessageData): Promise<void> {
  const currentMessage = getChatMessages(messageId)[0];
  if (!currentMessage) {
    throw new Error(`楼层 ${messageId} 不存在，无法保存插画状态`);
  }

  const oldExtra = currentMessage.extra ? klona(currentMessage.extra) : {};
  const nextExtra = {
    ...oldExtra,
    story_image_v1: data,
  };

  try {
    await setChatMessages(
      [
        {
          message_id: messageId,
          message: currentMessage.message,
          extra: nextExtra,
        },
      ],
      {
        refresh: 'none',
      },
    );

    if (typeof SillyTavern?.saveChat === 'function') {
      await SillyTavern.saveChat();
    }
  } catch (error) {
    console.error(`[剧情生图] 保存楼层 ${messageId} 状态失败:`, error);
    throw error;
  }

  const verifiedMessage = getChatMessages(messageId)[0];
  const verifiedData = verifiedMessage?.extra?.story_image_v1;
  if (!verifiedData || verifiedData.version !== 1 || typeof verifiedData.swipes !== 'object' || !verifiedData.swipes) {
    const errorMsg = `楼层 ${messageId} 插画状态保存失败（写后回读校验不匹配）`;
    console.error(`[剧情生图] ${errorMsg}:`, {
      messageId,
      hasExtra: Boolean(verifiedMessage?.extra),
      hasStoryData: Boolean(verifiedData),
    });
    throw new Error(errorMsg);
  }

  const swipeSummary = Object.entries(data.swipes).map(([swipeId, swipeState]) => ({
    swipeId,
    status: swipeState?.status,
    operationVersion: swipeState?.operationVersion,
  }));
  console.info(`[剧情生图] 楼层 ${messageId} 插画状态已落盘:`, {
    messageId,
    swipes: swipeSummary,
  });
}

// 轻量异步锁队列：同一 chatId + messageId 保证状态更新按序执行且读取最新数据
const messageLockQueues = new Map<string, Promise<any>>();

export function clearMessageLocks(): void {
  messageLockQueues.clear();
}

export function withMessageLock<T>(expectedChatId: string, messageId: number, fn: () => Promise<T>): Promise<T> {
  const lockKey = `${expectedChatId}:${messageId}`;
  const previous = messageLockQueues.get(lockKey) ?? Promise.resolve();

  const current = previous
    .catch(() => {
      /* 忽略前序错误，确保后续任务继续执行 */
    })
    .then(async () => {
      const nowChatId = SillyTavern.getCurrentChatId?.() || 'chat';
      if (nowChatId !== expectedChatId) {
        console.warn(`[剧情生图] 排队任务启动时当前聊天已变更 (预期: ${expectedChatId}, 当前: ${nowChatId})，终止执行`);
        throw new Error('Chat changed during lock wait');
      }
      return await fn();
    });

  messageLockQueues.set(lockKey, current);

  // 确保 cleanup 派生的 Promise 自身不会留下 unhandled rejection
  current
    .catch(() => {})
    .finally(() => {
      if (messageLockQueues.get(lockKey) === current) {
        messageLockQueues.delete(lockKey);
      }
    });

  return current;
}

export function getSwipeState(messageId: number, swipeId: number): StoryImageSwipeState | undefined {
  const data = getStoryImageData(messageId);
  return data.swipes[String(swipeId)];
}

export function updateSwipeState(
  messageId: number,
  swipeId: number,
  updater: (prev: StoryImageSwipeState | undefined) => StoryImageSwipeState,
  expectedChatId?: string,
): Promise<StoryImageSwipeState | undefined> {
  const targetChatId = expectedChatId || SillyTavern.getCurrentChatId?.() || 'chat';

  return withMessageLock(targetChatId, messageId, async () => {
    const nowChatId = SillyTavern.getCurrentChatId?.() || 'chat';
    if (nowChatId !== targetChatId) {
      return undefined;
    }

    const data = getStoryImageData(messageId);
    const prev = data.swipes[String(swipeId)];
    const next = updater(prev);
    data.swipes[String(swipeId)] = next;

    if ((SillyTavern.getCurrentChatId?.() || 'chat') !== targetChatId) {
      return undefined;
    }

    await saveStoryImageData(messageId, data);
    return next;
  });
}

export function handleSwipeDeleted(messageId: number, deletedSwipeId: number, expectedChatId?: string): Promise<void> {
  const targetChatId = expectedChatId || SillyTavern.getCurrentChatId?.() || 'chat';

  return withMessageLock(targetChatId, messageId, async () => {
    const nowChatId = SillyTavern.getCurrentChatId?.() || 'chat';
    if (nowChatId !== targetChatId) {
      return;
    }

    const data = getStoryImageData(messageId);
    const oldSwipes = data.swipes;
    const newSwipes: Record<string, StoryImageSwipeState> = {};

    for (const [key, state] of Object.entries(oldSwipes)) {
      const numericKey = Number(key);
      if (Number.isNaN(numericKey)) {
        newSwipes[key] = state;
        continue;
      }
      if (numericKey === deletedSwipeId) {
        continue;
      }
      if (numericKey > deletedSwipeId) {
        // 后续 Swipe 编号减 1，同时递增 operationVersion，避免旧任务写入
        const updatedState: StoryImageSwipeState = {
          ...state,
          operationVersion: (state.operationVersion ?? 0) + 1,
        };
        newSwipes[String(numericKey - 1)] = updatedState;
      } else {
        newSwipes[key] = state;
      }
    }

    data.swipes = newSwipes;

    if ((SillyTavern.getCurrentChatId?.() || 'chat') !== targetChatId) {
      return;
    }

    await saveStoryImageData(messageId, data);
  });
}

export function invalidateOnMessageEdited(
  messageId: number,
  swipeId: number,
  newFingerprint: string,
  expectedChatId?: string,
): Promise<number | undefined> {
  const targetChatId = expectedChatId || SillyTavern.getCurrentChatId?.() || 'chat';

  return withMessageLock(targetChatId, messageId, async () => {
    const nowChatId = SillyTavern.getCurrentChatId?.() || 'chat';
    if (nowChatId !== targetChatId) {
      return undefined;
    }

    const data = getStoryImageData(messageId);
    const prev = data.swipes[String(swipeId)];
    const nextVersion = (prev?.operationVersion ?? 0) + 1;

    const history: StoredImage[] = prev?.history ? [...prev.history] : [];
    for (const scene of prev?.scenes ?? []) {
      history.push(...scene.history);
      if (scene.currentImage) history.push({ ...scene.currentImage, collapsed: true, staleReason: 'message-edited' });
    }
    if (prev?.currentImage) {
      history.push({
        ...prev.currentImage,
        collapsed: true,
        staleReason: 'message-edited',
      });
    }

    const nextState: StoryImageSwipeState = {
      status: 'planning',
      sourceFingerprint: newFingerprint,
      operationVersion: nextVersion,
      promptEditedByUser: false,
      history,
      anchor: undefined,
      sceneSummary: undefined,
      scenePrompt: undefined,
      currentImage: undefined,
      error: undefined,
    };

    data.swipes[String(swipeId)] = nextState;

    if ((SillyTavern.getCurrentChatId?.() || 'chat') !== targetChatId) {
      return undefined;
    }

    await saveStoryImageData(messageId, data);
    return nextVersion;
  });
}
