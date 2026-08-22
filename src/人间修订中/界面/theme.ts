export const THEME_STORAGE_KEY = 'zaohua-world-config-theme';
export const THEME_CHANGE_EVENT = 'human-revision:theme-change';
export const DEFAULT_THEME_ID = 'archive';

export const themeOptions = [
  {
    id: 'archive',
    name: '官署卷宗',
    caption: '暖纸、黛墨与朱砂，像一份正在被认真受理的卷宗。',
    registry: 'WORLD REGISTRY · NO. 0047',
    seal: '受理',
  },
  {
    id: 'astrolabe',
    name: '命盘推演',
    caption: '墨蓝、铜金与米白微光，强调轨迹、关联与推演。',
    registry: 'FATE ORBIT · CALC. 0047',
    seal: '推演',
  },
  {
    id: 'terminal',
    name: '管理终端',
    caption: '骨白、碳黑与警示红，像一台克制的控制台。',
    registry: 'REALITY CONTROL · NODE. 0047',
    seal: '在线',
  },
  {
    id: 'neon',
    name: '霓虹夜城',
    caption: '深紫黑、电光青与霓虹粉，保留夜色中的清晰层级。',
    registry: 'NIGHT CITY // LINK 0047',
    seal: '接入',
  },
] as const;

export type ThemeId = (typeof themeOptions)[number]['id'];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return themeOptions.some(theme => theme.id === value);
}

export function readSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(saved) ? saved : DEFAULT_THEME_ID;
  } catch (error) {
    console.warn('[人间修订中] 主题偏好读取失败，将使用默认主题。', error);
    return DEFAULT_THEME_ID;
  }
}

export function saveTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('[人间修订中] 主题偏好保存失败，本次切换仍然有效。', error);
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}

export function onThemeChange(callback: (theme: ThemeId) => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY && isThemeId(event.newValue)) {
      callback(event.newValue);
    }
  };
  const handleCustom = (event: Event) => {
    const theme = (event as CustomEvent<unknown>).detail;
    if (typeof theme === 'string' && isThemeId(theme)) {
      callback(theme);
    }
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleCustom);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleCustom);
  };
}
