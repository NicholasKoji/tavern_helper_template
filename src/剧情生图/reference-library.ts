export type CharacterReference = {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  outfitStyle: string;
  outfitStyleCustom: string;
  photoStyle: string;
  photoStyleCustom: string;
  face?: string;
  body?: string;
  bodyFace?: string;
};
export type ReferenceLibrary = { enabled: boolean; characters: CharacterReference[] };
export type ImageReference = { label: string; url: string };
const LEGACY_CHARACTER_KEY = 'story_image_reference_library_v1';
const GLOBAL_SETTINGS_KEY = 'story_image_v1';
const GLOBAL_LIBRARIES_KEY = 'referenceLibraries';

function emptyLibrary(): ReferenceLibrary {
  return { enabled: true, characters: [] };
}

function normalizeCharacterReference(value: Partial<CharacterReference>): CharacterReference {
  return {
    id: String(value.id ?? ''),
    name: String(value.name ?? ''),
    aliases: Array.isArray(value.aliases) ? value.aliases.map(String) : [],
    description: String(value.description ?? ''),
    outfitStyle: String(value.outfitStyle ?? 'follow-character'),
    outfitStyleCustom: String(value.outfitStyleCustom ?? ''),
    photoStyle: String(value.photoStyle ?? 'auto'),
    photoStyleCustom: String(value.photoStyleCustom ?? ''),
    ...(value.face ? { face: String(value.face) } : {}),
    ...(value.body ? { body: String(value.body) } : {}),
    ...(value.bodyFace ? { bodyFace: String(value.bodyFace) } : {}),
  };
}

function normalizeLibrary(value: Partial<ReferenceLibrary>): ReferenceLibrary {
  return {
    enabled: value.enabled !== false,
    characters: Array.isArray(value.characters) ? value.characters.map(normalizeCharacterReference) : [],
  };
}

export function referenceLibraryName(): string {
  try {
    if (typeof getCurrentCharacterName === 'function') {
      const name = getCurrentCharacterName();
      if (name?.trim()) return name.trim();
    }
  } catch {
    /* fall through to SillyTavern context */
  }
  const st = SillyTavern as any;
  const character = st.characters?.[st.characterId];
  return String(character?.data?.name ?? character?.name ?? st.name2 ?? '').trim();
}

export function normalizeReferenceLibraryName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function referenceLibraryKey(name = referenceLibraryName()): string {
  const normalized = normalizeReferenceLibraryName(name);
  return normalized ? `name:${normalized}` : '';
}

export function referenceOwner(): string {
  const st = SillyTavern as any;
  return String(st.characters?.[st.characterId]?.avatar ?? '');
}
export function loadReferenceLibrary(): ReferenceLibrary {
  const key = referenceLibraryKey();
  if (!key) return emptyLibrary();
  try {
    const globalVars = getVariables({ type: 'global' });
    const value = globalVars?.[GLOBAL_SETTINGS_KEY]?.[GLOBAL_LIBRARIES_KEY]?.[key];
    if (value && Array.isArray(value.characters)) return normalizeLibrary(JSON.parse(JSON.stringify(value)));
  } catch {
    /* fall through to legacy character storage */
  }

  // One-way, non-destructive migration. Keep the legacy card data as a fallback.
  try {
    const legacy = getVariables({ type: 'character' })[LEGACY_CHARACTER_KEY];
    if (legacy && Array.isArray(legacy.characters)) {
      const migrated = normalizeLibrary(JSON.parse(JSON.stringify(legacy)));
      saveReferenceLibrary(migrated, referenceOwner());
      return migrated;
    }
  } catch {
    /* no card or legacy data */
  }
  return emptyLibrary();
}
export function saveReferenceLibrary(value: ReferenceLibrary, owner: string) {
  if (!owner || owner !== referenceOwner()) throw new Error('角色卡已变化，未保存参考库');
  const name = referenceLibraryName();
  const key = referenceLibraryKey(name);
  if (!key) throw new Error('未取得当前角色卡名称，未保存参考库');
  const normalized = normalizeLibrary(JSON.parse(JSON.stringify(value)));
  updateVariablesWith(
    vars => {
      if (!vars || typeof vars !== 'object') vars = {};
      if (
        !vars[GLOBAL_SETTINGS_KEY] ||
        typeof vars[GLOBAL_SETTINGS_KEY] !== 'object' ||
        Array.isArray(vars[GLOBAL_SETTINGS_KEY])
      ) {
        vars[GLOBAL_SETTINGS_KEY] = {};
      }
      const root = vars[GLOBAL_SETTINGS_KEY];
      if (
        !root[GLOBAL_LIBRARIES_KEY] ||
        typeof root[GLOBAL_LIBRARIES_KEY] !== 'object' ||
        Array.isArray(root[GLOBAL_LIBRARIES_KEY])
      ) {
        root[GLOBAL_LIBRARIES_KEY] = {};
      }
      root[GLOBAL_LIBRARIES_KEY][key] = {
        displayName: name,
        ...normalized,
      };
      return vars;
    },
    { type: 'global' },
  );
}
export function referenceRoster() {
  const lib = loadReferenceLibrary();
  return lib.enabled
    ? lib.characters.map(({ id, name, aliases, description }) => ({ id, name, aliases, description }))
    : [];
}
export function selectCharacterReferences(
  ids: string[],
  framing: string,
  library = loadReferenceLibrary(),
): ImageReference[] {
  if (!library.enabled) return [];
  const result: ImageReference[] = [];
  for (const id of [...new Set(ids)]) {
    const c = library.characters.find(item => item.id === id);
    if (!c) continue;
    if (c.face)
      result.push({
        label:
          c.name +
          '（' +
          c.id +
          '）面部身份参考：保持脸型、五官关系与辨识度，不复制旧衣服、姿势、背景。女性特化可调整精致程度，但不重塑为另一张脸。',
        url: c.face,
      });
    if (framing !== 'portrait' && c.body && c.bodyFace === c.face)
      result.push({
        label: c.name + '（' + c.id + '）全身比例参考：姿态、服装与场景以当前描述为准；女性体型特化优先。',
        url: c.body,
      });
  }
  return result;
}
export async function referenceDataUrl(url: string, signal?: AbortSignal): Promise<string> {
  if (url.startsWith('data:image/')) return url;
  const base = new URL(window.parent.location.href);
  const target = new URL(url, base);
  if (target.origin !== base.origin) throw new Error('参考图必须存储在当前酒馆服务器');
  const response = await fetch(target.href, { signal });
  if (!response.ok) throw new Error('角色参考图读取失败 HTTP ' + response.status);
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) throw new Error('参考文件不是图片');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('参考图片读取失败'));
    reader.readAsDataURL(blob);
  });
}
