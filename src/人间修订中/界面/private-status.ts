export const FEMALE_PRIVATE_STATUS_PARTS = [
  '脸部',
  '口部',
  '手部',
  '乳房',
  '乳头',
  '小穴',
  '臀部',
  '肛门',
  '足部',
] as const;

export const MALE_PRIVATE_STATUS_PARTS = ['阴茎', '阴囊'] as const;

export type PrivateStatusGender = 'female' | 'male';

export function classifyPrivateStatusGender(value: unknown): PrivateStatusGender | null {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;

  const hasFemaleMarker = /女|雌/.test(normalized) || /\b(?:female|woman)\b/i.test(normalized);
  const hasMaleMarker = /男|雄/.test(normalized) || /\b(?:male|man)\b/i.test(normalized);
  if (hasFemaleMarker === hasMaleMarker) return null;
  return hasFemaleMarker ? 'female' : 'male';
}

export function privateStatusPartsForGender(value: unknown): readonly string[] | null {
  const gender = classifyPrivateStatusGender(value);
  if (gender === 'female') return FEMALE_PRIVATE_STATUS_PARTS;
  if (gender === 'male') return MALE_PRIVATE_STATUS_PARTS;
  return null;
}

export function sortPrivateStatusEntries<T>(status: Record<string, T>, gender: unknown): Array<[string, T]> {
  const genderParts = privateStatusPartsForGender(gender);
  const preferredParts = genderParts ?? [...FEMALE_PRIVATE_STATUS_PARTS, ...MALE_PRIVATE_STATUS_PARTS];
  const rank = new Map(preferredParts.map((part, index) => [part, index]));

  return Object.entries(status).sort(([left], [right]) => {
    const leftRank = rank.get(left);
    const rightRank = rank.get(right);
    if (leftRank !== undefined && rightRank !== undefined) return leftRank - rightRank;
    if (leftRank !== undefined) return -1;
    if (rightRank !== undefined) return 1;
    return 0;
  });
}
