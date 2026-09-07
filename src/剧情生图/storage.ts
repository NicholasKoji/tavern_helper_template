import type { GeneratedImagePayload, StoredImage, StoryImageSettings } from './types';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('读取图片 Blob 失败'));
    reader.readAsDataURL(blob);
  });
}

function resolveFormatFromMime(mimeType: string): string {
  const sub = mimeType.split('/')[1]?.toLowerCase();
  if (sub === 'jpeg' || sub === 'jpg') return 'jpg';
  if (sub === 'png') return 'png';
  if (sub === 'webp') return 'webp';
  if (sub === 'gif') return 'gif';
  return 'png';
}

export async function uploadImageToTavern(
  payload: GeneratedImagePayload,
  chatId: string,
  messageId: number,
  swipeId: number,
  finalPrompt: string,
  settings: StoryImageSettings,
  cancelSignal?: AbortSignal,
  onStageChange?: (stage: 'download' | 'upload') => void,
): Promise<StoredImage> {
  let rawBase64: string;
  let mimeType: string;

  if (payload.kind === 'url') {
    onStageChange?.('download');
    let downloadRes: Response;
    try {
      downloadRes = await fetch(payload.url, { signal: cancelSignal });
    } catch (e: any) {
      if (cancelSignal?.aborted) {
        throw cancelSignal.reason ?? e;
      }
      throw new Error(`下载外部图片失败: ${e?.message ?? e}`, { cause: e });
    }
    if (!downloadRes.ok) {
      throw new Error(`下载外部图片失败 HTTP ${downloadRes.status}`);
    }
    const blob = await downloadRes.blob();
    mimeType = blob.type || 'image/png';
    rawBase64 = await blobToBase64(blob);
  } else {
    let base64 = payload.data;
    if (base64.startsWith('data:')) {
      const commaIdx = base64.indexOf(',');
      if (commaIdx >= 0) {
        base64 = base64.slice(commaIdx + 1);
      }
    }
    rawBase64 = base64;
    mimeType = payload.mimeType || 'image/png';
  }

  onStageChange?.('upload');
  const format = resolveFormatFromMime(mimeType);
  const cleanChatId = (chatId || 'chat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `story-image-${cleanChatId}-${messageId}-${swipeId}-${Date.now()}`;

  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const stHeaders = SillyTavern.getRequestHeaders?.();
    if (stHeaders) {
      headers = { ...headers, ...stHeaders };
    }
  } catch {
    /* ignore */
  }

  let response: Response;
  try {
    response = await fetch('/api/images/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: rawBase64,
        format,
        ch_name: 'story_image',
        filename,
      }),
      signal: cancelSignal,
    });
  } catch (e: any) {
    if (cancelSignal?.aborted) {
      throw cancelSignal.reason ?? e;
    }
    throw e;
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    const snippet = (errText || '').slice(0, 200).trim();
    throw new Error(`保存到酒馆服务器失败 HTTP ${response.status}: ${snippet || response.statusText}`);
  }

  const json = await response.json();
  const serverPath = json?.path || json?.name || json?.url;
  if (!serverPath || typeof serverPath !== 'string') {
    throw new Error('酒馆服务器上传成功但未返回有效路径');
  }

  const stored: StoredImage = {
    imageId: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    path: serverPath,
    mimeType,
    createdAt: Date.now(),
    finalPrompt,
    providerProtocol: settings.provider.protocol,
    model: settings.provider.model,
    collapsed: false,
  };

  return stored;
}
