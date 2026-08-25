import { z } from 'zod';
import type { OpeningFormSnapshot } from './opening';

export const OPENING_PLAN_SCHEMA_VERSION = 2 as const;
export const OPENING_PLAN_STORAGE_KEY = '人间修订中:开场配置方案库:v2';
export const LEGACY_OPENING_PLAN_STORAGE_KEY = '人间修订中:开场配置方案库:v1';
const MAX_PLANS = 100;
const MAX_TEXT_LENGTH = 4000;

const textField = z.string().max(MAX_TEXT_LENGTH);
const editorScope = z.enum(['世界', '区域', '个人']);
const dateYearField = z.string().regex(/^\d{0,4}$/, '年份只能包含 0-4 位数字');
const datePartField = z.string().regex(/^\d{0,2}$/, '月份和日期只能包含 0-2 位数字');
const clothingSchema = z
  .object({
    上装: textField,
    下装: textField,
    内衣: textField,
    袜子: textField,
    鞋子: textField,
    配饰: textField,
  })
  .strict();
const privateStatusSchema = z
  .record(
    z.string().max(80),
    z
      .object({
        外观描述: textField,
        当前状态: textField,
      })
      .strict(),
  )
  .refine(value => Object.keys(value).length <= 64, '动态部位数量不能超过 64 个');

const openingDateSchema = z.object({ 年: dateYearField, 月: datePartField, 日: datePartField }).strict();

const openingCharacterSchema = z
  .object({
    姓名: textField,
    性别: textField,
    年龄: textField,
    身高: textField,
    体型: textField,
    面容气质: textField,
    身体特征: textField,
    身份: textField,
    关系定位: textField,
    好感度: z.number().int().min(0).max(100),
    罩杯: textField,
    性格主色: textField,
    性格与声音: textField,
    穿着: clothingSchema,
    私密状态: privateStatusSchema,
  })
  .strict();

export const openingFormSnapshotSchema = z
  .object({
    让现实编辑器参与世界观生成: z.boolean(),
    故事起始日期: openingDateSchema,
    体验与叙事方向: z
      .object({
        故事体验: textField,
        主角处境: textField,
        冲突与成长: textField,
        叙事视角: textField,
        文风: textField,
      })
      .strict(),
    世界与故事骨架: z
      .object({
        世界规则: textField,
        时代与舞台: textField,
        社会后果: textField,
        核心矛盾与推进: textField,
      })
      .strict(),
    主角: z
      .object({
        启用: z.boolean(),
        性别: textField,
        年龄: textField,
        外貌: z
          .object({
            身高: textField,
            体型: textField,
            面容气质: textField,
            身体特征: textField,
          })
          .strict(),
        身份与位置: textField,
        追求: textField,
        性格主色: textField,
        性格与声音: textField,
        补充设定: textField,
        穿着: clothingSchema,
        私密状态: privateStatusSchema,
      })
      .strict(),
    重要角色: z.array(openingCharacterSchema).max(32),
    世界落地与开场准备: z
      .object({
        起始地点: textField,
        日常秩序: textField,
        组织势力: textField,
        必要规则: textField,
        当前矛盾与开场: textField,
      })
      .strict(),
    现实编辑器: z
      .object({
        表现形式: textField,
        可见与知晓: textField,
        可修改范围: z.array(editorScope).max(3),
        常识同步: textField,
        记忆保留: textField,
        主角受影响: textField,
        自主执行: textField,
        限制与代价: textField,
        自然语言修改: textField,
      })
      .strict(),
  })
  .strict();

const isoDate = z.string().refine(value => !Number.isNaN(Date.parse(value)), '必须是可解析的日期时间');

export const openingPlanSchema = z
  .object({
    schemaVersion: z.literal(OPENING_PLAN_SCHEMA_VERSION),
    id: z.string().min(1).max(128),
    名称: z.string().trim().min(1, '方案名称不能为空').max(80),
    createdAt: isoDate,
    updatedAt: isoDate,
    摘要: z.string().max(240),
    表单快照: openingFormSnapshotSchema,
  })
  .strict();

const openingPlanLibrarySchema = z
  .object({
    schemaVersion: z.literal(OPENING_PLAN_SCHEMA_VERSION),
    plans: z.array(openingPlanSchema).max(MAX_PLANS),
  })
  .strict();

export type OpeningPlan = z.infer<typeof openingPlanSchema>;
export type OpeningPlanLibrary = z.infer<typeof openingPlanLibrarySchema>;

type RecordLike = Record<string, unknown>;
type Migration = (value: RecordLike) => RecordLike;

function asText(value: unknown): string {
  return String(value ?? '').trim();
}

function emptyClothing() {
  return { 上装: '', 下装: '', 内衣: '', 袜子: '', 鞋子: '', 配饰: '无' };
}

function mergeLegacySupplement(protagonist: RecordLike): string {
  return [asText(protagonist.处境与压力), asText(protagonist.补充设定)].filter(Boolean).join('\n');
}

function migrateOpeningFormSnapshotV1(value: unknown): RecordLike {
  const source = asRecord(value, 'v1 表单快照');
  const oldProtagonist = asRecord(source.主角, 'v1 主角');
  const oldCharacters = Array.isArray(source.重要角色) ? source.重要角色 : [];
  return {
    让现实编辑器参与世界观生成: Boolean(source.让现实编辑器参与世界观生成),
    故事起始日期: { 年: '', 月: '', 日: '' },
    体验与叙事方向: source.体验与叙事方向 ?? {},
    世界与故事骨架: source.世界与故事骨架 ?? {},
    主角: {
      启用: Boolean(oldProtagonist.启用),
      性别: oldProtagonist.性别 ?? '',
      年龄: oldProtagonist.年龄 ?? '',
      外貌: oldProtagonist.外貌 ?? {},
      身份与位置: oldProtagonist.身份与位置 ?? '',
      追求: oldProtagonist.追求 ?? '',
      性格主色: '',
      性格与声音: oldProtagonist.性格与声音 ?? '',
      补充设定: mergeLegacySupplement(oldProtagonist),
      穿着: emptyClothing(),
      私密状态: {},
    },
    重要角色: oldCharacters.map(character => {
      const oldCharacter =
        character && typeof character === 'object' && !Array.isArray(character) ? (character as RecordLike) : {};
      return {
        姓名: oldCharacter.姓名 ?? '',
        性别: oldCharacter.性别 ?? '',
        年龄: oldCharacter.年龄 ?? '',
        身高: oldCharacter.身高 ?? '',
        体型: oldCharacter.体型 ?? '',
        面容气质: oldCharacter.面容气质 ?? '',
        身体特征: oldCharacter.身体特征 ?? '',
        身份: '',
        关系定位: oldCharacter.关系定位 ?? '',
        好感度: 0,
        罩杯: '不适用',
        性格主色: '',
        性格与声音: oldCharacter.性格与声音 ?? '',
        穿着: emptyClothing(),
        私密状态: {},
      };
    }),
    世界落地与开场准备: source.世界落地与开场准备 ?? {},
    现实编辑器: source.现实编辑器 ?? {},
  };
}

function migrateOpeningPlanV1(value: RecordLike): RecordLike {
  return {
    ...value,
    schemaVersion: OPENING_PLAN_SCHEMA_VERSION,
    表单快照: migrateOpeningFormSnapshotV1(value.表单快照),
  };
}

function asRecord(value: unknown, label: string): RecordLike {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label}必须是 JSON 对象`);
  return value as RecordLike;
}

/**
 * 所有方案版本迁移集中在这里。新增 schemaVersion 时只扩展这张表，
 * 不把旧字段兼容逻辑散落到 UI 或 localStorage 读写路径。
 */
const openingPlanMigrations: Record<number, Migration> = {
  1: migrateOpeningPlanV1,
};

const openingPlanLibraryMigrations: Record<number, Migration> = {
  1: value => ({
    ...value,
    schemaVersion: OPENING_PLAN_SCHEMA_VERSION,
    plans: (Array.isArray(value.plans) ? value.plans : []).map(plan => migrateOpeningPlanV1(asRecord(plan, 'v1 方案'))),
  }),
};

function migrateVersioned(value: unknown, label: string, migrations: Record<number, Migration>): RecordLike {
  let record = asRecord(value, label);
  let version = record.schemaVersion;
  if (typeof version !== 'number') throw new Error(`${label}缺少 schemaVersion`);
  if (version > OPENING_PLAN_SCHEMA_VERSION) throw new Error(`${label}的 schemaVersion=${version} 暂不支持`);
  while (version < OPENING_PLAN_SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) throw new Error(`${label}的 schemaVersion=${version} 暂不支持`);
    record = migrate(record);
    version = record.schemaVersion;
    if (typeof version !== 'number' || version <= 0) throw new Error(`${label}迁移后缺少有效 schemaVersion`);
  }
  return record;
}

export function migrateOpeningPlanPayload(value: unknown): unknown {
  return migrateVersioned(value, '方案文件', openingPlanMigrations);
}

export function migrateOpeningPlanLibraryPayload(value: unknown): unknown {
  return migrateVersioned(value, '方案库', openingPlanLibraryMigrations);
}

export function parseOpeningFormSnapshot(value: unknown): OpeningFormSnapshot {
  return openingFormSnapshotSchema.parse(value) as OpeningFormSnapshot;
}

export function parseOpeningPlan(value: unknown): OpeningPlan {
  return openingPlanSchema.parse(migrateOpeningPlanPayload(value));
}

export function parseOpeningPlanJson(json: string): OpeningPlan {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error('文件不是有效的 JSON');
  }
  return parseOpeningPlan(value);
}

export function serializeOpeningPlan(value: OpeningPlan): string {
  return JSON.stringify(parseOpeningPlan(value), null, 2);
}

export function normalizeOpeningPlanName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function findOpeningPlanByName(plans: readonly OpeningPlan[], name: string): OpeningPlan | undefined {
  const normalized = normalizeOpeningPlanName(name);
  return plans.find(plan => normalizeOpeningPlanName(plan.名称) === normalized);
}

export function findOpeningPlanById(plans: readonly OpeningPlan[], id: string): OpeningPlan | undefined {
  return plans.find(plan => plan.id === id);
}

function createOpeningPlanId(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  } catch {
    // 某些受限 iframe 只提供 localStorage，不提供 randomUUID，继续使用本地回退值。
  }
  return `opening-plan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createOpeningPlan(
  name: string,
  summary: string,
  snapshot: OpeningFormSnapshot,
  now = new Date(),
): OpeningPlan {
  const normalizedName = normalizeOpeningPlanName(name);
  const timestamp = now.toISOString();
  return parseOpeningPlan({
    schemaVersion: OPENING_PLAN_SCHEMA_VERSION,
    id: createOpeningPlanId(),
    名称: normalizedName,
    createdAt: timestamp,
    updatedAt: timestamp,
    摘要: summary.trim(),
    表单快照: parseOpeningFormSnapshot(snapshot),
  });
}

export function cloneOpeningPlanWithNewId(plan: OpeningPlan): OpeningPlan {
  return parseOpeningPlan({ ...plan, id: createOpeningPlanId() });
}

function getBrowserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function parseOpeningPlanLibraryPayload(value: unknown): OpeningPlan[] {
  const migrated = migrateOpeningPlanLibraryPayload(value);
  return openingPlanLibrarySchema.parse(migrated).plans;
}

function writeOpeningPlanLibraryPayload(storage: Storage, plans: readonly OpeningPlan[]): OpeningPlan[] {
  const validatedPlans = plans.map(parseOpeningPlan);
  const payload = openingPlanLibrarySchema.parse({
    schemaVersion: OPENING_PLAN_SCHEMA_VERSION,
    plans: validatedPlans,
  });
  storage.setItem(OPENING_PLAN_STORAGE_KEY, JSON.stringify(payload));
  return validatedPlans;
}

export function readOpeningPlans(storage: Storage | null = getBrowserStorage()): OpeningPlan[] {
  if (!storage) return [];
  const keys = [OPENING_PLAN_STORAGE_KEY, LEGACY_OPENING_PLAN_STORAGE_KEY];
  for (const key of keys) {
    const raw = storage.getItem(key);
    if (!raw) continue;
    try {
      const plans = parseOpeningPlanLibraryPayload(JSON.parse(raw));
      if (key !== OPENING_PLAN_STORAGE_KEY) {
        try {
          writeOpeningPlanLibraryPayload(storage, plans);
        } catch (error) {
          console.warn('[人间修订中·世界配置] v1 方案库迁移后写入 v2 失败，将继续使用已读取方案', error);
        }
      }
      return plans;
    } catch (error) {
      console.warn(`[人间修订中·世界配置] 本地方案库读取失败：${key}`, error);
    }
  }
  return [];
}

export function writeOpeningPlans(
  plans: readonly OpeningPlan[],
  storage: Storage | null = getBrowserStorage(),
): OpeningPlan[] {
  if (!storage) throw new Error('当前环境无法使用人间修订中的本地方案库');
  return writeOpeningPlanLibraryPayload(storage, plans);
}

export function formatOpeningPlanError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const firstIssues = error.issues.slice(0, 3).map(issue => {
      const path = issue.path.length ? issue.path.join('.') : '根对象';
      return `${path}：${issue.message}`;
    });
    return firstIssues.join('；');
  }
  return error instanceof Error ? error.message : String(error);
}
