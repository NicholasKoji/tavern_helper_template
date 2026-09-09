import _ from 'lodash';
import type { CharacterMvuSettings, MvuTreeNode } from './types';

function getMvuApi(): typeof Mvu | undefined {
  // 独立脚本可能未注入本 iframe，但 MVU 已在酒馆父窗口初始化。
  try {
    if (typeof Mvu !== 'undefined' && typeof Mvu.getMvuData === 'function') return Mvu;
  } catch {
    /* not initialized */
  }
  try {
    const api = (window.parent as any).Mvu;
    if (typeof api?.getMvuData === 'function') return api;
  } catch {
    /* cross-origin */
  }
  return undefined;
}

export function safeCheckMvuAvailable(): boolean {
  return !!getMvuApi();
}

export function safeGetMvuData(messageId?: number | 'latest'): any | undefined {
  const id = messageId === undefined || messageId === 'latest' ? getLastMessageId() : messageId;
  if (id < 0) return undefined;
  try {
    const data = getMvuApi()?.getMvuData({ type: 'message', message_id: id });
    if (data?.stat_data && typeof data.stat_data === 'object') return data;
  } catch (e) {
    console.warn('[剧情生图] MVU 接口读取失败，尝试读取同楼层已保存变量:', e);
  }
  // MVU 的持久化数据就在楼层变量 stat_data 中；不读取 latest/其他楼层作为替代。
  try {
    return getVariables({ type: 'message', message_id: id });
  } catch (e) {
    console.warn('[剧情生图] 同楼层变量读取失败:', e);
    return undefined;
  }
}

export function getActiveCharacterKey(): string | undefined {
  try {
    const characterId = (SillyTavern as any)?.characterId;
    if (characterId !== undefined && characterId !== null && characterId !== '') {
      return (SillyTavern as any)?.characters?.[characterId]?.avatar || undefined;
    }
    const avatar = (SillyTavern as any)?.characters?.[characterId]?.avatar;
    if (avatar) return String(avatar);
  } catch {
    /* ignore */
  }
  return undefined;
}

export function getActiveCharacterName(): string {
  try {
    const characterId = (SillyTavern as any)?.characterId;
    const charObj = (SillyTavern as any)?.characters?.[characterId];
    if (charObj?.name) return charObj.name;
  } catch {
    /* ignore */
  }
  return '当前角色';
}

const STORAGE_KEY = 'story_image_mvu_v1';
const GLOBAL_STORAGE_KEY = 'story_image_char_mvu_map';

export function getCharacterMvuSettings(): CharacterMvuSettings {
  const defaultSettings: CharacterMvuSettings = {
    enabled: true,
    rules: [],
  };

  // 1. 优先尝试从当前角色卡变量读取
  try {
    const charVars = getVariables({ type: 'character' });
    if (charVars && typeof charVars === 'object' && charVars[STORAGE_KEY]) {
      const data = charVars[STORAGE_KEY];
      return {
        enabled: Boolean(data.enabled ?? true),
        rules: Array.isArray(data.rules)
          ? data.rules.map((r: any) => ({ ...r, path: normalizeMvuPath(String(r.path || '')) }))
          : [],
      };
    }
  } catch {
    /* 没有打开角色卡或角色变量不支持 */
  }

  // 2. 尝试从全局隔离映射中读取
  try {
    const charKey = getActiveCharacterKey();
    if (charKey) {
      const globalVars = getVariables({ type: 'global' });
      const map = globalVars?.[GLOBAL_STORAGE_KEY];
      if (map && typeof map === 'object' && map[charKey]) {
        return {
          enabled: Boolean(map[charKey].enabled ?? true),
          rules: Array.isArray(map[charKey].rules)
            ? map[charKey].rules.map((r: any) => ({ ...r, path: normalizeMvuPath(String(r.path || '')) }))
            : [],
        };
      }
    }
  } catch {
    /* ignore */
  }

  return defaultSettings;
}

export function saveCharacterMvuSettings(settings: CharacterMvuSettings): void {
  const payload: CharacterMvuSettings = {
    enabled: Boolean(settings.enabled),
    rules: Array.isArray(settings.rules)
      ? settings.rules.map(r => ({
          path: normalizeMvuPath(String(r.path || '').trim()),
          alias: r.alias ? String(r.alias).trim() : undefined,
          enabled: Boolean(r.enabled),
        }))
      : [],
  };

  // 1. 优先尝试写入当前角色卡变量
  try {
    updateVariablesWith(
      vars => {
        vars[STORAGE_KEY] = payload;
        return vars;
      },
      { type: 'character' },
    );
  } catch {
    /* 忽略角色变量写入错误 */
  }

  // 2. 同时写入全局角色映射作为兜底隔离存储
  try {
    const charKey = getActiveCharacterKey();
    if (charKey) {
      updateVariablesWith(
        vars => {
          if (!vars[GLOBAL_STORAGE_KEY] || typeof vars[GLOBAL_STORAGE_KEY] !== 'object') {
            vars[GLOBAL_STORAGE_KEY] = {};
          }
          vars[GLOBAL_STORAGE_KEY][charKey] = payload;
          return vars;
        },
        { type: 'global' },
      );
    }
  } catch {
    /* 忽略全局变量写入错误 */
  }
}

export function normalizeMvuPath(path: string): string {
  return path.startsWith('/')
    ? path
    : '/' +
        _.toPath(path)
          .map(part => part.replace(/~/g, '~0').replace(/\//g, '~1'))
          .join('/');
}
export function mvuPathSegments(path: string): string[] {
  return normalizeMvuPath(path)
    .slice(1)
    .split('/')
    .map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export function buildMvuTree(obj: Record<string, any>, prefix = ''): MvuTreeNode[] {
  if (!obj || typeof obj !== 'object') return [];
  const nodes: MvuTreeNode[] = [];

  const entries = Object.entries(obj);
  for (const [key, value] of entries) {
    const currentPath = `${prefix}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);

    if (isObject) {
      const children = buildMvuTree(value, currentPath);
      if (children.length === 0) {
        nodes.push({
          path: currentPath,
          key,
          valueText: '{}',
          isLeaf: true,
        });
      } else {
        nodes.push({
          path: currentPath,
          key,
          valueText: `{...} (${Object.keys(value).length}项)`,
          isLeaf: false,
          children,
        });
      }
    } else {
      let valStr: string;
      if (value === null) valStr = 'null';
      else if (value === undefined) valStr = 'undefined';
      else if (Array.isArray(value)) {
        valStr = `[${value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ')}]`;
      } else if (typeof value === 'object') {
        valStr = JSON.stringify(value);
      } else {
        valStr = String(value);
      }

      if (valStr.length > 50) {
        valStr = valStr.slice(0, 47) + '...';
      }

      nodes.push({
        path: currentPath,
        key,
        valueText: valStr,
        isLeaf: true,
      });
    }
  }
  return nodes;
}

export function extractSelectedMvuState(
  statData: any,
  settings: CharacterMvuSettings,
): Record<string, any> | undefined {
  if (!settings.enabled || !statData || typeof statData !== 'object') return undefined;
  const result: Record<string, any> = {};
  for (const rule of settings.rules.filter(r => r.enabled && r.path)) {
    const segments = mvuPathSegments(rule.path);
    if (segments.some(key => ['__proto__', 'prototype', 'constructor'].includes(key))) continue;
    const val = _.get(statData, segments);
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'object' && Object.keys(val).length === 0) continue;
    const alias = rule.alias?.trim();
    if (alias) segments[segments.length - 1] = alias;
    // 克隆值，避免父子规则重叠时通过 result 修改原始 MVU 对象。
    _.set(result, segments, _.cloneDeep(val));
  }
  return Object.keys(result).length ? result : undefined;
}

export function extractCharacterStateForMessage(messageId: number): Record<string, any> | undefined {
  return extractSelectedMvuState(safeGetMvuData(messageId)?.stat_data, getCharacterMvuSettings());
}

export async function waitForMessageMvu(messageId: number, swipeId: number, signal?: AbortSignal): Promise<void> {
  const settings = getCharacterMvuSettings();
  if (!settings.enabled || !settings.rules.some(r => r.enabled && r.path)) return;
  const chatId = SillyTavern.getCurrentChatId();
  const deadline = Date.now() + 5000;
  while (true) {
    if (signal?.aborted) throw new Error('任务已取消');
    if (
      SillyTavern.getCurrentChatId() !== chatId ||
      getChatMessages(messageId, { include_swipes: true })[0]?.swipe_id !== swipeId
    ) {
      throw new Error('聊天或 Swipe 已变化，请在目标楼层重新生成');
    }
    const data = safeGetMvuData(messageId)?.stat_data;
    const hasData = !!data && typeof data === 'object' && !Array.isArray(data);
    const analyzing = getMvuApi()?.isDuringExtraAnalysis?.() === true;
    if (hasData && !analyzing) return;
    if (Date.now() >= deadline) {
      throw new Error(
        analyzing
          ? `MVU 额外模型解析仍在运行（目标消息 ID ${messageId}，${hasData ? '已读到变量' : '尚无变量'}），请等待解析完成后重试`
          : `目标消息 ID ${messageId} 的 stat_data 尚未保存或读取失败（MVU 接口${getMvuApi() ? '可用' : '未注入'}）；未使用其他楼层状态`,
      );
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
