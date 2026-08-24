export type EditorScope = '世界' | '区域' | '个人';

export type OpeningCharacterSnapshot = {
  姓名: string;
  性别: string;
  年龄: string;
  身高: string;
  体型: string;
  面容气质: string;
  身体特征: string;
  关系定位: string;
  欲望与压力: string;
  性格与声音: string;
  当前关联: string;
};

export type OpeningFormSnapshot = {
  让现实编辑器参与世界观生成: boolean;
  体验与叙事方向: {
    故事体验: string;
    主角处境: string;
    冲突与成长: string;
    叙事视角: string;
    文风: string;
  };
  世界与故事骨架: {
    世界规则: string;
    时代与舞台: string;
    社会后果: string;
    核心矛盾与推进: string;
  };
  主角: {
    启用: boolean;
    性别: string;
    年龄: string;
    外貌: {
      身高: string;
      体型: string;
      面容气质: string;
      身体特征: string;
    };
    身份与位置: string;
    追求: string;
    处境与压力: string;
    性格与声音: string;
    补充设定: string;
  };
  重要角色: OpeningCharacterSnapshot[];
  世界落地与开场准备: {
    起始地点: string;
    日常秩序: string;
    组织势力: string;
    必要规则: string;
    当前矛盾与开场: string;
  };
  现实编辑器: {
    表现形式: string;
    可见与知晓: string;
    可修改范围: EditorScope[];
    常识同步: string;
    记忆保留: string;
    主角受影响: string;
    自主执行: string;
    限制与代价: string;
    自然语言修改: string;
  };
};

export type ChatLoreKind = 'world' | 'editor';

export type ChatLoreSpec = {
  kind: ChatLoreKind;
  name: string;
  content: string;
};

export const CHAT_LORE_NAMES = {
  world: '人间修订中｜本会话世界与叙事设定',
  editor: '人间修订中｜本会话现实编辑器设定',
} as const;

export type JsonPatchOperation = {
  op: 'replace';
  path: '/当前场景' | '/主角' | '/NPC序列' | '/现实编辑器' | '/生效规则';
  value: Record<string, unknown>;
};

export type OpeningPatchOptions = {
  protagonistName?: string;
};

/**
 * 当前产品没有“关闭现实编辑器”的独立选项。顶部复选框只决定世界观生成是否融合编辑器，
 * 签发后的编辑器 Chat Lore 与 MVU 状态始终生效。
 */
export const REALITY_EDITOR_ENABLED = true;

const text = (value: unknown, fallback = '未填写'): string => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};

const optionalText = (value: unknown): string => String(value ?? '').trim();

function list(value: unknown, fallback = '未填写'): string {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.map(item => text(item)).join('、');
}

function section(title: string, rows: Array<[string, unknown]>): string {
  return [`## ${title}`, ...rows.map(([label, value]) => `- ${label}：${text(value)}`)].join('\n');
}

export function shouldIncludeRealityEditorInWorldGeneration(snapshot: OpeningFormSnapshot): boolean {
  return snapshot.让现实编辑器参与世界观生成;
}

export function buildWorldChatLoreContent(snapshot: OpeningFormSnapshot): string {
  const narrative = snapshot.体验与叙事方向;
  const world = snapshot.世界与故事骨架;
  const grounding = snapshot.世界落地与开场准备;
  const worldRows: Array<[string, unknown]> = [
    ['世界规则', world.世界规则],
    ['时代与舞台', world.时代与舞台],
    ['社会后果', world.社会后果],
    ['核心矛盾与推进', world.核心矛盾与推进],
  ];
  if (shouldIncludeRealityEditorInWorldGeneration(snapshot)) {
    worldRows.push(['现实编辑器参与世界观生成', '开启']);
  }
  return [
    '# 本会话世界与叙事设定',
    '本条是当前聊天的玩家签发设定。它与角色卡 Character Lore 叠加；本聊天的具体内容优先于通用默认补全。',
    section('叙事契约', [
      ['故事体验', narrative.故事体验],
      ['主角处境', narrative.主角处境],
      ['冲突与成长', narrative.冲突与成长],
      ['叙事视角', narrative.叙事视角],
      ['叙事文风', narrative.文风],
    ]),
    section('世界骨架', worldRows),
    section('开场落点', [
      ['起始地点', grounding.起始地点],
      ['日常秩序', grounding.日常秩序],
      ['组织与势力', grounding.组织势力],
      ['必要背景规则', grounding.必要规则],
      ['当前矛盾与开场', grounding.当前矛盾与开场],
    ]),
    '执行边界：不把本条重新解释成变量树；后续剧情遵循本条设定，并通过当前聊天的 MVU 动态状态表现变化。',
  ].join('\n\n');
}

export function buildEditorChatLoreContent(snapshot: OpeningFormSnapshot): string {
  const editor = snapshot.现实编辑器;
  return [
    '# 本会话现实编辑器设定',
    '本条只记录当前聊天的现实编辑器固定机制、可见边界、限制与玩家签发约定；运行中的显现状态和最近反馈只保存在 MVU 的 /现实编辑器。',
    section('出现与边界', [
      ['表现形式', editor.表现形式],
      ['可见、使用与知晓', editor.可见与知晓],
      ['可修改范围', list(editor.可修改范围)],
      ['常识同步', editor.常识同步],
      ['记忆保留', editor.记忆保留],
    ]),
    section('运行限制', [
      ['主角受影响', editor.主角受影响],
      ['自主执行', editor.自主执行],
      ['限制与代价', editor.限制与代价],
      ['自然语言修改', editor.自然语言修改],
    ]),
    '固定权限：玩家可以签发 /生效规则 中允许的世界、区域和个人规则；现实编辑器自身的权限与卸载边界不接受改写。',
  ].join('\n\n');
}

export function buildChatLoreSpecs(snapshot: OpeningFormSnapshot): ChatLoreSpec[] {
  return [
    { kind: 'world', name: CHAT_LORE_NAMES.world, content: buildWorldChatLoreContent(snapshot) },
    { kind: 'editor', name: CHAT_LORE_NAMES.editor, content: buildEditorChatLoreContent(snapshot) },
  ];
}

function parseAge(value: string): number {
  const normalized = optionalText(value);
  if (!/^\d{1,3}$/.test(normalized)) return -1;
  const age = Number(normalized);
  return age >= 0 && age <= 200 ? age : -1;
}

function splitLocation(value: string): { 一级区域: string; 二级区域: string; 三级地点: string } {
  const parts = optionalText(value)
    .split(/\s*(?:\/|／|>|＞|｜|·)\s*/)
    .map(item => item.trim())
    .filter(Boolean);
  if (parts.length >= 3) {
    return { 一级区域: parts[parts.length - 3], 二级区域: parts[parts.length - 2], 三级地点: parts[parts.length - 1] };
  }
  if (parts.length === 2) return { 一级区域: '待生成', 二级区域: parts[0], 三级地点: parts[1] };
  return { 一级区域: '待生成', 二级区域: '待生成', 三级地点: parts[0] ?? '待生成' };
}

function emptyClothing() {
  return { 上装: '', 下装: '', 内衣: '', 袜子: '', 鞋子: '', 配饰: '无' };
}

function buildProtagonistState(snapshot: OpeningFormSnapshot, options: OpeningPatchOptions): Record<string, unknown> {
  const protagonist = snapshot.主角;
  if (!protagonist.启用) {
    return {
      启用: false,
      基础信息: { 姓名: '', 性别: '', 年龄: -1, 身份: '', 目标: '', 与编辑器关系: '' },
      外貌: { 身高: '', 体型: '', 面容气质: '', 身体特征: '' },
      性格: { 底色: '', 主色调: '' },
      补充设定: '',
      当前状态: '',
      穿着: emptyClothing(),
      私密状态: {},
    };
  }
  const age = parseAge(protagonist.年龄);
  const ageStage = age === -1 && optionalText(protagonist.年龄) ? `年龄阶段：${optionalText(protagonist.年龄)}` : '';
  return {
    启用: true,
    基础信息: {
      姓名: optionalText(options.protagonistName),
      性别: optionalText(protagonist.性别),
      年龄: age,
      身份: optionalText(protagonist.身份与位置),
      目标: optionalText(protagonist.追求) || optionalText(snapshot.体验与叙事方向.主角处境),
      与编辑器关系: '按本会话现实编辑器设定进入',
    },
    外貌: {
      身高: optionalText(protagonist.外貌.身高),
      体型: optionalText(protagonist.外貌.体型),
      面容气质: optionalText(protagonist.外貌.面容气质),
      身体特征: optionalText(protagonist.外貌.身体特征),
    },
    性格: { 底色: optionalText(protagonist.性格与声音), 主色调: '' },
    补充设定: [
      optionalText(snapshot.体验与叙事方向.主角处境),
      optionalText(protagonist.处境与压力),
      optionalText(protagonist.补充设定),
      ageStage,
    ]
      .filter(Boolean)
      .join('\n'),
    当前状态: optionalText(protagonist.处境与压力) || optionalText(snapshot.体验与叙事方向.主角处境),
    穿着: emptyClothing(),
    私密状态: {},
  };
}

function buildNpcState(character: OpeningCharacterSnapshot): Record<string, unknown> {
  const age = parseAge(character.年龄);
  return {
    基础信息: {
      姓名: optionalText(character.姓名),
      性别: optionalText(character.性别),
      年龄: age,
      身份: optionalText(character.关系定位),
      关系定位: optionalText(character.当前关联) || optionalText(character.关系定位),
      好感度: 50,
    },
    外貌: {
      身高: optionalText(character.身高),
      罩杯: '不适用',
      体型: optionalText(character.体型),
      面容气质: optionalText(character.面容气质),
      身体特征: optionalText(character.身体特征),
    },
    性格: { 底色: optionalText(character.性格与声音), 主色调: '' },
    当前状态: optionalText(character.当前关联),
    穿着: emptyClothing(),
    当前想法: optionalText(character.欲望与压力),
    私密状态: {},
  };
}

export function buildOpeningState(
  snapshot: OpeningFormSnapshot,
  options: OpeningPatchOptions = {},
): Record<string, unknown> {
  const grounding = snapshot.世界落地与开场准备;
  return {
    当前场景: {
      地点: splitLocation(grounding.起始地点),
      日期: { 年: null, 月: null, 日: null },
      时间: { 时: null, 分: null },
      摘要: optionalText(grounding.当前矛盾与开场) || optionalText(snapshot.体验与叙事方向.故事体验),
    },
    主角: buildProtagonistState(snapshot, options),
    NPC序列: Object.fromEntries(
      snapshot.重要角色
        .filter(character => optionalText(character.姓名))
        .map(character => [optionalText(character.姓名), buildNpcState(character)]),
    ),
    现实编辑器: {
      是否显现: true,
      状态: '正常',
      最近反馈: '开场已签发，等待玩家提出第一项修改。',
    },
    生效规则: { 世界规则: {}, 区域规则: {}, 个人规则: {} },
  };
}

export function buildOpeningJsonPatch(
  snapshot: OpeningFormSnapshot,
  options: OpeningPatchOptions = {},
): JsonPatchOperation[] {
  const state = buildOpeningState(snapshot, options);
  return [
    { op: 'replace', path: '/当前场景', value: state.当前场景 as Record<string, unknown> },
    { op: 'replace', path: '/主角', value: state.主角 as Record<string, unknown> },
    { op: 'replace', path: '/NPC序列', value: state.NPC序列 as Record<string, unknown> },
    { op: 'replace', path: '/现实编辑器', value: state.现实编辑器 as Record<string, unknown> },
    { op: 'replace', path: '/生效规则', value: state.生效规则 as Record<string, unknown> },
  ];
}

export function buildOpeningUpdateVariable(snapshot: OpeningFormSnapshot, options: OpeningPatchOptions = {}): string {
  const patch = buildOpeningJsonPatch(snapshot, options);
  return [
    '<UpdateVariable>',
    '<Analysis>开场签发：写入当前场景、主角、NPC序列、现实编辑器动态状态和生效规则初值；现实编辑器保持生效。</Analysis>',
    '<JSONPatch>',
    JSON.stringify(patch, null, 2),
    '</JSONPatch>',
    '</UpdateVariable>',
  ].join('\n');
}

export function appendOpeningUpdateVariable(narrative: string, updateVariable: string): string {
  const cleanNarrative = narrative.replace(/<StatusPlaceHolderImpl\s*\/>/gi, '').trim();
  return `${cleanNarrative}\n\n${updateVariable.trim()}\n<StatusPlaceHolderImpl/>`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const OPENING_ROOTS = ['当前场景', '主角', 'NPC序列', '现实编辑器', '生效规则'] as const;

export function normalizeOpeningMvuData<T extends Record<string, any>>(oldData: T): T {
  const statData = oldData.stat_data ?? {};
  const legacyEditor = statData.现实编辑器 ?? {};
  return {
    ...clone(oldData),
    stat_data: {
      当前场景: statData.当前场景 ?? {},
      主角: statData.主角 ?? {},
      NPC序列: statData.NPC序列 ?? {},
      现实编辑器: legacyEditor,
      生效规则: statData.生效规则 ?? legacyEditor.生效规则 ?? {},
    },
  };
}

export function applyOpeningPatchToMvuData(oldData: Record<string, any>, finalMessage: string): Record<string, any> {
  const block = finalMessage.match(
    /<UpdateVariable>[\s\S]*?<JSONPatch>\s*([\s\S]*?)\s*<\/JSONPatch>[\s\S]*?<\/UpdateVariable>/i,
  );
  if (!block) throw new Error('缺少 UpdateVariable JSONPatch');
  const operations = JSON.parse(block[1]) as JsonPatchOperation[];
  const next = clone(oldData);
  next.stat_data ??= {};
  for (const root of Object.keys(next.stat_data)) {
    if (!(OPENING_ROOTS as readonly string[]).includes(root)) delete next.stat_data[root];
  }
  for (const operation of operations) {
    if (operation.op !== 'replace') throw new Error(`测试适配器不支持操作：${operation.op}`);
    const root = operation.path.slice(1);
    next.stat_data[root] = clone(operation.value);
  }
  return next;
}
