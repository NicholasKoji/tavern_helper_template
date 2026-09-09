export type CharacterReference = {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  face?: string;
  body?: string;
  bodyFace?: string;
};
export type ReferenceLibrary = { enabled: boolean; characters: CharacterReference[] };
export type ImageReference = { label: string; url: string };
const KEY = 'story_image_reference_library_v1';
export function referenceOwner(): string {
  const st = SillyTavern as any;
  return String(st.characters?.[st.characterId]?.avatar ?? '');
}
export function loadReferenceLibrary(): ReferenceLibrary {
  try {
    const value = getVariables({ type: 'character' })[KEY];
    if (value && Array.isArray(value.characters)) return JSON.parse(JSON.stringify(value));
  } catch {
    /* no card */
  }
  return { enabled: true, characters: [] };
}
export function saveReferenceLibrary(value: ReferenceLibrary, owner: string) {
  if (!owner || owner !== referenceOwner()) throw new Error('角色卡已变化，未保存参考库');
  updateVariablesWith(
    vars => {
      vars[KEY] = JSON.parse(JSON.stringify(value));
      return vars;
    },
    { type: 'character' },
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
