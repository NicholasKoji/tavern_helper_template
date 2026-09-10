import { z } from 'zod';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { klona } from 'klona';
import type { ModelAdaptation, ProviderProtocol, StoryImageSettings } from './types';
import { DEFAULT_STYLE_PRESET_IDS } from './style-presets';

export const DEFAULT_PROVIDER_TIMEOUT_MS = 10 * 60 * 1000;
const LEGACY_DEFAULT_PROVIDER_TIMEOUT_MS = 2 * 60 * 1000;

const LEGACY_STYLE_PRESET_IDS: Record<ModelAdaptation, Record<string, string>> = {
  'nano-banana': {
    A: 'anime-film-nano-banana',
    B1: 'action-webtoon-nano-banana',
    B2: 'refined-female-webtoon-nano-banana',
    F: 'douyin-beauty-nano-banana',
    G: 'luxury-beauty-nano-banana',
    H: 'cinematic-cg-nano-banana',
    I: 'beauty-enhanced-cg-nano-banana',
  },
  'gpt-image': {
    A: 'cinematic-anime-gpt-image',
    B1: 'action-illustration-gpt-image',
    B2: 'refined-character-webtoon-gpt-image',
    F: 'bright-fashion-photo-gpt-image',
    G: 'luxury-beauty-editorial-gpt-image',
    H: 'stylized-cinematic-cg-gpt-image',
    I: 'high-fidelity-digital-human-gpt-image',
  },
};

export function migrateLegacyStyleSelection(
  presetId: unknown,
  custom: unknown,
  adaptation: ModelAdaptation,
): { presetId: string; custom: string } {
  const legacyId = typeof presetId === 'string' ? presetId.trim() : '';
  const legacyCustom = typeof custom === 'string' ? custom.trim() : '';
  const mappedId = LEGACY_STYLE_PRESET_IDS[adaptation][legacyId];
  if (mappedId) return { presetId: mappedId, custom: legacyCustom };
  if (legacyId === 'custom' || legacyId === '自定义') return { presetId: 'custom', custom: legacyCustom };
  if (legacyId) {
    return {
      presetId: 'custom',
      custom: [legacyId, legacyCustom].filter(Boolean).join('\n'),
    };
  }
  return { presetId: DEFAULT_STYLE_PRESET_IDS[adaptation], custom: legacyCustom };
}

export function deriveEndpoints(
  inputUrl: string,
  protocol: ProviderProtocol,
): {
  baseUrl: string;
  endpoint: string;
  modelsEndpoint: string;
  detectedProtocol?: ProviderProtocol;
} {
  const trimmed = (inputUrl || '').trim();
  if (!trimmed) {
    return {
      baseUrl: '',
      endpoint: '',
      modelsEndpoint: '',
    };
  }

  let baseUrl = trimmed;
  let detectedProtocol: ProviderProtocol | undefined = undefined;

  if (/\/chat\/completions\/?$/i.test(trimmed)) {
    baseUrl = trimmed.replace(/\/chat\/completions\/?$/i, '');
    detectedProtocol = 'chat-completions';
  } else if (/\/images\/generations\/?$/i.test(trimmed)) {
    baseUrl = trimmed.replace(/\/images\/generations\/?$/i, '');
    detectedProtocol = 'openai-images';
  } else if (/\/models\/?$/i.test(trimmed)) {
    baseUrl = trimmed.replace(/\/models\/?$/i, '');
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  const effectiveProtocol = detectedProtocol || protocol;
  const endpoint = `${baseUrl}/${effectiveProtocol === 'chat-completions' ? 'chat/completions' : 'images/generations'}`;
  const modelsEndpoint = `${baseUrl}/models`;

  return {
    baseUrl,
    endpoint,
    modelsEndpoint,
    detectedProtocol,
  };
}

export function deriveChatEndpoints(inputUrl: string): {
  baseUrl: string;
  endpoint: string;
  modelsEndpoint: string;
} {
  const trimmed = (inputUrl || '').trim();
  if (!trimmed) {
    return {
      baseUrl: '',
      endpoint: '',
      modelsEndpoint: '',
    };
  }

  let baseUrl = trimmed;
  if (/\/chat\/completions\/?$/i.test(trimmed)) {
    baseUrl = trimmed.replace(/\/chat\/completions\/?$/i, '');
  } else if (/\/models\/?$/i.test(trimmed)) {
    baseUrl = trimmed.replace(/\/models\/?$/i, '');
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;
  const modelsEndpoint = `${baseUrl}/models`;

  return {
    baseUrl,
    endpoint,
    modelsEndpoint,
  };
}

export async function fetchModels(
  modelsUrl: string,
  apiKey: string,
): Promise<{ success: boolean; models?: string[]; error?: string }> {
  const url = modelsUrl.trim();
  if (!url) {
    return { success: false, error: '模型接口地址为空，请先填写基础服务地址' };
  }

  try {
    const headers: Record<string, string> = {};
    if (apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('请求超时（15秒）')), 15000);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const snippet = text.slice(0, 200).trim();
      return {
        success: false,
        error: `HTTP ${response.status}: ${snippet || response.statusText || '拉取模型失败'}`,
      };
    }

    const json = await response.json();
    const models: string[] = [];

    if (Array.isArray(json?.data)) {
      for (const item of json.data) {
        if (typeof item === 'string' && item.trim()) {
          models.push(item.trim());
        } else if (item && typeof item.id === 'string' && item.id.trim()) {
          models.push(item.id.trim());
        }
      }
    } else if (Array.isArray(json?.models)) {
      for (const item of json.models) {
        if (typeof item === 'string' && item.trim()) {
          models.push(item.trim());
        } else if (item && typeof item.id === 'string' && item.id.trim()) {
          models.push(item.id.trim());
        } else if (item && typeof item.name === 'string' && item.name.trim()) {
          models.push(item.name.trim());
        }
      }
    } else if (Array.isArray(json)) {
      for (const item of json) {
        if (typeof item === 'string' && item.trim()) {
          models.push(item.trim());
        } else if (item && typeof item.id === 'string' && item.id.trim()) {
          models.push(item.id.trim());
        }
      }
    }

    const unique = Array.from(new Set(models)).filter(Boolean).sort();
    if (unique.length === 0) {
      return {
        success: false,
        error: '成功接收响应，但未解析到可用模型列表',
      };
    }

    return {
      success: true,
      models: unique,
    };
  } catch (err: any) {
    return {
      success: false,
      error: String(err?.message ?? err),
    };
  }
}

export const StoryImageSettingsSchema = z
  .object({
    schemaVersion: z.coerce.number().int().prefault(3),
    enabled: z.boolean().prefault(true),

    planner: z
      .object({
        contextMessageCount: z.coerce.number().prefault(2),
        sceneCount: z.coerce.number().int().min(1).max(10).catch(1).prefault(1),
        connectionMode: z.enum(['follow-tavern', 'custom-openai']).prefault('follow-tavern'),
        baseUrl: z.string().prefault(''),
        endpoint: z.string().prefault(''),
        modelsEndpoint: z.string().prefault(''),
        apiKey: z.string().prefault(''),
        model: z.string().prefault(''),
        availableModels: z.array(z.string()).prefault([]),
        customEndpointOverride: z.boolean().prefault(false),
        timeoutMs: z.coerce.number().prefault(60000),
      })
      .prefault({}),

    provider: z
      .object({
        protocol: z.enum(['openai-images', 'chat-completions']).prefault('openai-images'),
        modelAdaptation: z
          .enum(['nano-banana', 'gpt-image'] satisfies [ModelAdaptation, ...ModelAdaptation[]])
          .prefault('nano-banana'),
        baseUrl: z.string().prefault(''),
        endpoint: z.string().prefault(''),
        modelsEndpoint: z.string().prefault(''),
        apiKey: z.string().prefault(''),
        model: z.string().prefault(''),
        availableModels: z.array(z.string()).prefault([]),
        customEndpointOverride: z.boolean().prefault(false),
        timeoutMs: z.coerce.number().prefault(DEFAULT_PROVIDER_TIMEOUT_MS),
      })
      .prefault({}),

    behavior: z
      .object({
        autoPlanEnabled: z.boolean().prefault(true),
        autoGenerateImageEnabled: z.boolean().prefault(false),
        enableDoubleClick: z.boolean().prefault(true),
        enableQuickButton: z.boolean().prefault(true),
      })
      .prefault({}),

    canvas: z
      .object({
        aspectRatioPreset: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', 'custom']).prefault('2:3'),
        customAspectRatio: z.string().prefault(''),
        sizePreset: z.enum(['1024x1024', '1024x1536', '1536x1024', 'custom']).prefault('1024x1536'),
        customSize: z.string().prefault(''),
      })
      .prefault({}),

    visual: z
      .object({
        characterSpecialization: z
          .enum(['none', 'slender', 'curvy', 'athletic', 'custom'])
          .catch('none')
          .prefault('none'),
        characterSpecializationEdits: z.record(z.string(), z.string()).prefault({}),
        maxVisiblePeople: z.coerce.number().int().min(1).catch(2).prefault(2),
        compositionPreset: z.string().prefault('根据剧情选择最能表达当前情节的镜头'),
        compositionCustom: z.string().prefault(''),
        styleByModel: z
          .object({
            'nano-banana': z
              .object({
                presetId: z.string().prefault(DEFAULT_STYLE_PRESET_IDS['nano-banana']),
                custom: z.string().prefault(''),
              })
              .prefault({}),
            'gpt-image': z
              .object({
                presetId: z.string().prefault(DEFAULT_STYLE_PRESET_IDS['gpt-image']),
                custom: z.string().prefault(''),
              })
              .prefault({}),
          })
          .prefault({}),
        lightingPreset: z.string().prefault('符合场景时间、环境和情绪的自然光线'),
        lightingCustom: z.string().prefault(''),
        qualityPreset: z.string().prefault('主体清晰，空间关系明确，细节完整'),
        qualityCustom: z.string().prefault(''),
        globalRequirements: z.string().prefault(''),
        avoidRequirements: z.string().prefault(''),
      })
      .prefault({}),
  })
  .prefault({});

const GLOBAL_SETTINGS_KEY = 'story_image_v1';

export function loadSettingsFromVariables(): StoryImageSettings {
  try {
    let raw: unknown = null;

    // 1. 优先从全局变量独立命名空间读取
    try {
      const globalVars = getVariables({ type: 'global' });
      if (globalVars && typeof globalVars === 'object' && (globalVars as any)[GLOBAL_SETTINGS_KEY]) {
        raw = (globalVars as any)[GLOBAL_SETTINGS_KEY]?.settings;
      }
    } catch (e) {
      console.warn('[剧情生图] 读取全局设置变量失败:', e);
    }

    // 2. 升级迁移：若全局命名空间为空，尝试从脚本变量读取旧配置并迁移
    if (!raw) {
      try {
        const scriptId = typeof getScriptId === 'function' ? getScriptId() : '';
        if (scriptId) {
          const scriptVars = getVariables({ type: 'script', script_id: scriptId });
          if (scriptVars && typeof scriptVars === 'object' && Object.keys(scriptVars).length > 0) {
            console.info('[剧情生图] 检测到旧版本脚本配置，自动迁移到全局命名空间 story_image_v1.settings');
            raw = scriptVars;
            saveSettingsToVariables(raw as any);
          }
        }
      } catch (e) {
        console.warn('[剧情生图] 迁移旧脚本配置失败:', e);
      }
    }

    const rawSchemaVersion =
      raw && typeof raw === 'object' && typeof (raw as any).schemaVersion === 'number' ? (raw as any).schemaVersion : 1;
    const parsed = StoryImageSettingsSchema.parse(raw ?? {});
    let migrated = false;

    // v2：将旧版默认的 2 分钟生图超时一次性迁移为 10 分钟；用户自定义的其他时长保持不变。
    if (rawSchemaVersion < 2) {
      if (parsed.provider.timeoutMs === LEGACY_DEFAULT_PROVIDER_TIMEOUT_MS) {
        parsed.provider.timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS;
      }
      parsed.schemaVersion = 2;
      migrated = true;
    }

    // v3：为不同生图模型保存完全独立的风格预设与自定义文本，并迁移旧版单一选择。
    if (rawSchemaVersion < 3) {
      const legacyAdaptation: ModelAdaptation =
        (raw as any)?.provider?.modelAdaptation === 'gpt-image' ? 'gpt-image' : 'nano-banana';
      const legacyVisual = (raw as any)?.visual;
      if (legacyVisual && ('stylePreset' in legacyVisual || 'styleCustom' in legacyVisual)) {
        parsed.visual.styleByModel[legacyAdaptation] = migrateLegacyStyleSelection(
          legacyVisual.stylePreset,
          legacyVisual.styleCustom,
          legacyAdaptation,
        );
      }
      parsed.schemaVersion = 3;
      migrated = true;
    }

    if (raw && migrated) saveSettingsToVariables(parsed);

    // Backward compatibility: If endpoint exists but baseUrl is empty, derive baseUrl
    if (parsed.provider.endpoint && !parsed.provider.baseUrl) {
      const derived = deriveEndpoints(parsed.provider.endpoint, parsed.provider.protocol);
      parsed.provider.baseUrl = derived.baseUrl;
      if (!parsed.provider.modelsEndpoint) {
        parsed.provider.modelsEndpoint = derived.modelsEndpoint;
      }
    }

    // Backward compatibility for planner: If endpoint exists but baseUrl is empty, derive baseUrl
    if (parsed.planner.endpoint && !parsed.planner.baseUrl) {
      const derived = deriveChatEndpoints(parsed.planner.endpoint);
      parsed.planner.baseUrl = derived.baseUrl;
      if (!parsed.planner.modelsEndpoint) {
        parsed.planner.modelsEndpoint = derived.modelsEndpoint;
      }
    }

    return parsed;
  } catch (error) {
    console.warn('[剧情生图] 加载设置失败，使用默认配置:', error);
    return StoryImageSettingsSchema.parse({});
  }
}

export function saveSettingsToVariables(settings: StoryImageSettings): void {
  try {
    const dataToSave = klona(settings);
    updateVariablesWith(
      variables => {
        if (!variables || typeof variables !== 'object') {
          variables = {};
        }
        if (!variables[GLOBAL_SETTINGS_KEY] || typeof variables[GLOBAL_SETTINGS_KEY] !== 'object') {
          variables[GLOBAL_SETTINGS_KEY] = {};
        }
        variables[GLOBAL_SETTINGS_KEY].settings = dataToSave;
        return variables;
      },
      { type: 'global' },
    );
  } catch (error) {
    console.error('[剧情生图] 保存设置到全局变量失败:', error);
  }
}

export const useStoryImageSettingsStore = defineStore('story_image_settings', () => {
  const settings = ref<StoryImageSettings>(loadSettingsFromVariables());
  const lastSavedAt = ref<number | null>(null);

  function reloadSettings(): StoryImageSettings {
    const latest = loadSettingsFromVariables();
    settings.value = latest;
    return latest;
  }

  function saveNow(): void {
    saveSettingsToVariables(settings.value);
    lastSavedAt.value = Date.now();
  }

  watch(
    settings,
    newVal => {
      saveSettingsToVariables(newVal);
      lastSavedAt.value = Date.now();
    },
    { deep: true },
  );

  return { settings, reloadSettings, saveNow, lastSavedAt };
});
