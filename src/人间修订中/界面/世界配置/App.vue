<template>
  <main class="dossier-app-shell" :data-theme="activeTheme" data-world-config="human-revision-opening-v3">
    <!-- 顶部卷宗台头 -->
    <HeaderBar
      v-model="form.让现实编辑器参与世界观生成"
      :active-theme="activeTheme"
      :active-theme-meta="activeThemeMeta"
      @select-theme="setTheme"
    />

    <!-- 5 层步骤指示轨 -->
    <StepNav
      :layers="layers"
      :current-layer="currentLayer"
      :max-visited-layer="maxVisitedLayer"
      @go-to-layer="goToLayer"
    />

    <!-- 双栏工作台主体 -->
    <div class="dossier-workspace">
      <!-- 左侧主表单区 -->
      <section class="dossier-form-column" role="region" :aria-label="currentLayerMeta.title">
        <OpeningPlanLibrary
          v-if="currentLayer === 0"
          :plans="openingPlans"
          :current-plan-id="currentPlanId"
          @apply="applyOpeningPlan"
          @apply-and-forward="applyOpeningPlanAndForward"
          @export="exportOpeningPlan"
          @delete="deleteOpeningPlan"
          @import="importOpeningPlan"
        />

        <transition name="layer-fade" mode="out-in">
          <LayerExperience
            v-if="currentLayerMeta.id === 'experience'"
            :form="form"
            :ai-busy-key="aiBusyKey"
            :pov-options="povOptions"
            :style-options="styleOptions"
            @assist="requestAi"
          />

          <LayerSkeleton
            v-else-if="currentLayerMeta.id === 'world'"
            :form="form"
            :ai-busy-key="aiBusyKey"
            @assist="requestAi"
          />

          <LayerCharacters
            v-else-if="currentLayerMeta.id === 'characters'"
            :form="form"
            :ai-busy-key="aiBusyKey"
            :protagonist-name="protagonistName"
            @assist-protagonist="requestProtagonistAi"
            @assist-character="requestCharacterAi"
            @assist-private-status="requestPrivateStatusAi"
            @clear-private-status="clearPrivateStatus"
            @add-character="addCharacter"
            @remove-character="removeCharacter"
          />

          <LayerLanding
            v-else-if="currentLayerMeta.id === 'grounding'"
            :form="form"
            :ai-busy-key="aiBusyKey"
            @assist="requestAi"
          />

          <LayerEditor
            v-else-if="currentLayerMeta.id === 'editor'"
            :form="form"
            :ai-busy-key="aiBusyKey"
            :editor-form-options="editorFormOptions"
            :editor-scopes="editorScopes"
            :editor-sync-options="editorSyncOptions"
            :editor-memory-options="editorMemoryOptions"
            :editor-autonomy-options="editorAutonomyOptions"
            :opening-generating="openingGenerating"
            :opening-preview="openingPreview"
            :opening-preview-stale="openingPreviewStale"
            :starting="starting"
            @assist="requestAi"
            @generate-opening="generateOpeningDraft('')"
            @generate-opening-with-note="generateOpeningDraft"
            @confirm-opening="confirmOpening"
          />
        </transition>

        <!-- 底部悬浮操作栏 -->
        <ActionFooter
          :current-layer="currentLayer"
          :is-last-layer="isLastLayer"
          :is-ai-busy="aiBusyKey"
          :status-message="status"
          :status-type="statusType"
          :current-plan-name="currentPlanName"
          :has-current-plan="hasCurrentPlan"
          @previous="goPreviousLayer"
          @next="goNextLayer"
          @complete-remaining="completeRemaining()"
          @save-new-plan="saveNewOpeningPlan"
          @update-current-plan="updateCurrentOpeningPlan"
          @save-as-plan="saveAsOpeningPlan"
        />
      </section>

      <!-- 右侧已录入卷宗简报（大屏固定/小屏折叠） -->
      <section class="dossier-summary-column" aria-label="已录入卷宗简报">
        <ConfirmedDrawer
          :context-rows="contextRows"
          :completed-count="completedLayerCount"
          :current-layer="currentLayer"
          @go-to-layer="goToLayer"
        />
      </section>
    </div>

    <!-- AI 建议弹窗预览浮层 -->
    <AiAssistModal
      v-if="aiPreview"
      :ai-preview="aiPreview"
      :is-stale="aiPreviewStale"
      :is-any-ai-busy="Boolean(aiBusyKey)"
      @close="closeAiPreview"
      @apply="applyAiPreview"
      @regenerate="regenerateAiPreview"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { BookOpen, Cpu, Feather, Globe, ListChecks, Sparkles, Stamp, UsersRound } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import themeArchiveFontUrl from './fonts/theme-archive.woff2?url';
import themeAstrolabeFontUrl from './fonts/theme-astrolabe.woff2?url';
import themeNeonFontUrl from './fonts/theme-neon.woff2?url';
import themeTerminalFontUrl from './fonts/theme-terminal.woff2?url';
import { onThemeChange, readSavedTheme, saveTheme, themeOptions, type ThemeId } from '../theme';
import { buildAuthorizationLayer, extractGenerateText, parseJsonLoose } from '../ai-helpers';
import { useDataStore } from './store';
import {
  appendOpeningUpdateVariable,
  buildOpeningUpdateVariable,
  isOpeningDateComplete,
  normalizeOpeningMvuData,
  type ClothingSnapshot,
  type OpeningDateSnapshot,
  type OpeningFormSnapshot,
  type PrivateStatusSnapshot,
} from './opening';
import {
  commitCurrentChatLore,
  rollbackChatLoreMutation,
  verifyChatLoreMutation,
  type ChatLoreMutation,
} from './chat-lore';
import {
  OPENING_PLAN_STORAGE_KEY,
  LEGACY_OPENING_PLAN_STORAGE_KEY,
  cloneOpeningPlanWithNewId,
  createOpeningPlan,
  findOpeningPlanById,
  findOpeningPlanByName,
  formatOpeningPlanError,
  normalizeOpeningPlanName,
  parseOpeningPlan,
  parseOpeningPlanJson,
  readOpeningPlans,
  serializeOpeningPlan,
  writeOpeningPlans,
  type OpeningPlan,
} from './opening-plans';

// 子组件导入
import HeaderBar from './components/HeaderBar.vue';
import StepNav from './components/StepNav.vue';
import LayerExperience from './components/LayerExperience.vue';
import LayerSkeleton from './components/LayerSkeleton.vue';
import LayerCharacters from './components/LayerCharacters.vue';
import LayerLanding from './components/LayerLanding.vue';
import LayerEditor from './components/LayerEditor.vue';
import AiAssistModal from './components/AiAssistModal.vue';
import ConfirmedDrawer from './components/ConfirmedDrawer.vue';
import ActionFooter from './components/ActionFooter.vue';
import OpeningPlanLibrary from './components/OpeningPlanLibrary.vue';
import { privateStatusPartsForGender } from '../private-status';

const HUMAN_REVISION_BUILD_MARKER = 'human-revision-world-config-v3';
const OPENING_READBACK_CHECKS = 8;

type LayerId = 'experience' | 'world' | 'characters' | 'grounding' | 'editor';
type StatusType = '' | 'working' | 'success' | 'error';
type EditorScope = '世界' | '区域' | '个人';
type AppearanceDraft = { 身高: string; 体型: string; 面容气质: string; 身体特征: string };
type ClothingDraft = ClothingSnapshot;
type PrivateStatusDraft = PrivateStatusSnapshot;

type CharacterDraft = {
  localId: string;
  姓名: string;
  性别: string;
  年龄: string;
  身高: string;
  体型: string;
  面容气质: string;
  身体特征: string;
  身份: string;
  关系定位: string;
  好感度: number;
  罩杯: string;
  性格主色: string;
  性格与声音: string;
  穿着: ClothingDraft;
  私密状态: PrivateStatusDraft;
};

type StoryForm = {
  让现实编辑器参与世界观生成: boolean;
  故事起始日期: OpeningDateSnapshot;
  体验与叙事方向: { 故事体验: string; 主角处境: string; 冲突与成长: string; 叙事视角: string; 文风: string };
  世界与故事骨架: { 世界规则: string; 时代与舞台: string; 社会后果: string; 核心矛盾与推进: string };
  主角: {
    启用: boolean;
    性别: string;
    年龄: string;
    外貌: AppearanceDraft;
    身份与位置: string;
    追求: string;
    性格主色: string;
    性格与声音: string;
    补充设定: string;
    穿着: ClothingDraft;
    私密状态: PrivateStatusDraft;
  };
  重要角色: CharacterDraft[];
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

type AiFieldDescriptor = {
  id: string;
  title: string;
  layer: LayerId;
  question: string;
  read: () => string;
  write: (value: string) => void;
  label?: string;
};

type AiPreview = {
  target: string;
  title: string;
  layer: LayerId;
  summary: string;
  rationale: string;
  constraints: string[];
  values: Record<string, string>;
  contextRevision: number;
  bulkAllowedKeys?: string[];
  kind?: 'fields' | 'private-status';
  privateStatusValues?: PrivateStatusDraft;
};

type AiPayload = { 结论?: string; 理由?: string; 可执行约束?: string[]; 可采用?: Record<string, string> };
type PrivateStatusAiPayload = {
  结论?: string;
  理由?: string;
  可执行约束?: string[];
  可采用?: { 私密状态?: Record<string, { 外观描述?: string; 当前状态?: string }> };
};
type PersonaSnapshot = { name?: unknown; description?: unknown };
type PersonaReader = (scope: 'current') => PersonaSnapshot | null | undefined;

const store = useDataStore();
const { data } = storeToRefs(store);
const themeIcons = { archive: Stamp, astrolabe: Sparkles, terminal: Cpu, neon: Globe } as const;
const activeTheme = ref<ThemeId>(readSavedTheme());
const activeThemeMeta = computed(() => {
  const theme = themeOptions.find(item => item.id === activeTheme.value) ?? themeOptions[0];
  return { ...theme, icon: themeIcons[theme.id] };
});

let removeThemeListener: (() => void) | undefined;
let injectedThemeFontStyle: HTMLStyleElement | null = null;

const layers = [
  {
    id: 'experience' as const,
    kicker: '第一层',
    order: '01',
    title: '体验与叙事方向',
    description: '先说你想经历的故事，再决定镜头如何靠近它。',
    icon: Feather,
  },
  {
    id: 'world' as const,
    kicker: '第二层',
    order: '02',
    title: '世界与故事骨架',
    description: '只留下会影响选择的世界事实，让舞台服务于故事。',
    icon: BookOpen,
  },
  {
    id: 'characters' as const,
    kicker: '第三层',
    order: '03',
    title: '主角与重要角色',
    description: '让角色拥有愿望、压力和能够改变场面的关系位置。',
    icon: UsersRound,
  },
  {
    id: 'grounding' as const,
    kicker: '第四层',
    order: '04',
    title: '世界落地与开场准备',
    description: '把前面的想法落成当前 RP 立刻会用到的生活与开场。',
    icon: ListChecks,
  },
  {
    id: 'editor' as const,
    kicker: '第五层',
    order: '05',
    title: '现实编辑器',
    description: '最后单独决定它如何出现、如何工作，以及边界在哪里。',
    icon: Cpu,
  },
] as const;

const povOptions = [
  { value: '第二人称', label: '第二人称「你」' },
  { value: '第三人称限定', label: '第三人称限定' },
  { value: '第三人称上帝', label: '第三人称全景' },
  { value: '第一人称玩家', label: '第一人称「我」' },
  { value: '第一人称角色', label: '第一人称角色' },
];

const styleOptions = [
  { value: '细腻写实', label: '细腻写实' },
  { value: '通用白描', label: '通用白描' },
  { value: '轻小说', label: '轻小说' },
  { value: '古风', label: '古风' },
  { value: '西幻', label: '西幻' },
  { value: '漫画分镜', label: '漫画分镜' },
];

const editorFormOptions = ['悬浮面板', '文字提示与弹窗', '绑定设备界面', '可感知的异常现象', '由 AI 结合前文整理'];
const editorSyncOptions = ['立即同步', '渐进同步', '只对受影响对象同步'];
const editorMemoryOptions = ['只有主角保留', '所有人保留', '只有编辑器保留', '修改前后都不保留'];
const editorAutonomyOptions = [
  { value: 'D-完全禁止', label: '不自主执行，只按玩家确认' },
  { value: 'A-完全随机', label: '可以自主执行，变化不设倾向' },
  { value: 'B-倾向色色', label: '可以自主执行，偏向亲密变化' },
  { value: 'C-不涉及物理', label: '可以自主执行，但避开物理层' },
  { value: 'E-玩家插件伪装', label: '只在外部触发时执行' },
];
const editorScopes: Array<{ value: EditorScope; label: string; description: string }> = [
  { value: '世界', label: '整个世界', description: '公共常识与世界层规则' },
  { value: '区域', label: '指定区域', description: '地点、建筑或局部空间' },
  { value: '个人', label: '指定个人', description: '角色或单一对象' },
];

function createClothing(): ClothingDraft {
  return { 上装: '', 下装: '', 内衣: '', 袜子: '', 鞋子: '', 配饰: '无' };
}

function createPrivateStatus(): PrivateStatusDraft {
  return {};
}

function createCharacter(): CharacterDraft {
  return {
    localId: `role-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    姓名: '',
    性别: '',
    年龄: '',
    身高: '',
    体型: '',
    面容气质: '',
    身体特征: '',
    身份: '',
    关系定位: '',
    好感度: 0,
    罩杯: '不适用',
    性格主色: '',
    性格与声音: '',
    穿着: createClothing(),
    私密状态: createPrivateStatus(),
  };
}

function createDefaultForm(): StoryForm {
  return {
    让现实编辑器参与世界观生成: false,
    故事起始日期: { 年: '', 月: '', 日: '' },
    体验与叙事方向: { 故事体验: '', 主角处境: '', 冲突与成长: '', 叙事视角: '第三人称限定', 文风: '通用白描' },
    世界与故事骨架: { 世界规则: '', 时代与舞台: '', 社会后果: '', 核心矛盾与推进: '' },
    主角: {
      启用: true,
      性别: '',
      年龄: '',
      外貌: { 身高: '', 体型: '', 面容气质: '', 身体特征: '' },
      身份与位置: '',
      追求: '',
      性格主色: '',
      性格与声音: '',
      补充设定: '',
      穿着: createClothing(),
      私密状态: createPrivateStatus(),
    },
    重要角色: [],
    世界落地与开场准备: { 起始地点: '', 日常秩序: '', 组织势力: '', 必要规则: '', 当前矛盾与开场: '' },
    现实编辑器: {
      表现形式: '由 AI 结合前文整理',
      可见与知晓: '',
      可修改范围: ['世界', '区域', '个人'],
      常识同步: '立即同步',
      记忆保留: '只有主角保留',
      主角受影响: '是',
      自主执行: 'D-完全禁止',
      限制与代价: '',
      自然语言修改: '',
    },
  };
}

const form = reactive<StoryForm>(createDefaultForm());
const currentLayer = ref(0);
const maxVisitedLayer = ref(0);
const contextRevision = ref(0);
const hydrated = ref(false);
const starting = ref(false);
const openingGenerating = ref(false);
const openingPreview = ref('');
const openingContextRevision = ref(0);
const status = ref('');
const statusType = ref<StatusType>('');
const aiBusyKey = ref('');
const aiPreview = ref<AiPreview | null>(null);

const currentLayerMeta = computed(() => layers[currentLayer.value] ?? layers[0]);
const isLastLayer = computed(() => currentLayer.value === layers.length - 1);
const protagonistName = ref('');
const protagonistDescription = ref('');
let removePersonaListener: (() => void) | undefined;

const openingPreviewStale = computed(
  () => Boolean(openingPreview.value) && openingContextRevision.value !== contextRevision.value,
);
const aiPreviewStale = computed(
  () => Boolean(aiPreview.value) && aiPreview.value?.contextRevision !== contextRevision.value,
);
const openingPlans = ref<OpeningPlan[]>([]);
const currentPlanId = ref<string | null>(null);
const currentPlan = computed(() =>
  currentPlanId.value ? findOpeningPlanById(openingPlans.value, currentPlanId.value) : undefined,
);
const currentPlanName = computed(() => currentPlan.value?.名称 ?? '');
const hasCurrentPlan = computed(() => Boolean(currentPlan.value));

function readCurrentPersona(): PersonaSnapshot {
  const getPersona = (globalThis as typeof globalThis & { getPersona?: PersonaReader }).getPersona;
  if (typeof getPersona !== 'function') return {};
  try {
    const value = getPersona('current');
    return value && typeof value === 'object' ? value : {};
  } catch (error) {
    console.warn('[人间修订中·世界配置] 读取当前人设失败', error);
    return {};
  }
}

function syncProtagonistPersona() {
  const persona = readCurrentPersona();
  const fallbackName = typeof SillyTavern === 'undefined' ? '' : String(SillyTavern.name1 ?? '').trim();
  protagonistName.value = trimValue(persona.name, fallbackName);
  protagonistDescription.value = trimValue(persona.description, '');
}

function listenForPersonaChanges() {
  if (typeof SillyTavern === 'undefined') return;
  const eventTypes = SillyTavern.eventTypes as typeof SillyTavern.eventTypes & { PERSONA_CHANGED?: string };
  const eventType = eventTypes.PERSONA_CHANGED ?? 'persona_changed';
  removePersonaListener = eventOn(eventType, syncProtagonistPersona).stop;
}

function trimValue(value: unknown, fallback = ''): string {
  const text = String(value ?? '').trim();
  return text === '待生成' || text === '待记录' || text === '暂无补充设定' ? fallback : text;
}

function draftAgeFromStored(value: unknown): string {
  const text = trimValue(value);
  return text === '-1' ? '' : text;
}

function draftDatePartFromStored(value: unknown): string {
  const text = trimValue(value);
  return /^\d+$/.test(text) ? text : '';
}

function hydrateClothing(value: Partial<ClothingDraft> | null | undefined): ClothingDraft {
  return {
    上装: trimValue(value?.上装, ''),
    下装: trimValue(value?.下装, ''),
    内衣: trimValue(value?.内衣, ''),
    袜子: trimValue(value?.袜子, ''),
    鞋子: trimValue(value?.鞋子, ''),
    配饰: trimValue(value?.配饰, '') || '无',
  };
}

function hydratePrivateStatus(value: unknown): PrivateStatusDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([part, detail]) => {
        if (!part.trim() || !detail || typeof detail !== 'object' || Array.isArray(detail)) return null;
        const item = detail as Record<string, unknown>;
        return [
          part.trim(),
          { 外观描述: trimValue(item.外观描述, ''), 当前状态: trimValue(item.当前状态, '') },
        ] as const;
      })
      .filter((entry): entry is readonly [string, { 外观描述: string; 当前状态: string }] => entry !== null),
  );
}

function hydrateFromMvu() {
  const scene = data.value.当前场景;
  const protagonist = data.value.主角;
  const editor = data.value.现实编辑器;
  const npcEntries = Object.values(data.value.NPC序列 ?? {});
  const location = [scene.地点.一级区域, scene.地点.二级区域, scene.地点.三级地点]
    .map(value => trimValue(value))
    .filter(value => value && value !== '待生成');
  if (location.length) form.世界落地与开场准备.起始地点 = location.join(' / ');
  form.故事起始日期.年 = draftDatePartFromStored(scene.日期.年);
  form.故事起始日期.月 = draftDatePartFromStored(scene.日期.月);
  form.故事起始日期.日 = draftDatePartFromStored(scene.日期.日);
  const sceneSummary = trimValue(scene.摘要);
  if (sceneSummary && sceneSummary !== '等待玩家完成开场签发') {
    form.世界落地与开场准备.当前矛盾与开场 = sceneSummary;
  }
  form.主角.启用 = protagonist.启用;
  form.主角.性别 = trimValue(protagonist.基础信息.性别, '');
  form.主角.年龄 = draftAgeFromStored(protagonist.基础信息.年龄);
  form.主角.外貌.身高 = trimValue(protagonist.外貌.身高, '');
  form.主角.外貌.体型 = trimValue(protagonist.外貌.体型, '');
  form.主角.外貌.面容气质 = trimValue(protagonist.外貌.面容气质, '');
  form.主角.外貌.身体特征 = trimValue(protagonist.外貌.身体特征, '');
  form.主角.身份与位置 = trimValue(protagonist.基础信息.身份, '');
  form.主角.追求 = trimValue(protagonist.基础信息.目标, '');
  form.主角.性格主色 = trimValue(protagonist.性格.主色调, '');
  form.主角.性格与声音 = trimValue(protagonist.性格.底色, '');
  form.主角.补充设定 = trimValue(protagonist.补充设定, '');
  form.主角.穿着 = hydrateClothing(protagonist.穿着);
  form.主角.私密状态 = hydratePrivateStatus(protagonist.私密状态);
  if (editor.是否显现) form.现实编辑器.可修改范围 = [...form.现实编辑器.可修改范围];
  if (npcEntries.length) {
    form.重要角色 = npcEntries.map((npc, index) => ({
      localId: `stored-role-${index}-${npc.基础信息.姓名}`,
      姓名: trimValue(npc.基础信息.姓名),
      性别: trimValue(npc.基础信息.性别),
      年龄: trimValue(npc.基础信息.年龄),
      身高: trimValue(npc.外貌.身高),
      体型: trimValue(npc.外貌.体型),
      面容气质: trimValue(npc.外貌.面容气质),
      身体特征: trimValue(npc.外貌.身体特征),
      身份: trimValue(npc.基础信息.身份),
      关系定位: trimValue(npc.基础信息.关系定位),
      好感度: Math.min(100, Math.max(0, Number(npc.基础信息.好感度) || 0)),
      罩杯: trimValue(npc.外貌.罩杯, '不适用') || '不适用',
      性格主色: trimValue(npc.性格.主色调),
      性格与声音: trimValue(npc.性格.底色),
      穿着: hydrateClothing(npc.穿着),
      私密状态: hydratePrivateStatus(npc.私密状态),
    }));
  }
  hydrated.value = true;
}

function setStatus(message: string, type: StatusType = '') {
  status.value = message;
  statusType.value = type;
}

function hasOpeningDraft(): boolean {
  return Boolean(
    form.让现实编辑器参与世界观生成 ||
    Object.values(form.故事起始日期).some(value => value.trim()) ||
    Object.values(form.体验与叙事方向).some(value => value.trim()) ||
    Object.values(form.世界与故事骨架).some(value => value.trim()) ||
    form.主角.启用 !== true ||
    form.主角.性别 ||
    form.主角.年龄 ||
    Object.values(form.主角.外貌).some(value => value.trim()) ||
    form.主角.身份与位置 ||
    form.主角.追求 ||
    form.主角.性格主色 ||
    form.主角.性格与声音 ||
    form.主角.补充设定 ||
    Object.values(form.主角.穿着).some(value => value.trim() && value.trim() !== '无') ||
    Object.keys(form.主角.私密状态).length > 0 ||
    form.重要角色.some(hasCharacterDraft) ||
    Object.values(form.世界落地与开场准备).some(value => value.trim()) ||
    hasEditorDraft(),
  );
}

function applyOpeningSnapshot(snapshot: OpeningFormSnapshot) {
  form.让现实编辑器参与世界观生成 = snapshot.让现实编辑器参与世界观生成;
  Object.assign(form.故事起始日期, snapshot.故事起始日期);
  Object.assign(form.体验与叙事方向, snapshot.体验与叙事方向);
  Object.assign(form.世界与故事骨架, snapshot.世界与故事骨架);
  Object.assign(form.主角, {
    ...snapshot.主角,
    外貌: { ...snapshot.主角.外貌 },
    穿着: { ...snapshot.主角.穿着 },
    私密状态: hydratePrivateStatus(snapshot.主角.私密状态),
  });
  form.重要角色.splice(
    0,
    form.重要角色.length,
    ...snapshot.重要角色.map(character => ({
      localId: createCharacter().localId,
      ...character,
      穿着: { ...character.穿着 },
      私密状态: hydratePrivateStatus(character.私密状态),
    })),
  );
  Object.assign(form.世界落地与开场准备, snapshot.世界落地与开场准备);
  Object.assign(form.现实编辑器, {
    ...snapshot.现实编辑器,
    可修改范围: [...snapshot.现实编辑器.可修改范围],
  });
  aiPreview.value = null;
  openingPreview.value = '';
  openingContextRevision.value = contextRevision.value;
}

function applyOpeningPlan(plan: OpeningPlan, jumpToFinal = false) {
  if (hasOpeningDraft()) {
    const confirmed = window.confirm(`套用“${plan.名称}”会覆盖当前五层草稿，是否继续？`);
    if (!confirmed) {
      setStatus('已取消套用，当前草稿保持不变。');
      return;
    }
  }
  applyOpeningSnapshot(plan.表单快照);
  currentPlanId.value = plan.id;
  if (jumpToFinal) {
    maxVisitedLayer.value = layers.length - 1;
    currentLayer.value = layers.length - 1;
    scrollToTop();
    setStatus(`已套用“${plan.名称}”，前四层已标记为已访问。`, 'success');
  } else {
    currentLayer.value = 0;
    setStatus(`已套用“${plan.名称}”，可从第一层继续检查或修改。`, 'success');
  }
}

function applyOpeningPlanAndForward(plan: OpeningPlan) {
  applyOpeningPlan(plan, true);
}

function persistOpeningPlans(nextPlans: OpeningPlan[]): boolean {
  try {
    openingPlans.value = writeOpeningPlans(nextPlans);
    return true;
  } catch (error) {
    console.error('[人间修订中·世界配置] 本地方案库写入失败', error);
    setStatus(`方案库保存失败：${formatOpeningPlanError(error)}`, 'error');
    return false;
  }
}

function promptPlanName(defaultName: string): string | null {
  const value = window.prompt('请输入方案名称：', defaultName);
  if (value === null) return null;
  const name = normalizeOpeningPlanName(value);
  if (!name) {
    setStatus('方案名称不能为空，尚未保存。', 'error');
    return null;
  }
  return name;
}

function choosePlanName(defaultName: string): { name: string; conflict?: OpeningPlan } | null {
  let name = promptPlanName(defaultName);
  while (name) {
    const conflict = findOpeningPlanByName(openingPlans.value, name);
    if (!conflict) return { name };
    const overwrite = window.confirm(`已有同名方案“${conflict.名称}”。确定覆盖它吗？取消后可输入新名称另存。`);
    if (overwrite) return { name, conflict };
    name = promptPlanName(`${name} 副本`);
  }
  return null;
}

function saveNewOpeningPlan(defaultName = '未命名开场方案') {
  const choice = choosePlanName(defaultName);
  if (!choice) return;
  try {
    const plan = createOpeningPlan(choice.name, buildOpeningPlanSummary(), buildOpeningSnapshot());
    const nextPlans = choice.conflict
      ? openingPlans.value.map(item => (item.id === choice.conflict?.id ? plan : item))
      : [...openingPlans.value, plan];
    if (!persistOpeningPlans(nextPlans)) return;
    currentPlanId.value = plan.id;
    setStatus(`方案“${plan.名称}”已保存。`, 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] 新方案校验失败', error);
    setStatus(`保存失败：${formatOpeningPlanError(error)}`, 'error');
  }
}

function saveAsOpeningPlan() {
  const defaultName = currentPlanName.value ? `${currentPlanName.value} 副本` : '未命名开场方案';
  saveNewOpeningPlan(defaultName);
}

function updateCurrentOpeningPlan() {
  const current = currentPlan.value;
  if (!current) {
    setStatus('当前没有可更新的已保存方案，请先保存为新方案。', 'error');
    return;
  }
  try {
    const updated = parseOpeningPlan({
      ...current,
      updatedAt: new Date().toISOString(),
      摘要: buildOpeningPlanSummary(),
      表单快照: buildOpeningSnapshot(),
    });
    const nextPlans = openingPlans.value.map(item => (item.id === current.id ? updated : item));
    if (!persistOpeningPlans(nextPlans)) return;
    setStatus(`方案“${updated.名称}”已更新。`, 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] 当前方案校验失败', error);
    setStatus(`更新失败：${formatOpeningPlanError(error)}`, 'error');
  }
}

function deleteOpeningPlan(plan: OpeningPlan) {
  const confirmed = window.confirm(`确定删除本地方案“${plan.名称}”吗？此操作不会影响当前表单。`);
  if (!confirmed) return;
  const nextPlans = openingPlans.value.filter(item => item.id !== plan.id);
  if (!persistOpeningPlans(nextPlans)) return;
  if (currentPlanId.value === plan.id) currentPlanId.value = null;
  setStatus(`方案“${plan.名称}”已删除。`, 'success');
}

function exportOpeningPlan(plan: OpeningPlan) {
  try {
    const blob = new Blob([serializeOpeningPlan(plan)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const safeName = plan.名称.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 64) || '未命名方案';
    anchor.href = url;
    anchor.download = `人间修订中-开场方案-${safeName}.json`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus(`方案“${plan.名称}”已导出 JSON。`, 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] 方案导出失败', error);
    setStatus(`导出失败：${formatOpeningPlanError(error)}`, 'error');
  }
}

async function importOpeningPlan(file: File) {
  setStatus('正在完整校验方案 JSON…', 'working');
  try {
    let importedPlan = parseOpeningPlanJson(await file.text());
    let nameConflict = findOpeningPlanByName(openingPlans.value, importedPlan.名称);
    while (nameConflict) {
      const overwrite = window.confirm(
        `已有同名方案“${nameConflict.名称}”。确定用导入文件覆盖它吗？取消后可另存为新名称。`,
      );
      if (overwrite) break;
      const alternateName = promptPlanName(`${importedPlan.名称} 副本`);
      if (!alternateName) {
        setStatus('已取消导入，当前表单与方案库保持不变。');
        return;
      }
      importedPlan = parseOpeningPlan({ ...importedPlan, 名称: alternateName });
      nameConflict = findOpeningPlanByName(openingPlans.value, importedPlan.名称);
    }
    const idConflict = findOpeningPlanById(openingPlans.value, importedPlan.id);
    const storedPlan =
      idConflict && idConflict.id !== nameConflict?.id ? cloneOpeningPlanWithNewId(importedPlan) : importedPlan;
    const nextPlans = nameConflict
      ? openingPlans.value.map(item => (item.id === nameConflict.id ? storedPlan : item))
      : [...openingPlans.value, storedPlan];
    if (!persistOpeningPlans(nextPlans)) return;
    if (currentPlanId.value === nameConflict?.id) currentPlanId.value = storedPlan.id;
    setStatus(`方案“${storedPlan.名称}”已导入方案库。`, 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] 方案导入校验失败', error);
    setStatus(`导入失败：${formatOpeningPlanError(error)}。当前表单与方案库未改变。`, 'error');
  }
}

function refreshOpeningPlans() {
  const previousCurrentId = currentPlanId.value;
  openingPlans.value = readOpeningPlans();
  if (previousCurrentId && !findOpeningPlanById(openingPlans.value, previousCurrentId)) currentPlanId.value = null;
}

function onOpeningPlanStorageChange(event: StorageEvent) {
  if (event.key === OPENING_PLAN_STORAGE_KEY || event.key === LEGACY_OPENING_PLAN_STORAGE_KEY) refreshOpeningPlans();
}

function openingMessages() {
  return getChatMessages('0-{{lastMessageId}}');
}

function findCreatedOpeningMessage(message: string, dataToMatch: Record<string, any>, beforeMessageIds: Set<number>) {
  return openingMessages().find(
    candidate =>
      !beforeMessageIds.has(candidate.message_id) &&
      candidate.message === message &&
      (Object.keys(dataToMatch).length === 0 || _.isEqual(candidate.data, dataToMatch)),
  );
}

async function waitForCreatedOpeningMessage(
  message: string,
  dataToMatch: Record<string, any>,
  beforeMessageIds: Set<number>,
) {
  for (let attempt = 0; attempt < OPENING_READBACK_CHECKS; attempt += 1) {
    const candidate = findCreatedOpeningMessage(message, dataToMatch, beforeMessageIds);
    if (candidate) return candidate;
    await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
  }
  throw new Error('createChatMessages 后未能回读包含 UpdateVariable 与 MVU 数据的新消息');
}

function setTheme(theme: ThemeId) {
  activeTheme.value = theme;
  saveTheme(theme);
}

function scrollToTop() {
  // 保持安全滚动，不强制移动宿主酒馆窗口顶部，避免 #top-settings-holder 顶栏被推离视口
}

function goToLayer(index: number) {
  if (index < 0 || index >= layers.length || index > maxVisitedLayer.value) return;
  currentLayer.value = index;
  scrollToTop();
}

function goNextLayer() {
  if (isLastLayer.value) return;
  maxVisitedLayer.value = Math.max(maxVisitedLayer.value, currentLayer.value + 1);
  currentLayer.value += 1;
  scrollToTop();
}

function goPreviousLayer() {
  if (currentLayer.value > 0) currentLayer.value -= 1;
  scrollToTop();
}

function addCharacter() {
  form.重要角色.push(createCharacter());
}

function removeCharacter(index: number) {
  form.重要角色.splice(index, 1);
}

function clearPrivateStatus(target: string) {
  const info = privateStatusTargetInfo(target);
  if (!info) return;
  Object.keys(info.status).forEach(part => delete info.status[part]);
  setStatus(`已清空“${info.label}”的私密状态。`, 'success');
}

function compact(text: string, fallback: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized ? (normalized.length > 70 ? `${normalized.slice(0, 70)}…` : normalized) : fallback;
}

function formatOpeningDate(date: OpeningDateSnapshot): string {
  const { 年, 月, 日 } = date;
  return 年 && 月 && 日 ? `${年}-${月}-${日}` : '';
}

function buildOpeningPlanSummary(): string {
  return compact(
    [
      formatOpeningDate(form.故事起始日期),
      form.体验与叙事方向.故事体验,
      form.世界与故事骨架.时代与舞台,
      form.主角.身份与位置,
      form.世界落地与开场准备.起始地点,
      form.世界落地与开场准备.当前矛盾与开场,
    ]
      .filter(Boolean)
      .join(' · '),
    '五层开场配置方案',
  );
}

function hasCharacterDraft(character: CharacterDraft): boolean {
  return (
    [
      character.姓名,
      character.性别,
      character.年龄,
      character.身高,
      character.体型,
      character.面容气质,
      character.身体特征,
      character.身份,
      character.关系定位,
      character.性格主色,
      character.性格与声音,
      ...Object.values(character.穿着),
    ].some(value => value.trim() && value.trim() !== '无') ||
    character.好感度 !== 0 ||
    Object.keys(character.私密状态).length > 0
  );
}

function hasEditorDraft(): boolean {
  return Boolean(
    form.现实编辑器.可见与知晓 ||
    form.现实编辑器.限制与代价 ||
    form.现实编辑器.自然语言修改 ||
    form.现实编辑器.表现形式 !== '由 AI 结合前文整理' ||
    form.现实编辑器.可修改范围.join(',') !== '世界,区域,个人' ||
    form.现实编辑器.常识同步 !== '立即同步' ||
    form.现实编辑器.记忆保留 !== '只有主角保留' ||
    form.现实编辑器.主角受影响 !== '是' ||
    form.现实编辑器.自主执行 !== 'D-完全禁止',
  );
}

function layerComplete(layer: LayerId): boolean {
  if (layer === 'experience')
    return Boolean(
      isOpeningDateComplete(form.故事起始日期) ||
      form.体验与叙事方向.故事体验 ||
      form.体验与叙事方向.主角处境 ||
      form.体验与叙事方向.冲突与成长,
    );
  if (layer === 'world')
    return Boolean(
      form.世界与故事骨架.世界规则 || form.世界与故事骨架.时代与舞台 || form.世界与故事骨架.核心矛盾与推进,
    );
  if (layer === 'characters')
    return Boolean(
      !form.主角.启用 ||
      form.主角.性别 ||
      form.主角.年龄 ||
      form.主角.外貌.身高 ||
      form.主角.外貌.体型 ||
      form.主角.外貌.面容气质 ||
      form.主角.外貌.身体特征 ||
      form.主角.身份与位置 ||
      form.主角.追求 ||
      form.主角.性格主色 ||
      form.主角.性格与声音 ||
      form.主角.补充设定 ||
      form.重要角色.some(hasCharacterDraft),
    );
  if (layer === 'grounding') return Boolean(form.世界落地与开场准备.起始地点 || form.世界落地与开场准备.当前矛盾与开场);
  return hasEditorDraft();
}

const completedLayerCount = computed(() => layers.filter(layer => layerComplete(layer.id)).length);

const contextRows = computed(() => [
  {
    id: 'experience',
    index: 0,
    order: '01',
    title: '体验与叙事方向',
    summary: compact(
      [
        formatOpeningDate(form.故事起始日期),
        form.体验与叙事方向.故事体验,
        form.体验与叙事方向.主角处境,
        form.体验与叙事方向.冲突与成长,
      ]
        .filter(Boolean)
        .join(' · '),
      '尚未填写',
    ),
    complete: layerComplete('experience'),
  },
  {
    id: 'world',
    index: 1,
    order: '02',
    title: '世界与故事骨架',
    summary: compact(
      [
        form.世界与故事骨架.世界规则,
        form.世界与故事骨架.时代与舞台,
        form.世界与故事骨架.社会后果,
        form.世界与故事骨架.核心矛盾与推进,
      ]
        .filter(Boolean)
        .join(' · '),
      '尚未填写',
    ),
    complete: layerComplete('world'),
  },
  {
    id: 'characters',
    index: 2,
    order: '03',
    title: '主角与重要角色',
    summary: compact(
      [
        form.主角.身份与位置,
        form.主角.追求,
        form.主角.性格主色,
        ...form.重要角色.filter(hasCharacterDraft).map(character => character.姓名 || character.关系定位),
      ]
        .filter(Boolean)
        .join(' · '),
      '尚未填写',
    ),
    complete: layerComplete('characters'),
  },
  {
    id: 'grounding',
    index: 3,
    order: '04',
    title: '世界落地与开场准备',
    summary: compact(
      [
        form.世界落地与开场准备.起始地点,
        form.世界落地与开场准备.日常秩序,
        form.世界落地与开场准备.组织势力,
        form.世界落地与开场准备.必要规则,
        form.世界落地与开场准备.当前矛盾与开场,
      ]
        .filter(Boolean)
        .join(' · '),
      '尚未填写',
    ),
    complete: layerComplete('grounding'),
  },
  {
    id: 'editor',
    index: 4,
    order: '05',
    title: '现实编辑器',
    summary: compact(
      [
        form.现实编辑器.可见与知晓,
        form.现实编辑器.可修改范围.join('、') !== '世界、区域、个人' ? form.现实编辑器.可修改范围.join('、') : '',
        form.现实编辑器.常识同步 !== '立即同步' ? form.现实编辑器.常识同步 : '',
        form.现实编辑器.记忆保留 !== '只有主角保留' ? form.现实编辑器.记忆保留 : '',
        form.现实编辑器.限制与代价,
        form.现实编辑器.自然语言修改,
      ]
        .filter(Boolean)
        .join(' · '),
      '尚未填写',
    ),
    complete: layerComplete('editor'),
  },
]);

function markContextChange() {
  if (!hydrated.value) return;
  contextRevision.value += 1;
}

watch(() => ({ ...form.体验与叙事方向 }), markContextChange, { deep: true });
watch(() => ({ ...form.故事起始日期 }), markContextChange, { deep: true });
watch(() => ({ ...form.世界与故事骨架, 参与: form.让现实编辑器参与世界观生成 }), markContextChange, { deep: true });
watch(() => ({ 主角: form.主角, 角色: form.重要角色.map(c => ({ ...c })) }), markContextChange, { deep: true });
watch(() => ({ ...form.世界落地与开场准备 }), markContextChange, { deep: true });
watch(() => ({ ...form.现实编辑器 }), markContextChange, { deep: true });

// AI 字段映射
const aiFieldMap: Record<string, AiFieldDescriptor> = {
  'experience.story': {
    id: 'experience.story',
    title: '故事体验',
    layer: 'experience',
    question: '玩家想从这段故事中获得怎样的体验？',
    read: () => form.体验与叙事方向.故事体验,
    write: value => (form.体验与叙事方向.故事体验 = value),
  },
  'experience.situation': {
    id: 'experience.situation',
    title: '主角处境',
    layer: 'experience',
    question: '主角此刻处在什么处境，正在追求什么？',
    read: () => form.体验与叙事方向.主角处境,
    write: value => (form.体验与叙事方向.主角处境 = value),
  },
  'experience.conflict': {
    id: 'experience.conflict',
    title: '冲突与成长',
    layer: 'experience',
    question: '玩家偏好哪一种冲突或成长感？',
    read: () => form.体验与叙事方向.冲突与成长,
    write: value => (form.体验与叙事方向.冲突与成长 = value),
  },
  'world.rules': {
    id: 'world.rules',
    title: '世界规则',
    layer: 'world',
    question: '哪些简明世界事实会改变人物的日常选择？',
    read: () => form.世界与故事骨架.世界规则,
    write: value => (form.世界与故事骨架.世界规则 = value),
  },
  'world.stage': {
    id: 'world.stage',
    title: '时代与舞台',
    layer: 'world',
    question: '故事从什么时代与舞台开始？',
    read: () => form.世界与故事骨架.时代与舞台,
    write: value => (form.世界与故事骨架.时代与舞台 = value),
  },
  'world.consequence': {
    id: 'world.consequence',
    title: '社会后果',
    layer: 'world',
    question: '世界规则会造成哪些社会后果与日常习惯？',
    read: () => form.世界与故事骨架.社会后果,
    write: value => (form.世界与故事骨架.社会后果 = value),
  },
  'world.conflict': {
    id: 'world.conflict',
    title: '核心矛盾与推进',
    layer: 'world',
    question: '核心矛盾是什么，故事可以怎样推进？',
    read: () => form.世界与故事骨架.核心矛盾与推进,
    write: value => (form.世界与故事骨架.核心矛盾与推进 = value),
  },
  'grounding.place': {
    id: 'grounding.place',
    title: '起始地点',
    layer: 'grounding',
    question: '第一幕从哪里开始，那里正在发生什么日常活动？',
    read: () => form.世界落地与开场准备.起始地点,
    write: value => (form.世界落地与开场准备.起始地点 = value),
  },
  'grounding.order': {
    id: 'grounding.order',
    title: '日常秩序',
    layer: 'grounding',
    question: '这个地点的人如何按默认常识生活？',
    read: () => form.世界落地与开场准备.日常秩序,
    write: value => (form.世界落地与开场准备.日常秩序 = value),
  },
  'grounding.factions': {
    id: 'grounding.factions',
    title: '组织与势力',
    layer: 'grounding',
    question: '当前开局真正会接触到哪些组织或势力？',
    read: () => form.世界落地与开场准备.组织势力,
    write: value => (form.世界落地与开场准备.组织势力 = value),
  },
  'grounding.rules': {
    id: 'grounding.rules',
    title: '必要历史、力量或经济规则',
    layer: 'grounding',
    question: '为了让这次开局成立，必须保留哪些背景规则？',
    read: () => form.世界落地与开场准备.必要规则,
    write: value => (form.世界落地与开场准备.必要规则 = value),
  },
  'grounding.opening': {
    id: 'grounding.opening',
    title: '当前矛盾与唯一开场',
    layer: 'grounding',
    question: '开场时已经发生了什么，画面停在哪里？',
    read: () => form.世界落地与开场准备.当前矛盾与开场,
    write: value => (form.世界落地与开场准备.当前矛盾与开场 = value),
  },
  'editor.visibility': {
    id: 'editor.visibility',
    title: '可见、使用与知晓',
    layer: 'editor',
    question: '谁能看见、使用或知晓现实编辑器？',
    read: () => form.现实编辑器.可见与知晓,
    write: value => (form.现实编辑器.可见与知晓 = value),
  },
  'editor.limit': {
    id: 'editor.limit',
    title: '限制、代价与异常反馈',
    layer: 'editor',
    question: '编辑器的限制、代价和异常反馈是什么？',
    read: () => form.现实编辑器.限制与代价,
    write: value => (form.现实编辑器.限制与代价 = value),
  },
  'editor.language': {
    id: 'editor.language',
    title: '自然语言修改',
    layer: 'editor',
    question: '玩家如何用自然语言提出修改？',
    read: () => form.现实编辑器.自然语言修改,
    write: value => (form.现实编辑器.自然语言修改 = value),
  },
};

type CharacterField =
  | '姓名'
  | '性别'
  | '年龄'
  | '身高'
  | '体型'
  | '面容气质'
  | '身体特征'
  | '身份'
  | '关系定位'
  | '好感度'
  | '罩杯'
  | '性格主色'
  | '性格与声音'
  | '上装'
  | '下装'
  | '内衣'
  | '袜子'
  | '鞋子'
  | '配饰';
const characterFieldNames: CharacterField[] = [
  '姓名',
  '性别',
  '年龄',
  '身高',
  '体型',
  '面容气质',
  '身体特征',
  '身份',
  '关系定位',
  '好感度',
  '罩杯',
  '性格主色',
  '性格与声音',
  '上装',
  '下装',
  '内衣',
  '袜子',
  '鞋子',
  '配饰',
];

function characterDescriptor(index: number): AiFieldDescriptor {
  const character = form.重要角色[index];
  return {
    id: `character:${index}`,
    title: character?.姓名.trim() || `角色 ${index + 1}`,
    layer: 'characters',
    question: '请让这个角色拥有清晰的身份、关系定位、外貌、性格和可直接影响当前 RP 的资料。',
    read: () => JSON.stringify(character ?? {}),
    write: value => {
      if (character) character.性格与声音 = value;
    },
  };
}

const clothingFieldNames = new Set<CharacterField>(['上装', '下装', '内衣', '袜子', '鞋子', '配饰']);

function readCharacterField(character: CharacterDraft | undefined, field: CharacterField): string {
  if (!character) return '';
  if (clothingFieldNames.has(field)) return character.穿着[field as keyof ClothingDraft];
  return String((character as unknown as Record<string, unknown>)[field] ?? '');
}

function writeCharacterField(character: CharacterDraft | undefined, field: CharacterField, value: string): void {
  if (!character) return;
  if (clothingFieldNames.has(field)) {
    character.穿着[field as keyof ClothingDraft] = value;
    return;
  }
  if (field === '好感度') {
    const number = Number(value.replace(/[^\d.-]/g, ''));
    character.好感度 = Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : 0;
    return;
  }
  if (field === '罩杯') {
    character.罩杯 = ['不适用', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(value) ? value : '不适用';
    return;
  }
  (character as unknown as Record<string, string>)[field] = value;
}

function characterFieldDescriptor(index: number, field: CharacterField): AiFieldDescriptor {
  const character = form.重要角色[index];
  return {
    id: `character:${index}.${field}`,
    title: `${character?.姓名.trim() || `角色 ${index + 1}`} · ${field}`,
    layer: 'characters',
    question: `请整理第 ${index + 1} 个重要角色的${field}，让它能直接影响当前 RP。`,
    read: () => readCharacterField(character, field),
    write: value => {
      writeCharacterField(character, field, value);
    },
  };
}

type ProtagonistField =
  | '性别'
  | '年龄'
  | '身高'
  | '体型'
  | '面容气质'
  | '身体特征'
  | '身份与位置'
  | '追求'
  | '性格主色'
  | '性格与声音'
  | '补充设定'
  | '上装'
  | '下装'
  | '内衣'
  | '袜子'
  | '鞋子'
  | '配饰';
const protagonistFieldNames: ProtagonistField[] = [
  '性别',
  '年龄',
  '身高',
  '体型',
  '面容气质',
  '身体特征',
  '身份与位置',
  '追求',
  '性格主色',
  '性格与声音',
  '补充设定',
  '上装',
  '下装',
  '内衣',
  '袜子',
  '鞋子',
  '配饰',
];

function readProtagonistField(field: ProtagonistField): string {
  if (['身高', '体型', '面容气质', '身体特征'].includes(field)) return form.主角.外貌[field as keyof AppearanceDraft];
  if (['上装', '下装', '内衣', '袜子', '鞋子', '配饰'].includes(field)) {
    return form.主角.穿着[field as keyof ClothingDraft];
  }
  return String((form.主角 as unknown as Record<string, unknown>)[field] ?? '');
}

function writeProtagonistField(field: ProtagonistField, value: string): void {
  if (['身高', '体型', '面容气质', '身体特征'].includes(field)) {
    form.主角.外貌[field as keyof AppearanceDraft] = value;
    return;
  }
  if (['上装', '下装', '内衣', '袜子', '鞋子', '配饰'].includes(field)) {
    form.主角.穿着[field as keyof ClothingDraft] = value;
    return;
  }
  (form.主角 as unknown as Record<string, string>)[field] = value;
}

function protagonistFieldDescriptor(field: ProtagonistField): AiFieldDescriptor {
  return {
    id: `characters.protagonist.${field}`,
    title: `主角 · ${field}`,
    layer: 'characters',
    question: `请整理主角的${field}，保留玩家已填写内容并使其能直接影响当前 RP。`,
    read: () => readProtagonistField(field),
    write: value => writeProtagonistField(field, value),
  };
}

function contextSnapshot(includeEditor: boolean): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {
    故事起始日期: form.故事起始日期,
    体验与叙事方向: form.体验与叙事方向,
    世界与故事骨架: form.世界与故事骨架,
    主角与重要角色: { 主角: form.主角, 重要角色: form.重要角色 },
    世界落地与开场准备: form.世界落地与开场准备,
  };
  if (includeEditor) snapshot.现实编辑器 = form.现实编辑器;
  return snapshot;
}

const layerSequence: LayerId[] = ['experience', 'world', 'characters', 'grounding', 'editor'];

function filledSnapshot(value: unknown): unknown {
  if (typeof value === 'string') {
    const text = value.trim();
    return text || undefined;
  }
  if (Array.isArray(value)) {
    const items = value.map(filledSnapshot).filter(item => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, filledSnapshot(item)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}

function protagonistPromptContext(): Record<string, unknown> {
  return {
    当前人设: {
      名称: protagonistName.value,
      完整说明: protagonistDescription.value,
    },
    前两层已确认内容: {
      体验与叙事方向: filledSnapshot(form.体验与叙事方向),
      故事起始日期: filledSnapshot(form.故事起始日期),
      世界与故事骨架: filledSnapshot(form.世界与故事骨架),
    },
    当前第三层已填写内容:
      filledSnapshot({
        主角: form.主角,
        重要角色: form.重要角色.map(character =>
          Object.fromEntries(Object.entries(character).filter(([key]) => key !== 'localId')),
        ),
      }) ?? {},
  };
}

function bulkLayerContext(layer: LayerId): Record<string, unknown> {
  const roleDrafts = form.重要角色.map(character =>
    Object.fromEntries(Object.entries(character).filter(([key]) => key !== 'localId')),
  );
  const sections: Record<LayerId, unknown> = {
    experience: { 故事起始日期: form.故事起始日期, ...form.体验与叙事方向 },
    world: form.世界与故事骨架,
    characters: { 主角: form.主角, 重要角色: roleDrafts },
    grounding: form.世界落地与开场准备,
    editor: form.现实编辑器,
  };
  const currentIndex = layerSequence.indexOf(layer);
  return Object.fromEntries(
    layerSequence
      .slice(0, currentIndex + 1)
      .map(layerId => [
        layerId === 'experience'
          ? '体验与叙事方向'
          : layerId === 'world'
            ? '世界与故事骨架'
            : layerId === 'characters'
              ? '主角与重要角色'
              : layerId === 'grounding'
                ? '世界落地与开场准备'
                : '现实编辑器',
        filledSnapshot(sections[layerId]),
      ]),
  );
}

function bulkDescriptorsForLayer(layer: LayerId): AiFieldDescriptor[] {
  const staticDescriptors = Object.values(aiFieldMap).filter(descriptor => descriptor.layer === layer);
  if (layer !== 'characters') return staticDescriptors;
  const protagonistDescriptors = form.主角.启用 ? protagonistFieldNames.map(protagonistFieldDescriptor) : [];
  const characterDescriptors = form.重要角色.flatMap((_, index) =>
    characterFieldNames.map(field => characterFieldDescriptor(index, field)),
  );
  return [...staticDescriptors, ...protagonistDescriptors, ...characterDescriptors];
}

function bulkPendingDescriptors(layer: LayerId): AiFieldDescriptor[] {
  return bulkDescriptorsForLayer(layer).filter(descriptor => isAiFieldBlank(descriptor));
}

function isAiFieldBlank(descriptor: AiFieldDescriptor): boolean {
  const value = descriptor.read().trim();
  return !value || value === '无' || value === '不适用' || value === '0';
}

function worldGenerationBoundary(layer: LayerId): string {
  if (layer !== 'world' && layer !== 'grounding') return '';
  return form.让现实编辑器参与世界观生成
    ? '世界观生成开关：已开启。允许把现实编辑器的存在、传闻或影响纳入世界骨架，但仍需服务于玩家想体验的故事。'
    : '世界观生成开关：关闭。此次世界观内容必须明确排除现实编辑器：不得提及、暗示、预设或围绕它设计任何世界规则、社会后果、组织、历史和矛盾。现实编辑器只在之后作为突然出现的外来事物进入。';
}

function suggestionSchema() {
  return {
    name: 'human_revision_interview_suggestion',
    description: '创作访谈 AI 整理结果',
    strict: true,
    value: {
      type: 'object',
      additionalProperties: false,
      properties: {
        结论: { type: 'string' },
        理由: { type: 'string' },
        可执行约束: { type: 'array', items: { type: 'string' } },
        可采用: { type: 'object', additionalProperties: { type: 'string' } },
      },
      required: ['结论', '理由', '可执行约束', '可采用'],
    },
  };
}

function privateStatusSuggestionSchema(expectedParts: readonly string[]) {
  const privatePartSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      外观描述: { type: 'string', minLength: 60 },
      当前状态: { type: 'string', minLength: 60 },
    },
    required: ['外观描述', '当前状态'],
  };
  return {
    name: 'human_revision_private_status_suggestion',
    description: '动态私密状态 AI 预览结果',
    strict: true,
    value: {
      type: 'object',
      additionalProperties: false,
      properties: {
        结论: { type: 'string' },
        理由: { type: 'string' },
        可执行约束: { type: 'array', items: { type: 'string' } },
        可采用: {
          type: 'object',
          additionalProperties: false,
          properties: {
            私密状态: {
              type: 'object',
              additionalProperties: false,
              properties: Object.fromEntries(expectedParts.map(part => [part, privatePartSchema])),
              required: [...expectedParts],
            },
          },
          required: ['私密状态'],
        },
      },
      required: ['结论', '理由', '可执行约束', '可采用'],
    },
  };
}

async function requestStructuredJson(
  prompt: string,
  userInput: string,
  generationId: string,
  schema: () => Record<string, unknown>,
): Promise<Record<string, unknown>> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await generateRaw({
        user_input: userInput,
        should_silence: true,
        generation_id: `${generationId}-${attempt}`,
        custom_api: { max_tokens: 'unset' },
        ordered_prompts: [
          { role: 'system', content: buildAuthorizationLayer() },
          { role: 'system', content: prompt },
          { role: 'assistant', content: '<|no-trans|>我已进入私人虚构创作状态，会先给出可预览的整理结果。' },
          'user_input',
        ],
        ...(attempt === 0 ? { json_schema: schema() } : {}),
      });
      const text = extractGenerateText(result);
      if (!text.trim()) throw new Error('AI 返回为空');
      const parsed = parseJsonLoose(text) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') throw new Error('AI 返回结构无效');
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(
        `[人间修订中·世界配置] AI 整理第 ${attempt + 1} 次请求失败${attempt === 0 ? '，将改用普通 JSON 重试' : ''}。`,
        error,
      );
    }
  }
  throw new Error(lastError instanceof Error ? lastError.message : String(lastError));
}

async function requestJson(prompt: string, userInput: string, generationId: string): Promise<AiPayload> {
  const parsed = (await requestStructuredJson(prompt, userInput, generationId, suggestionSchema)) as AiPayload;
  return {
    结论: String(parsed.结论 ?? '').trim(),
    理由: String(parsed.理由 ?? '').trim(),
    可执行约束: Array.isArray(parsed.可执行约束)
      ? parsed.可执行约束.map(item => String(item).trim()).filter(Boolean)
      : [],
    可采用:
      parsed.可采用 && typeof parsed.可采用 === 'object'
        ? Object.fromEntries(
            Object.entries(parsed.可采用)
              .map(([key, value]) => [key, String(value).trim()])
              .filter(([, value]) => value),
          )
        : {},
  };
}

function buildFieldPrompt(descriptor: AiFieldDescriptor, currentValue: string): string {
  const includeEditor =
    descriptor.layer === 'editor' ||
    (form.让现实编辑器参与世界观生成 && (descriptor.layer === 'world' || descriptor.layer === 'grounding'));
  return `【任务】\n你是创作访谈整理引擎。请围绕“${descriptor.title}”给出一份能直接用于文字 RPG 的建议。\n问题：${descriptor.question}\n目标字段 ID：${descriptor.id}\n${worldGenerationBoundary(descriptor.layer)}\n\n【已确认上下文】\n${JSON.stringify(contextSnapshot(includeEditor), null, 2)}\n\n【玩家当前回答】\n${currentValue || '（空白，请基于已确认上下文提出可采用的起点）'}\n\n【整理要求】\n- 空白时给出一个有明确选择和可玩后果的推荐，不要要求玩家先补更多资料。\n- 有零散内容时，补足因果、人物行动和叙事限制；不要只做辞藻润色。\n- 已填写内容要整理成可执行的叙事约束，保留玩家原意。\n- 只在“可采用”中返回与目标字段 ID 对应的内容；不要静默改变其他字段。\n- 结论简明，理由说明它会如何影响当前 RP；可执行约束不超过 4 条。\n【输出】\n只输出 JSON。字段为：结论、理由、可执行约束、可采用。可采用是对象，键必须包含“${descriptor.id}”，值为玩家确认后可直接写入字段的中文内容。`;
}

function buildCompositePrompt(
  title: string,
  layer: LayerId,
  question: string,
  current: unknown,
  fields: string[],
): string {
  return `【任务】\n你是创作访谈整理引擎。请把“${title}”整理成一个能够直接进入文字 RPG 的设计结果。\n问题：${question}\n${worldGenerationBoundary(layer)}\n\n【已确认上下文】\n${JSON.stringify(contextSnapshot(layer === 'editor'), null, 2)}\n\n【当前草稿】\n${JSON.stringify(current, null, 2)}\n\n【必须覆盖的字段】\n${fields.map(field => `- ${field}`).join('\n')}\n\n空白字段请基于上下文补全，已有字段请整理为具体的行动、关系、限制或叙事约束。不要写百科资料，不要加入本次开场不会直接使用的信息。只输出 JSON：结论、理由、可执行约束、可采用。可采用对象的键只能使用上面列出的字段名。`;
}

function buildProtagonistPrompt(fields: string[]): string {
  return `【任务】\n根据酒馆当前人设与已确认访谈内容，生成一份可直接用于文字 RPG 的完整主角档案整理结果。结果先供玩家预览，不直接覆盖表单。\n\n【当前人设】\n${JSON.stringify(protagonistPromptContext().当前人设, null, 2)}\n\n【前两层上下文与当前第三层草稿】\n${JSON.stringify(protagonistPromptContext(), null, 2)}\n\n【必须覆盖的主角字段】\n${fields.map(field => `- ${field}`).join('\n')}\n\n【信息优先级】\n1. 玩家在当前页面手写的明确内容最高；这些非空字段不得被改写、扩写或替换。\n2. 人设说明中的明确事实其次；不得把没有依据的推测写成事实。\n3. 第一、二层已确认内容用于推断能影响当前 RP 的身份、追求、处境与声音；故事起始日期只读取玩家填写值，不得自行生成。\n4. 没有依据的字段保持空白，不为了完整而编造。\n\n【输出约束】\n- 只返回上面列出的字段名，不返回姓名字段；姓名使用当前酒馆人设名称，不新增重复输入。\n- 可采用对象的键只能是这些字段名；空字段可以省略，但有依据时应给出完整档案建议。\n- 每个值都应是能执行的角色设定，不要只堆形容词；外貌四项分别写面容气质、身高、体型、身体特征。穿着字段分别填写上装、下装、内衣、袜子、鞋子、配饰。\n- 不要返回私密状态；私密状态只能通过专用按钮单独生成。\n- 只输出 JSON：结论、理由、可执行约束、可采用。`;
}

function buildBulkPrompt(layer: LayerId) {
  const pendingDescriptors = bulkPendingDescriptors(layer).map(descriptor => ({
    id: descriptor.id,
    question: descriptor.question,
  }));
  const layerMeta = layers.find(item => item.id === layer) ?? layers[0];
  const boundary = layer === 'world' || layer === 'grounding' ? worldGenerationBoundary(layer) : '';
  return `【任务】\n根据已确认的创作访谈，提出一份“补全本层空白项”草稿。当前层是“${layerMeta.title}”，只处理当前层的空白字段。\n\n${
    boundary ? `【当前层世界边界】\n${boundary}\n` : ''
  }【当前层允许返回的字段】\n${JSON.stringify(pendingDescriptors, null, 2)}\n【已确认上下文】\n${JSON.stringify(
    bulkLayerContext(layer),
    null,
    2,
  )}\n\n【整理要求】\n- 只补全上面列出的空白字段，不覆盖已有回答。\n- 可采用对象只能使用“当前层允许返回的字段”中的 ID；不要返回前层、后层或未列出的键。\n- 上下文只包含已经确认的前面层，以及当前层已经填写的内容；不要据此生成后续层内容。\n- 每一项都要形成能直接执行的叙事约束，不写百科资料、秘密或后续扩展钩子。\n\n只输出 JSON：结论、理由、可执行约束、可采用。可采用对象的键只能使用上面列出的 ID。`;
}

async function requestAiDescriptor(descriptor: AiFieldDescriptor) {
  if (aiBusyKey.value) return;
  aiBusyKey.value = descriptor.id;
  setStatus(`正在为“${descriptor.title}”整理建议…`, 'working');
  const revision = contextRevision.value;
  try {
    const payload = await requestJson(
      buildFieldPrompt(descriptor, descriptor.read()),
      `请给出“${descriptor.title}”的可预览建议。`,
      `human-revision-interview-${descriptor.id}-${Date.now()}`,
    );
    aiPreview.value = {
      target: descriptor.id,
      title: `${descriptor.title} · AI 结果预览`,
      layer: descriptor.layer,
      summary: payload.结论 || '已根据当前上下文整理出一份可采用草稿。',
      rationale: payload.理由 || '',
      constraints: payload.可执行约束 ?? [],
      values: payload.可采用 ?? {},
      contextRevision: contextRevision.value,
    };
    setStatus('AI 结果已放入预览，确认后才会写入回答。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] AI 字段整理失败', error);
    setStatus(`AI 整理失败：${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    aiBusyKey.value = '';
  }
}

async function requestAi(descriptorId: string) {
  const descriptor = aiFieldMap[descriptorId];
  if (descriptor) await requestAiDescriptor(descriptor);
}

async function requestProtagonistAi() {
  if (aiBusyKey.value) return;
  aiBusyKey.value = 'protagonist';
  setStatus('正在根据当前人设生成主角档案…', 'working');
  const fields = [
    '性别',
    '年龄',
    '身高',
    '体型',
    '面容气质',
    '身体特征',
    '身份与位置',
    '追求',
    '性格主色',
    '性格与声音',
    '补充设定',
    '上装',
    '下装',
    '内衣',
    '袜子',
    '鞋子',
    '配饰',
  ];
  try {
    const payload = await requestJson(
      buildProtagonistPrompt(fields),
      '请根据当前人设生成主角档案的可预览整理结果。',
      `human-revision-protagonist-${Date.now()}`,
    );
    aiPreview.value = {
      target: 'protagonist',
      title: '主角档案 · AI 结果预览',
      layer: 'characters',
      summary: payload.结论 || '已整理出一份可直接行动的主角设计。',
      rationale: payload.理由 || '',
      constraints: payload.可执行约束 ?? [],
      values: payload.可采用 ?? {},
      contextRevision: contextRevision.value,
    };
    setStatus('主角整理结果已进入预览。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] AI 主角整理失败', error);
    setStatus(`AI 整理失败：${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    aiBusyKey.value = '';
  }
}

async function requestCharacterAi(index: number) {
  if (aiBusyKey.value || !form.重要角色[index]) return;
  const descriptor = characterDescriptor(index);
  aiBusyKey.value = descriptor.id;
  setStatus(`正在整理“${descriptor.title}”…`, 'working');
  const fields = characterFieldNames;
  try {
    const payload = await requestJson(
      buildCompositePrompt(descriptor.title, 'characters', descriptor.question, form.重要角色[index], fields),
      '请给出这个重要角色的可预览整理结果。',
      `human-revision-character-${index}-${Date.now()}`,
    );
    aiPreview.value = {
      target: descriptor.id,
      title: `${descriptor.title} · AI 结果预览`,
      layer: 'characters',
      summary: payload.结论 || '已整理出一份具有关系和行动压力的角色设计。',
      rationale: payload.理由 || '',
      constraints: payload.可执行约束 ?? [],
      values: payload.可采用 ?? {},
      contextRevision: contextRevision.value,
    };
    setStatus('角色整理结果已进入预览。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] AI 角色整理失败', error);
    setStatus(`AI 整理失败：${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    aiBusyKey.value = '';
  }
}

function privateStatusTargetInfo(
  target: string,
):
  | { owner: 'protagonist'; label: string; gender: string; status: PrivateStatusDraft }
  | { owner: 'character'; index: number; label: string; gender: string; status: PrivateStatusDraft }
  | null {
  if (target === 'protagonist.private-status') {
    return {
      owner: 'protagonist',
      label: protagonistName.value || '主角',
      gender: form.主角.性别,
      status: form.主角.私密状态,
    };
  }
  const match = target.match(/^character:(\d+)\.private-status$/);
  if (!match) return null;
  const index = Number(match[1]);
  const character = form.重要角色[index];
  if (!character) return null;
  return {
    owner: 'character',
    index,
    label: character.姓名.trim(),
    gender: character.性别,
    status: character.私密状态,
  };
}

function normalizePrivateStatusAiValue(value: unknown, expectedParts: readonly string[]): PrivateStatusDraft {
  const entries = value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : [];
  const normalized = Object.fromEntries(
    entries
      .map(([part, detail]) => {
        if (!part.trim() || !detail || typeof detail !== 'object' || Array.isArray(detail)) return null;
        const item = detail as Record<string, unknown>;
        const normalized = {
          外观描述: String(item.外观描述 ?? '').trim(),
          当前状态: String(item.当前状态 ?? '').trim(),
        };
        return normalized.外观描述 || normalized.当前状态 ? ([part.trim(), normalized] as const) : null;
      })
      .filter((entry): entry is readonly [string, { 外观描述: string; 当前状态: string }] => entry !== null),
  );
  const incompleteParts = expectedParts.filter(part => {
    const detail = normalized[part];
    return !detail || detail.外观描述.replace(/\s/g, '').length < 60 || detail.当前状态.replace(/\s/g, '').length < 60;
  });
  if (incompleteParts.length) throw new Error(`AI 返回部位缺失或内容过短：${incompleteParts.join('、')}`);
  return Object.fromEntries(expectedParts.map(part => [part, normalized[part]]));
}

function privateStatusPreviewValues(status: PrivateStatusDraft): Record<string, string> {
  return Object.fromEntries(
    Object.entries(status).flatMap(([part, detail]) => [
      [`${part} · 外观描述`, detail.外观描述],
      [`${part} · 当前状态`, detail.当前状态],
    ]),
  );
}

async function requestPrivateStatusAi(target: string) {
  if (aiBusyKey.value) return;
  const info = privateStatusTargetInfo(target);
  if (!info) return;
  if (info.owner === 'character' && !info.label) {
    setStatus('请先填写 NPC 姓名，再生成该 NPC 的私密状态。', 'error');
    return;
  }
  if (info.owner === 'protagonist' && !form.主角.启用) {
    setStatus('主角已关闭，不能为关闭中的主角生成私密状态。', 'error');
    return;
  }
  const expectedParts = privateStatusPartsForGender(info.gender);
  if (!expectedParts) {
    setStatus(`请先将“${info.label}”的性别明确填写为“女”或“男”，再生成私密状态。`, 'error');
    return;
  }
  aiBusyKey.value = target;
  setStatus(`正在为“${info.label}”生成私密状态预览…`, 'working');
  const revision = contextRevision.value;
  const currentStatus = filledSnapshot(info.status) ?? {};
  const prompt = `【任务】
请为“${info.label}”生成一份可供玩家预览的动态私密状态。只返回结构化 JSON，不要直接写入表单。

【已确认上下文】
${JSON.stringify(contextSnapshot(false), null, 2)}

【当前已有私密状态】
${JSON.stringify(currentStatus, null, 2)}

【性别与标准部位】
- 已确认性别：${info.gender}
- 本次必须且只能返回：${expectedParts.join('、')}

【输出要求】
- 可采用对象必须只有一个“私密状态”键；私密状态必须使用上方列出的全部标准部位，不得缺项或增加其他部位。
- 私密状态是面向玩家的全知身体档案，不受叙事视角、衣物遮挡、角色是否主动展示或现场观察角度限制；目标是提供直白、细腻、情色化且富有窥视感的高密度身体信息。
- 每个部位必须同时给出“外观描述”和“当前状态”，每个字段分别使用二至四句、至少六十个汉字。
- 外观描述记录衣物之下长期存在的身体本身，覆盖形状与比例、颜色与肤质、局部结构、个体辨识特征中的至少三类，不以照片、视线或可见范围为边界。
- 当前状态必须写明衣物或外物之下的实际身体状态，并结合当前姿态造成的形变或牵拉、接触与受压或摩擦、温度与湿润程度、汗液或分泌物及残留痕迹等至少四类适用事实；衣物遮蔽只能占其中一个信息点。
- 脸部、口部、手部与足部同样使用具有感官吸引力和情色张力的细腻身体描写，避免普通证件照式外貌摘要；整体使用直接身体词汇和具体感官事实，避免含蓄代称、纯医学报告式表达与空泛抒情。
- 禁止使用“胸部”“阴部”“下体”“生殖器”“脚部”等概括键，也禁止返回“待记录”“未知”“普通”“正常”“无异常”“静息”“照片中未见”“不可见”“隐藏在衣物下”“未观察到”等低信息或回避性内容。
- 已有部位只用于参考，玩家采用时已有非空字段不会被覆盖。
- 不要返回穿着、外貌、当前状态或其他字段；结果必须先预览再采用。
- 输出前逐项自检：键集合必须与上方标准部位逐字一致，每个标准部位的两个字段均达到长度与信息维度，当前状态明确穿透衣物记录身体本身；任一条件未满足时继续补全。
- 只输出 JSON：结论、理由、可执行约束、可采用。`;
  try {
    const parsed = (await requestStructuredJson(
      prompt,
      `请只生成“${info.label}”的私密状态结构化预览。`,
      `human-revision-private-status-${target}-${Date.now()}`,
      () => privateStatusSuggestionSchema(expectedParts),
    )) as PrivateStatusAiPayload;
    const privateStatus = normalizePrivateStatusAiValue(parsed.可采用?.私密状态, expectedParts);
    aiPreview.value = {
      target,
      title: `${info.label} · 私密状态 AI 预览`,
      layer: 'characters',
      kind: 'private-status',
      summary: String(parsed.结论 ?? '').trim() || '已生成一组动态私密状态，采用前仍可检查。',
      rationale: String(parsed.理由 ?? '').trim(),
      constraints: Array.isArray(parsed.可执行约束)
        ? parsed.可执行约束.map(item => String(item).trim()).filter(Boolean)
        : [],
      values: privateStatusPreviewValues(privateStatus),
      privateStatusValues: privateStatus,
      contextRevision: revision,
    };
    setStatus('私密状态已进入预览，确认采用后才会写入；已有非空字段保持不变。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] AI 私密状态生成失败', error);
    setStatus(`AI 私密状态生成失败：${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    aiBusyKey.value = '';
  }
}

async function completeRemaining(requestLayer: LayerId = currentLayerMeta.value.id) {
  if (aiBusyKey.value) return;
  const allowedDescriptors = bulkPendingDescriptors(requestLayer);
  const allowedKeys = allowedDescriptors.map(descriptor => descriptor.id);
  aiBusyKey.value = 'bulk';
  setStatus('正在补全本层空白项…', 'working');
  try {
    const payload = await requestJson(
      buildBulkPrompt(requestLayer),
      '请只补全当前层空白项，并返回可预览结果。',
      `human-revision-bulk-${Date.now()}`,
    );
    aiPreview.value = {
      target: 'bulk',
      title: `${layers.find(layer => layer.id === requestLayer)?.title ?? '本层'} · AI 补全预览`,
      layer: requestLayer,
      summary: payload.结论 || '已根据已有想法补出一组可采用的空白回答。',
      rationale: payload.理由 || '',
      constraints: payload.可执行约束 ?? [],
      values: payload.可采用 ?? {},
      contextRevision: contextRevision.value,
      bulkAllowedKeys: allowedKeys,
    };
    setStatus('本层补全结果已进入预览，确认后才会写入空白回答。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] AI 批量补全失败', error);
    setStatus(`AI 整理失败：${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    aiBusyKey.value = '';
  }
}

function resolveAiDescriptor(target: string): AiFieldDescriptor | undefined {
  const descriptor = aiFieldMap[target];
  if (descriptor) return descriptor;
  const protagonistMatch = target.match(/^characters\.protagonist\.(.+)$/);
  if (protagonistMatch && protagonistFieldNames.includes(protagonistMatch[1] as ProtagonistField)) {
    return protagonistFieldDescriptor(protagonistMatch[1] as ProtagonistField);
  }
  const match = target.match(/^character:(\d+)\.(.+)$/);
  if (!match || !characterFieldNames.includes(match[2] as CharacterField)) return undefined;
  return characterFieldDescriptor(Number(match[1]), match[2] as CharacterField);
}

function applyCompositeValues(target: string, values: Record<string, string>) {
  if (target === 'protagonist') {
    [
      '性别',
      '年龄',
      '身高',
      '体型',
      '面容气质',
      '身体特征',
      '身份与位置',
      '追求',
      '性格主色',
      '性格与声音',
      '补充设定',
      '上装',
      '下装',
      '内衣',
      '袜子',
      '鞋子',
      '配饰',
    ].forEach(field => {
      let value = values[field]?.trim();
      if (!value) return;
      if (field === '年龄') {
        const digits = value.replace(/\D/g, '');
        const num = parseInt(digits, 10);
        value = num > 0 ? String(num) : '';
        if (!value) return;
      }
      const appearanceFieldNames = ['身高', '体型', '面容气质', '身体特征'];
      const clothingFieldNamesForProtagonist = ['上装', '下装', '内衣', '袜子', '鞋子', '配饰'];
      const currentValue = appearanceFieldNames.includes(field)
        ? form.主角.外貌[field as keyof AppearanceDraft]
        : clothingFieldNamesForProtagonist.includes(field)
          ? form.主角.穿着[field as keyof ClothingDraft]
          : (form.主角 as unknown as Record<string, string>)[field];
      if (currentValue?.trim() && !['无', '不适用', '0'].includes(currentValue.trim())) return;
      if (appearanceFieldNames.includes(field)) form.主角.外貌[field as keyof AppearanceDraft] = value;
      else if (clothingFieldNamesForProtagonist.includes(field)) form.主角.穿着[field as keyof ClothingDraft] = value;
      else (form.主角 as unknown as Record<string, string>)[field] = value;
    });
    return;
  }
  const match = target.match(/^character:(\d+)$/);
  if (!match) return;
  const character = form.重要角色[Number(match[1])];
  if (!character) return;
  characterFieldNames.forEach(field => {
    let value = values[field]?.trim();
    if (!value) return;
    if (field === '年龄') {
      const digits = value.replace(/\D/g, '');
      const num = parseInt(digits, 10);
      value = num > 0 ? String(num) : '';
      if (!value) return;
    }
    if (!isAiFieldBlank(characterFieldDescriptor(Number(match[1]), field))) return;
    writeCharacterField(character, field, value);
  });
}

function applyPrivateStatusPreview(preview: AiPreview): void {
  const info = privateStatusTargetInfo(preview.target);
  const generated = preview.privateStatusValues ?? {};
  if (!info) return;
  const targetStatus = info.status;
  Object.entries(generated).forEach(([part, detail]) => {
    const existing = targetStatus[part];
    if (!existing) {
      targetStatus[part] = { 外观描述: detail.外观描述, 当前状态: detail.当前状态 };
      return;
    }
    if (!existing.外观描述.trim() && detail.外观描述.trim()) existing.外观描述 = detail.外观描述;
    if (!existing.当前状态.trim() && detail.当前状态.trim()) existing.当前状态 = detail.当前状态;
  });
}

function applyAiPreview() {
  const preview = aiPreview.value;
  if (!preview) return;
  const values = preview.values;
  if (preview.target === 'bulk') {
    const allowedKeys = new Set(preview.bulkAllowedKeys ?? []);
    Object.entries(values).forEach(([key, value]) => {
      if (!allowedKeys.has(key)) return;
      const descriptor = resolveAiDescriptor(key);
      if (descriptor?.layer !== preview.layer || !isAiFieldBlank(descriptor) || !value.trim()) return;
      let text = value.trim();
      if (key === 'characters.protagonist.age' || key.endsWith('.年龄')) {
        const digits = text.replace(/\D/g, '');
        const num = parseInt(digits, 10);
        text = num > 0 ? String(num) : '';
      }
      descriptor.write(text);
    });
  } else if (preview.kind === 'private-status') {
    applyPrivateStatusPreview(preview);
  } else if (preview.target === 'protagonist' || preview.target.startsWith('character:')) {
    if (preview.target.includes('.')) {
      const descriptor = resolveAiDescriptor(preview.target);
      if (descriptor) descriptor.write(values[preview.target] ?? preview.summary);
    } else applyCompositeValues(preview.target, values);
  } else {
    const descriptor = resolveAiDescriptor(preview.target);
    const value = descriptor ? (values[descriptor.id] ?? preview.summary) : '';
    if (descriptor && value.trim()) descriptor.write(value.trim());
  }
  aiPreview.value = null;
  setStatus('已采用 AI 整理结果，内容仍可继续修改。', 'success');
}

function closeAiPreview() {
  aiPreview.value = null;
}

async function regenerateAiPreview() {
  const preview = aiPreview.value;
  if (!preview) return;
  const { target, layer } = preview;
  closeAiPreview();
  if (target === 'bulk') return completeRemaining(layer);
  if (preview.kind === 'private-status') return requestPrivateStatusAi(target);
  if (target === 'protagonist') return requestProtagonistAi();
  const match = target.match(/^character:(\d+)$/);
  if (match) return requestCharacterAi(Number(match[1]));
  return requestAi(target);
}

function buildOpeningSnapshot(): OpeningFormSnapshot {
  return {
    让现实编辑器参与世界观生成: form.让现实编辑器参与世界观生成,
    故事起始日期: { ...form.故事起始日期 },
    体验与叙事方向: { ...form.体验与叙事方向 },
    世界与故事骨架: { ...form.世界与故事骨架 },
    主角: {
      ...form.主角,
      外貌: { ...form.主角.外貌 },
      穿着: { ...form.主角.穿着 },
      私密状态: hydratePrivateStatus(form.主角.私密状态),
    },
    重要角色: form.重要角色.map(({ localId: _localId, ...character }) => ({
      ...character,
      穿着: { ...character.穿着 },
      私密状态: hydratePrivateStatus(character.私密状态),
    })),
    世界落地与开场准备: { ...form.世界落地与开场准备 },
    现实编辑器: {
      ...form.现实编辑器,
      可修改范围: [...form.现实编辑器.可修改范围],
    },
  };
}

function buildOpeningConfig() {
  return {
    故事起始日期: form.故事起始日期,
    体验与叙事方向: form.体验与叙事方向,
    世界与故事骨架: form.世界与故事骨架,
    主角与重要角色: { 主角: form.主角, 重要角色: form.重要角色 },
    世界落地与开场准备: form.世界落地与开场准备,
    现实编辑器: form.现实编辑器,
    现实编辑器参与世界观生成: form.让现实编辑器参与世界观生成,
  };
}

function buildOpeningPrompt() {
  const editorEntry = form.让现实编辑器参与世界观生成
    ? '编辑器参与世界观生成已开启，可以将它与前文自然连接。'
    : '编辑器参与世界观生成关闭。世界骨架此前没有提及或暗示它；现在必须把它作为突然出现的外来事物引入，不得把它改写成世界原生制度。';
  return `【本次任务】\n你是第一幕叙事引擎。请根据以下创作访谈生成唯一的一份正式开场，供玩家直接开始 RP。\n\n【创作授权】\n${buildAuthorizationLayer()}\n\n【已确认配置】\n${JSON.stringify(buildOpeningConfig(), null, 2)}\n\n【世界与编辑器边界】\n${editorEntry}\n\n【叙事执行】\n- 先从已填写的故事起始日期、具体地点、动作或正在发生的变化切入，不写欢迎词，不写配置说明。日期必须原样遵循玩家填写值，不得使用现实当前日期或自行改写。\n- 让世界规则通过人物的行动、对话、制度和环境显现，不把设定列成清单。\n- 主角启用时，不替玩家决定主角的关键行动、台词或心理；把选择停在可接续的位置。主角关闭时，玩家留在故事外，现实编辑器不作为正文人物。\n- 主线只使用已登记的主角和重要角色。没有登记重要角色时，允许必要的无名或低权重场景人物短暂出现、行动或说出承接场景的台词，但不得为其新增抢占主线的核心身份、长线关系或主线目标；环境、物件、制度和编辑器界面仍可承担主要开场信息。\n- 现实编辑器以配置的形式出现，可以有提示、面板、文字、设备或异常反馈，但不作为会说话的人格角色。\n- 结尾停在一个未完成动作、清晰选择或正在扩大的现场变化上，让玩家能立刻回应。\n- 全文只生成这一份开场，不列出候选，不输出备选事件，不解释你的写作过程。\n\n【输出格式】\n- 只输出正文和最后一行 <StatusPlaceHolderImpl/>。\n- 不输出 JSON、配置复述、标题、思考过程或作者说明。\n- 正文长度约 900~1500 字，具体服从文风与玩家已确认的体验。`;
}

async function requestOpening(prompt: string, userInput: string): Promise<string> {
  const result = await generateRaw({
    user_input: userInput,
    should_silence: true,
    generation_id: `human-revision-opening-${Date.now()}`,
    custom_api: { max_tokens: 'unset' },
    ordered_prompts: [
      { role: 'system', content: buildAuthorizationLayer() },
      { role: 'system', content: prompt },
      { role: 'assistant', content: '<|no-trans|>我已接受创作任务，只输出一份可直接开始 RP 的正式开场。' },
      'user_input',
    ],
  });
  const text = extractGenerateText(result)
    .replace(/<thinking>[\s\S]*?<\/thinking>/gis, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .trim();
  if (!text) throw new Error('AI 没有返回开场正文');
  return text.replace(/<StatusPlaceHolderImpl\s*\/>/gi, '').trim();
}

async function generateOpeningDraft(note = '') {
  if (openingGenerating.value) return;
  openingGenerating.value = true;
  setStatus(note ? '正在按修改意见重新生成唯一开场…' : '正在生成唯一开场预览…', 'working');
  const revision = contextRevision.value;
  try {
    const prompt = `${buildOpeningPrompt()}${note ? `\n\n【针对上一份开场的修改意见】\n${note}\n只修改这份开场，不生成第二份候选。` : ''}`;
    openingPreview.value = await requestOpening(prompt, note || '请生成唯一的正式开场。');
    openingContextRevision.value = revision;
    setStatus('唯一开场已生成，请预览后确认签发。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] 开场生成失败', error);
    setStatus(`开场生成失败：${error instanceof Error ? error.message : String(error)}`, 'error');
  } finally {
    openingGenerating.value = false;
  }
}

async function confirmOpening() {
  if (!openingPreview.value || openingPreviewStale.value || starting.value) return;
  if (!isOpeningDateComplete(form.故事起始日期)) {
    currentLayer.value = 0;
    scrollToTop();
    setStatus('故事起始日期尚未完整有效，请返回第一层填写 1–9999 年、1–12 月、1–31 日后再签发。', 'error');
    return;
  }
  starting.value = true;
  setStatus('正在签发配置并创建开场楼层…', 'working');
  const snapshot = buildOpeningSnapshot();
  const oldData = normalizeOpeningMvuData(Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() }));
  const beforeMessages = openingMessages();
  const beforeMessageIds = new Set(beforeMessages.map(item => item.message_id));
  const updateVariable = buildOpeningUpdateVariable(snapshot, { protagonistName: protagonistName.value });
  const message = appendOpeningUpdateVariable(openingPreview.value, updateVariable);
  let mutation: ChatLoreMutation | undefined;
  let createdMessageId: number | undefined;
  try {
    mutation = await commitCurrentChatLore(snapshot);
    const expectedChatLore = await verifyChatLoreMutation(mutation);
    console.info('[人间修订中·世界配置] Chat Lore 后置条件已确认', {
      buildMarker: HUMAN_REVISION_BUILD_MARKER,
      worldbookName: mutation.worldbookName,
      binding: expectedChatLore.binding,
      managedEntryCount: expectedChatLore.managedEntries.length,
    });
    const parsed = await Mvu.parseMessage(message, oldData);
    if (!parsed || !parsed.stat_data) throw new Error('Mvu.parseMessage 未返回可持久化的 stat_data');
    console.info('[人间修订中·世界配置] MVU parseMessage 已返回', {
      buildMarker: HUMAN_REVISION_BUILD_MARKER,
      roots: Object.keys(parsed.stat_data),
      updateVariablePresent: message.includes('<UpdateVariable>'),
    });
    await createChatMessages([{ role: 'assistant', message, data: parsed }], { refresh: 'none' });
    const createdMessage = await waitForCreatedOpeningMessage(message, parsed, beforeMessageIds);
    createdMessageId = createdMessage.message_id;
    if (!createdMessage.message.includes('<UpdateVariable>')) {
      throw new Error('新消息回读成功但正文缺少可审计的 <UpdateVariable>');
    }
    if (!_.isEqual(createdMessage.data, parsed)) {
      throw new Error('新消息回读成功但 MVU 数据与 parseMessage 返回值不一致');
    }
    await SillyTavern.saveChat();
    const persistedMessage = await waitForCreatedOpeningMessage(message, parsed, beforeMessageIds);
    console.info('[人间修订中·世界配置] 新消息写后回读已确认', {
      buildMarker: HUMAN_REVISION_BUILD_MARKER,
      messageId: persistedMessage.message_id,
      updateVariablePresent: persistedMessage.message.includes('<UpdateVariable>'),
      statDataRoots: Object.keys(persistedMessage.data?.stat_data ?? {}),
    });
    setStatus('开场已签发，往下翻阅新楼层即可开始游玩。', 'success');
  } catch (error) {
    console.error('[人间修订中·世界配置] 开场签发失败', error);
    if (createdMessageId === undefined) {
      const candidate = findCreatedOpeningMessage(message, {}, beforeMessageIds);
      if (candidate) createdMessageId = candidate.message_id;
    }
    const rollbackErrors: string[] = [];
    if (createdMessageId !== undefined) {
      try {
        await deleteChatMessages([createdMessageId], { refresh: 'none' });
        await SillyTavern.saveChat();
      } catch (rollbackError) {
        rollbackErrors.push(
          `消息回滚失败：${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        );
      }
    }
    if (mutation) {
      try {
        await rollbackChatLoreMutation(mutation);
      } catch (rollbackError) {
        rollbackErrors.push(
          `Chat Lore 回滚失败：${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        );
      }
    }
    const detail = error instanceof Error ? error.message : String(error);
    const rollbackDetail = rollbackErrors.length ? `；${rollbackErrors.join('；')}` : '；已回滚已写入状态';
    setStatus(`签发失败：${detail}${rollbackDetail}`, 'error');
  } finally {
    starting.value = false;
  }
}

onMounted(() => {
  hydrateFromMvu();
  refreshOpeningPlans();
  window.addEventListener('storage', onOpeningPlanStorageChange);
  syncProtagonistPersona();
  listenForPersonaChanges();
  removeThemeListener = onThemeChange(theme => (activeTheme.value = theme));
  if (!document.getElementById('human-revision-interview-fonts')) {
    const style = document.createElement('style');
    style.id = 'human-revision-interview-fonts';
    style.textContent = `@font-face { font-family: 'Theme Archive Preview'; src: url("${themeArchiveFontUrl}") format('woff2'); font-display: swap; } @font-face { font-family: 'Theme Astrolabe Preview'; src: url("${themeAstrolabeFontUrl}") format('woff2'); font-display: swap; } @font-face { font-family: 'Theme Terminal Preview'; src: url("${themeTerminalFontUrl}") format('woff2'); font-display: swap; } @font-face { font-family: 'Theme Neon Preview'; src: url("${themeNeonFontUrl}") format('woff2'); font-display: swap; }`;
    document.head.appendChild(style);
    injectedThemeFontStyle = style;
  }
});

onUnmounted(() => {
  window.removeEventListener('storage', onOpeningPlanStorageChange);
  removePersonaListener?.();
  removeThemeListener?.();
  injectedThemeFontStyle?.remove();
});
</script>

<style scoped>
.dossier-app-shell {
  position: relative;
  width: min(980px, 100%);
  max-width: 100%;
  margin: 0 auto;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  box-sizing: border-box;
}

.dossier-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;
  min-width: 0;
  width: 100%;
}

.dossier-form-column {
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.dossier-summary-column {
  position: sticky;
  top: 12px;
}

/* Layer transition */
.layer-fade-enter-active,
.layer-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.layer-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.layer-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 900px) {
  .dossier-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .dossier-summary-column {
    position: static;
    order: 2;
  }
}
</style>
