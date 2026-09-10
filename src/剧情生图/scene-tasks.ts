import { klona } from 'klona';
import { DEFAULT_PROVIDER_TIMEOUT_MS, useStoryImageSettingsStore } from './settings';
import {
  getSwipeState,
  updateSwipeState,
  createSourceFingerprint,
  getMessageText,
  getMessageCurrentSwipeId,
} from './message-state';
import { renderSlot } from './renderer';
import { assembleFinalPrompt } from './planner';
import { requestImageGeneration } from './providers';
import { selectCharacterReferences } from './reference-library';
import { uploadImageToTavern } from './storage';
import type { StoryImageSwipeState, SlotAction } from './types';

type Job = {
  chat: string;
  message: number;
  swipe: number;
  id: string;
  version: number;
  source: string;
  controller: AbortController;
};
const jobs = new Map<string, Job>();
let tail: Promise<unknown> = Promise.resolve();
const chatId = () => SillyTavern.getCurrentChatId?.() || 'chat';
const keyOf = (chat: string, message: number, swipe: number, id: string) => JSON.stringify([chat, message, swipe, id]);
const key = (job: Job) => keyOf(job.chat, job.message, job.swipe, job.id);

async function interruptible<T>(request: Promise<T>, signal: AbortSignal): Promise<T> {
  let abort = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    abort = () => reject(new Error('场景任务已取消'));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
  try {
    return await Promise.race([request, interrupted]);
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

function valid(job: Job) {
  if (job.chat !== chatId() || job.controller.signal.aborted || jobs.get(key(job)) !== job) return false;
  if (getMessageCurrentSwipeId(job.message) !== job.swipe) return false;
  const root = getSwipeState(job.message, job.swipe);
  return (
    root?.sourceFingerprint === job.source &&
    createSourceFingerprint(getMessageText(job.message, job.swipe)) === job.source &&
    root.scenes?.some(s => s.sceneId === job.id && s.operationVersion === job.version)
  );
}

async function change(job: Job, mutate: (s: StoryImageSwipeState) => StoryImageSwipeState, requireActive = true) {
  return updateSwipeState(
    job.message,
    job.swipe,
    root => {
      if (!root || (requireActive && !valid(job))) return root!;
      return {
        ...root,
        scenes: root.scenes?.map(s => (s.sceneId === job.id && s.operationVersion === job.version ? mutate(s) : s)),
      };
    },
    job.chat,
  );
}

export function renderScenes(message: number, swipe: number, root: StoryImageSwipeState) {
  // Remove old root-only placeholder without destroying other scenes' open editors.
  const doc = retrieveDisplayedMessage(message)?.[0]?.ownerDocument;
  if (doc) {
    const prefix = `${message}:${swipe}`;
    const wanted = new Set(root.scenes?.map(s => `${prefix}:${s.sceneId}`));
    doc.querySelectorAll<HTMLElement>('[data-story-image-slot]').forEach(el => {
      const id = el.dataset.storyImageSlot!;
      if ((id === prefix || id.startsWith(`${prefix}:`)) && !wanted.has(id)) el.remove();
    });
  }
  for (const scene of root.scenes ?? []) {
    renderSlot(message, swipe, scene, (action, payload) => {
      void sceneAction(message, swipe, scene.sceneId!, action, payload).catch(e =>
        toastr.error(String(e?.message ?? e), '场景操作失败'),
      );
    });
  }
}

async function sceneAction(message: number, swipe: number, id: string, action: SlotAction, payload?: string) {
  const chat = chatId();
  const root = getSwipeState(message, swipe);
  const scene = root?.scenes?.find(s => s.sceneId === id);
  if (!scene || (!useStoryImageSettingsStore().settings.enabled && action !== 'cancel')) return;
  if (action === 'anchor-resolved' && !scene.anchorWarning) return;
  if (action === 'anchor-failed' && scene.anchorWarning) return;
  if (['generate', 'retry-gen', 'regenerate'].includes(action)) {
    await enqueueScene(message, swipe, id, action === 'regenerate');
    return;
  }
  if (action === 'retry-plan') {
    toastr.info('请使用本楼快捷菜单重新规划场景；已有图片会保留在历史中');
    return;
  }
  if (action === 'save-prompt' && !payload?.trim()) return;
  const existing = jobs.get(keyOf(chat, message, swipe, id));
  if (existing && ['cancel', 'save-prompt'].includes(action)) {
    existing.controller.abort();
    jobs.delete(key(existing));
  }
  const job: Job = {
    chat,
    message,
    swipe,
    id,
    version: scene.operationVersion,
    source: scene.sourceFingerprint,
    controller: new AbortController(),
  };
  const next = await change(
    job,
    s => {
      if (action === 'cancel')
        return {
          ...s,
          status: s.currentImage ? 'ready' : 'planned',
          queued: false,
          operationVersion: s.operationVersion + 1,
          error: undefined,
        };
      if (action === 'anchor-resolved') return { ...s, anchorWarning: undefined };
      if (action === 'anchor-failed')
        return {
          ...s,
          anchorWarning:
            '该场景锚点暂未在显示正文中定位，先列在楼层末尾；不影响单独编辑或生图。重新规划本楼可更换锚点。',
        };
      if (action === 'save-prompt')
        return {
          ...s,
          scenePrompt: payload!.trim(),
          operationVersion: s.operationVersion + 1,
          promptEditedByUser: true,
          characterIds: [],
          referenceFraming: undefined,
          status: 'planned',
          queued: false,
          currentImage: undefined,
          history: [
            ...s.history,
            ...(s.currentImage ? [{ ...s.currentImage, collapsed: true, staleReason: 'prompt-edited' as const }] : []),
          ],
          error: undefined,
        };
      return s;
    },
    false,
  );
  if (next?.scenes) renderScenes(message, swipe, next);
}

async function enqueueScene(message: number, swipe: number, id: string, regenerate = false) {
  const chat = chatId();
  const root = getSwipeState(message, swipe);
  const scene = root?.scenes?.find(s => s.sceneId === id);
  if (!scene?.scenePrompt || jobs.has(keyOf(chat, message, swipe, id))) return;
  if (scene.currentImage && !regenerate) return;
  const job: Job = {
    chat,
    message,
    swipe,
    id,
    version: scene.operationVersion,
    source: scene.sourceFingerprint,
    controller: new AbortController(),
  };
  jobs.set(key(job), job);
  // Register with the queue before awaiting persistence, so enqueue order remains deterministic.
  const queued = change(job, s => ({ ...s, status: 'generating', queued: true, error: undefined }));
  const execute = async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      await queued;
      if (!valid(job)) return;
      const settings = klona(useStoryImageSettingsStore().settings);
      if (!settings.enabled) return;
      const active = await change(job, s => ({ ...s, queued: false }));
      if (active?.scenes) renderScenes(message, swipe, active);
      const current = active?.scenes?.find(s => s.sceneId === id);
      if (!current || !valid(job)) return;
      timer = setTimeout(
        () => {
          timedOut = true;
          job.controller.abort();
        },
        Math.max(5000, settings.provider.timeoutMs || DEFAULT_PROVIDER_TIMEOUT_MS),
      );
      const finalPrompt = assembleFinalPrompt(current.scenePrompt!, settings);
      const image = await interruptible(
        requestImageGeneration(
          finalPrompt,
          settings,
          job.controller.signal,
          selectCharacterReferences(current.characterIds ?? [], current.referenceFraming ?? 'full'),
        ),
        job.controller.signal,
      );
      if (!valid(job)) return;
      const stored = await interruptible(
        uploadImageToTavern(image, chat, message, swipe, finalPrompt, settings, job.controller.signal),
        job.controller.signal,
      );
      if (!valid(job)) return;
      const done = await change(job, s => ({
        ...s,
        status: 'ready',
        queued: false,
        currentImage: stored,
        history: [
          ...s.history,
          ...(s.currentImage ? [{ ...s.currentImage, collapsed: true, staleReason: 'regenerated' as const }] : []),
        ],
        error: undefined,
      }));
      if (done?.scenes) renderScenes(message, swipe, done);
    } catch (error) {
      if (job.chat !== chatId() || jobs.get(key(job)) !== job || (job.controller.signal.aborted && !timedOut)) return;
      const failed = await change(
        job,
        s => ({
          ...s,
          status: 'error',
          queued: false,
          error: {
            stage: 'generation',
            message: timedOut ? '该场景生图超时，可单独重试' : String(error instanceof Error ? error.message : error),
          },
        }),
        false,
      );
      if (failed?.scenes) renderScenes(message, swipe, failed);
    } finally {
      if (timer) clearTimeout(timer);
      if (jobs.get(key(job)) === job) jobs.delete(key(job));
    }
  };
  const result = tail.catch(() => {}).then(execute);
  tail = result.catch(error => console.error('[剧情生图] 场景队列错误', error));
  void queued
    .then(state => {
      if (state?.scenes && valid(job)) renderScenes(message, swipe, state);
    })
    .catch(() => {});
  return result;
}

export async function generateScenes(message: number, swipe: number, regenerate = false) {
  if (!useStoryImageSettingsStore().settings.enabled) return;
  const root = getSwipeState(message, swipe);
  await Promise.all((root?.scenes ?? []).map(scene => enqueueScene(message, swipe, scene.sceneId!, regenerate)));
}

export function cancelSceneJobs(message?: number, swipe?: number, chat?: string) {
  for (const [id, job] of jobs) {
    if (
      (message !== undefined && job.message !== message) ||
      (swipe !== undefined && job.swipe !== swipe) ||
      (chat && job.chat !== chat)
    )
      continue;
    job.controller.abort();
    jobs.delete(id);
  }
}

export async function recoverScenes(message: number, swipe: number) {
  const chat = chatId();
  const root = getSwipeState(message, swipe);
  if (!root?.scenes?.some(s => s.status === 'generating' && !jobs.has(keyOf(chat, message, swipe, s.sceneId!))))
    return root;
  return updateSwipeState(
    message,
    swipe,
    state => ({
      ...state!,
      scenes: state?.scenes?.map(s =>
        s.status === 'generating' && !jobs.has(keyOf(chat, message, swipe, s.sceneId!))
          ? { ...s, status: s.currentImage ? 'ready' : 'planned', queued: false }
          : s,
      ),
    }),
    chat,
  );
}
