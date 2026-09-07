import type { GeneratedImagePayload, StoryImageSettings } from './types';
import { B2_STYLE_REFERENCE } from './style-reference';

function createHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = apiKey.trim();
  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
  }
  return headers;
}

export function resolveSize(settings: StoryImageSettings): string {
  if (settings.canvas.sizePreset === 'custom') {
    return settings.canvas.customSize.trim() || '1024x1536';
  }
  return settings.canvas.sizePreset.trim() || '1024x1536';
}

async function handleResponseError(response: Response): Promise<never> {
  const errText = await response.text().catch(() => response.statusText);
  const snippet = (errText || '').slice(0, 300).trim();
  throw new Error(`HTTP ${response.status}: ${snippet || response.statusText || '请求失败'}`);
}

async function callOpenAIImages(
  finalPrompt: string,
  settings: StoryImageSettings,
  signal?: AbortSignal,
): Promise<GeneratedImagePayload> {
  const { endpoint, apiKey, model } = settings.provider;
  if (!endpoint.trim()) {
    throw new Error('未配置生图接口完整 URL');
  }

  const modelName = model.trim();
  if (!modelName) {
    throw new Error('未配置生图模型名称，请在设置中填写');
  }

  const size = resolveSize(settings);
  const body: Record<string, any> = {
    model: modelName,
    prompt: finalPrompt,
    n: 1,
    size,
  };

  const response = await fetch(endpoint.trim(), {
    method: 'POST',
    headers: createHeaders(apiKey),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  const json = await response.json();
  const first = json?.data?.[0];
  if (!first) {
    throw new Error('OpenAI Images 响应中未包含 data 数组或图片');
  }

  if (first.b64_json && typeof first.b64_json === 'string') {
    return {
      kind: 'base64',
      data: first.b64_json.trim(),
      mimeType: 'image/png',
    };
  }

  if (first.url && typeof first.url === 'string') {
    return {
      kind: 'url',
      url: first.url.trim(),
    };
  }

  throw new Error('OpenAI Images 响应中未找到 b64_json 或 url');
}

export function extractSingleImagePayload(item: any): GeneratedImagePayload | null {
  if (!item) return null;

  // 1. 如果是字符串
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return null;

    // Data URL
    const dataUrlMatch = trimmed.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
    if (dataUrlMatch) {
      return {
        kind: 'base64',
        mimeType: dataUrlMatch[1],
        data: dataUrlMatch[2].trim(),
      };
    }

    // 单独的 HTTP(S) URL
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
      return { kind: 'url', url: trimmed };
    }

    // Markdown 图片语法 ![...](http...)
    const mdHttpMatch = trimmed.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    if (mdHttpMatch) {
      return { kind: 'url', url: mdHttpMatch[1] };
    }

    // Markdown 图片语法包含 data url: ![...](data:image/...)
    const mdDataMatch = trimmed.match(/!\[.*?\]\((data:image\/[a-zA-Z0-9+.-]+;base64,[^\s)]+)\)/);
    if (mdDataMatch) {
      const parsed = extractSingleImagePayload(mdDataMatch[1]);
      if (parsed) return parsed;
    }

    // 裸 Base64 字符串（长度足够且由合法 base64 字符组成）
    const cleanB64 = trimmed.replace(/\s+/g, '');
    if (cleanB64.length > 200 && /^[A-Za-z0-9+/=]+$/.test(cleanB64)) {
      return {
        kind: 'base64',
        data: cleanB64,
        mimeType: 'image/png',
      };
    }

    return null;
  }

  // 2. 如果是对象
  if (typeof item === 'object') {
    // { b64_json: string }
    if (typeof item.b64_json === 'string' && item.b64_json.trim()) {
      return {
        kind: 'base64',
        data: item.b64_json.trim(),
        mimeType: 'image/png',
      };
    }

    // { url: string }
    if (typeof item.url === 'string' && item.url.trim()) {
      const parsed = extractSingleImagePayload(item.url);
      if (parsed) return parsed;
    }

    // { image_url: string | { url: string } }
    if (item.image_url) {
      if (typeof item.image_url === 'string') {
        const parsed = extractSingleImagePayload(item.image_url);
        if (parsed) return parsed;
      } else if (typeof item.image_url === 'object' && item.image_url.url) {
        const parsed = extractSingleImagePayload(item.image_url.url);
        if (parsed) return parsed;
      }
    }

    // { type: "image_url", image_url: { url } }
    if (item.type === 'image_url') {
      if (item.image_url) {
        const parsed = extractSingleImagePayload(item.image_url);
        if (parsed) return parsed;
      }
      if (item.url) {
        const parsed = extractSingleImagePayload(item.url);
        if (parsed) return parsed;
      }
    }

    // { type: "image", source: { data: string, media_type?: string } }
    if (item.type === 'image' && item.source && typeof item.source.data === 'string') {
      return {
        kind: 'base64',
        data: item.source.data.trim(),
        mimeType: item.source.media_type || 'image/png',
      };
    }

    // { image: string | object }
    if (item.image) {
      const parsed = extractSingleImagePayload(item.image);
      if (parsed) return parsed;
    }
  }

  return null;
}

function extractImageFromMessage(message: any): GeneratedImagePayload | null {
  if (!message) return null;

  // 1. 检查 message.images 数组（广泛支持各种对象或字符串结构）
  if (Array.isArray(message.images) && message.images.length > 0) {
    for (const img of message.images) {
      const found = extractSingleImagePayload(img);
      if (found) return found;
    }
  }

  // 2. 检查 message.content 数组或字符串
  if (Array.isArray(message.content)) {
    for (const part of message.content) {
      const found = extractSingleImagePayload(part);
      if (found) return found;
    }
  } else if (typeof message.content === 'string') {
    const found = extractSingleImagePayload(message.content);
    if (found) return found;
  }

  return null;
}

async function callChatCompletions(
  finalPrompt: string,
  settings: StoryImageSettings,
  signal?: AbortSignal,
): Promise<GeneratedImagePayload> {
  const { endpoint, apiKey, model } = settings.provider;
  if (!endpoint.trim()) {
    throw new Error('未配置生图接口完整 URL');
  }

  const modelName = model.trim();
  if (!modelName) {
    throw new Error('未配置生图模型名称，请在设置中填写');
  }

  const body = {
    model: modelName,
    stream: false,
    // Antigravity 将 size 映射为 imageConfig.aspectRatio；只写在 prompt 中会回落到方图。
    size: resolveSize(settings),
    messages: [
      {
        role: 'user',
        content:
          settings.visual.stylePreset === 'B2'
            ? [
                { type: 'text', text: finalPrompt },
                { type: 'image_url', image_url: { url: B2_STYLE_REFERENCE } },
              ]
            : finalPrompt,
      },
    ],
  };

  const response = await fetch(endpoint.trim(), {
    method: 'POST',
    headers: createHeaders(apiKey),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    await handleResponseError(response);
  }

  const json = await response.json();
  const choice = json?.choices?.[0];
  const message = choice?.message;

  if (!message) {
    throw new Error('Chat Completions 响应中未包含有效 message');
  }

  const extracted = extractImageFromMessage(message);
  if (extracted) {
    return extracted;
  }

  // 若仅有普通文本，提取简要摘要报错
  let snippet = '';
  if (typeof message.content === 'string') {
    snippet = message.content.slice(0, 150).trim();
  }
  throw new Error(`未在模型响应中找到图片数据${snippet ? ': ' + snippet : ''}`);
}

export async function requestImageGeneration(
  finalPrompt: string,
  settings: StoryImageSettings,
  signal?: AbortSignal,
): Promise<GeneratedImagePayload> {
  if (settings.visual.stylePreset === 'B2' && settings.provider.protocol !== 'chat-completions') {
    throw new Error('B2 需要附带画风参考图，请将生图协议切换为 Chat Completions，并使用支持图片输入的模型。');
  }
  if (settings.provider.protocol === 'chat-completions') {
    return await callChatCompletions(finalPrompt, settings, signal);
  } else {
    return await callOpenAIImages(finalPrompt, settings, signal);
  }
}
