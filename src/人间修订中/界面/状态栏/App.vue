<template>
  <main class="status-shell" data-status-bar="human-revision-status-v2" :data-theme="themeId">
    <!-- 顶部卷宗台头 -->
    <TopHeader
      :editor-status="data.现实编辑器.状态"
      :editor-manifested="data.现实编辑器.是否显现"
      :active-theme="themeId"
      @open-rule-editor="openRuleEditor"
      @select-theme="setTheme"
    />

    <!-- 场景元信息栏 -->
    <MetaStrip
      :format-date="formatDate"
      :format-time="formatTime"
      :format-location="formatLocation"
      :summary="scene.摘要"
    />

    <!-- 3 页签视图切换导航 -->
    <TabNav v-model="activeTab" :tabs="tabs" />

    <!-- 主体内容卡片区域 -->
    <div class="status-content-area">
      <transition name="tab-fade" mode="out-in">
        <OverviewPanel
          v-if="activeTab === 'overview'"
          :data="data"
          :format-location="formatLocation"
          @open-rule-editor="openRuleEditor"
        />

        <ProtagonistPanel
          v-else-if="activeTab === 'protagonist'"
          :protagonist="data.主角"
        />

        <NpcPanel
          v-else-if="activeTab === 'npc'"
          :npc-entries="npcEntries"
          :selected-name="selectedNpcName"
          :selected-npc="selectedNpc"
          @select-npc="selectedNpcName = $event"
        />
      </transition>
    </div>

    <!-- 现实编辑器 · 规则修订弹窗 -->
    <RuleEditorModal
      v-if="ruleEditorOpen"
      v-model:ai-hint="aiHint"
      :rule-editor-state="ruleEditorState"
      :ai-busy="aiBusy"
      :ai-draft="aiDraft"
      :editor-error="editorError"
      :busy="busy"
      @close="closeRuleEditor"
      @suggest-rules="suggestRules"
      @add-rule-row="addRuleRow"
      @remove-rule-row="removeRuleRow"
      @confirm-rules="confirmRules"
    />

    <!-- 规则变动系统公告横幅 -->
    <SystemAnnouncement
      :announcement="announcement"
      @dismiss="announcement = null"
    />
  </main>
  <div class="sr-only" aria-live="polite">{{ announcer }}</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { BookOpen, User, Users } from '@lucide/vue';
import { useLocalStorage } from '@vueuse/core';
import themeArchiveFontUrl from '../世界配置/fonts/theme-archive.woff2?url';
import themeAstrolabeFontUrl from '../世界配置/fonts/theme-astrolabe.woff2?url';
import themeNeonFontUrl from '../世界配置/fonts/theme-neon.woff2?url';
import themeTerminalFontUrl from '../世界配置/fonts/theme-terminal.woff2?url';
import { onThemeChange, readSavedTheme, saveTheme, type ThemeId } from '../theme';
import { useDataStore } from './store';

// 子组件引入
import TopHeader from './components/TopHeader.vue';
import MetaStrip from './components/MetaStrip.vue';
import TabNav from './components/TabNav.vue';
import OverviewPanel from './components/OverviewPanel.vue';
import ProtagonistPanel from './components/ProtagonistPanel.vue';
import NpcPanel from './components/NpcPanel.vue';
import RuleEditorModal from './components/RuleEditorModal.vue';
import SystemAnnouncement from './components/SystemAnnouncement.vue';

type TabId = 'overview' | 'protagonist' | 'npc';
type RuleGroupKey = '世界规则' | '区域规则' | '个人规则';
type RuleRowDraft = { 对象: string; 名称: string; 内容: string; _ai?: boolean };
type RuleEditorState = Record<RuleGroupKey, RuleRowDraft[]>;
type RulePatchOp = { op: 'insert' | 'replace' | 'remove'; path: string; value?: string };
type AnnouncementItem = { 编号: string; 类型: '新增' | '修订' | '废止'; 名称: string; 内容: string; 范围: string };
type AiSystemDraft = { 主题: string; 说明: string; 对象: string };

const store = useDataStore();
const data = computed(() => store.data);
const scene = computed(() => data.value.当前场景);
const activeTab = useLocalStorage<TabId>('human-revision:status_tab', 'overview');
const selectedNpcName = useLocalStorage('human-revision:selected_npc', '');
const announcer = ref('');
const themeId = ref<ThemeId>(readSavedTheme());

const themeFontStyleId = 'human-revision-status-fonts';
let injectedThemeFontStyle: HTMLStyleElement | null = null;
let removeThemeListener: (() => void) | undefined;

function setTheme(theme: ThemeId) {
  themeId.value = theme;
  saveTheme(theme);
}

const npcEntries = computed(() => Object.entries(data.value.NPC序列 ?? {}));
const selectedNpc = computed(() => (selectedNpcName.value ? data.value.NPC序列[selectedNpcName.value] : undefined));

const tabs = computed(() => [
  { id: 'overview', label: '总览', icon: BookOpen },
  { id: 'protagonist', label: '主角', icon: User },
  { id: 'npc', label: 'NPC', icon: Users, badge: npcEntries.value.length },
]);

const formatDate = computed(() => {
  const date = scene.value.日期;
  if (date.年 == null && date.月 == null && date.日 == null) return '待生成';
  return `${date.年 ?? '--'}年${date.月 ?? '--'}月${date.日 ?? '--'}日`;
});

const formatTime = computed(() => {
  const time = scene.value.时间;
  if (time.时 == null && time.分 == null) return '待生成';
  const hour = time.时 == null ? '--' : String(time.时).padStart(2, '0');
  const minute = time.分 == null ? '--' : String(time.分).padStart(2, '0');
  return `${hour}:${minute}`;
});

const formatLocation = computed(() => {
  const place = scene.value.地点;
  const parts = [place.一级区域, place.二级区域, place.三级地点];
  if (parts.every(value => !value || value === '待生成')) return '待生成';
  return parts.map(value => (value && value !== '待生成' ? value : '待生成')).join(' / ');
});

watch(
  npcEntries,
  entries => {
    if (!entries.length) {
      selectedNpcName.value = '';
      return;
    }
    if (!selectedNpcName.value || !data.value.NPC序列[selectedNpcName.value]) {
      selectedNpcName.value = entries[0][0];
    }
  },
  { immediate: true },
);

// 规则修订模块状态
const ruleEditorOpen = ref(false);
const busy = ref(false);
const aiBusy = reactive<Record<RuleGroupKey, boolean>>({
  世界规则: false,
  区域规则: false,
  个人规则: false,
});
const aiHint = ref('');
const editorError = ref('');
const announcement = ref<{ items: AnnouncementItem[] } | null>(null);
const aiDraft = reactive<Record<RuleGroupKey, AiSystemDraft>>({
  世界规则: { 主题: '', 说明: '', 对象: '' },
  区域规则: { 主题: '', 说明: '', 对象: '' },
  个人规则: { 主题: '', 说明: '', 对象: '' },
});
let modSeq = 0;

const ruleEditorState = reactive<RuleEditorState>({
  世界规则: [],
  区域规则: [],
  个人规则: [],
});

function toScopedDrafts(record: Record<string, Record<string, string>>): RuleRowDraft[] {
  return Object.entries(record).flatMap(([target, rules]) =>
    Object.entries(rules).map(([名称, 内容]) => ({ 对象: target, 名称, 内容 })),
  );
}

function openRuleEditor() {
  editorError.value = '';
  aiDraft.世界规则 = { 主题: '', 说明: '', 对象: '' };
  aiDraft.区域规则 = { 主题: '', 说明: '', 对象: '' };
  aiDraft.个人规则 = { 主题: '', 说明: '', 对象: '' };
  const rules = data.value.生效规则;
  ruleEditorState.世界规则 = Object.entries(rules.世界规则 ?? {}).map(([名称, 内容]) => ({ 对象: '', 名称, 内容 }));
  ruleEditorState.区域规则 = toScopedDrafts(rules.区域规则 ?? {});
  ruleEditorState.个人规则 = toScopedDrafts(rules.个人规则 ?? {});
  ruleEditorOpen.value = true;
}

function closeRuleEditor() {
  if (busy.value) return;
  ruleEditorOpen.value = false;
  editorError.value = '';
}

function addRuleRow(groupKey: RuleGroupKey) {
  ruleEditorState[groupKey].push({ 对象: '', 名称: '', 内容: '' });
}

function removeRuleRow(groupKey: RuleGroupKey, index: number) {
  ruleEditorState[groupKey].splice(index, 1);
}

function assertSafePathSegment(value: string, label: string, errors: string[]) {
  if (/[/~.]/.test(value)) {
    errors.push(`${label}「${value}」不能包含 / ~ . 字符`);
  }
}

function buildRuleDiff(): { error?: string; ops: RulePatchOp[]; items: AnnouncementItem[] } {
  const rules = data.value.生效规则;
  const current = {
    世界规则: rules.世界规则 ?? {},
    区域规则: rules.区域规则 ?? {},
    个人规则: rules.个人规则 ?? {},
  };
  const ops: RulePatchOp[] = [];
  const items: AnnouncementItem[] = [];
  const errors: string[] = [];

  const worldNames = new Set<string>();
  for (const row of ruleEditorState.世界规则) {
    const name = row.名称.trim();
    if (!name) {
      errors.push('世界规则存在未命名的规则');
      continue;
    }
    assertSafePathSegment(name, '规则名', errors);
    if (worldNames.has(name)) {
      errors.push(`世界规则规则名重复：${name}`);
      continue;
    }
    worldNames.add(name);
    const content = row.内容.trim() || '已生效';
    const path = `/生效规则/世界规则/${name}`;
    if (current.世界规则[name] === undefined) {
      ops.push({ op: 'insert', path, value: content });
      items.push({ 编号: '', 类型: '新增', 名称: name, 内容: content, 范围: '整个世界' });
    } else if (current.世界规则[name] !== content) {
      ops.push({ op: 'replace', path, value: content });
      items.push({ 编号: '', 类型: '修订', 名称: name, 内容: content, 范围: '整个世界' });
    }
  }
  for (const name of Object.keys(current.世界规则)) {
    if (!worldNames.has(name)) {
      ops.push({ op: 'remove', path: `/生效规则/世界规则/${name}` });
      items.push({ 编号: '', 类型: '废止', 名称: name, 内容: '', 范围: '整个世界' });
    }
  }

  const handleScoped = (groupKey: '区域规则' | '个人规则') => {
    const scopeLabel = groupKey === '区域规则' ? '区域名' : '对象名';
    const seenKeys = new Set<string>();
    for (const row of ruleEditorState[groupKey]) {
      const target = row.对象?.trim() ?? '';
      const name = row.名称.trim();
      if (!target) {
        errors.push(`${groupKey}存在未填写${scopeLabel}的行`);
        continue;
      }
      if (!name) {
        errors.push(`${groupKey}「${target}」存在未命名的规则`);
        continue;
      }
      assertSafePathSegment(target, scopeLabel, errors);
      assertSafePathSegment(name, '规则名', errors);
      const mapKey = `${target}\u0000${name}`;
      if (seenKeys.has(mapKey)) {
        errors.push(`${groupKey}重复：${target} / ${name}`);
        continue;
      }
      seenKeys.add(mapKey);
      const content = row.内容.trim() || '已生效';
      const path = `/生效规则/${groupKey}/${target}/${name}`;
      const scopeText = groupKey === '区域规则' ? `指定区域（${target}）` : `指定对象（${target}）`;
      const oldContent = current[groupKey][target]?.[name];
      if (oldContent === undefined) {
        ops.push({ op: 'insert', path, value: content });
        items.push({ 编号: '', 类型: '新增', 名称: name, 内容: content, 范围: scopeText });
      } else if (oldContent !== content) {
        ops.push({ op: 'replace', path, value: content });
        items.push({ 编号: '', 类型: '修订', 名称: name, 内容: content, 范围: scopeText });
      }
    }
    for (const [target, ruleMap] of Object.entries(current[groupKey] ?? {})) {
      for (const name of Object.keys(ruleMap)) {
        if (!seenKeys.has(`${target}\u0000${name}`)) {
          ops.push({ op: 'remove', path: `/生效规则/${groupKey}/${target}/${name}` });
          items.push({
            编号: '',
            类型: '废止',
            名称: name,
            内容: '',
            范围: groupKey === '区域规则' ? `指定区域（${target}）` : `指定对象（${target}）`,
          });
        }
      }
    }
  };

  handleScoped('区域规则');
  handleScoped('个人规则');
  ops.push({ op: 'replace', path: '/现实编辑器/最近反馈', value: '规则修订已签发。' });

  if (errors.length) {
    return { error: errors.join('；') };
  }
  return { ops, items };
}

async function confirmRules() {
  if (busy.value) return;
  const { error, ops, items } = buildRuleDiff();
  if (error) {
    editorError.value = error;
    return;
  }
  if (!items.length) {
    editorError.value = '没有检测到任何规则变更';
    return;
  }

  busy.value = true;
  editorError.value = '';
  try {
    const patchMessage = `<UpdateVariable>\n<Analysis>现实编辑器持有者签发规则修订。</Analysis>\n<JSONPatch>\n${JSON.stringify(ops, null, 2)}\n</JSONPatch>\n</UpdateVariable>`;
    const oldData = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
    const newData = await Mvu.parseMessage(patchMessage, oldData);
    await Mvu.replaceMvuData(newData, { type: 'message', message_id: getCurrentMessageId() });

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    announcement.value = {
      items: items.map(item => ({
        ...item,
        编号: `MOD-${stamp}-${String(++modSeq).padStart(3, '0')}`,
      })),
    };
    ruleEditorOpen.value = false;
    window.setTimeout(() => {
      if (announcement.value) announcement.value = null;
    }, 12000);
  } catch (error) {
    console.error('[人间修订中·状态栏] 规则修订失败', error);
    toastr.error(error instanceof Error ? error.message : String(error), '现实编辑器报错');
  } finally {
    busy.value = false;
  }
}

function parseJsonLoose(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error('AI 返回的内容不是可解析的 JSON');
  }
}

function extractRecentStoryBodies(maxLayers = 3): string[] {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 0) return [];
  const assistantMessages = getChatMessages(`0-${lastMessageId}`, {
    role: 'assistant',
    hide_state: 'unhidden',
  });
  const bodies: string[] = [];
  for (let index = assistantMessages.length - 1; index >= 0 && bodies.length < maxLayers; index -= 1) {
    const match = assistantMessages[index].message.match(/<content>([\s\S]*?)<\/content>/i);
    const body = match?.[1]?.trim();
    if (body) bodies.push(body);
  }
  return bodies.reverse();
}

function buildWorldviewPrompt(groupKey: RuleGroupKey, hint: string): string {
  const sceneVal = data.value.当前场景;
  const protagonist = data.value.主角;
  const editor = data.value.现实编辑器;
  const recentBodies = extractRecentStoryBodies();
  const recentStory = recentBodies.length
    ? recentBodies.map((body, index) => `第 ${index + 1} 层：\n${body}`).join('\n\n')
    : '（暂无可用正文楼层）';
  const scopeRule =
    groupKey === '世界规则'
      ? '作用于整个世界与所有公共场景，不点名具体对象；体系应塑造整个社会的运转逻辑。'
      : groupKey === '区域规则'
        ? '必须绑定一个清晰空间边界（区域名，如建筑、房间、街区、场馆），只在该区域内生效；体系应解释该区域为何如此运转、与外界的关系、区域内人群的默认观念，以及离开区域后的边界。'
        : '必须绑定一个具体对象（角色或物品名），只影响该对象；体系应解释该对象的行为逻辑、自我认同、内在矛盾，以及外人视角下的怪异或正常。';
  const ruleCount = groupKey === '世界规则' ? '5~8 条' : '3~5 条';
  const scopeNameField = groupKey === '区域规则' ? '「区域名」' : groupKey === '个人规则' ? '「对象名」' : '';
  const formatJson =
    groupKey === '世界规则'
      ? '{"主题":"...","说明":"...","规则列表":[{"名称":"...","内容":"..."}]}'
      : groupKey === '区域规则'
        ? '{"主题":"...","说明":"...","区域名":"...","规则列表":[{"名称":"...","内容":"..."}]}'
        : '{"主题":"...","说明":"...","对象名":"...","规则列表":[{"名称":"...","内容":"..."}]}';
  return `你是「现实编辑器」的规则世界观起草引擎。玩家会通过状态栏把整套规则写入世界，并在下一轮剧情中立即显化。你的任务不是列点子，而是生成一套逻辑自洽、互相咬合、能产生叙事摩擦的规则体系。\n【目标类别】${groupKey}\n${hint ? `【玩家方向】${hint}` : '【玩家方向】未指定，请结合当前聊天 Chat Lore 中的固定世界设定自由发挥一个有吸引力的主题。'}\n\n【固定设定来源】\n世界、叙事与现实编辑器的固定机制以当前聊天 Chat Lore 为准；下列 MVU 只提供动态状态，不重复制造固定设定。\n【动态状态】\n- 当前地点：${sceneVal.地点.一级区域}/${sceneVal.地点.二级区域}/${sceneVal.地点.三级地点}\n- 当前摘要：${sceneVal.摘要}\n- 主角启用：${protagonist.启用 ? '是' : '否'}\n- 主角身份：${protagonist.基础信息.身份 || '未记录'}\n- 现实编辑器显现：${editor.是否显现 ? '是' : '否'}\n- 现实编辑器最近反馈：${editor.最近反馈 || '暂无'}\n【当前 MVU 变量快照】\n${JSON.stringify(data.value, null, 2)}\n【最近剧情正文（仅取 AI 回复中的 <content> 正文，按时间先后，最多三层）】\n${recentStory}\n【体系结构要求】\n一套${groupKey}体系必须按以下层次组织（每层至少覆盖一项，可合并但不得缺失逻辑环节）：\n1. 起因：打破常态的前提或危机（它制造什么问题）。\n2. 机制：社会或对象如何回应（制度、行为机制、习惯）。\n3. 伦理或常识配套：社会共识如何改写，让机制运转而不崩（区域：该地人群的默认观念；个人：该对象的自我说服或习惯）。\n4. 张力与摩擦：保留某样人性常态或矛盾，制造持续冲突。\n5. 日常纹理：一条恒定、可感知、被视为理所当然的规则，渗透进日常生活。\n6. 收束：边界、例外或后果，让体系闭环。\n\n【一致性自检】\n为每条规则依次回答：制造什么问题 / 解决什么问题 / 需要什么配套 / 产生什么摩擦。答不上来或与其它规则矛盾的，必须调整或删除。规则之间允许有因果链，禁止孤立堆砌。\n\n【作用域】\n${scopeRule}\n\n【尺度与文风】\n- 内容尺度服从当前聊天 Chat Lore 的固定设定与既有文风；不得凭空增加未签发的固定权限或限制。\n- 规则内容必须具体、可显现：落到动作、对白、身体反应、环境细节或社会惯例，禁止抽象口号。\n- 禁止出现“规则”“编辑器”“系统”等元叙述词；正文角色把它当作天然秩序。\n\n【输出】\n产出 ${ruleCount}${groupKey}，全部属于同一套体系；${scopeNameField ? `并在${scopeNameField}中填写统一作用范围。` : ''}每条「名称」2~12 字，「内容」一句话以内、明确无歧义。\n只输出 JSON，不要输出任何解释、Markdown 代码块或额外文本。格式：${formatJson}`;
}

function suggestionSchema(groupKey: RuleGroupKey) {
  const rootProperties: Record<string, unknown> = {
    主题: { type: 'string' },
    说明: { type: 'string' },
  };
  const rootRequired = ['主题', '说明', '规则列表'];
  if (groupKey === '区域规则') {
    rootProperties.区域名 = { type: 'string' };
    rootRequired.push('区域名');
  } else if (groupKey === '个人规则') {
    rootProperties.对象名 = { type: 'string' };
    rootRequired.push('对象名');
  }
  return {
    name: `rule_suggestions_${groupKey}`,
    description: `为${groupKey}起草规则体系建议`,
    value: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ...rootProperties,
        规则列表: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              名称: { type: 'string' },
              内容: { type: 'string' },
            },
            required: ['名称', '内容'],
          },
        },
      },
      required: rootRequired,
    },
  };
}

function extractGenerateText(
  result: string | { content?: string; tool_calls?: Array<{ arguments?: string; function?: { arguments?: string } }> },
): string {
  if (typeof result === 'string') return result;
  const calls = result?.tool_calls;
  if (Array.isArray(calls) && calls.length) {
    const args = calls[0]?.function?.arguments ?? calls[0]?.arguments ?? '';
    if (args) return args;
  }
  return result?.content ?? '';
}

async function suggestRules(groupKey: RuleGroupKey) {
  if (aiBusy[groupKey]) return;
  aiBusy[groupKey] = true;
  editorError.value = '';
  try {
    const hint = aiHint.value.trim();
    const prompt = buildWorldviewPrompt(groupKey, hint);
    let parsed: {
      主题?: string;
      说明?: string;
      区域名?: string;
      对象名?: string;
      规则列表?: Array<{ 名称?: string; 内容?: string }>;
    } | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt += 1) {
      try {
        const result = await generateRaw({
          user_input: hint || '按以上要求起草规则建议。',
          should_silence: true,
          generation_id: `human-revision-rule-suggest-${groupKey}-${Date.now()}-${attempt}`,
          ordered_prompts: [{ role: 'system', content: prompt }, 'user_input'],
          ...(attempt === 0 ? { json_schema: suggestionSchema(groupKey) } : {}),
        });
        const text = extractGenerateText(result);
        if (!text.trim()) {
          lastError = new Error('AI 返回为空');
          continue;
        }
        try {
          parsed = parseJsonLoose(text) as {
            主题?: string;
            说明?: string;
            区域名?: string;
            对象名?: string;
            规则列表?: Array<{ 名称?: string; 内容?: string }>;
          };
        } catch (error) {
          lastError = error;
        }
      } catch (error) {
        lastError = error;
      }
    }
    if (!parsed) {
      throw new Error(lastError instanceof Error ? lastError.message : String(lastError));
    }
    const list = Array.isArray(parsed?.规则列表) ? parsed.规则列表 : [];
    if (!list.length) throw new Error('AI 未返回可用的规则体系');
    const scopeName =
      groupKey === '世界规则'
        ? ''
        : (parsed.区域名 ?? parsed.对象名 ?? '').trim() || ruleEditorState[groupKey][0]?.对象?.trim() || '';
    if (groupKey !== '世界规则' && !scopeName) {
      throw new Error(groupKey === '区域规则' ? 'AI 未返回区域名' : 'AI 未返回对象名');
    }
    aiDraft[groupKey] = {
      主题: (parsed.主题 ?? '').trim() || `${groupKey}体系`,
      说明: (parsed.说明 ?? '').trim(),
      对象: scopeName,
    };
    let added = 0;
    for (const item of list) {
      const name = (item.名称 ?? '').trim();
      const content = (item.内容 ?? '').trim();
      if (!name || !content) continue;
      if (!ruleEditorOpen.value) return;
      if (groupKey === '世界规则') {
        ruleEditorState.世界规则.push({ 对象: '', 名称: name, 内容: content, _ai: true });
      } else {
        ruleEditorState[groupKey].push({ 对象: scopeName, 名称: name, 内容: content, _ai: true });
      }
      added += 1;
    }
    if (!added) throw new Error('AI 返回的规则缺少名称或内容');
    toastr.success(`已生成 ${added} 条${groupKey}草稿，请核对后确认`, '现实编辑器');
  } catch (error) {
    console.error('[人间修订中·状态栏] AI 起草失败', error);
    const message = error instanceof Error ? error.message : String(error);
    editorError.value = `起草失败：${message}`;
    toastr.error(message, '起草失败');
  } finally {
    aiBusy[groupKey] = false;
  }
}

onMounted(() => {
  removeThemeListener = onThemeChange(theme => (themeId.value = theme));
  if (!document.getElementById(themeFontStyleId)) {
    const style = document.createElement('style');
    style.id = themeFontStyleId;
    style.textContent = `
      @font-face { font-family: 'Theme Archive Preview'; src: url("${themeArchiveFontUrl}") format('woff2'); font-display: swap; }
      @font-face { font-family: 'Theme Astrolabe Preview'; src: url("${themeAstrolabeFontUrl}") format('woff2'); font-display: swap; }
      @font-face { font-family: 'Theme Terminal Preview'; src: url("${themeTerminalFontUrl}") format('woff2'); font-display: swap; }
      @font-face { font-family: 'Theme Neon Preview'; src: url("${themeNeonFontUrl}") format('woff2'); font-display: swap; }
    `;
    document.head.appendChild(style);
    injectedThemeFontStyle = style;
  }
});

onUnmounted(() => {
  removeThemeListener?.();
  injectedThemeFontStyle?.remove();
  injectedThemeFontStyle = null;
});
</script>

<style scoped>
.status-shell {
  position: relative;
  width: min(840px, 100%);
  margin: 0 auto;
  background: var(--paper-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.status-content-area {
  min-height: 200px;
  background: var(--paper-deep);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
