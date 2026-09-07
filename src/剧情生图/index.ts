import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createScriptIdDiv, teleportStyle } from '@util/script';
import SettingsPanel from './设置界面.vue';
import { useStoryImageSettingsStore } from './settings';
import {
  closeActionPopover,
  closeModal,
  isModalOpen,
  openActionPopover,
  openModal,
  popoverState,
  setPopoverActionHandler,
} from './ui-state';
import { clearTavernSelection, initTavernDom, tavernDocument, tavernWindow } from './tavern-dom';
import type {
  PlanPostAction,
  SlotAction,
  StoryImageErrorStage,
  StoryImageSettings,
  StoryImageSwipeState,
} from './types';
import {
  clearMessageLocks,
  createSourceFingerprint,
  getMessageCurrentSwipeId,
  getMessageText,
  getStoryImageData,
  getSwipeState,
  handleSwipeDeleted,
  invalidateOnMessageEdited,
  saveStoryImageData,
  updateSwipeState,
  withMessageLock,
} from './message-state';
import { assembleFinalPrompt, planScene } from './planner';
import { requestImageGeneration } from './providers';
import { uploadImageToTavern } from './storage';
import { openSlotPromptEditor, removeSlot, renderSlot } from './renderer';
import {
  notifyPlanningStarted,
  notifyPlanCompleted,
  notifyGeneratingStarted,
  notifyGenerateCompleted,
  notifyFailure,
  notifyCanceled,
  clearTaskNotification,
  clearAllTaskNotifications,
} from './notifier';
import './style.scss';

type ActiveTask = {
  chatId: string;
  messageId: number;
  swipeId: number;
  operationVersion: number;
  generationId?: string;
  abortController?: AbortController;
  timedOut?: boolean;
};

type AutoRepairRecord = {
  expectedRetryVersion: number;
};

const activeTasks = new Map<string, ActiveTask>();
// 记录各楼层 Swipe 已经触发过锚点自动重新生成提示词修复的周期与预期版本，键格式为 `${chatId}:${messageId}:${swipeId}`
const autoRepairedSlots = new Map<string, AutoRepairRecord>();

// 记录处于提示词生成阶段的任务 Promise，避免并发重复触发
const inFlightPlanPromises = new Map<string, Promise<StoryImageSwipeState | undefined>>();
// 记录任务后续生图行为意图（follow-setting: 依据全局设置决定; force-image: 明确生图; prompt-only: 明确仅提示词）
const planPostActionIntents = new Map<string, PlanPostAction>();

const EXTENSION_MENU_ITEM_ID = 'story_image_extension_menu_item';

function isRealChatActive(): boolean {
  try {
    const characterId = (SillyTavern as any)?.characterId;
    const groupId = (SillyTavern as any)?.groupId;
    const hasCharOrGroup =
      (characterId !== undefined && characterId !== null && characterId !== '') ||
      (groupId !== undefined && groupId !== null && groupId !== '');
    if (!hasCharOrGroup) return false;

    const chatId = SillyTavern.getCurrentChatId?.();
    if (!chatId || typeof chatId !== 'string' || !chatId.trim()) return false;

    const chat = (SillyTavern as any)?.chat;
    if (!Array.isArray(chat) || chat.length === 0) return false;

    if ($(tavernDocument).find('#welcome:visible').length > 0) return false;

    return true;
  } catch {
    return false;
  }
}

function getSlotKey(chatId: string, messageId: number, swipeId: number): string {
  return `${chatId}:${messageId}:${swipeId}`;
}

function getAutoRepairKey(chatId: string, messageId: number, swipeId: number): string {
  return `${chatId}:${messageId}:${swipeId}`;
}

function cancelTask(messageId: number, swipeId: number, chatId?: string, clearPendingIntent = true): void {
  const targetChatId = chatId || SillyTavern.getCurrentChatId?.() || 'chat';
  const key = getSlotKey(targetChatId, messageId, swipeId);
  if (clearPendingIntent) {
    planPostActionIntents.delete(key);
  }
  const task = activeTasks.get(key);
  if (task) {
    if (task.generationId) {
      try {
        stopGenerationById(task.generationId);
      } catch {
        /* ignore */
      }
    }
    if (task.abortController) {
      try {
        task.abortController.abort(new Error('任务已取消'));
      } catch {
        /* ignore */
      }
    }
    activeTasks.delete(key);
  }
}

function cancelTasksForMessage(messageId: number, chatId?: string): void {
  for (const [key, task] of activeTasks.entries()) {
    if (task.messageId === messageId && (!chatId || task.chatId === chatId)) {
      planPostActionIntents.delete(key);
      clearTaskNotification(task.chatId, task.messageId, task.swipeId);
      if (task.generationId) {
        try {
          stopGenerationById(task.generationId);
        } catch {
          /* ignore */
        }
      }
      if (task.abortController) {
        try {
          task.abortController.abort(new Error('消息任务已取消'));
        } catch {
          /* ignore */
        }
      }
      activeTasks.delete(key);
    }
  }
}

function cancelAllTasks(): void {
  planPostActionIntents.clear();
  for (const [, task] of activeTasks.entries()) {
    if (task.generationId) {
      try {
        stopGenerationById(task.generationId);
      } catch {
        /* ignore */
      }
    }
    if (task.abortController) {
      try {
        task.abortController.abort(new Error('任务已取消'));
      } catch {
        /* ignore */
      }
    }
  }
  activeTasks.clear();
}

type TaskStaleReason =
  'chat-changed' | 'active-task-missing' | 'active-task-replaced' | 'operation-version-newer' | 'task-aborted';

type CommitResult<T> =
  { success: true; state: T } | { success: false; reason: TaskStaleReason; actualVersion?: number };

function checkTaskValidity(
  task: ActiveTask,
  options?: { allowTimeout?: boolean },
): { valid: boolean; reason?: TaskStaleReason; actualVersion?: number } {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  if (task.chatId !== currentChatId) {
    return { valid: false, reason: 'chat-changed' };
  }

  const isTimeoutAllowed = Boolean(options?.allowTimeout && task.timedOut);
  if (task.abortController?.signal.aborted && !isTimeoutAllowed) {
    return { valid: false, reason: 'task-aborted' };
  }

  const taskKey = getSlotKey(task.chatId, task.messageId, task.swipeId);
  const currentTask = activeTasks.get(taskKey);
  if (!currentTask) {
    return { valid: false, reason: 'active-task-missing' };
  }

  if (currentTask !== task) {
    return { valid: false, reason: 'active-task-replaced', actualVersion: currentTask.operationVersion };
  }

  return { valid: true };
}

function logTaskDiscarded(
  stage: 'planning' | 'generation' | 'upload',
  task: ActiveTask,
  reason: TaskStaleReason,
  actualVersion?: number,
): void {
  console.info(
    `[剧情生图] ${stage === 'planning' ? '提示词' : '生图'}结果已丢弃 (${reason}) [chatId: ${task.chatId}, messageId: ${task.messageId}, swipeId: ${task.swipeId}, expectedVersion: ${task.operationVersion}, actualVersion: ${actualVersion ?? task.operationVersion}]`,
  );
}

async function commitTaskSwipeState(
  task: ActiveTask,
  baseState: StoryImageSwipeState,
  updater: (baseline: StoryImageSwipeState) => Partial<StoryImageSwipeState>,
  options?: { allowTimeout?: boolean },
): Promise<CommitResult<StoryImageSwipeState>> {
  const targetChatId = task.chatId;
  const taskKey = getSlotKey(task.chatId, task.messageId, task.swipeId);
  const isTimeoutAllowed = Boolean(options?.allowTimeout && task.timedOut);

  return withMessageLock(targetChatId, task.messageId, async () => {
    // 1. 检查当前聊天仍然一致
    const nowChatId = SillyTavern.getCurrentChatId?.() || 'chat';
    if (nowChatId !== targetChatId) {
      return { success: false, reason: 'chat-changed' };
    }

    // 2. 检查 activeTasks.get(taskKey) === task 以及 abort 状态
    if (task.abortController?.signal.aborted && !isTimeoutAllowed) {
      return { success: false, reason: 'task-aborted' };
    }
    const currentTask = activeTasks.get(taskKey);
    if (!currentTask) {
      return { success: false, reason: 'active-task-missing' };
    }
    if (currentTask !== task) {
      return { success: false, reason: 'active-task-replaced', actualVersion: currentTask.operationVersion };
    }

    // 3 & 4. 读取当前楼层状态；若存在比当前任务更新的 operationVersion，返回 stale，不覆盖
    const data = getStoryImageData(task.messageId);
    const persisted = data.swipes[String(task.swipeId)];
    const persistedVersion = persisted?.operationVersion ?? 0;
    if (persistedVersion > task.operationVersion) {
      return { success: false, reason: 'operation-version-newer', actualVersion: persistedVersion };
    }

    // 5. 再次检查任务对象仍由当前 task 持有
    if (activeTasks.get(taskKey) !== task || (task.abortController?.signal.aborted && !isTimeoutAllowed)) {
      const latestTask = activeTasks.get(taskKey);
      if (!latestTask) {
        return { success: false, reason: 'active-task-missing' };
      }
      if (latestTask !== task) {
        return { success: false, reason: 'active-task-replaced', actualVersion: latestTask.operationVersion };
      }
      return { success: false, reason: 'task-aborted' };
    }

    // 6. 写入 planned 或 ready 状态（以 baseState 确认基线融合持久化属性，保证原子安全）
    const baseline = persisted && persisted.operationVersion === task.operationVersion ? persisted : baseState;
    const nextState: StoryImageSwipeState = {
      ...baseline,
      ...updater(baseline),
      operationVersion: task.operationVersion,
    };

    data.swipes[String(task.swipeId)] = nextState;
    await saveStoryImageData(task.messageId, data);
    return { success: true, state: nextState };
  });
}

function renderMessageSlot(messageId: number, swipeId: number, state: StoryImageSwipeState): void {
  renderSlot(messageId, swipeId, state, (action, payload, slotState) => {
    void handleSlotAction(messageId, swipeId, action, payload, slotState || state).catch(err => {
      console.error(`[剧情生图] handleSlotAction 异常 (${action}):`, err);
    });
  });
}

async function handleSlotAction(
  messageId: number,
  swipeId: number,
  action: SlotAction,
  payload?: string,
  stateHint?: StoryImageSwipeState,
): Promise<void> {
  const settingsStore = useStoryImageSettingsStore();
  const settings = settingsStore.settings;

  if (!settings.enabled && action !== 'cancel') {
    return;
  }

  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const repairKey = getAutoRepairKey(currentChatId, messageId, swipeId);

  switch (action) {
    case 'anchor-resolved': {
      autoRepairedSlots.delete(repairKey);
      break;
    }

    case 'anchor-failed': {
      const currentState = getSwipeState(messageId, swipeId);
      if (!currentState) return;

      const currentVersion = currentState.operationVersion ?? 0;
      const existingRecord = autoRepairedSlots.get(repairKey);

      if (!existingRecord) {
        // 第一次确认已保存锚点失效：
        // 1. 如果存在 currentImage，将其 collapsed 设为 true，移入 history，清空 currentImage，staleReason 设为 message-edited
        const nextVersion = currentVersion + 1;
        autoRepairedSlots.set(repairKey, { expectedRetryVersion: nextVersion });

        console.warn(
          `[剧情生图] 锚点定位失败 (v${currentVersion})，归档旧图并触发单次自动重新生成提示词修复 (目标 v${nextVersion}): ${repairKey}`,
        );

        await updateSwipeState(
          messageId,
          swipeId,
          prev => {
            if (!prev) return prev as any;
            const history = prev.history ? [...prev.history] : [];
            if (prev.currentImage) {
              history.push({
                ...prev.currentImage,
                collapsed: true,
                staleReason: 'message-edited',
              });
            }
            return {
              ...prev,
              currentImage: undefined,
              history,
            };
          },
          currentChatId,
        );

        // 2. 然后进行唯一一次自动重新生成提示词
        await triggerPlan(messageId, swipeId, true);
        return;
      }

      // 如果已有修复记录：
      // - 旧 operationVersion 的重复 anchor-failed：忽略
      if (currentVersion < existingRecord.expectedRetryVersion) {
        console.info(
          `[剧情生图] 忽略旧版本 (v${currentVersion} < v${existingRecord.expectedRetryVersion}) 的重复 anchor-failed`,
        );
        return;
      }

      // - retryOperationVersion 对应的新规划再次定位失败：进入 error/render
      console.error(
        `[剧情生图] 自动重选后 (v${currentVersion}) 锚点仍定位失败，转入错误态供手动重试: "${currentState.anchor?.quote ?? ''}"`,
      );
      const errorState = await updateSwipeState(
        messageId,
        swipeId,
        prev => {
          if (!prev) return prev as any;
          return {
            ...prev,
            status: 'error',
            error: {
              stage: 'render',
              message: `未能定位正文锚点: "${currentState.anchor?.quote?.slice(0, 20) ?? ''}..."`,
            },
          };
        },
        currentChatId,
      );
      if (errorState) {
        renderMessageSlot(messageId, swipeId, errorState);
      }
      break;
    }

    case 'generate':
    case 'retry-gen': {
      await startImageGeneration(messageId, swipeId, stateHint, action);
      break;
    }

    case 'cancel': {
      cancelTask(messageId, swipeId, currentChatId);
      notifyCanceled(currentChatId, messageId, swipeId);
      const state = await updateSwipeState(
        messageId,
        swipeId,
        prev => {
          if (!prev) return prev as any;
          return {
            ...prev,
            status: prev.currentImage ? 'ready' : 'planned',
            error: undefined,
          };
        },
        currentChatId,
      );
      if (state) {
        renderMessageSlot(messageId, swipeId, state);
      }
      break;
    }

    case 'retry-plan': {
      autoRepairedSlots.delete(repairKey);
      await triggerPlan(messageId, swipeId, true);
      break;
    }

    case 'regenerate': {
      const state = await updateSwipeState(
        messageId,
        swipeId,
        prev => {
          const baseline = prev || stateHint;
          if (!baseline) return baseline as any;
          const history = baseline.history ? [...baseline.history] : [];
          if (baseline.currentImage) {
            history.push({
              ...baseline.currentImage,
              collapsed: true,
              staleReason: 'regenerated',
            });
          }
          return {
            ...baseline,
            currentImage: undefined,
            history,
          };
        },
        currentChatId,
      );
      if (state) {
        renderMessageSlot(messageId, swipeId, state);
      }
      await startImageGeneration(messageId, swipeId, state || stateHint, 'regenerate');
      break;
    }

    case 'save-prompt': {
      const newPrompt = (payload ?? '').trim();
      if (!newPrompt) {
        return;
      }
      const state = await updateSwipeState(
        messageId,
        swipeId,
        prev => {
          if (!prev) return prev as any;
          const history = prev.history ? [...prev.history] : [];
          if (prev.currentImage) {
            history.push({
              ...prev.currentImage,
              collapsed: true,
              staleReason: 'prompt-edited',
            });
          }
          return {
            ...prev,
            scenePrompt: newPrompt,
            promptEditedByUser: true,
            status: 'planned',
            currentImage: undefined,
            history,
          };
        },
        currentChatId,
      );
      if (state) {
        renderMessageSlot(messageId, swipeId, state);
      }
      break;
    }
  }
}

async function startImageGeneration(
  messageId: number,
  swipeId: number,
  stateHint?: StoryImageSwipeState,
  action = 'generate',
): Promise<void> {
  const settingsStore = useStoryImageSettingsStore();
  const settings = settingsStore.settings;

  if (!settings.enabled) {
    console.warn('[剧情生图] 插件已禁用，禁止生图');
    toastr.warning('剧情生图插件已禁用');
    return;
  }

  const chatId = SillyTavern.getCurrentChatId?.() || 'chat';

  // 1. 检查当前 Swipe 是否已切换
  const currentSwipeId = getMessageCurrentSwipeId(messageId);
  if (currentSwipeId !== swipeId) {
    console.warn(`[剧情生图] 楼层 ${messageId} 当前 Swipe 已切换 (当前: ${currentSwipeId}, 请求: ${swipeId})`);
    toastr.warning('当前楼层已被切换到其他 Swipe，请在当前画面重新生成');
    return;
  }

  // 2. 检查楼层正文与指纹
  const text = getMessageText(messageId, swipeId);
  if (!text.trim()) {
    console.warn(`[剧情生图] 楼层 ${messageId} 正文为空，无法生图`);
    toastr.warning('楼层正文为空，无法生成图片');
    return;
  }
  const currentFingerprint = createSourceFingerprint(text);

  // 3. 同时读取 persistedState 与 stateHint，按规则择优
  const persistedState = getSwipeState(messageId, swipeId);
  let effectiveState: StoryImageSwipeState | undefined;
  let stateSource: 'persisted' | 'hint' | 'none' = 'none';

  const persistedMatchesFingerprint = persistedState && persistedState.sourceFingerprint === currentFingerprint;
  const hintMatchesFingerprint = stateHint && stateHint.sourceFingerprint === currentFingerprint;

  const persistedVersion = persistedState?.operationVersion ?? -1;
  const hintVersion = stateHint?.operationVersion ?? -1;

  if (persistedState && stateHint) {
    if (persistedVersion > hintVersion && persistedMatchesFingerprint) {
      effectiveState = persistedState;
      stateSource = 'persisted';
    } else if (hintMatchesFingerprint) {
      effectiveState = stateHint;
      stateSource = 'hint';
    } else if (persistedMatchesFingerprint) {
      effectiveState = persistedState;
      stateSource = 'persisted';
    }
  } else if (persistedState) {
    if (persistedMatchesFingerprint) {
      effectiveState = persistedState;
      stateSource = 'persisted';
    }
  } else if (stateHint) {
    if (hintMatchesFingerprint) {
      effectiveState = stateHint;
      stateSource = 'hint';
    }
  }

  // 4. 结构化日志（仅记录动作元数据，严禁输出 API Key 或完整提示词）
  console.info('[剧情生图] 生图动作入口:', {
    action,
    chatId,
    messageId,
    swipeId,
    stateSource,
    status: effectiveState?.status ?? 'none',
    operationVersion: effectiveState?.operationVersion ?? 0,
    hasPrompt: Boolean(effectiveState?.scenePrompt?.trim()),
  });

  // 5. 严格检查：状态获取、正文指纹变化、提示词非空
  if (!effectiveState) {
    if ((persistedState && !persistedMatchesFingerprint) || (stateHint && !hintMatchesFingerprint)) {
      console.warn(`[剧情生图] 楼层 ${messageId} 正文指纹已变化，拦截旧提示词生图`);
      toastr.warning('楼层正文已修改，请重新生成提示词后再生成图片');
      return;
    }
    console.warn(`[剧情生图] 楼层 ${messageId} 未取得可用插画状态`);
    toastr.warning('未获取到该楼层的插画状态，请先生成提示词');
    return;
  }

  const prompt = effectiveState.scenePrompt;
  if (!prompt || !prompt.trim()) {
    console.warn(`[剧情生图] 楼层 ${messageId} 场景提示词为空`);
    toastr.warning('场景提示词为空，请先填写或生成提示词');
    return;
  }

  // 6. 检查是否已有进行中的任务或正在生成中
  const taskKey = getSlotKey(chatId, messageId, swipeId);
  if (activeTasks.has(taskKey) || effectiveState.status === 'generating') {
    console.warn(`[剧情生图] 楼层 ${messageId} swipe ${swipeId} generating 状态已有任务进行中`);
    toastr.info('该楼层已有正在进行的生图任务，请稍候');
    return;
  }

  // 7. 取消旧任务，准备新任务
  cancelTask(messageId, swipeId, chatId);

  const abortController = new AbortController();
  const timeoutMs = Math.max(5000, settings.provider.timeoutMs || 120000);
  const timeoutSeconds = Math.round(timeoutMs / 1000);
  let timedOut = false;
  let currentStage: StoryImageErrorStage = 'generation';

  const opVersion = effectiveState.operationVersion;
  const task: ActiveTask = {
    chatId,
    messageId,
    swipeId,
    operationVersion: opVersion,
    abortController,
  };

  activeTasks.set(taskKey, task);
  let timer: any = null;
  let generatingState: StoryImageSwipeState | undefined = undefined;

  try {
    // 立即发出通知（必须在发起 HTTP 请求之前显示）
    notifyGeneratingStarted(chatId, messageId, swipeId);

    timer = setTimeout(() => {
      timedOut = true;
      task.timedOut = true;
      abortController.abort(new Error(`生图全流程超时（${timeoutSeconds}秒）`));
    }, timeoutMs);

    const finalPrompt = assembleFinalPrompt(prompt, settings);

    // 8. 原子提交初始 generating 状态（基于 effectiveState 基线，解决持久化暂时为空的问题）
    const commitGenResult = await commitTaskSwipeState(task, effectiveState, prev => ({
      ...prev,
      status: 'generating',
      error: undefined,
    }));

    if (!commitGenResult.success) {
      logTaskDiscarded('generation', task, commitGenResult.reason, commitGenResult.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      console.error(`[剧情生图] 初始 generating 状态提交失败 (${commitGenResult.reason})`);
      toastr.error('初始生图状态提交失败，请重试');
      return;
    }

    generatingState = commitGenResult.state;
    renderMessageSlot(messageId, swipeId, generatingState);

    // 初始状态写入完成后、开始生图 HTTP 请求前再次检查
    const preCheck = checkTaskValidity(task);
    if (!preCheck.valid) {
      logTaskDiscarded('generation', task, preCheck.reason!, preCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      toastr.warning('任务已失效，生图终止');
      return;
    }

    currentStage = 'generation';
    const payload = await requestImageGeneration(finalPrompt, settings, abortController.signal);

    const postGenCheck = checkTaskValidity(task);
    if (!postGenCheck.valid) {
      logTaskDiscarded('generation', task, postGenCheck.reason!, postGenCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return;
    }

    currentStage = payload.kind === 'url' ? 'download' : 'upload';
    const storedImage = await uploadImageToTavern(
      payload,
      chatId,
      messageId,
      swipeId,
      finalPrompt,
      settings,
      abortController.signal,
      stage => {
        currentStage = stage;
      },
    );

    const postUploadCheck = checkTaskValidity(task);
    if (!postUploadCheck.valid) {
      logTaskDiscarded('upload', task, postUploadCheck.reason!, postUploadCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return;
    }

    const commitResult = await commitTaskSwipeState(task, generatingState, prev => ({
      ...prev,
      status: 'ready',
      currentImage: storedImage,
      error: undefined,
    }));

    if (!commitResult.success) {
      logTaskDiscarded('upload', task, commitResult.reason, commitResult.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return;
    }

    const readyState = commitResult.state;
    renderMessageSlot(messageId, swipeId, readyState);
    notifyGenerateCompleted(chatId, messageId, swipeId);
  } catch (err: any) {
    const isTimeout = Boolean(timedOut || task.timedOut || String(err?.message ?? '').includes('超时'));
    if (isTimeout) {
      task.timedOut = true;
    }
    const isUserCancel = abortController.signal.aborted && !isTimeout;
    if (isUserCancel) {
      // 玩家主动取消：静默退出，不记录为错误
      console.info('[剧情生图] 生图已被用户主动取消');
      notifyCanceled(chatId, messageId, swipeId);
      return;
    }
    const errCheck = checkTaskValidity(task, { allowTimeout: isTimeout });
    if (!errCheck.valid) {
      logTaskDiscarded('generation', task, errCheck.reason!, errCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return;
    }

    let errMsg: string;
    if (isTimeout) {
      errMsg = `生图全流程超时（${timeoutSeconds}秒）`;
    } else {
      const reasonMsg = abortController.signal.reason
        ? String((abortController.signal.reason as any).message || abortController.signal.reason)
        : '';
      errMsg = reasonMsg || String(err?.message ?? err);
    }

    console.error(`[剧情生图] 生图流程异常 (${currentStage}):`, errMsg);

    let stage: StoryImageErrorStage = currentStage;
    if (errMsg.includes('下载外部图片') || errMsg.includes('下载')) {
      stage = 'download';
    } else if (errMsg.includes('酒馆服务器') || errMsg.includes('上传')) {
      stage = 'upload';
    }

    notifyFailure(chatId, messageId, swipeId, stage, errMsg);

    const baseState = generatingState || effectiveState;
    const errorCommit = await commitTaskSwipeState(
      task,
      baseState,
      prev => ({
        ...prev,
        status: 'error',
        error: {
          stage,
          message: errMsg,
        },
      }),
      { allowTimeout: isTimeout },
    );

    if (errorCommit.success) {
      renderMessageSlot(messageId, swipeId, errorCommit.state);
    }
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    if (activeTasks.get(taskKey) === task) {
      activeTasks.delete(taskKey);
    }
  }
}

async function executePlan(
  chatId: string,
  taskKey: string,
  messageId: number,
  swipeId: number,
  existing: StoryImageSwipeState | undefined,
  settings: StoryImageSettings,
): Promise<StoryImageSwipeState | undefined> {
  const text = getMessageText(messageId, swipeId);
  const fingerprint = createSourceFingerprint(text);
  const nextVersion = (existing?.operationVersion ?? 0) + 1;

  cancelTask(messageId, swipeId, chatId, false);

  const generationId = `story-image-plan:${chatId}:${messageId}:${swipeId}:${nextVersion}`;
  const abortController = new AbortController();
  const task: ActiveTask = {
    chatId,
    messageId,
    swipeId,
    operationVersion: nextVersion,
    generationId,
    abortController,
  };

  activeTasks.set(taskKey, task);
  notifyPlanningStarted(chatId, messageId, swipeId);

  let plannedState: StoryImageSwipeState | undefined;
  let planningState: StoryImageSwipeState | undefined;
  try {
    planningState = await updateSwipeState(
      messageId,
      swipeId,
      prev => {
        const history = prev?.history ? [...prev.history] : [];
        if (prev?.currentImage) {
          history.push({
            ...prev.currentImage,
            collapsed: true,
            staleReason: 'prompt-edited',
          });
        }
        return {
          status: 'planning',
          sourceFingerprint: fingerprint,
          operationVersion: nextVersion,
          promptEditedByUser: false,
          history,
          anchor: undefined,
          sceneSummary: undefined,
          scenePrompt: undefined,
          currentImage: undefined,
          error: undefined,
        };
      },
      chatId,
    );

    if (!planningState) {
      console.info('[剧情生图] 初始 planningState 写入失败，终止本次规划');
      clearTaskNotification(chatId, messageId, swipeId);
      return undefined;
    }
    renderMessageSlot(messageId, swipeId, planningState);

    // 初始状态写入完成后再次检查环境与活跃任务
    const preCheck = checkTaskValidity(task);
    if (!preCheck.valid) {
      logTaskDiscarded('planning', task, preCheck.reason!, preCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return undefined;
    }

    const result = await planScene(
      messageId,
      swipeId,
      nextVersion,
      settings,
      fallbackGenId => {
        task.generationId = fallbackGenId;
      },
      abortController.signal,
    );

    const postCheck = checkTaskValidity(task);
    if (!postCheck.valid) {
      logTaskDiscarded('planning', task, postCheck.reason!, postCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return undefined;
    }

    const commitResult = await commitTaskSwipeState(task, planningState, prev => ({
      ...prev,
      status: 'planned',
      anchor: result.anchor,
      sceneSummary: result.scene_summary,
      scenePrompt: result.scene_prompt,
      currentImage: undefined,
      error: undefined,
    }));

    if (!commitResult.success) {
      logTaskDiscarded('planning', task, commitResult.reason, commitResult.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return undefined;
    }

    plannedState = commitResult.state;
    renderMessageSlot(messageId, swipeId, plannedState);
  } catch (err: any) {
    planPostActionIntents.delete(taskKey);

    const isTimeout = Boolean(
      err?.name === 'TimeoutError' ||
      (err as any)?.isTimeout ||
      task.timedOut ||
      String(err?.message ?? '').includes('超时'),
    );
    const isUserCancel = (abortController.signal.aborted || err?.name === 'AbortError') && !isTimeout;

    if (isUserCancel) {
      console.info(`[剧情生图] 楼层 ${messageId} swipe ${swipeId} 提示词生成任务已被取消`);
      logTaskDiscarded('planning', task, 'task-aborted');
      clearTaskNotification(chatId, messageId, swipeId);
      return undefined;
    }

    if (isTimeout) {
      task.timedOut = true;
    }

    const errCheck = checkTaskValidity(task, { allowTimeout: isTimeout });
    if (!errCheck.valid) {
      logTaskDiscarded('planning', task, errCheck.reason!, errCheck.actualVersion);
      clearTaskNotification(chatId, messageId, swipeId);
      return undefined;
    }

    const errMsg = String(err?.message ?? err);
    console.error('[剧情生图] 提示词生成失败:', errMsg);
    notifyFailure(chatId, messageId, swipeId, 'planning', errMsg);

    const baseState = planningState ||
      existing || {
        status: 'planning',
        sourceFingerprint: fingerprint,
        operationVersion: nextVersion,
        promptEditedByUser: false,
        history: [],
        anchor: undefined,
        sceneSummary: undefined,
        scenePrompt: undefined,
        currentImage: undefined,
        error: undefined,
      };

    const errorCommit = await commitTaskSwipeState(
      task,
      baseState,
      prev => ({
        ...prev,
        status: 'error',
        error: {
          stage: 'planning',
          message: errMsg,
        },
      }),
      { allowTimeout: isTimeout },
    );

    if (errorCommit.success) {
      renderMessageSlot(messageId, swipeId, errorCommit.state);
      return errorCommit.state;
    }
    return undefined;
  } finally {
    if (activeTasks.get(taskKey) === task) {
      activeTasks.delete(taskKey);
    }
  }

  return plannedState;
}

async function triggerPlan(
  messageId: number,
  swipeId: number,
  forced = false,
  postAction?: PlanPostAction,
): Promise<StoryImageSwipeState | undefined> {
  const settingsStore = useStoryImageSettingsStore();
  const settings = settingsStore.settings;
  if (!settings.enabled) return undefined;
  if (!isRealChatActive()) return undefined;

  const messages = getChatMessages(messageId);
  const msg = messages[0];
  if (!msg || msg.role !== 'assistant' || msg.is_hidden) {
    return undefined;
  }

  const chatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const taskKey = getSlotKey(chatId, messageId, swipeId);
  if (postAction) {
    planPostActionIntents.set(taskKey, postAction);
  } else if (!planPostActionIntents.has(taskKey)) {
    planPostActionIntents.set(taskKey, 'follow-setting');
  }

  // 1. 若内存已有在飞规划 Promise，非强制重选时直接复用（复用者只等待结果，不重复消费后续动作）
  const inFlight = inFlightPlanPromises.get(taskKey);
  if (inFlight) {
    if (!forced) {
      console.info(`[剧情生图] 楼层 ${messageId} swipe ${swipeId} 已有提示词生成进行中，复用该请求`);
      if (postAction === 'force-image') {
        toastr.info('已记录生成意图，提示词生成后将自动生成图片');
      }
      return inFlight;
    }
    cancelTask(messageId, swipeId, chatId, false);
  }

  // 2. 检查持久化状态：若未强制且已有稳定状态（planned 或 ready），直接渲染并返回
  const existing = getSwipeState(messageId, swipeId);
  if (!forced && existing && (existing.status === 'planned' || existing.status === 'ready')) {
    renderMessageSlot(messageId, swipeId, existing);
    return existing;
  }

  // 3. 作为唯一的任务创建者，执行规划任务并维护 inFlightPlanPromises 缓存
  const planPromise = executePlan(chatId, taskKey, messageId, swipeId, existing, settings);
  inFlightPlanPromises.set(taskKey, planPromise);

  let plannedState: StoryImageSwipeState | undefined;
  try {
    plannedState = await planPromise;
  } finally {
    if (inFlightPlanPromises.get(taskKey) === planPromise) {
      inFlightPlanPromises.delete(taskKey);
    }
  }

  // 4. 只有唯一的任务创建者才消费 planPostActionIntents 并决定是否启动生图
  if (plannedState && plannedState.status === 'planned') {
    const action = planPostActionIntents.get(taskKey) ?? 'follow-setting';
    planPostActionIntents.delete(taskKey);

    const shouldGenerateImage =
      action === 'force-image'
        ? true
        : action === 'prompt-only'
          ? false
          : Boolean(settings.behavior?.autoGenerateImageEnabled);

    if (shouldGenerateImage) {
      console.info(
        `[剧情生图] 楼层 ${messageId} swipe ${swipeId} 提示词生成完毕，继续执行生图流程 (action: ${action})`,
      );
      await startImageGeneration(messageId, swipeId, plannedState, 'auto-follow-plan');
    } else {
      notifyPlanCompleted(chatId, messageId, swipeId);
    }
  }

  return plannedState;
}

async function handleQuickPlan(
  messageId: number,
  swipeId: number,
  postAction: PlanPostAction = 'follow-setting',
): Promise<void> {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const taskKey = getSlotKey(currentChatId, messageId, swipeId);
  planPostActionIntents.set(taskKey, postAction);
  await triggerPlan(messageId, swipeId, false, postAction);
}

async function handleQuickPlanAndGenerate(messageId: number, swipeId: number): Promise<void> {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const taskKey = getSlotKey(currentChatId, messageId, swipeId);
  planPostActionIntents.set(taskKey, 'force-image');

  await triggerPlan(messageId, swipeId, false, 'force-image');
}

async function handleManualPrompt(messageId: number, swipeId: number): Promise<void> {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const taskKey = getSlotKey(currentChatId, messageId, swipeId);

  // 1. 取消当前提示词任务
  cancelTask(messageId, swipeId, currentChatId, true);
  clearTaskNotification(currentChatId, messageId, swipeId);
  autoRepairedSlots.delete(getAutoRepairKey(currentChatId, messageId, swipeId));

  // 2. 清理当前 taskKey 的 postAction
  planPostActionIntents.delete(taskKey);

  // 3 & 4 & 5. 无论旧状态是否存在，写入一个可编辑的 planned 状态；如有 currentImage 归入 history
  const text = getMessageText(messageId, swipeId);
  const fingerprint = createSourceFingerprint(text);

  const state = await updateSwipeState(
    messageId,
    swipeId,
    prev => {
      const history = prev?.history ? [...prev.history] : [];
      if (prev?.currentImage) {
        history.push({
          ...prev.currentImage,
          collapsed: true,
          staleReason: 'prompt-edited',
        });
      }
      return {
        status: 'planned',
        sourceFingerprint: fingerprint,
        operationVersion: (prev?.operationVersion ?? 0) + 1,
        promptEditedByUser: true,
        history,
        anchor: undefined,
        sceneSummary: '手动设定场景',
        scenePrompt: '',
        currentImage: undefined,
        error: undefined,
      };
    },
    currentChatId,
  );

  // 6. 打开并聚焦提示词编辑器
  if (state) {
    openSlotPromptEditor(messageId, swipeId);
    renderMessageSlot(messageId, swipeId, state);
    setTimeout(() => {
      const slotKey = `${messageId}:${swipeId}`;
      const $slot = $(`[data-story-image-slot="${slotKey}"]`, tavernDocument);
      if ($slot.length) {
        $slot[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        $slot.find('.story-image-textarea').focus();
      }
    }, 50);
  }
}

async function handleQuickGenerate(
  messageId: number,
  swipeId: number,
  stateHint?: StoryImageSwipeState,
): Promise<void> {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const taskKey = getSlotKey(currentChatId, messageId, swipeId);
  const persistedState = getSwipeState(messageId, swipeId);
  const state =
    persistedState && stateHint
      ? persistedState.operationVersion >= stateHint.operationVersion
        ? persistedState
        : stateHint
      : persistedState || stateHint;

  if (state?.status === 'generating') {
    toastr.info('当前楼层已有生图任务正在进行中');
    return;
  }
  if (state?.status === 'planning') {
    planPostActionIntents.set(taskKey, 'force-image');
    await triggerPlan(messageId, swipeId, false, 'force-image');
    return;
  }

  if (state?.status === 'ready') {
    await handleSlotAction(messageId, swipeId, 'regenerate', undefined, state);
    return;
  }

  if (state?.status === 'planned' && state.scenePrompt) {
    await startImageGeneration(messageId, swipeId, state, 'quick-generate');
    return;
  }

  if (state?.status === 'error') {
    if (state.error?.stage === 'planning' || state.error?.stage === 'render') {
      planPostActionIntents.set(taskKey, 'force-image');
      await triggerPlan(messageId, swipeId, true, 'force-image');
    } else {
      await startImageGeneration(messageId, swipeId, state, 'retry-error');
    }
    return;
  }

  // 兜底：若尚未规划，串联生成提示词与生图
  planPostActionIntents.set(taskKey, 'force-image');
  await triggerPlan(messageId, swipeId, false, 'force-image');
}

async function handleQuickReplan(
  messageId: number,
  swipeId: number,
  postAction: PlanPostAction = 'follow-setting',
): Promise<void> {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const taskKey = getSlotKey(currentChatId, messageId, swipeId);
  cancelTask(messageId, swipeId, currentChatId, true);
  autoRepairedSlots.delete(getAutoRepairKey(currentChatId, messageId, swipeId));
  planPostActionIntents.set(taskKey, postAction);

  await triggerPlan(messageId, swipeId, true, postAction);
}

async function handleQuickEditPrompt(messageId: number, swipeId: number): Promise<void> {
  let state = getSwipeState(messageId, swipeId);
  if (!state || state.status === 'error' || !state.scenePrompt) {
    state = await triggerPlan(messageId, swipeId, false);
  }
  if (state) {
    openSlotPromptEditor(messageId, swipeId);
    renderMessageSlot(messageId, swipeId, state);
    setTimeout(() => {
      const slotKey = `${messageId}:${swipeId}`;
      const $slot = $(`[data-story-image-slot="${slotKey}"]`, tavernDocument);
      if ($slot.length) {
        $slot[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        $slot.find('.story-image-textarea').focus();
      }
    }, 50);
  }
}

async function reconcileTransientState(messageId: number, swipeId: number): Promise<StoryImageSwipeState | null> {
  const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
  const state = getSwipeState(messageId, swipeId);
  if (!state) return null;

  const taskKey = getSlotKey(currentChatId, messageId, swipeId);
  const task = activeTasks.get(taskKey);
  const hasActiveTask = Boolean(task && task.operationVersion === state.operationVersion);

  // 1. 若内存中确实存在该活动任务，保持当前暂态
  if (hasActiveTask) {
    return state;
  }

  // 2. 状态是 planning，但无对应活动任务 -> 恢复为重新生成提示词流程
  if (state.status === 'planning') {
    console.info(`[剧情生图] 协调暂态：楼层 ${messageId} swipe ${swipeId} 恢复重新生成提示词`);
    return (await triggerPlan(messageId, swipeId, true)) ?? null;
  }

  // 3. 状态是 generating，但无对应活动任务
  if (state.status === 'generating') {
    const hasPrompt = Boolean(state.scenePrompt?.trim());
    const recoveredStatus = hasPrompt ? 'planned' : 'error';
    console.info(`[剧情生图] 协调暂态：楼层 ${messageId} swipe ${swipeId} 恢复为 ${recoveredStatus}`);
    const updated = await updateSwipeState(
      messageId,
      swipeId,
      prev => {
        if (!prev) return prev as any;
        return {
          ...prev,
          status: recoveredStatus,
          error: !hasPrompt
            ? {
                stage: 'planning',
                message: '任务中断且缺少场景描述，请重新生成提示词',
              }
            : undefined,
        };
      },
      currentChatId,
    );
    return updated ?? null;
  }

  // 4. 其他稳定状态直接返回
  return state;
}

async function restoreExistingSlots(): Promise<void> {
  const settingsStore = useStoryImageSettingsStore();
  if (!settingsStore.settings.enabled) return;
  if (!isRealChatActive()) return;

  try {
    const lastId = getLastMessageId();
    if (typeof lastId !== 'number' || lastId < 0) return;

    const chatMessages = getChatMessages(`0-${lastId}`);
    for (const msg of chatMessages) {
      if (msg.role === 'assistant' && !msg.is_hidden) {
        const swipeId = getMessageCurrentSwipeId(msg.message_id);
        const reconciled = await reconcileTransientState(msg.message_id, swipeId);
        if (reconciled) {
          renderMessageSlot(msg.message_id, swipeId, reconciled);
        }
      }
    }
  } catch (e) {
    console.warn('[剧情生图] 恢复已保存楼层失败:', e);
  }
}

async function autoPlanLatestAssistantIfNeeded(): Promise<void> {
  const settingsStore = useStoryImageSettingsStore();
  if (!settingsStore.settings.enabled) return;
  if (!isRealChatActive()) return;
  if (!settingsStore.settings.behavior?.autoPlanEnabled) return;

  try {
    const lastId = getLastMessageId();
    if (typeof lastId !== 'number' || lastId < 0) return;

    const messages = getChatMessages(`0-${lastId}`);
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && !msg.is_hidden) {
        const swipeId = getMessageCurrentSwipeId(msg.message_id);
        const state = getSwipeState(msg.message_id, swipeId);
        if (!state) {
          await triggerPlan(msg.message_id, swipeId, false, 'follow-setting');
        }
        break;
      }
    }
  } catch (e) {
    console.warn('[剧情生图] 检查最新助手楼层失败:', e);
  }
}

function ensureExtensionMenuItem(): void {
  if ($(tavernDocument).find(`#${EXTENSION_MENU_ITEM_ID}`).length > 0) return;

  const $menu = $(tavernDocument).find('#extensionsMenu, #extensions_menu, .extensions_menu').first();
  if (!$menu.length) return;

  const $item = $(
    `
    <div class="list-group-item extension_item interactable" id="${EXTENSION_MENU_ITEM_ID}" title="剧情生图" style="cursor: pointer;">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span>剧情生图</span>
    </div>
  `,
    tavernDocument,
  );

  $item.on('click', e => {
    e.preventDefault();
    e.stopPropagation();

    // 查找左下角“扩展程序”按钮与菜单容器
    const $extBtn = $(tavernDocument)
      .find('#extensionsMenuButton, #extensions_button, .extensions_button, #nav_toggle_extensions')
      .first();
    const $menuEl = $(tavernDocument).find('#extensionsMenu, #extensions_menu, .extensions_menu').first();
    const extBtnEl = ($extBtn[0] || $item[0]) as HTMLElement;

    // 1. 调用酒馆原生扩展按钮的关闭逻辑，收起 #extensionsMenu
    if ($extBtn.length && ($menuEl.is(':visible') || $menuEl.css('display') !== 'none' || $menuEl.hasClass('open'))) {
      $extBtn.trigger('click');
    }
    // 兜底确保菜单隐藏，避免两个界面同时显示
    if ($menuEl.is(':visible') || $menuEl.css('display') !== 'none') {
      $menuEl.hide();
    }

    // 2. 等当前点击事件结束后再打开剧情生图弹窗
    // 3. 传入左下角“扩展程序”按钮，弹窗关闭后把焦点恢复到该按钮
    setTimeout(() => {
      openModal(extBtnEl);
    }, 0);
  });

  $menu.append($item);
}

function ensureQuickButton(messageId: number): void {
  const settingsStore = useStoryImageSettingsStore();
  if (!settingsStore.settings.enabled) return;
  if (!settingsStore.settings.behavior?.enableQuickButton) return;
  if (!isRealChatActive()) return;

  const $mes = retrieveDisplayedMessage(messageId);
  if (!$mes || !$mes.length) return;

  if ($mes.attr('is_user') === 'true' || $mes.hasClass('is_user')) return;
  if ($mes.find('.story-image-quick-btn').length > 0) return;

  let $container = $mes.find('.extraMesButtons');
  if (!$container.length) $container = $mes.find('.mes_buttons');
  if (!$container.length) $container = $mes.find('.name_text');
  if (!$container.length) $container = $mes.find('.mes_block');
  if (!$container.length) return;

  const $btn = $(
    `
    <button type="button" class="story-image-quick-btn interactable" title="剧情生图" aria-label="剧情生图" data-message-id="${messageId}">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
      <span class="story-image-quick-btn-text">画图</span>
    </button>
  `,
    tavernDocument,
  );

  $btn.on('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const swipeId = getMessageCurrentSwipeId(messageId);
    const offset = $btn.offset();
    const stateHint = getSwipeState(messageId, swipeId);
    openActionPopover(
      messageId,
      swipeId,
      offset ? { x: offset.left, y: offset.top + ($btn.outerHeight() ?? 30) } : undefined,
      $btn[0],
      stateHint,
    );
  });

  $container.append($btn);
}

function ensureAllQuickButtons(): void {
  const settingsStore = useStoryImageSettingsStore();
  if (!settingsStore.settings.enabled || !settingsStore.settings.behavior?.enableQuickButton || !isRealChatActive()) {
    $(tavernDocument).find('.story-image-quick-btn').remove();
    return;
  }

  $(tavernDocument)
    .find('#chat .mes[is_user="false"], #chat .mes:not([is_user="true"])')
    .each(function () {
      const mesIdStr = $(this).attr('mesid');
      if (mesIdStr !== undefined && mesIdStr !== '') {
        const mesId = Number(mesIdStr);
        if (!isNaN(mesId)) {
          ensureQuickButton(mesId);
        }
      }
    });
}

$(() => {
  const pinia = createPinia();
  const app = createApp(SettingsPanel).use(pinia);

  // 挂载独立模态面板到 body
  const $app = createScriptIdDiv().appendTo('body');
  initTavernDom($app[0]);
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  const settingsStore = useStoryImageSettingsStore();
  let previousEnabled = settingsStore.settings.enabled;
  let previousQuickBtn = settingsStore.settings.behavior?.enableQuickButton;

  // 注册快捷浮层菜单动作分发，统一进行异步异常收拢
  setPopoverActionHandler(async (action, messageId, swipeId, stateHint) => {
    try {
      switch (action) {
        case 'plan':
          await handleQuickPlan(messageId, swipeId);
          break;
        case 'plan-only':
          await handleQuickPlan(messageId, swipeId, 'prompt-only');
          break;
        case 'plan-and-generate':
          await handleQuickPlanAndGenerate(messageId, swipeId);
          break;
        case 'manual-prompt':
          await handleManualPrompt(messageId, swipeId);
          break;
        case 'generate':
          await handleQuickGenerate(messageId, swipeId, stateHint);
          break;
        case 'replan':
          await handleQuickReplan(messageId, swipeId);
          break;
        case 'replan-only':
          await handleQuickReplan(messageId, swipeId, 'prompt-only');
          break;
        case 'replan-and-generate':
          await handleQuickReplan(messageId, swipeId, 'force-image');
          break;
        case 'edit-prompt':
          await handleQuickEditPrompt(messageId, swipeId);
          break;
        case 'regenerate':
          await handleSlotAction(messageId, swipeId, 'regenerate', undefined, stateHint);
          break;
      }
    } catch (err: any) {
      const errMsg = String(err?.message ?? err);
      console.error(`[剧情生图] 快捷动作 (${action}) 执行异常:`, err);
      if (typeof toastr !== 'undefined' && toastr.error) {
        toastr.error(`剧情生图执行失败: ${errMsg}`);
      }
    }
  });

  // 幂等注入左下角扩展程序菜单项
  ensureExtensionMenuItem();

  // 狭窄范围观察者：仅观察 #extensionsMenu 自身或其稳定父容器的 childList，不观察聊天 subtree
  let menuObserver: MutationObserver | null = null;
  const targetMenuContainer =
    $(tavernDocument).find('#extensionsMenu, #extensions_menu, .extensions_menu').first()[0] ||
    $(tavernDocument).find('#extensions_holder, #sheld, #left-nav').first()[0] ||
    tavernDocument.body;

  if (targetMenuContainer) {
    menuObserver = new MutationObserver(() => {
      if ($(tavernDocument).find(`#${EXTENSION_MENU_ITEM_ID}`).length === 0) {
        ensureExtensionMenuItem();
      }
    });
    menuObserver.observe(targetMenuContainer, { childList: true, subtree: false });
  }

  // 监听酒馆扩展菜单按钮点击
  const onExtensionMenuBtnClick = () => {
    setTimeout(ensureExtensionMenuItem, 0);
  };
  $(tavernDocument).on(
    'click',
    '#extensionsMenuButton, #extensions_button, .extensions_button, #nav_toggle_extensions',
    onExtensionMenuBtnClick,
  );

  // 全局统一监听 ESC 键关闭浮层与模态弹窗
  const onTavernKeyDown = (e: JQuery.KeyDownEvent) => {
    if (e.key === 'Escape' || e.keyCode === 27) {
      if (popoverState.value.visible) {
        closeActionPopover();
        e.stopPropagation();
      } else if (isModalOpen.value) {
        closeModal();
        e.stopPropagation();
      }
    }
  };
  $(tavernDocument).on('keydown', onTavernKeyDown);

  // 桌面端双击助手正文快捷唤起操作菜单 (仅在桌面指针/支持hover与细指针环境触发，移动端避免误弹)
  const onDoubleClickText = function (this: HTMLElement, e: JQuery.DoubleClickEvent) {
    const isDesktopPointer =
      typeof tavernWindow?.matchMedia === 'function'
        ? tavernWindow.matchMedia('(hover: hover) and (pointer: fine)').matches
        : (tavernWindow?.innerWidth ?? window.innerWidth) > 600;
    if (!isDesktopPointer) return;

    const store = useStoryImageSettingsStore();
    if (!store.settings.enabled) return;
    if (!store.settings.behavior?.enableDoubleClick) return;
    if (!isRealChatActive()) return;

    const target = e.target as HTMLElement;
    if (!target) return;

    // 排除按钮、链接、输入框、媒体、代码块、已有插画槽位等
    if (
      $(target).closest(
        'button, a, input, textarea, select, img, video, audio, pre, code, .story-image-slot, [data-story-image-slot], .extraMesButtons, .mes_buttons, .story-image-quick-btn',
      ).length > 0
    ) {
      return;
    }

    const $mes = $(this).closest('.mes');
    if (!$mes.length) return;

    if ($mes.attr('is_user') === 'true' || $mes.hasClass('is_user')) return;

    const mesIdStr = $mes.attr('mesid');
    if (mesIdStr === undefined || mesIdStr === '') return;
    const messageId = Number(mesIdStr);
    if (isNaN(messageId)) return;

    const swipeId = getMessageCurrentSwipeId(messageId);

    clearTavernSelection();

    e.preventDefault();
    e.stopPropagation();

    const stateHint = getSwipeState(messageId, swipeId);
    openActionPopover(messageId, swipeId, { x: e.clientX, y: e.clientY }, target, stateHint);
  };

  $(tavernDocument).on('dblclick', '#chat .mes .mes_text', onDoubleClickText);

  // 监听启用开关或快捷按钮开关变化
  settingsStore.$subscribe((_mutation, state) => {
    const nextEnabled = state.settings.enabled;
    const nextQuickBtn = state.settings.behavior?.enableQuickButton;

    if (nextEnabled !== previousEnabled) {
      previousEnabled = nextEnabled;
      (async () => {
        try {
          if (nextEnabled) {
            ensureExtensionMenuItem();
            ensureAllQuickButtons();
            await restoreExistingSlots();
            await autoPlanLatestAssistantIfNeeded();
          } else {
            cancelAllTasks();
            clearAllTaskNotifications();
            $(tavernDocument).find('[data-story-image-slot]').remove();
            $(tavernDocument).find('.story-image-quick-btn').remove();
            autoRepairedSlots.clear();
          }
        } catch (e) {
          console.error('[剧情生图] 启用开关切换异常:', e);
        }
      })();
    } else if (nextQuickBtn !== previousQuickBtn) {
      previousQuickBtn = nextQuickBtn;
      ensureAllQuickButtons();
    }
  });

  // 1. MESSAGE_RECEIVED: 若目标是助手楼层，按配置决定是否自动生成提示词
  eventOn(tavern_events.MESSAGE_RECEIVED, async messageId => {
    try {
      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      ensureQuickButton(messageId);

      if (!settingsStore.settings.behavior?.autoPlanEnabled) return;

      const messages = getChatMessages(messageId);
      const msg = messages[0];
      if (msg && msg.role === 'assistant' && !msg.is_hidden) {
        const swipeId = getMessageCurrentSwipeId(messageId);
        await triggerPlan(messageId, swipeId, false, 'follow-setting');
      }
    } catch (err) {
      console.error('[剧情生图] MESSAGE_RECEIVED 异常:', err);
    }
  });

  // 2. MESSAGE_SWIPED: 渲染该 Swipe；根据 autoPlanEnabled 决定是否自动生成提示词
  eventOn(tavern_events.MESSAGE_SWIPED, async messageId => {
    try {
      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      ensureQuickButton(messageId);

      const messages = getChatMessages(messageId);
      const msg = messages[0];
      if (msg && msg.role === 'assistant' && !msg.is_hidden) {
        const swipeId = getMessageCurrentSwipeId(messageId);
        // 清理当前消息下非当前 swipe 的残留 slot 节点
        $(tavernDocument)
          .find(`[data-story-image-slot^="${messageId}:"]`)
          .not(`[data-story-image-slot="${messageId}:${swipeId}"]`)
          .remove();

        const reconciled = await reconcileTransientState(messageId, swipeId);
        if (reconciled) {
          renderMessageSlot(messageId, swipeId, reconciled);
        } else if (settingsStore.settings.behavior?.autoPlanEnabled) {
          await triggerPlan(messageId, swipeId, false, 'follow-setting');
        }
      }
    } catch (err) {
      console.error('[剧情生图] MESSAGE_SWIPED 异常:', err);
    }
  });

  // 3. MESSAGE_EDITED: 比较正文标识；变化则执行失效流程并重新生成提示词
  eventOn(tavern_events.MESSAGE_EDITED, async messageId => {
    try {
      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      const messages = getChatMessages(messageId);
      const msg = messages[0];
      if (msg && msg.role === 'assistant' && !msg.is_hidden) {
        const swipeId = getMessageCurrentSwipeId(messageId);
        const text = getMessageText(messageId, swipeId);
        const newFingerprint = createSourceFingerprint(text);
        const state = getSwipeState(messageId, swipeId);

        if (!state || state.sourceFingerprint !== newFingerprint) {
          const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
          cancelTask(messageId, swipeId, currentChatId);
          autoRepairedSlots.delete(getAutoRepairKey(currentChatId, messageId, swipeId));
          await invalidateOnMessageEdited(messageId, swipeId, newFingerprint, currentChatId);
          await triggerPlan(messageId, swipeId, true);
        }
      }
    } catch (err) {
      console.error('[剧情生图] MESSAGE_EDITED 异常:', err);
    }
  });

  // 4. MESSAGE_UPDATED: 只在正文标识变化时处理，忽略仅写元数据导致的更新
  eventOn(tavern_events.MESSAGE_UPDATED, async messageId => {
    try {
      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      const messages = getChatMessages(messageId);
      const msg = messages[0];
      if (msg && msg.role === 'assistant' && !msg.is_hidden) {
        const swipeId = getMessageCurrentSwipeId(messageId);
        const text = getMessageText(messageId, swipeId);
        const newFingerprint = createSourceFingerprint(text);
        const state = getSwipeState(messageId, swipeId);

        if (state && state.sourceFingerprint !== newFingerprint) {
          const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
          cancelTask(messageId, swipeId, currentChatId);
          autoRepairedSlots.delete(getAutoRepairKey(currentChatId, messageId, swipeId));
          await invalidateOnMessageEdited(messageId, swipeId, newFingerprint, currentChatId);
          await triggerPlan(messageId, swipeId, true);
        }
      }
    } catch (err) {
      console.error('[剧情生图] MESSAGE_UPDATED 异常:', err);
    }
  });

  // 5. MESSAGE_SWIPE_DELETED: 取消任务、删除节点并重新对齐 swipe 键
  eventOn(tavern_events.MESSAGE_SWIPE_DELETED, async eventData => {
    try {
      const { messageId, swipeId, newSwipeId } = eventData;
      const currentChatId = SillyTavern.getCurrentChatId?.() || 'chat';
      cancelTasksForMessage(messageId, currentChatId);
      clearTaskNotification(currentChatId, messageId, swipeId);
      removeSlot(messageId, undefined, tavernDocument);

      for (const key of autoRepairedSlots.keys()) {
        if (key.startsWith(`${currentChatId}:${messageId}:`)) {
          autoRepairedSlots.delete(key);
        }
      }

      await handleSwipeDeleted(messageId, swipeId, currentChatId);

      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      ensureQuickButton(messageId);

      // 重新编号完成后，先协调新当前 Swipe 的暂态，再渲染
      const reconciled = await reconcileTransientState(messageId, newSwipeId);
      if (reconciled) {
        renderMessageSlot(messageId, newSwipeId, reconciled);
      } else if (settingsStore.settings.behavior?.autoPlanEnabled) {
        await triggerPlan(messageId, newSwipeId, false, 'follow-setting');
      }
    } catch (err) {
      console.error('[剧情生图] MESSAGE_SWIPE_DELETED 异常:', err);
    }
  });

  // 6. CHARACTER_MESSAGE_RENDERED: 渲染已有插画并注入快捷画图按钮
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, async messageId => {
    try {
      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      ensureQuickButton(messageId);

      const swipeId = getMessageCurrentSwipeId(messageId);
      const reconciled = await reconcileTransientState(messageId, swipeId);
      if (reconciled) {
        renderMessageSlot(messageId, swipeId, reconciled);
      }
    } catch (err) {
      console.error('[剧情生图] CHARACTER_MESSAGE_RENDERED 异常:', err);
    }
  });

  // 7. MORE_MESSAGES_LOADED: 恢复已保存楼层 UI 与按钮
  eventOn(tavern_events.MORE_MESSAGES_LOADED, async () => {
    try {
      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      ensureAllQuickButtons();
      await restoreExistingSlots();
    } catch (err) {
      console.error('[剧情生图] MORE_MESSAGES_LOADED 异常:', err);
    }
  });

  // 8. MESSAGE_DELETED: 取消当前聊天全部任务并清理节点，等待重新编号后协调与恢复
  eventOn(tavern_events.MESSAGE_DELETED, async () => {
    try {
      cancelAllTasks();
      clearAllTaskNotifications();
      $(tavernDocument).find('[data-story-image-slot]').remove();
      $(tavernDocument).find('.story-image-quick-btn').remove();
      autoRepairedSlots.clear();

      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      // 等待酒馆消息数组和 DOM 完成重新编号
      await new Promise(resolve => setTimeout(resolve, 50));

      ensureAllQuickButtons();
      await restoreExistingSlots();
      await autoPlanLatestAssistantIfNeeded();
    } catch (err) {
      console.error('[剧情生图] MESSAGE_DELETED 异常:', err);
    }
  });

  // 9. CHAT_CHANGED: 取消全部任务、清理节点与锁、恢复新聊天已有 UI
  eventOn(tavern_events.CHAT_CHANGED, async () => {
    try {
      cancelAllTasks();
      clearAllTaskNotifications();
      clearMessageLocks();
      autoRepairedSlots.clear();
      $(tavernDocument).find('[data-story-image-slot]').remove();
      $(tavernDocument).find('.story-image-quick-btn').remove();

      if (!settingsStore.settings.enabled) return;
      if (!isRealChatActive()) return;

      ensureAllQuickButtons();
      await restoreExistingSlots();
      await autoPlanLatestAssistantIfNeeded();
    } catch (err) {
      console.error('[剧情生图] CHAT_CHANGED 异常:', err);
    }
  });

  // 初始加载
  if (settingsStore.settings.enabled && isRealChatActive()) {
    ensureAllQuickButtons();
    void restoreExistingSlots()
      .then(() => autoPlanLatestAssistantIfNeeded())
      .catch(err => console.error('[剧情生图] 初始恢复异常:', err));
  }

  // 卸载处理
  $(window).on('pagehide', () => {
    if (menuObserver) {
      menuObserver.disconnect();
    }
    $(tavernDocument).off(
      'click',
      '#extensionsMenuButton, #extensions_button, .extensions_button, #nav_toggle_extensions',
      onExtensionMenuBtnClick,
    );
    $(tavernDocument).off('dblclick', '#chat .mes .mes_text', onDoubleClickText);
    $(tavernDocument).off('keydown', onTavernKeyDown);

    cancelAllTasks();
    clearAllTaskNotifications();
    clearMessageLocks();
    autoRepairedSlots.clear();
    $(tavernDocument).find('[data-story-image-slot]').remove();
    $(tavernDocument).find('.story-image-quick-btn').remove();
    $(tavernDocument).find(`#${EXTENSION_MENU_ITEM_ID}`).remove();

    app.unmount();
    $app.remove();
    destroy();
  });
});
