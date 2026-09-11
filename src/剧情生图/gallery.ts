import type { StoryImageMessageData, StoryImageSwipeState } from './types';

export type GalleryKind = 'story' | 'reference' | 'other';
export type GalleryImage = {
  name: string;
  path: string;
  kind: GalleryKind;
  createdAt?: number;
  messageId?: number;
};

export function currentChatImages(messages: { message_id: number; extra: Record<string, any> }[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const message of messages) {
    const data = message.extra?.story_image_v1 as StoryImageMessageData | undefined;
    const visit = (state: StoryImageSwipeState) => {
      for (const image of [state.currentImage, ...(state.history ?? [])]) {
        if (image?.path) result.set(image.path.split('/').pop()!, message.message_id);
      }
      state.scenes?.forEach(visit);
    };
    if (data?.version === 1) Object.values(data.swipes ?? {}).forEach(visit);
  }
  return result;
}

/** Preserve the server's mtime-desc order, including legacy/unknown filenames. */
export function galleryFromFiles(files: string[], chatImages = new Map<string, number>()): GalleryImage[] {
  return [...new Set(files)].map(name => {
    const reference = name.startsWith('story-image-reference-library-');
    const timestamp = name.match(/-(\d{13})\.[^.]+$/)?.[1];
    return {
      name,
      path: `user/images/story_image/${encodeURIComponent(name)}`,
      kind: reference ? 'reference' : /^story-image-.+-\d+-\d+-\d{13}\.[^.]+$/.test(name) ? 'story' : 'other',
      createdAt: timestamp ? Number(timestamp) : undefined,
      messageId: chatImages.get(name),
    };
  });
}

export async function loadGallery(signal: AbortSignal): Promise<string[]> {
  const response = await fetch('/api/images/list', {
    method: 'POST',
    headers: { ...SillyTavern.getRequestHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'story_image', sortField: 'date', sortOrder: 'desc' }),
    signal,
  });
  if (!response.ok) throw new Error(`读取图库失败 HTTP ${response.status}`);
  const files: unknown = await response.json();
  if (!Array.isArray(files) || !files.every(file => typeof file === 'string')) {
    throw new Error('图库接口返回格式异常，请检查酒馆版本');
  }
  return files;
}
