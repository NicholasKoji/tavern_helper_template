<template>
  <main class="status-shell">
    <div class="terminal-frame" :class="{ 'scene-virtual': isVirtual }">
      <header class="topbar">
        <div class="topbar-identity">
          <span class="kicker">PSSEA / VIRTUAL ECHO</span>
          <h1 class="title">虚拟回响 状态栏</h1>
        </div>
        <div class="scene-pill">{{ data.当前场景 }}</div>
      </header>

      <section class="meta-strip" aria-label="当前时间地点">
        <div class="meta-item">
          <span class="label"><Icon name="calendar" />DATE</span>
          <span class="value">{{ formatDate(activeScene.日期) }}</span>
        </div>
        <div class="meta-item">
          <span class="label"><Icon name="clock" />TIME</span>
          <span class="value">{{ formatTime(activeScene.时间) }}</span>
        </div>
        <div class="meta-item location">
          <span class="label"><Icon name="mapPin" />LOC</span>
          <span class="value">{{ activeScene.地点.三级地点 }}</span>
        </div>
      </section>

      <nav v-show="!isContentCollapsed" class="tabs" role="tablist" aria-label="状态栏页签">
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
          <Icon :name="tab.icon" />
          {{ tab.label }}
        </button>
      </nav>

      <div id="status-content" v-show="!isContentCollapsed" class="content">
        <section
          v-show="activeTab === 'overview'"
          id="panel-overview"
          class="panel"
          :class="{ active: activeTab === 'overview' }"
          role="tabpanel"
          aria-labelledby="tab-overview"
        >
          <div class="accordions">
            <details class="module-details">
              <summary>
                <span class="card-title"><Icon name="list" />当前任务</span>
                <span class="status-tag">{{ data.当前任务.状态 }}</span>
              </summary>
              <div class="detail-body data-list">
                <div v-for="[key, value] in entries(data.当前任务)" :key="key" class="data-row">
                  <div class="data-key">{{ key }}</div>
                  <div class="data-val">{{ value }}</div>
                </div>
              </div>
            </details>

            <details class="module-details">
              <summary>
                <span class="card-title"><Icon name="crosshair" />当前场景</span>
                <span class="status-tag">{{ data.当前场景 }}</span>
              </summary>
              <div class="detail-body data-list">
                <div class="data-row">
                  <div class="data-key">场景类型</div>
                  <div class="data-val">{{ data.当前场景 }}</div>
                </div>
                <div class="data-row">
                  <div class="data-key">时间</div>
                  <div class="data-val">{{ formatDate(activeScene.日期) }} {{ formatTime(activeScene.时间) }}</div>
                </div>
                <div class="data-row">
                  <div class="data-key">地点</div>
                  <div class="data-val">{{ formatLocation(activeScene.地点) }}</div>
                </div>
              </div>
            </details>
          </div>

          <StatusCard class="mt-10" title="主角即时状态">
            <template #icon><Icon name="activity" /></template>
            <p class="summary-line">{{ protagonistSceneState.当前状态 }}</p>
          </StatusCard>

          <StatusCard class="mt-10" title="NPC 速览" tag="点击跳转">
            <template #icon><Icon name="users" /></template>
            <div v-if="npcEntries.length" class="npc-jump-list">
              <button
                v-for="[name, npc] in npcEntries"
                :key="name"
                class="npc-chip"
                type="button"
                @click="jumpToNpc(name)"
              >
                <div class="npc-chip-head">
                  <strong>{{ name }}</strong>
                  <span>好感度 {{ npc.基础信息.好感度 }} / 100</span>
                </div>
                <div class="meter" aria-hidden="true">
                  <div class="meter-fill" :style="{ width: `${npc.基础信息.好感度 || 0}%` }"></div>
                </div>
                <p class="npc-thought">{{ npc.当前想法 || '当前想法未记录' }}</p>
              </button>
            </div>
            <div v-else class="empty-state">暂无 NPC 记录</div>
          </StatusCard>
        </section>

        <section
          v-show="activeTab === 'scene'"
          id="panel-scene"
          class="panel"
          :class="{ active: activeTab === 'scene' }"
          role="tabpanel"
          aria-labelledby="tab-scene"
        >
          <div class="accordions">
            <details class="module-details" open>
              <summary>
                <span class="card-title"><Icon name="building" />现实场景状态</span>
                <span class="status-tag">现实</span>
              </summary>
              <div class="detail-body data-list">
                <SceneRows :scene="data.现实场景状态" />
              </div>
            </details>
            <details class="module-details" open>
              <summary>
                <span class="card-title"><Icon name="monitor" />虚拟场景状态</span>
                <span class="status-tag">虚拟</span>
              </summary>
              <div class="detail-body data-list">
                <SceneRows :scene="data.虚拟场景状态" />
              </div>
            </details>
          </div>
        </section>

        <section
          v-show="activeTab === 'protagonist'"
          id="panel-protagonist"
          class="panel"
          :class="{ active: activeTab === 'protagonist' }"
          role="tabpanel"
          aria-labelledby="tab-protagonist"
        >
          <StatusCard title="杨世发">
            <template #icon><Icon name="user" /></template>
            <DataTree :data="data.主角" :options="characterTreeOptions" />
          </StatusCard>
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
                <div class="npc-select-head">
                  <strong>{{ name }}</strong>
                  <span>{{ npc.基础信息.好感度 }} / 100</span>
                </div>
                <div class="meter" aria-hidden="true">
                  <div class="meter-fill" :style="{ width: `${npc.基础信息.好感度 || 0}%` }"></div>
                </div>
              </button>
            </aside>
            <section>
              <StatusCard :title="selectedNpcName" :tag="`好感 ${selectedNpc?.基础信息.好感度 ?? '待记录'}`">
                <template #icon><Icon name="shield" /></template>
                <DataTree v-if="selectedNpc" :data="selectedNpc" :options="characterTreeOptions" />
              </StatusCard>
            </section>
          </div>
          <div v-else class="notice-state">
            <strong>暂无 NPC 记录</strong>
            当前剧情尚未写入可展示的 NPC。
          </div>
        </section>

        <section
          v-show="activeTab === 'items'"
          id="panel-items"
          class="panel"
          :class="{ active: activeTab === 'items' }"
          role="tabpanel"
          aria-labelledby="tab-items"
        >
          <div class="accordions">
            <details class="module-details" open>
              <summary>
                <span class="card-title"><Icon name="briefcase" />现实携带物</span>
              </summary>
              <div class="detail-body">
                <DataTree :data="data.携带物.现实" />
              </div>
            </details>
            <details class="module-details" open>
              <summary>
                <span class="card-title"><Icon name="box" />虚拟携带物</span>
              </summary>
              <div class="detail-body">
                <DataTree :data="data.携带物.虚拟" />
              </div>
            </details>
          </div>
        </section>
      </div>

      <button
        class="bottom-toggle"
        type="button"
        :aria-label="toggleLabel"
        :title="toggleLabel"
        :aria-expanded="!isContentCollapsed"
        aria-controls="status-content"
        @click="toggleContent"
      >
        <Icon :name="toggleIcon" />
      </button>
    </div>
  </main>
  <div class="sr-only" aria-live="polite">{{ announcer }}</div>
</template>

<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core';
import { computed, defineComponent, h, ref, watch } from 'vue';
import DataTree from './components/DataTree.vue';
import Icon from './components/Icon.vue';
import StatusCard from './components/StatusCard.vue';
import { useDataStore, type AnyRecord } from './store';

type TabId = 'overview' | 'scene' | 'protagonist' | 'npc' | 'items';

interface TimeValue {
  年?: number;
  月?: number;
  日?: number;
  时?: number;
  分?: number;
}

interface PlaceValue {
  一级区域?: string;
  二级区域?: string;
  三级地点?: string;
}

interface SceneValue extends AnyRecord {
  日期: TimeValue;
  时间: TimeValue;
  地点: PlaceValue;
}

const store = useDataStore();
const data = computed(() => store.data);
const activeTab = useLocalStorage<TabId>('virtual_echo:status_tab', 'overview');
const selectedNpcName = useLocalStorage('virtual_echo:selected_npc', '');
const isContentCollapsed = useLocalStorage('virtual_echo:content_collapsed', false);
const announcer = ref('');

const tabs = [
  { id: 'overview' as const, label: '总览', icon: 'dashboard' as const },
  { id: 'scene' as const, label: '场景', icon: 'map' as const },
  { id: 'protagonist' as const, label: '主角', icon: 'user' as const },
  { id: 'npc' as const, label: 'NPC', icon: 'users' as const },
  { id: 'items' as const, label: '物品', icon: 'box' as const },
];

const characterTreeOptions = {
  omitBaseName: true,
  forceOpen: ['私密状态'],
  forceOpenChildrenOf: ['私密状态'],
};

const npcEntries = computed(() => Object.entries(data.value.NPC序列 ?? {}));
const selectedNpc = computed(() => (selectedNpcName.value ? data.value.NPC序列[selectedNpcName.value] : undefined));
const isVirtual = computed(() => data.value.当前场景 === '虚拟');
const activeScene = computed(() => (isVirtual.value ? data.value.虚拟场景状态 : data.value.现实场景状态));
const protagonistSceneState = computed(() => (isVirtual.value ? data.value.主角.虚拟化身 : data.value.主角.现实身体));
const toggleIcon = computed(() => (isContentCollapsed.value ? 'chevronsDown' : 'chevronsUp'));
const toggleLabel = computed(() => (isContentCollapsed.value ? '展开状态栏内容' : '收起状态栏内容'));

const SceneRows = defineComponent({
  props: {
    scene: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const scene = props.scene as SceneValue;
      const baseRows = [
        ['日期', formatDateCN(scene.日期)],
        ['时间', formatTime(scene.时间)],
        ['地点', formatLocation(scene.地点)],
      ];
      const restRows = Object.entries(scene).filter(([key]) => !['日期', '时间', '地点'].includes(key));
      return [...baseRows, ...restRows].map(([key, value]) =>
        h('div', { class: 'data-row', key: String(key) }, [
          h('div', { class: 'data-key' }, String(key)),
          h('div', { class: 'data-val' }, formatCellValue(value)),
        ]),
      );
    };
  },
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

function setTab(tab: TabId) {
  activeTab.value = tab;
  const found = tabs.find(item => item.id === tab);
  announcer.value = found ? `已切换到${found.label}页签` : '';
}

function jumpToNpc(name: string) {
  selectedNpcName.value = name;
  setTab('npc');
  isContentCollapsed.value = false;
}

function toggleContent() {
  isContentCollapsed.value = !isContentCollapsed.value;
  announcer.value = isContentCollapsed.value ? '状态栏内容已收起' : '状态栏内容已展开';
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

function entries(record: AnyRecord) {
  return Object.entries(record);
}

function formatDate(date: TimeValue) {
  return `${date.年 ?? '----'}-${String(date.月 ?? '--').padStart(2, '0')}-${String(date.日 ?? '--').padStart(2, '0')}`;
}

function formatDateCN(date: TimeValue) {
  return `${date.年 ?? '----'}年${date.月 ?? '--'}月${date.日 ?? '--'}日`;
}

function formatTime(time: TimeValue) {
  return `${String(time.时 ?? '--').padStart(2, '0')}:${String(time.分 ?? '--').padStart(2, '0')}`;
}

function formatLocation(place: PlaceValue) {
  return `${place.一级区域 ?? '待记录'} / ${place.二级区域 ?? '待记录'} / ${place.三级地点 ?? '待记录'}`;
}

function formatCellValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '待记录';
  }
  if (typeof value === 'object') {
    return Object.entries(value as AnyRecord)
      .map(([key, inner]) => `${key}：${formatCellValue(inner)}`)
      .join(' / ');
  }
  return String(value);
}
</script>
