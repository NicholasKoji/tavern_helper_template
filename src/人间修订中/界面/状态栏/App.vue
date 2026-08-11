<!-- eslint-disable better-tailwindcss/no-unknown-classes -->
<template>
  <main class="status-shell" data-status-bar="human-revision-status-v1" :data-theme="themeId">
    <header class="topbar">
      <div class="topbar-identity">
        <span class="kicker">REALITY EDITOR</span>
        <h1 class="title">人间修订中</h1>
      </div>
      <span class="editor-badge">{{ data.现实编辑器.状态 }}</span>
      <span class="version">{{ data.现实编辑器.版本 }}</span>
    </header>

    <section class="meta-strip" aria-label="当前场景">
      <div class="meta-item">
        <span class="label"><CalendarDays :size="13" stroke-width="1.8" />日期</span>
        <span class="value">{{ formatDate }}</span>
      </div>
      <div class="meta-item">
        <span class="label"><Clock3 :size="13" stroke-width="1.8" />时间</span>
        <span class="value">{{ formatTime }}</span>
      </div>
      <div class="meta-item location">
        <span class="label"><MapPin :size="13" stroke-width="1.8" />地点</span>
        <span class="value">{{ formatLocation }}</span>
      </div>
      <div class="meta-item summary">
        <span class="label"><ScrollText :size="13" stroke-width="1.8" />摘要</span>
        <span class="value summary-text" :title="scene.摘要">{{ scene.摘要 }}</span>
      </div>
    </section>

    <nav class="tabs" role="tablist" aria-label="状态栏页签">
      <button
        v-for="tab in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        role="tab"
        type="button"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeTab === tab.id ? 0 : -1"
        @click="setTab(tab.id)"
        @keydown="onTabKeydown"
      >
        <component :is="tab.icon" :size="16" stroke-width="1.8" />
        {{ tab.label }}
      </button>
    </nav>

    <div class="content">
      <section
        v-show="activeTab === 'overview'"
        id="panel-overview"
        class="panel"
        :class="{ active: activeTab === 'overview' }"
        role="tabpanel"
        aria-labelledby="tab-overview"
      >
        <article class="card">
          <header class="card-header">
            <h2 class="card-title"><BookOpen :size="17" stroke-width="1.8" />世界档案</h2>
          </header>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">世界模板</div>
              <div class="data-val">{{ data.世界配置.世界模板 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">时代背景</div>
              <div class="data-val">{{ data.世界配置.时代背景 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">主线目标</div>
              <div class="data-val">{{ data.世界配置.剧情方向.主线目标 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">叙事视角</div>
              <div class="data-val">{{ data.世界配置.叙事视角 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">叙事文风</div>
              <div class="data-val">{{ data.世界配置.叙事文风 }}</div>
            </div>
          </div>
          <div class="tone-block">
            <div v-for="tone in tones" :key="tone.key" class="tone-row">
              <span class="tone-label">{{ tone.label }}</span>
              <span class="meter" aria-hidden="true">
                <span class="meter-fill" :style="{ width: `${tone.value}%` }" />
              </span>
              <span class="tone-value">{{ tone.value }}</span>
            </div>
          </div>
        </article>

        <article class="card">
          <header class="card-header">
            <h2 class="card-title"><ShieldCheck :size="17" stroke-width="1.8" />现实编辑器</h2>
            <span class="status-tag">{{ data.现实编辑器.状态 }}</span>
          </header>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">版本</div>
              <div class="data-val">{{ data.现实编辑器.版本 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">权限</div>
              <div class="data-val perms">
                <span class="perm ok">改规则 ✓</span>
                <span class="perm no">改权限 ✗</span>
                <span class="perm no">卸载 ✗</span>
              </div>
            </div>
          </div>
          <div v-if="ruleGroups.length" class="rules">
            <details v-for="[category, rules] in ruleGroups" :key="category" class="rule-group">
              <summary>
                <span>{{ category }}</span>
                <span class="rule-count">{{ Object.keys(rules).length }}</span>
              </summary>
              <ul>
                <li v-for="(content, name) in rules" :key="name">
                  <b>{{ name }}</b
                  >：{{ content }}
                </li>
              </ul>
            </details>
          </div>
          <p v-else class="empty-state">暂无生效规则</p>
        </article>
      </section>

      <section
        v-show="activeTab === 'protagonist'"
        id="panel-protagonist"
        class="panel"
        :class="{ active: activeTab === 'protagonist' }"
        role="tabpanel"
        aria-labelledby="tab-protagonist"
      >
        <article v-if="protagonistEnabled" class="card">
          <header class="card-header">
            <h2 class="card-title"><User :size="17" stroke-width="1.8" />主角档案</h2>
          </header>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">姓名</div>
              <div class="data-val">{{ data.主角.姓名 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">身份</div>
              <div class="data-val">{{ data.主角.身份 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">性格</div>
              <div class="data-val">{{ data.主角.性格 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">目标</div>
              <div class="data-val">{{ data.主角.目标 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">与编辑器关系</div>
              <div class="data-val">{{ data.主角.与编辑器关系 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">补充设定</div>
              <div class="data-val">{{ data.主角.补充设定 }}</div>
            </div>
          </div>
        </article>
        <p v-else class="notice-state">
          <strong>主角未启用</strong>
          玩家为故事外操作者，主角档案不参与叙事。
        </p>
      </section>

      <section
        v-show="activeTab === 'npc'"
        id="panel-npc"
        class="panel"
        :class="{ active: activeTab === 'npc' }"
        role="tabpanel"
        aria-labelledby="tab-npc"
      >
        <div v-if="npcEntries.length" class="npc-layout">
          <aside class="npc-list" aria-label="NPC 列表">
            <button
              v-for="[name, npc] in npcEntries"
              :key="name"
              class="npc-select"
              :class="{ active: selectedNpcName === name }"
              type="button"
              @click="selectedNpcName = name"
            >
              <strong>{{ name }}</strong>
              <span>{{ npc.基础信息.身份 || '身份未记录' }}</span>
              <span class="npc-favor">好感 {{ npc.基础信息.好感度 ?? '--' }}</span>
            </button>
          </aside>
          <article v-if="selectedNpc" class="card npc-detail">
            <header class="card-header">
              <h2 class="card-title"><Users :size="17" stroke-width="1.8" />{{ selectedNpcName }}</h2>
              <span class="status-tag">好感 {{ selectedNpc.基础信息.好感度 ?? '--' }}</span>
            </header>

            <h3 class="sub-title">基础信息</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">性别</div>
                <div class="data-val">{{ selectedNpc.基础信息.性别 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">年龄</div>
                <div class="data-val">{{ selectedNpc.基础信息.年龄 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">身份</div>
                <div class="data-val">{{ selectedNpc.基础信息.身份 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">关系定位</div>
                <div class="data-val">{{ selectedNpc.基础信息.关系定位 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">好感度</div>
                <div class="data-val favor-row">
                  <span class="meter" aria-hidden="true">
                    <span class="meter-fill" :style="{ width: `${selectedNpc.基础信息.好感度 || 0}%` }" />
                  </span>
                  <span class="tone-value">{{ selectedNpc.基础信息.好感度 }}</span>
                </div>
              </div>
            </div>

            <h3 class="sub-title">外貌</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">身高</div>
                <div class="data-val">{{ selectedNpc.外貌.身高 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">罩杯</div>
                <div class="data-val">{{ selectedNpc.外貌.罩杯 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">体型</div>
                <div class="data-val">{{ selectedNpc.外貌.体型 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">面容气质</div>
                <div class="data-val">{{ selectedNpc.外貌.面容气质 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">身体特征</div>
                <div class="data-val">{{ selectedNpc.外貌.身体特征 }}</div>
              </div>
            </div>

            <h3 class="sub-title">性格</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">底色</div>
                <div class="data-val">{{ selectedNpc.性格.底色 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">主色调</div>
                <div class="data-val">{{ selectedNpc.性格.主色调 }}</div>
              </div>
            </div>

            <h3 class="sub-title">当前状态</h3>
            <p class="paragraph">{{ selectedNpc.当前状态 }}</p>

            <h3 class="sub-title">穿着</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">上装</div>
                <div class="data-val">{{ selectedNpc.穿着.上装 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">下装</div>
                <div class="data-val">{{ selectedNpc.穿着.下装 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">内衣</div>
                <div class="data-val">{{ selectedNpc.穿着.内衣 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">袜子</div>
                <div class="data-val">{{ selectedNpc.穿着.袜子 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">鞋子</div>
                <div class="data-val">{{ selectedNpc.穿着.鞋子 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">配饰</div>
                <div class="data-val">{{ selectedNpc.穿着.配饰 }}</div>
              </div>
            </div>

            <h3 class="sub-title">当前想法</h3>
            <p class="paragraph">{{ selectedNpc.当前想法 }}</p>

            <div v-if="privateStateEntries.length" class="private-state">
              <h3 class="sub-title">私密状态</h3>
              <details v-for="[part, state] in privateStateEntries" :key="part" class="sub-block">
                <summary>{{ part }}</summary>
                <div class="detail-body">
                  <div class="data-row">
                    <div class="data-key">外观描述</div>
                    <div class="data-val">{{ state.外观描述 }}</div>
                  </div>
                  <div class="data-row">
                    <div class="data-key">当前状态</div>
                    <div class="data-val">{{ state.当前状态 }}</div>
                  </div>
                </div>
              </details>
            </div>
            <p v-else class="empty-state">暂无私密状态记录</p>
          </article>
        </div>
        <p v-else class="notice-state">
          <strong>暂无 NPC 记录</strong>
          当前剧情尚未写入可展示的 NPC。
        </p>
      </section>
    </div>
  </main>
  <div class="sr-only" aria-live="polite">{{ announcer }}</div>
</template>

<script setup lang="ts">
import {
  CalendarDays,
  BookOpen,
  Clock3,
  LayoutDashboard,
  MapPin,
  ScrollText,
  ShieldCheck,
  User,
  Users,
} from '@lucide/vue';
import { useLocalStorage } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import themeArchiveFontUrl from '../世界配置/fonts/theme-archive.woff2?url';
import { useDataStore } from './store';

type TabId = 'overview' | 'protagonist' | 'npc';

const store = useDataStore();
const data = computed(() => store.data);
const scene = computed(() => data.value.当前场景);
const activeTab = useLocalStorage<TabId>('human-revision:status_tab', 'overview');
const selectedNpcName = useLocalStorage('human-revision:selected_npc', '');
const announcer = ref('');
const themeId = ref<'archive'>('archive');

const THEME_STORAGE_KEY = 'zaohua-world-config-theme';
const themeFontStyleId = 'human-revision-status-fonts';
let injectedThemeFontStyle: HTMLStyleElement | null = null;

const tabs = [
  { id: 'overview' as const, label: '总览', icon: LayoutDashboard },
  { id: 'protagonist' as const, label: '主角', icon: User },
  { id: 'npc' as const, label: 'NPC', icon: Users },
];

const protagonistEnabled = computed(() => data.value.世界配置.主角启用);
const npcEntries = computed(() => Object.entries(data.value.NPC序列 ?? {}));
const selectedNpc = computed(() => (selectedNpcName.value ? data.value.NPC序列[selectedNpcName.value] : undefined));
const ruleGroups = computed(() => Object.entries(data.value.现实编辑器.生效规则 ?? {}));
const privateStateEntries = computed(() => Object.entries(selectedNpc.value?.私密状态 ?? {}));
const tones = computed(() => [
  { key: '色情浓度', label: '色情', value: data.value.世界配置.基调.色情浓度 },
  { key: '搞笑程度', label: '搞笑', value: data.value.世界配置.基调.搞笑程度 },
  { key: '轻松程度', label: '轻松', value: data.value.世界配置.基调.轻松程度 },
]);

const formatDate = computed(() => {
  const date = scene.value.日期;
  if (date.年 == null && date.月 == null && date.日 == null) {
    return '待生成';
  }
  return `${date.年 ?? '--'}年${date.月 ?? '--'}月${date.日 ?? '--'}日`;
});

const formatTime = computed(() => {
  const time = scene.value.时间;
  if (time.时 == null && time.分 == null) {
    return '待生成';
  }
  const hour = time.时 == null ? '--' : String(time.时).padStart(2, '0');
  const minute = time.分 == null ? '--' : String(time.分).padStart(2, '0');
  return `${hour}:${minute}`;
});

const formatLocation = computed(() => {
  const place = scene.value.地点;
  const parts = [place.一级区域, place.二级区域, place.三级地点];
  if (parts.every(value => !value || value === '待生成')) {
    return '待生成';
  }
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

onMounted(() => {
  try {
    if (localStorage.getItem(THEME_STORAGE_KEY) !== 'archive') {
      themeId.value = 'archive';
    }
  } catch (error) {
    console.warn('[人间修订中·状态栏] 主题偏好读取失败，使用档案主题。', error);
  }

  if (document.getElementById(themeFontStyleId)) {
    return;
  }
  const style = document.createElement('style');
  style.id = themeFontStyleId;
  style.textContent = `
    @font-face {
      font-family: 'Theme Archive Preview';
      src: url("${themeArchiveFontUrl}") format('woff2');
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }
  `;
  document.head.appendChild(style);
  injectedThemeFontStyle = style;
});

onUnmounted(() => {
  injectedThemeFontStyle?.remove();
  injectedThemeFontStyle = null;
});

function setTab(tab: TabId) {
  activeTab.value = tab;
  const found = tabs.find(item => item.id === tab);
  announcer.value = found ? `已切换到${found.label}页签` : '';
}

function onTabKeydown(event: KeyboardEvent) {
  const target = event.currentTarget as HTMLButtonElement;
  const id = target.id.replace('tab-', '') as TabId;
  const currentIndex = tabs.findIndex(tab => tab.id === id);
  if (currentIndex < 0) {
    return;
  }

  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }
  event.preventDefault();
  setTab(tabs[nextIndex].id);
  requestAnimationFrame(() => document.getElementById(`tab-${tabs[nextIndex].id}`)?.focus());
}
</script>
