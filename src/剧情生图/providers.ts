import { referenceDataUrl, type ImageReference } from './reference-library';
import type { GeneratedImagePayload, StoryImageSettings } from './types';
import { getStylePreset } from './style-presets';

export type ReferencePromptMode = 'scene' | 'full-body-reference';

export type ImageGenerationRequestOptions = {
  referencePromptMode?: ReferencePromptMode;
};

export function buildGptPostReferenceInstruction(mode: ReferencePromptMode): string {
  if (mode === 'full-body-reference') {
    return `【全身参考图面部重绘协议｜最高优先级】
这是同一人物在另一个时间、另一种构图和光线下拍摄的全新全身照片，不是把输入照片的人脸直接延伸或粘贴到新身体上。

输入面部图只用于识别以下稳定身份特征：脸部轮廓、五官形状、五官相对间距、发际线和人物辨识度。

在调用生图工具前，先观察输入图中的四项旧拍摄状态：
1. 表情与面部肌肉状态；
2. 嘴唇开合与嘴角状态；
3. 视线方向；
4. 头部转向、倾斜与俯仰。

然后根据本次拍照方式与人物气质确定一个明确的新拍摄状态。新状态必须在上述四项中至少有三项与输入图明显不同，并把这些差异落实到生成结果。

整张脸必须在新状态下重新渲染，包括眉眼张力、眼睑开合、瞳孔方向、嘴角、唇部开合、面颊张力、头部姿态，以及新环境下的面部光影。保持人物身份，不保留输入图的拍摄瞬间。

验收标准：人物清楚地还是同一个人，但并非输入图中的同一拍摄瞬间；并排比较时，能够明显看出神态、嘴型、视线和头部姿态已经改变。`;
  }

  return `【剧情面部重绘协议｜最高优先级】
输入图片只负责稳定人物身份与身体比例，不代表当前剧情中的拍摄瞬间。

以当前剧情明确规定的表情、嘴型、视线、头部朝向和动作作为唯一动态目标。按照这个目标重新构建并渲染整张脸，包括眉眼肌肉、眼睑开合、瞳孔方向、嘴角、唇部开合、面颊张力、头部姿态，以及当前场景下的面部光影。

只有当当前剧情文字明确要求相同状态时，生成结果才可以与参考图呈现相似神态；不得仅因为输入图已有某种微笑、凝视或头部角度就继续沿用。

最终画面必须表现为同一个人物在当前剧情时刻的全新镜头，而不是把参考图的人脸状态复制到新场景中。`;
}

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
  references: ImageReference[] = [],
  options: ImageGenerationRequestOptions = {},
): Promise<GeneratedImagePayload> {
  const { endpoint, apiKey, model } = settings.provider;
  if (!endpoint.trim()) {
    throw new Error('未配置生图接口完整 URL');
  }

  const modelName = model.trim();
  if (!modelName) {
    throw new Error('未配置生图模型名称，请在设置中填写');
  }

  const content: any[] = [{ type: 'text', text: finalPrompt }];
  const styleSelection = settings.visual.styleByModel[settings.provider.modelAdaptation];
  const styleReference = getStylePreset(settings.provider.modelAdaptation, styleSelection.presetId)?.styleReference;
  if (styleReference)
    content.push(
      { type: 'text', text: styleReference.label },
      { type: 'image_url', image_url: { url: styleReference.imageUrl } },
    );
  for (const ref of references)
    content.push(
      { type: 'text', text: ref.label },
      { type: 'image_url', image_url: { url: await referenceDataUrl(ref.url, signal) } },
    );
  if (settings.provider.modelAdaptation === 'gpt-image' && references.length > 0) {
    content.push({
      type: 'text',
      text: buildGptPostReferenceInstruction(options.referencePromptMode ?? 'scene'),
    });
  }
  const body = {
    model: modelName,
    stream: false,
    // Antigravity 将 size 映射为 imageConfig.aspectRatio；只写在 prompt 中会回落到方图。
    size: resolveSize(settings),
    messages: [
      {
        role: 'user',
        content,
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
  references: ImageReference[] = [],
  options: ImageGenerationRequestOptions = {},
): Promise<GeneratedImagePayload> {
  const styleSelection = settings.visual.styleByModel[settings.provider.modelAdaptation];
  const hasStyleReference = Boolean(
    getStylePreset(settings.provider.modelAdaptation, styleSelection.presetId)?.styleReference,
  );
  if ((references.length > 0 || hasStyleReference) && settings.provider.protocol !== 'chat-completions') {
    const reason = hasStyleReference ? (references.length ? '画风参考图和角色参考图' : '画风参考图') : '角色参考图';
    throw new Error(`当前请求包含${reason}，请将生图协议切换为 Chat Completions，并使用支持图片输入的模型。`);
  }
  if (settings.provider.protocol === 'chat-completions') {
    return await callChatCompletions(finalPrompt, settings, signal, references, options);
  } else {
    return await callOpenAIImages(finalPrompt, settings, signal);
  }
}
