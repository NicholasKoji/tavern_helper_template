<template>
  <section class="est-status" :class="san_class">
    <div class="status-frame">
      <header class="status-header">
        <div class="brand-mark">
          <StatusIcon name="crest" size="badge" tone="main" glow />
        </div>
        <div class="brand-copy">
          <p class="eyebrow">ESTHISTRIA STATUS</p>
          <h1>埃希斯特利亚</h1>
        </div>
        <button class="icon-button san-button" type="button" aria-label="查看 SAN 状态" @click="open_panel = { type: 'sanState' }">
          <StatusIcon name="san" size="md" :tone="san_status.tone" :glow="store.data.主角.san值 < 80" />
        </button>
      </header>

      <button class="hero-card" type="button" @click="open_panel = { type: 'sanState' }">
        <div class="hero-identity">
          <div class="badge-shell">
            <StatusIcon name="protagonist" size="badge" tone="main" />
          </div>
          <div>
            <span class="field-label">主角</span>
            <strong>{{ store.data.主角.姓名 }}</strong>
            <span>{{ store.data.主角.年龄 }} 岁</span>
          </div>
        </div>
        <div class="san-readout">
          <span>{{ san_status.label }}</span>
          <strong>SAN {{ store.data.主角.san值 }}</strong>
          <div class="meter-track" aria-hidden="true">
            <span :style="{ width: percent(store.data.主角.san值, 100) + '%' }"></span>
          </div>
        </div>
      </button>

      <div class="scene-grid">
        <button class="scene-cell" type="button" @click="open_panel = { type: 'sceneTodo' }">
          <StatusIcon name="time" tone="blue" />
          <span>当前时间</span>
          <strong>{{ formatted_time_long }}</strong>
        </button>
        <button class="scene-cell scene-cell-wide" type="button" @click="open_panel = { type: 'sceneTodo' }">
          <StatusIcon name="location" tone="main" />
          <span>当前地点</span>
          <strong>{{ formatted_location }}</strong>
        </button>
        <button class="scene-cell" type="button" @click="open_panel = { type: 'sceneTodo' }">
          <StatusIcon name="weather" tone="cyan" />
          <span>天气</span>
          <strong>{{ formatted_weather }}</strong>
        </button>
      </div>

      <button class="todo-card" type="button" @click="open_panel = { type: 'sceneTodo' }">
        <div class="todo-icon">
          <StatusIcon name="todo" size="lg" tone="blue" />
        </div>
        <div>
          <span class="field-label">主要待办</span>
          <p>{{ store.data.待办事项.主要 }}</p>
        </div>
        <StatusIcon name="chevron" tone="muted" />
      </button>

      <div class="character-stack">
        <div class="section-title">
          <span>人物记录</span>
          <small>{{ character_total }} 名记录</small>
        </div>

        <div class="character-list-meta" aria-hidden="true">
          <span><StatusIcon name="knight" size="sm" tone="blue" />骑士 {{ knight_entries.length }}</span>
          <span><StatusIcon name="female-rider" size="sm" tone="crimson" />女骑 {{ female_entries.length }}</span>
        </div>

        <article v-if="!has_characters" class="empty-card">
          <StatusIcon name="crest" tone="muted" />
          <p>当前楼层尚未登记骑士或女骑记录。</p>
        </article>

        <div v-if="knight_entries.length" class="character-group-title">
          <StatusIcon name="knight" size="sm" tone="blue" />
          <span>骑士</span>
        </div>

        <article v-for="[name, knight] in knight_entries" :key="'knight-' + name" class="character-card">
          <button class="character-row" type="button" @click="toggleCharacter('knight', name)">
            <div class="avatar knight-avatar">
              <StatusIcon name="knight" size="lg" tone="blue" />
            </div>
            <div class="character-main">
              <span>骑士</span>
              <strong>{{ name }}</strong>
              <p>{{ knight.身份 }}</p>
            </div>
            <div class="character-meta">
              <span>{{ knight.年龄 }} 岁</span>
              <span>好感 {{ knight.好感度 }}</span>
              <StatusIcon :name="isExpanded('knight', name) ? 'collapse' : 'expand'" tone="muted" />
            </div>
          </button>

          <div v-if="isExpanded('knight', name)" class="accordion-body">
            <div class="detail-grid">
              <InfoPair label="年龄" :value="`${knight.年龄} 岁`" />
              <InfoPair label="态度" :value="knight.态度" />
            </div>
            <p class="summary-text">{{ truncate(knight.当前心理, 76) }}</p>
            <p class="summary-text action-summary">动作：{{ truncate(knight.当前动作, 62) }}</p>
            <button class="text-link" type="button" @click="open_panel = { type: 'knightDetail', name }">
              查看完整骑士详情
              <StatusIcon name="chevron" size="sm" tone="muted" />
            </button>
          </div>
        </article>

        <div v-if="female_entries.length" class="character-group-title">
          <StatusIcon name="female-rider" size="sm" tone="crimson" />
          <span>女骑</span>
        </div>

        <article v-for="[name, rider] in female_entries" :key="'female-' + name" class="character-card female-card">
          <button class="character-row" type="button" @click="toggleCharacter('femaleRider', name)">
            <div class="avatar female-avatar">
              <StatusIcon name="female-rider" size="lg" tone="crimson" />
            </div>
            <div class="character-main">
              <span>女骑</span>
              <strong>{{ name }}</strong>
              <p>{{ rider.身份 }} / {{ rider.所属骑士 || '未登记骑士' }}</p>
            </div>
            <div class="character-meta">
              <span>体力 {{ rider.体力 }}</span>
              <span>好感 {{ rider.好感度 }}</span>
              <StatusIcon :name="isExpanded('femaleRider', name) ? 'collapse' : 'expand'" tone="muted" />
            </div>
          </button>

          <div v-if="isExpanded('femaleRider', name)" class="accordion-body female-accordion">
            <div class="metric-row">
              <StatusIcon name="stamina" tone="crimson" />
              <span>当前体力</span>
              <strong>{{ rider.体力 }}/100</strong>
              <div class="meter-track" aria-hidden="true">
                <span :style="{ width: percent(rider.体力, 100) + '%' }"></span>
              </div>
            </div>
            <div class="detail-grid">
              <InfoPair label="年龄" :value="`${rider.年龄} 岁`" />
              <InfoPair label="所属关系" :value="rider.所属关系" />
              <InfoPair label="态度" :value="rider.态度" />
            </div>
            <p class="summary-text">{{ truncate(rider.当前心理, 76) }}</p>
            <p class="summary-text action-summary">动作：{{ truncate(rider.当前动作, 62) }}</p>
            <div class="quick-actions">
              <button type="button" @click="open_panel = { type: 'femaleRiderDetail', name }">
                <StatusIcon name="female-rider" size="sm" tone="crimson" />
                总览
              </button>
              <button type="button" @click="open_panel = { type: 'femaleRiderRelation', name }">
                <StatusIcon name="relation" size="sm" tone="crimson" />
                关系背景
              </button>
              <button type="button" @click="open_panel = { type: 'femaleRiderAppearance', name }">
                <StatusIcon name="appearance" size="sm" tone="blue" />
                外貌记录
              </button>
              <button type="button" @click="open_panel = { type: 'femaleRiderBody', name }">
                <StatusIcon name="body-record" size="sm" tone="crimson" />
                身材记录
              </button>
              <button type="button" @click="open_panel = { type: 'equipment', name }">
                <StatusIcon name="equipment" size="sm" tone="blue" />
                装备
              </button>
              <button type="button" @click="open_panel = { type: 'mobility', name }">
                <StatusIcon name="mobility" size="sm" tone="cyan" />
                机动能力
              </button>
            </div>
          </div>
        </article>
      </div>

      <Transition name="panel-slide">
        <aside v-if="open_panel && open_panel.type !== 'equipment'" class="detail-panel">
          <div class="panel-handle" aria-hidden="true"></div>
          <div class="panel-header">
            <div>
              <span class="field-label">{{ panel_eyebrow }}</span>
              <h2>{{ panel_title }}</h2>
            </div>
            <button class="panel-close" type="button" aria-label="关闭详情" @click="open_panel = null">
              <StatusIcon name="close" tone="dark" />
            </button>
          </div>

          <div v-if="open_panel.type === 'sceneTodo'" class="panel-content">
            <RecordBlock title="时间" :text="formatted_time_long" />
            <RecordBlock title="地点" :text="formatted_location" />
            <RecordBlock title="天气" :text="`${formatted_weather} / ${store.data.当前场景.天气.体感}`" />
            <RecordBlock title="环境" :text="store.data.当前场景.环境" />
            <RecordBlock title="主要待办" :text="store.data.待办事项.主要" />
            <RecordBlock title="次要待办" :text="store.data.待办事项.次要" />
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = null">
                <StatusIcon name="back" tone="dark" />
                返回状态卡
              </button>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'mobility' && active_female" class="panel-content">
            <div class="mobility-head">
              <StatusIcon name="mobility" size="lg" tone="cyan" glow />
              <div>
                <strong>{{ open_panel.name }}</strong>
                <span>机动能力记录</span>
              </div>
            </div>
            <div class="mobility-support">
              <RecordBlock title="体力" :text="`${active_female.体力}/100`" />
              <RecordBlock title="装备状态摘要" :text="equipment_status_summary" />
            </div>
            <div class="metric-list">
              <MetricItem
                v-for="metric in mobility_metrics"
                :key="metric.label"
                :label="metric.label"
                :value="metric.value"
                :width="metric.width"
              />
            </div>
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = { type: 'femaleRiderDetail', name: open_panel.name }">
                <StatusIcon name="back" tone="dark" />
                返回女骑详情
              </button>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'sanState'" class="panel-content san-panel">
            <div class="san-panel-main">
              <StatusIcon name="san" size="badge" :tone="san_status.tone" :glow="store.data.主角.san值 < 80" />
              <div>
                <strong>SAN {{ store.data.主角.san值 }} / {{ san_status.label }}</strong>
                <span>{{ san_status.range }}</span>
              </div>
            </div>
            <p>{{ san_status.description }}</p>
            <div class="san-scale" aria-label="SAN 阈值说明">
              <div
                v-for="threshold in san_thresholds"
                :key="threshold.label"
                class="san-scale-row"
                :class="{ 'is-current': threshold.label === san_status.label }"
              >
                <span class="scale-dot" :class="threshold.tone"></span>
                <strong>{{ threshold.label }}</strong>
                <small>{{ threshold.range }}</small>
              </div>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'knightDetail' && active_knight" class="panel-content">
            <RecordBlock title="年龄" :text="`${active_knight.年龄} 岁`" />
            <RecordBlock title="身份" :text="active_knight.身份" />
            <RecordBlock title="好感度" :text="String(active_knight.好感度)" />
            <RecordBlock title="外貌" :text="active_knight.外貌" />
            <RecordBlock title="性格" :text="active_knight.性格" />
            <RecordBlock title="态度" :text="active_knight.态度" />
            <RecordBlock title="当前心理" :text="active_knight.当前心理" />
            <RecordBlock title="当前动作" :text="active_knight.当前动作" />
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = null">
                <StatusIcon name="back" tone="dark" />
                返回状态卡
              </button>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'femaleRiderDetail' && active_female" class="panel-content">
            <div class="female-overview-card">
              <StatusIcon name="female-rider" size="badge" tone="crimson" glow />
              <div>
                <strong>{{ open_panel.name }}</strong>
                <span>{{ active_female.身份 }} / {{ active_female.所属骑士 || '未登记骑士' }}</span>
              </div>
            </div>
            <div class="mobility-support">
              <RecordBlock title="年龄" :text="`${active_female.年龄} 岁`" />
              <RecordBlock title="好感度" :text="String(active_female.好感度)" />
              <RecordBlock title="体力" :text="`${active_female.体力}/100`" />
            </div>
            <RecordBlock title="身份" :text="active_female.身份" />
            <RecordBlock title="所属骑士" :text="active_female.所属骑士" />
            <RecordBlock title="所属关系" :text="active_female.所属关系" />
            <RecordBlock title="态度" :text="active_female.态度" />
            <div class="drawer-action-grid">
              <button type="button" @click="open_panel = { type: 'femaleRiderRelation', name: open_panel.name }">
                <StatusIcon name="relation" tone="crimson" />
                <span>关系背景</span>
              </button>
              <button type="button" @click="open_panel = { type: 'femaleRiderAppearance', name: open_panel.name }">
                <StatusIcon name="appearance" tone="blue" />
                <span>外貌记录</span>
              </button>
              <button type="button" @click="open_panel = { type: 'femaleRiderBody', name: open_panel.name }">
                <StatusIcon name="body-record" tone="crimson" />
                <span>身材记录</span>
              </button>
              <button type="button" @click="open_panel = { type: 'equipment', name: open_panel.name }">
                <StatusIcon name="equipment" tone="blue" />
                <span>装备</span>
              </button>
              <button type="button" @click="open_panel = { type: 'mobility', name: open_panel.name }">
                <StatusIcon name="mobility" tone="cyan" />
                <span>机动能力</span>
              </button>
            </div>
            <RecordBlock title="当前心理" :text="active_female.当前心理" />
            <RecordBlock title="当前动作" :text="active_female.当前动作" />
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = null">
                <StatusIcon name="back" tone="dark" />
                返回状态卡
              </button>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'femaleRiderRelation' && active_female" class="panel-content">
            <div class="relation-card">
              <StatusIcon name="relation" size="lg" tone="crimson" glow />
              <div>
                <strong>{{ open_panel.name }} / {{ active_female.所属骑士 || '未登记骑士' }}</strong>
                <span>{{ active_female.所属关系 || '关系未登记' }}</span>
              </div>
            </div>
            <RecordBlock title="身份" :text="active_female.身份" />
            <RecordBlock title="所属骑士" :text="active_female.所属骑士" />
            <RecordBlock title="所属关系" :text="active_female.所属关系" />
            <RecordBlock title="关系背景" :text="active_female.关系背景" />
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = { type: 'femaleRiderDetail', name: open_panel.name }">
                <StatusIcon name="back" tone="dark" />
                返回女骑详情
              </button>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'femaleRiderAppearance' && active_female" class="panel-content">
            <div class="appearance-grid">
              <RecordBlock title="体型" :text="active_female.外貌.体型" />
              <RecordBlock title="头发" :text="active_female.外貌.头发" />
              <RecordBlock title="眉眼" :text="active_female.外貌.眉眼" />
              <RecordBlock title="鼻梁" :text="active_female.外貌.鼻梁" />
              <RecordBlock title="唇口" :text="active_female.外貌.唇口" />
              <RecordBlock title="脸部轮廓" :text="active_female.外貌.脸部轮廓" />
              <RecordBlock title="皮肤" :text="active_female.外貌.皮肤" />
            </div>
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = { type: 'femaleRiderDetail', name: open_panel.name }">
                <StatusIcon name="back" tone="dark" />
                返回女骑详情
              </button>
            </div>
          </div>

          <div v-else-if="open_panel.type === 'femaleRiderBody' && active_female" class="panel-content body-panel">
            <details class="body-section" open>
              <summary>
                <StatusIcon name="body-record" tone="crimson" />
                <span>胸部</span>
                <small>{{ active_female.身材.胸部.罩杯 || '未记录' }}</small>
              </summary>
              <RecordBlock title="身材描述" :text="active_female.身材.胸部.身材描述" />
              <RecordBlock title="当前状态" :text="active_female.身材.胸部.当前状态" />
            </details>
            <details class="body-section">
              <summary>
                <StatusIcon name="body-record" tone="crimson" />
                <span>臀部</span>
                <small>状态记录</small>
              </summary>
              <RecordBlock title="身材描述" :text="active_female.身材.臀部.身材描述" />
              <RecordBlock title="当前状态" :text="active_female.身材.臀部.当前状态" />
            </details>
            <details class="body-section">
              <summary>
                <StatusIcon name="body-record" tone="crimson" />
                <span>足部</span>
                <small>状态记录</small>
              </summary>
              <RecordBlock title="身材描述" :text="active_female.身材.足部.身材描述" />
              <RecordBlock title="当前状态" :text="active_female.身材.足部.当前状态" />
            </details>
            <div class="panel-footer">
              <button class="drawer-back" type="button" @click="open_panel = { type: 'femaleRiderDetail', name: open_panel.name }">
                <StatusIcon name="back" tone="dark" />
                返回女骑详情
              </button>
            </div>
          </div>
        </aside>
      </Transition>

      <Transition name="modal-fade">
        <div v-if="open_panel?.type === 'equipment' && active_female" class="modal-layer" @click.self="open_panel = null">
          <section class="equipment-modal" role="dialog" aria-modal="true" aria-label="装备详情">
            <div class="panel-header">
              <div>
                <span class="field-label">女骑装备</span>
                <h2>{{ open_panel.name }}</h2>
              </div>
              <button class="panel-close" type="button" aria-label="关闭装备详情" @click="open_panel = null">
                <StatusIcon name="close" tone="dark" />
              </button>
            </div>
            <div class="equipment-list">
              <article v-for="[equip_name, equip] in equipment_entries" :key="equip_name" class="equipment-item">
                <StatusIcon name="equipment" tone="blue" />
                <div>
                  <strong>{{ equip_name }}</strong>
                  <p>{{ equip.描述 }}</p>
                  <span>{{ equip.状态 }}</span>
                </div>
              </article>
            </div>
            <div class="panel-footer equipment-footer">
              <button class="drawer-back" type="button" @click="open_panel = { type: 'femaleRiderDetail', name: open_panel.name }">
                <StatusIcon name="back" tone="dark" />
                返回女骑详情
              </button>
            </div>
          </section>
        </div>
      </Transition>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, ref } from 'vue';
import InfoPair from './components/InfoPair.vue';
import MetricItem from './components/MetricItem.vue';
import RecordBlock from './components/RecordBlock.vue';
import StatusIcon from './components/StatusIcon.vue';
import { useDataStore } from './store';
import type { Schema as StatusData } from '../../schema';

type KnightData = StatusData['骑士'][string];
type FemaleRiderData = StatusData['女骑'][string];
type EquipmentData = FemaleRiderData['装备'][string];
type OpenPanel =
  | null
  | { type: 'sceneTodo' }
  | { type: 'equipment'; name: string }
  | { type: 'mobility'; name: string }
  | { type: 'sanState' }
  | { type: 'knightDetail'; name: string }
  | { type: 'femaleRiderDetail'; name: string }
  | { type: 'femaleRiderRelation'; name: string }
  | { type: 'femaleRiderAppearance'; name: string }
  | { type: 'femaleRiderBody'; name: string };
type ExpandedCharacter = null | { kind: 'knight' | 'femaleRider'; name: string };

const store = useDataStore();
const open_panel = ref<OpenPanel>(null);
const expanded_character = ref<ExpandedCharacter>(null);

const knight_entries = computed(() => Object.entries(store.data.骑士) as Array<[string, KnightData]>);
const female_entries = computed(() => Object.entries(store.data.女骑) as Array<[string, FemaleRiderData]>);
const character_total = computed(() => knight_entries.value.length + female_entries.value.length);
const has_characters = computed(() => character_total.value > 0);

const formatted_time = computed(() => {
  const time = store.data.当前场景.时间;
  return `${pad(time.时)}:${pad(time.分)}`;
});

const formatted_time_long = computed(() => {
  const time = store.data.当前场景.时间;
  return `${time.年}.${pad(time.月)}.${pad(time.日)} ${pad(time.时)}:${pad(time.分)}`;
});

const formatted_location = computed(() => {
  const location = store.data.当前场景.地点;
  return [location.一级区域, location.二级区域, location.三级区域].filter(Boolean).join(' / ');
});

const formatted_weather = computed(() => {
  const weather = store.data.当前场景.天气;
  return `${weather.概况} ${weather.气温.数值}${weather.气温.单位} / ${weather.风}`;
});

const san_status = computed(() => {
  const value = store.data.主角.san值;
  if (value <= 0) {
    return {
      label: '崩溃边界',
      tone: 'danger' as const,
      class_name: 'san-collapse',
      range: '0',
      description: '当前数值处于最低边界。状态栏只提示数值风险，不补写原因或剧情解释。',
    };
  }
  if (value < 50) {
    return {
      label: '危险',
      tone: 'danger' as const,
      class_name: 'san-danger',
      range: '1-49',
      description: '当前精神稳定度较低，适合提醒玩家留意认知冲击与制度矛盾带来的影响。',
    };
  }
  if (value < 80) {
    return {
      label: '警戒',
      tone: 'amber' as const,
      class_name: 'san-amber',
      range: '50-79',
      description: '当前精神稳定度出现波动，但仍保留清晰判断。界面使用琥珀色提示。',
    };
  }
  return {
    label: '稳定',
    tone: 'blue' as const,
    class_name: 'san-blue',
    range: '80-100',
    description: '当前精神稳定度良好。界面使用冷蓝色维持常态读数。',
  };
});

const san_class = computed(() => san_status.value.class_name);

const san_thresholds = [
  { label: '稳定', range: '80-100', tone: 'blue' },
  { label: '警戒', range: '50-79', tone: 'amber' },
  { label: '危险', range: '1-49', tone: 'danger' },
  { label: '崩溃边界', range: '0', tone: 'danger' },
];

const active_knight = computed(() => {
  if (!open_panel.value || open_panel.value.type !== 'knightDetail') return null;
  return store.data.骑士[open_panel.value.name] ?? null;
});

const active_female = computed(() => {
  if (!open_panel.value || !('name' in open_panel.value)) return null;
  return store.data.女骑[open_panel.value.name] ?? null;
});

const equipment_entries = computed(() => {
  if (!active_female.value) return [] as Array<[string, EquipmentData]>;
  return Object.entries(active_female.value.装备) as Array<[string, EquipmentData]>;
});

const equipment_status_summary = computed(() => {
  if (!equipment_entries.value.length) return '暂无装备记录。';
  return equipment_entries.value.map(([name, equipment]) => `${name}：${equipment.状态 || '暂无状态'}`).join(' / ');
});

const mobility_metrics = computed(() => {
  const mobility = active_female.value?.机动能力;
  if (!mobility) return [];
  return [
    {
      label: '最高时速',
      value: `${mobility.最高时速.数值}${mobility.最高时速.单位}`,
      width: percent(mobility.最高时速.数值, 60),
    },
    {
      label: '巡航距离',
      value: `${mobility.巡航距离.数值}${mobility.巡航距离.单位}`,
      width: percent(mobility.巡航距离.数值, 40),
    },
    {
      label: '承载稳定',
      value: `${mobility.承载稳定.数值}${mobility.承载稳定.单位}`,
      width: percent(mobility.承载稳定.数值, 4),
    },
    {
      label: '操控响应',
      value: `${mobility.操控响应.数值}${mobility.操控响应.单位}`,
      width: percent(2 - mobility.操控响应.数值, 2),
    },
    {
      label: '动力转化效率',
      value: `${mobility.动力转化效率.数值}${mobility.动力转化效率.单位}`,
      width: percent(mobility.动力转化效率.数值, 100),
    },
  ];
});

const panel_title = computed(() => {
  if (!open_panel.value) return '';
  if (open_panel.value.type === 'sceneTodo') return '场景与待办';
  if (open_panel.value.type === 'mobility') return '机动能力';
  if (open_panel.value.type === 'sanState') return 'SAN 状态';
  if (open_panel.value.type === 'knightDetail') return open_panel.value.name;
  if (open_panel.value.type === 'femaleRiderDetail') return open_panel.value.name;
  if (open_panel.value.type === 'femaleRiderRelation') return '关系背景';
  if (open_panel.value.type === 'femaleRiderAppearance') return '外貌记录';
  if (open_panel.value.type === 'femaleRiderBody') return '身材记录';
  return '';
});

const panel_eyebrow = computed(() => {
  if (!open_panel.value) return '';
  if (open_panel.value.type === 'knightDetail') return '完整骑士详情';
  if (open_panel.value.type === 'femaleRiderDetail') return '完整女骑详情';
  if (open_panel.value.type === 'femaleRiderRelation') return open_panel.value.name;
  if (open_panel.value.type === 'femaleRiderAppearance') return open_panel.value.name;
  if (open_panel.value.type === 'femaleRiderBody') return open_panel.value.name;
  return '状态详情';
});

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function percent(value: number, max: number) {
  return _.clamp(Math.round((value / max) * 100), 0, 100);
}

function truncate(value: string, max: number) {
  if (!value) return '暂无记录。';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function toggleCharacter(kind: 'knight' | 'femaleRider', name: string) {
  if (expanded_character.value?.kind === kind && expanded_character.value.name === name) {
    expanded_character.value = null;
    return;
  }
  expanded_character.value = { kind, name };
}

function isExpanded(kind: 'knight' | 'femaleRider', name: string) {
  return expanded_character.value?.kind === kind && expanded_character.value.name === name;
}
</script>

<style lang="scss" scoped>
.est-status {
  --panel-bg: #10222a;
  --panel-bg-2: #1d3038;
  --panel-line: rgba(221, 235, 238, 0.2);
  --panel-line-strong: rgba(231, 241, 242, 0.34);
  --text-main: #edf2f2;
  --text-soft: #aebcc0;
  --text-muted: #7f929a;
  --drawer-bg: #eeecea;
  --drawer-line: rgba(31, 47, 55, 0.16);
  --drawer-text: #20313a;
  --icon-main: #e8edf0;
  --icon-muted: #91a4ad;
  --icon-blue: #67b7f7;
  --icon-cyan: #75d8e6;
  --icon-crimson: #d66b70;
  --icon-amber: #d9a84d;
  --icon-danger: #b8474f;
  --icon-dark: #20313a;
  --accent: var(--icon-blue);

  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  color: var(--text-main);
  font-family:
    ui-serif,
    'Noto Serif SC',
    'Songti SC',
    serif;
  line-height: 1.42;
}

.san-amber {
  --accent: var(--icon-amber);
}

.san-danger {
  --accent: var(--icon-danger);
}

.san-collapse {
  --accent: var(--icon-danger);
}

.san-collapse .hero-card,
.san-collapse .san-button {
  animation: sanPulse 1.7s ease-in-out infinite;
}

.status-frame {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border: 1px solid rgba(215, 231, 236, 0.22);
  border-radius: 22px;
  background:
    radial-gradient(circle at 18% 0%, rgba(103, 183, 247, 0.2), transparent 34%),
    linear-gradient(145deg, #0a1a20 0%, #152830 52%, #08171d 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 18px 48px rgba(1, 10, 14, 0.42);
}

.status-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent);
}

.status-header,
.hero-card,
.scene-grid,
.todo-card,
.character-stack,
.detail-panel,
.modal-layer {
  position: relative;
  z-index: 1;
}

.status-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.brand-mark {
  display: grid;
  place-items: center;
}

.brand-copy {
  min-width: 0;
}

.eyebrow,
.field-label,
.section-title small,
.character-main span,
.san-readout span,
.scene-cell span,
.record-block span,
.metric-copy span {
  color: var(--text-soft);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 11px;
  letter-spacing: 0;
}

.brand-copy h1 {
  margin: 2px 0 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
}

button {
  font: inherit;
}

.icon-button,
.panel-close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--panel-line);
  border-radius: 50%;
  color: inherit;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  cursor: pointer;
}

.san-button {
  position: relative;
}

.san-button::after {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
  border-radius: inherit;
  opacity: 0;
}

.san-amber .san-button::after,
.san-danger .san-button::after,
.san-collapse .san-button::after {
  opacity: 1;
}

.hero-card,
.todo-card,
.scene-cell,
.character-row,
.quick-actions button,
.text-link {
  border: 1px solid var(--panel-line);
  color: inherit;
  background: rgba(255, 255, 255, 0.075);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.hero-card:active,
.todo-card:active,
.scene-cell:active,
.character-row:active,
.quick-actions button:active,
.icon-button:active,
.panel-close:active {
  transform: translateY(1px);
}

.hero-card {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border-radius: 18px;
  text-align: left;
  background:
    linear-gradient(120deg, rgba(235, 243, 245, 0.14), rgba(92, 141, 154, 0.08)),
    rgba(255, 255, 255, 0.055);
}

.hero-identity {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.badge-shell,
.avatar,
.todo-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border: 1px solid var(--panel-line-strong);
  background: rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 10px 20px rgba(0, 0, 0, 0.18);
}

.badge-shell {
  width: 64px;
  height: 64px;
  border-radius: 18px;
}

.hero-identity strong,
.character-main strong,
.san-readout strong {
  display: block;
  overflow-wrap: anywhere;
  font-size: 24px;
  line-height: 1.1;
}

.hero-identity span:last-child,
.character-main p,
.summary-text,
.todo-card p,
.equipment-item p,
.equipment-item span,
.record-block p,
.san-panel p {
  margin: 0;
  color: var(--text-soft);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 13px;
}

.san-readout {
  width: 118px;
  text-align: right;
}

.san-readout strong {
  color: var(--accent);
  font-family: Georgia, serif;
  font-size: 22px;
}

.meter-track {
  width: 100%;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(6, 17, 22, 0.54);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.45);
}

.meter-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 68%, white));
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 52%, transparent);
}

.scene-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.3fr 0.85fr;
  gap: 8px;
  margin-top: 10px;
}

.scene-cell {
  display: grid;
  gap: 4px;
  align-content: start;
  min-width: 0;
  min-height: 94px;
  padding: 12px;
  border-radius: 15px;
  text-align: left;
}

.scene-cell strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 15px;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.todo-card {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-top: 10px;
  padding: 12px;
  border-radius: 16px;
  text-align: left;
}

.todo-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
}

.todo-card p,
.summary-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.action-summary {
  color: color-mix(in srgb, var(--text-soft) 86%, var(--accent));
}

.character-stack {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
  font-weight: 800;
}

.character-list-meta,
.character-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-soft);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 12px;
}

.character-list-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.character-list-meta span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.055);
}

.character-group-title {
  margin-top: 4px;
  padding: 0 4px;
  font-weight: 700;
}

.empty-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 12px;
  border: 1px dashed rgba(221, 235, 238, 0.2);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
}

.empty-card p {
  margin: 0;
  color: var(--text-soft);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 13px;
}

.character-card {
  overflow: hidden;
  border: 1px solid var(--panel-line);
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.female-card {
  background: linear-gradient(120deg, rgba(214, 107, 112, 0.12), rgba(255, 255, 255, 0.05));
}

.character-row {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 76px;
  padding: 12px;
  border: 0;
  border-radius: 0;
  text-align: left;
  background: transparent;
}

.avatar {
  width: 54px;
  height: 54px;
  border-radius: 16px;
}

.knight-avatar {
  background: rgba(103, 183, 247, 0.12);
}

.female-avatar {
  background: rgba(214, 107, 112, 0.12);
}

.character-main {
  min-width: 0;
}

.character-main strong {
  font-size: 20px;
}

.character-main p {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.character-meta {
  display: grid;
  justify-items: end;
  gap: 4px;
  color: var(--text-soft);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 12px;
}

.character-meta span {
  white-space: nowrap;
}

.accordion-body {
  display: grid;
  gap: 10px;
  padding: 0 12px 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.metric-row {
  display: grid;
  grid-template-columns: auto auto auto minmax(66px, 1fr);
  gap: 8px;
  align-items: center;
  padding: 9px;
  border-radius: 12px;
  background: rgba(214, 107, 112, 0.1);
}

.metric-row strong {
  color: var(--icon-crimson);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.quick-actions button,
.text-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  padding: 9px 10px;
  border-radius: 12px;
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 13px;
}

.text-link {
  justify-self: start;
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.06);
}

.detail-panel {
  margin-top: 14px;
  overflow: hidden;
  border-radius: 22px 22px 16px 16px;
  color: var(--drawer-text);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(231, 232, 230, 0.96)),
    var(--drawer-bg);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 18px 34px rgba(0, 0, 0, 0.24);
}

.panel-handle {
  width: 54px;
  height: 5px;
  margin: 10px auto 2px;
  border-radius: 999px;
  background: rgba(32, 49, 58, 0.35);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 10px;
}

.panel-header .field-label {
  color: rgba(32, 49, 58, 0.62);
}

.panel-header h2 {
  margin: 0;
  color: var(--drawer-text);
  font-size: 22px;
  line-height: 1.18;
}

.panel-close {
  border-color: var(--drawer-line);
  background: rgba(255, 255, 255, 0.62);
}

.panel-content {
  display: grid;
  gap: 10px;
  max-height: min(560px, 130vw);
  overflow: auto;
  padding: 0 16px 16px;
}

.mobility-head,
.san-panel,
.female-overview-card,
.relation-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--drawer-line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.46);
}

.mobility-head div,
.san-panel,
.female-overview-card div,
.relation-card div {
  display: grid;
}

.mobility-head span,
.female-overview-card span,
.relation-card span {
  color: rgba(32, 49, 58, 0.62);
}

.female-overview-card,
.relation-card {
  background:
    linear-gradient(120deg, rgba(214, 107, 112, 0.13), rgba(255, 255, 255, 0.52)),
    rgba(255, 255, 255, 0.46);
}

.female-overview-card strong,
.relation-card strong {
  color: var(--drawer-text);
  font-size: 20px;
}

.drawer-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.drawer-action-grid button {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 10px;
  border: 1px solid var(--drawer-line);
  border-radius: 14px;
  color: var(--drawer-text);
  background: rgba(255, 255, 255, 0.52);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  cursor: pointer;
}

.drawer-action-grid button:active {
  transform: translateY(1px);
}

.mobility-support {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mobility-support > :deep(.record-block):last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.panel-footer {
  display: flex;
  justify-content: center;
  padding-top: 2px;
}

.drawer-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--drawer-line);
  border-radius: 14px;
  color: var(--drawer-text);
  background: rgba(255, 255, 255, 0.56);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  cursor: pointer;
}

.drawer-back:active {
  transform: translateY(1px);
}

.appearance-grid {
  display: grid;
  gap: 10px;
}

.body-panel {
  gap: 9px;
}

.body-section {
  overflow: hidden;
  border: 1px solid rgba(214, 107, 112, 0.24);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(214, 107, 112, 0.1), rgba(255, 255, 255, 0.48)),
    rgba(255, 255, 255, 0.48);
}

.body-section summary {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
  min-height: 52px;
  padding: 10px 12px;
  color: var(--drawer-text);
  cursor: pointer;
  list-style: none;
}

.body-section summary::-webkit-details-marker {
  display: none;
}

.body-section summary span {
  font-size: 15px;
  font-weight: 800;
}

.body-section summary small {
  color: rgba(32, 49, 58, 0.58);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 12px;
}

.body-section[open] {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.body-section > :deep(.record-block) {
  margin: 0 10px 10px;
  background: rgba(255, 255, 255, 0.58);
}

.metric-list {
  display: grid;
  gap: 9px;
}

.san-panel {
  justify-items: stretch;
}

.san-panel-main {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--drawer-line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.46);
  text-align: left;
}

.san-panel-main div {
  display: grid;
}

.san-panel-main strong {
  color: var(--drawer-text);
  font-size: 20px;
}

.san-panel-main span {
  color: rgba(32, 49, 58, 0.62);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 12px;
}

.san-panel > p {
  padding: 0 4px;
  color: rgba(32, 49, 58, 0.72);
}

.san-scale {
  display: grid;
  gap: 7px;
}

.san-scale-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--drawer-line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.42);
}

.san-scale-row.is-current {
  border-color: color-mix(in srgb, var(--accent) 42%, var(--drawer-line));
  background: color-mix(in srgb, var(--accent) 12%, rgba(255, 255, 255, 0.55));
}

.san-scale-row strong {
  color: var(--drawer-text);
}

.san-scale-row small {
  color: rgba(32, 49, 58, 0.58);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
}

.scale-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--icon-blue);
  box-shadow: 0 0 8px color-mix(in srgb, var(--icon-blue) 54%, transparent);
}

.scale-dot.amber {
  background: var(--icon-amber);
  box-shadow: 0 0 8px color-mix(in srgb, var(--icon-amber) 54%, transparent);
}

.scale-dot.danger {
  background: var(--icon-danger);
  box-shadow: 0 0 8px color-mix(in srgb, var(--icon-danger) 54%, transparent);
}

.modal-layer {
  position: absolute;
  inset: 0;
  display: grid;
  align-items: end;
  padding: 14px;
  background: rgba(3, 12, 16, 0.58);
  backdrop-filter: blur(5px);
}

.equipment-modal {
  max-height: min(580px, 136vw);
  overflow: auto;
  border-radius: 22px;
  color: var(--drawer-text);
  background: var(--drawer-bg);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.42);
}

.equipment-list {
  display: grid;
  gap: 10px;
  padding: 0 14px 14px;
}

.equipment-footer {
  padding: 0 14px 14px;
}

.equipment-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--drawer-line);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.56);
}

.equipment-item strong {
  display: block;
  margin-bottom: 4px;
  color: var(--drawer-text);
}

.equipment-item p,
.equipment-item span {
  color: rgba(32, 49, 58, 0.72);
}

.equipment-item span {
  display: inline-block;
  margin-top: 7px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(103, 183, 247, 0.16);
}

.panel-slide-enter-active,
.panel-slide-leave-active,
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes sanPulse {
  0%,
  100% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      0 0 0 rgba(184, 71, 79, 0);
  }

  50% {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 0 18px color-mix(in srgb, var(--accent) 26%, transparent);
  }
}

@media (max-width: 520px) {
  .status-frame {
    padding: 12px;
    border-radius: 18px;
  }

  .brand-copy h1 {
    font-size: 22px;
  }

  .hero-card {
    grid-template-columns: 1fr;
  }

  .san-readout {
    width: 100%;
    text-align: left;
  }

  .scene-grid {
    grid-template-columns: 1fr 1fr;
  }

  .scene-cell-wide {
    grid-column: span 2;
  }

  .quick-actions,
  .character-list-meta,
  .detail-grid,
  .drawer-action-grid,
  .mobility-support {
    grid-template-columns: 1fr;
  }
}
</style>
