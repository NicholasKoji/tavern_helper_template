<template>
  <section class="debug-console" :data-stability="stabilityTone">
    <header class="console-header">
      <div class="title-block">
        <p class="eyebrow">NPC WORLD DEBUG</p>
        <h1>世界调试模式</h1>
        <p class="subtitle">{{ data.杨世发.身份 }} · {{ data.杨世发.年级 }}</p>
      </div>

      <div class="stability-gauge" :style="{ '--value': `${stabilityScore}%` }">
        <span>规则稳定</span>
        <strong>{{ stabilityScore }}</strong>
        <small>{{ stabilityLabel }}</small>
      </div>
    </header>

    <section class="world-grid" aria-label="世界坐标">
      <article>
        <span>时间</span>
        <strong>{{ data.世界.当前时间 }}</strong>
      </article>
      <article>
        <span>地点</span>
        <strong>{{ data.世界.当前地点 }}</strong>
      </article>
      <article>
        <span>常识版本</span>
        <strong>{{ data.世界.公开常识版本 }}</strong>
      </article>
    </section>

    <section class="rule-panel">
      <div>
        <span>当前规则</span>
        <p>{{ data.世界.当前规则摘要 }}</p>
      </div>
      <strong>{{ topRisk.label }} {{ topRisk.value }}</strong>
    </section>

    <section class="signal-board" aria-label="状态指标">
      <article v-for="meter in meters" :key="meter.label" class="signal-meter" :data-tone="meter.tone">
        <div class="meter-head">
          <span>{{ meter.label }}</span>
          <strong>{{ meter.value }}</strong>
        </div>
        <div class="meter-track" :aria-label="`${meter.label} ${meter.value}`">
          <div class="meter-fill" :style="{ width: `${meter.value}%` }"></div>
        </div>
        <small>{{ toneText(meter.tone) }}</small>
      </article>
    </section>

    <div class="primary-grid">
      <section class="section-panel subject-panel">
        <div class="section-title">
          <span>杨世发</span>
          <strong>{{ data.杨世发.年龄 }}岁</strong>
        </div>
        <dl class="fact-list">
          <div>
            <dt>当前位置</dt>
            <dd>{{ data.杨世发.当前位置 }}</dd>
          </div>
          <div>
            <dt>当前目标</dt>
            <dd>{{ data.杨世发.当前目标 }}</dd>
          </div>
          <div>
            <dt>认知状态</dt>
            <dd>{{ data.杨世发.认知状态 }}</dd>
          </div>
        </dl>
      </section>

      <section class="section-panel veil-panel">
        <div class="section-title">
          <span>调试者遮蔽</span>
          <strong>{{ data.调试者遮蔽.遮蔽强度 }}</strong>
        </div>
        <dl class="fact-list">
          <div>
            <dt>存在事实</dt>
            <dd>{{ data.调试者遮蔽._存在事实 }}</dd>
          </div>
          <div>
            <dt>身份状态</dt>
            <dd>{{ data.调试者遮蔽._身份状态 }}</dd>
          </div>
        </dl>
        <div class="permission-row">
          <span :data-enabled="data.调试者遮蔽._交流许可"> 交流 {{ permissionText(data.调试者遮蔽._交流许可) }} </span>
          <span :data-enabled="data.调试者遮蔽._互知许可"> 互知 {{ permissionText(data.调试者遮蔽._互知许可) }} </span>
        </div>
      </section>
    </div>

    <section v-if="recentChanges.length" class="section-panel">
      <div class="section-title">
        <span>最近变更</span>
        <strong>{{ recentChanges.length }}</strong>
      </div>
      <div class="change-list">
        <article v-for="[code, change] in recentChanges" :key="code" class="change-item">
          <header>
            <strong>{{ code }}</strong>
            <span>{{ change.影响范围 }}</span>
          </header>
          <p>{{ change.说明 }}</p>
          <small>{{ change.杨世发观测 }}</small>
        </article>
      </div>
    </section>

    <section v-if="inventory.length" class="section-panel">
      <div class="section-title">
        <span>随身物品</span>
        <strong>{{ inventory.length }}</strong>
      </div>
      <div class="item-list">
        <article v-for="[name, item] in inventory" :key="name" class="item-row">
          <div>
            <strong>{{ name }}</strong>
            <p>{{ item.描述 }}</p>
          </div>
          <span>x{{ item.数量 }}</span>
        </article>
      </div>
    </section>

    <footer class="narrative-note">
      <span>叙事备注</span>
      <p>{{ data.调试者遮蔽.叙事备注 }}</p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from './store';

type MeterTone = 'safe' | 'warn' | 'danger';

const store = useDataStore();
const data = store.data;

const inventory = computed(() => Object.entries(data.杨世发.随身物品));
const recentChanges = computed(() => Object.entries(data.世界.最近变更));
const stabilityScore = computed(() => normalizePercent(data.世界.规则稳定度));
const stabilityTone = computed(() => getMeterTone(stabilityScore.value, false));
const stabilityLabel = computed(() => toneText(stabilityTone.value));

const meters = computed(() =>
  [
    { label: '规则稳定度', value: data.世界.规则稳定度, inverse: false },
    { label: '认知压力', value: data.杨世发.异常认知压力, inverse: true },
    { label: '异常怀疑', value: data.杨世发.对世界异常的怀疑, inverse: true },
    { label: '社会伪装', value: data.杨世发.社会伪装程度, inverse: false },
    { label: '遮蔽强度', value: data.调试者遮蔽.遮蔽强度, inverse: false },
  ].map(meter => {
    const value = normalizePercent(meter.value);
    return {
      ...meter,
      value,
      tone: getMeterTone(value, meter.inverse),
    };
  }),
);

const topRisk = computed(() => {
  const riskMeters = meters.value.filter(meter => meter.label !== '规则稳定度');
  return riskMeters.reduce((current, meter) => (meter.value > current.value ? meter : current), riskMeters[0]);
});

function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

function getMeterTone(value: number, inverse: boolean): MeterTone {
  if (inverse) {
    if (value >= 70) {
      return 'danger';
    }
    if (value >= 40) {
      return 'warn';
    }
    return 'safe';
  }
  if (value <= 30) {
    return 'danger';
  }
  if (value <= 60) {
    return 'warn';
  }
  return 'safe';
}

function toneText(tone: MeterTone): string {
  if (tone === 'danger') {
    return '高危';
  }
  if (tone === 'warn') {
    return '警戒';
  }
  return '稳定';
}

function permissionText(value: boolean): string {
  return value ? '开启' : '关闭';
}
</script>

<style scoped>
.debug-console {
  --surface: oklch(23% 0.018 168);
  --panel: oklch(28% 0.016 170);
  --panel-raised: oklch(34% 0.014 165);
  --line: oklch(46% 0.025 165);
  --line-soft: oklch(38% 0.018 165);
  --text: oklch(92% 0.012 115);
  --muted: oklch(74% 0.022 150);
  --faint: oklch(62% 0.02 150);
  --safe: oklch(71% 0.14 157);
  --safe-soft: oklch(37% 0.055 157);
  --warn: oklch(76% 0.14 78);
  --warn-soft: oklch(40% 0.06 78);
  --danger: oklch(65% 0.16 28);
  --danger-soft: oklch(38% 0.07 28);
  width: auto;
  max-width: 780px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: linear-gradient(180deg, oklch(27% 0.02 168), var(--surface) 42%), var(--surface);
  color: var(--text);
  font-family:
    Inter,
    'Noto Sans SC',
    'Microsoft YaHei UI',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    system-ui,
    sans-serif;
  font-size: 13px;
  line-height: 1.45;
}

.console-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 12px;
  align-items: stretch;
}

.title-block {
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: oklch(25% 0.017 169);
}

.eyebrow,
.world-grid span,
.rule-panel span,
.signal-meter small,
dt,
.narrative-note span {
  color: var(--faint);
  font-size: 11px;
  font-weight: 700;
}

.eyebrow {
  margin: 0 0 4px;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  color: var(--text);
  font-size: 22px;
  font-weight: 850;
  line-height: 1.15;
}

.subtitle {
  margin: 5px 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.stability-gauge {
  --tone: var(--safe);
  display: grid;
  min-height: 96px;
  place-items: center;
  align-content: center;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid color-mix(in oklch, var(--tone) 48%, var(--line));
  border-radius: 8px;
  background:
    radial-gradient(circle at center, var(--panel) 0 49%, transparent 50%),
    conic-gradient(var(--tone) var(--value), oklch(33% 0.014 165) 0);
}

.debug-console[data-stability='warn'] .stability-gauge {
  --tone: var(--warn);
}

.debug-console[data-stability='danger'] .stability-gauge {
  --tone: var(--danger);
}

.stability-gauge span,
.stability-gauge small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.stability-gauge strong {
  margin-top: 2px;
  color: var(--text);
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.world-grid,
.signal-board,
.primary-grid {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.world-grid {
  grid-template-columns: 0.72fr 1.18fr 1.1fr;
}

.world-grid article,
.signal-meter,
.section-panel,
.rule-panel,
.narrative-note {
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: var(--panel);
}

.world-grid article {
  padding: 9px 10px;
}

.world-grid strong {
  display: block;
  margin-top: 3px;
  color: var(--text);
  font-size: 12px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.rule-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-top: 8px;
  padding: 11px 12px;
  background: color-mix(in oklch, var(--safe-soft) 36%, var(--panel));
}

.rule-panel p {
  margin: 4px 0 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.rule-panel > strong {
  align-self: stretch;
  display: grid;
  min-width: 76px;
  place-items: center;
  padding: 0 10px;
  border: 1px solid color-mix(in oklch, var(--warn) 45%, var(--line-soft));
  border-radius: 7px;
  color: var(--warn);
  font-size: 12px;
  white-space: nowrap;
}

.signal-board {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.signal-meter {
  --tone: var(--safe);
  --tone-soft: var(--safe-soft);
  padding: 9px;
  background: color-mix(in oklch, var(--tone-soft) 28%, var(--panel));
}

.signal-meter[data-tone='warn'] {
  --tone: var(--warn);
  --tone-soft: var(--warn-soft);
}

.signal-meter[data-tone='danger'] {
  --tone: var(--danger);
  --tone-soft: var(--danger-soft);
}

.meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.meter-head span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

.meter-head strong {
  color: var(--text);
  font-size: 15px;
  font-weight: 850;
}

.meter-track {
  height: 6px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: oklch(20% 0.01 165);
}

.meter-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--tone);
}

.signal-meter small {
  display: block;
  margin-top: 5px;
  color: var(--tone);
}

.primary-grid {
  grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
}

.section-panel,
.narrative-note {
  margin-top: 8px;
  padding: 11px 12px;
}

.primary-grid .section-panel {
  margin-top: 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line-soft);
}

.section-title span {
  color: var(--text);
  font-size: 13px;
  font-weight: 850;
}

.section-title strong {
  color: var(--safe);
  font-size: 12px;
  font-weight: 850;
}

.fact-list {
  display: grid;
  gap: 8px;
  margin: 9px 0 0;
}

.fact-list div,
.item-row,
.change-item {
  min-width: 0;
}

dt {
  margin: 0;
}

dd {
  margin: 2px 0 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.permission-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.permission-row span {
  padding: 4px 7px;
  border: 1px solid color-mix(in oklch, var(--danger) 35%, var(--line-soft));
  border-radius: 999px;
  background: color-mix(in oklch, var(--danger-soft) 28%, var(--panel));
  color: var(--danger);
  font-size: 12px;
  font-weight: 800;
}

.permission-row span[data-enabled='true'] {
  border-color: color-mix(in oklch, var(--safe) 40%, var(--line-soft));
  background: color-mix(in oklch, var(--safe-soft) 30%, var(--panel));
  color: var(--safe);
}

.change-list,
.item-list {
  display: grid;
  gap: 7px;
  margin-top: 9px;
}

.change-item,
.item-row {
  padding: 9px;
  border: 1px solid var(--line-soft);
  border-radius: 7px;
  background: var(--panel-raised);
}

.change-item header {
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1fr);
  gap: 8px;
}

.change-item strong,
.item-row strong {
  color: var(--text);
  font-weight: 850;
  overflow-wrap: anywhere;
}

.change-item header span {
  color: var(--warn);
  font-size: 12px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.change-item p,
.item-row p,
.narrative-note p {
  margin: 4px 0 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.change-item small {
  display: block;
  margin-top: 5px;
  color: var(--faint);
  overflow-wrap: anywhere;
}

.item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.item-row > span {
  min-width: 34px;
  padding: 3px 6px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--warn-soft) 34%, var(--panel));
  color: var(--warn);
  font-weight: 900;
  text-align: center;
}

.narrative-note {
  background: oklch(25% 0.015 165);
}

@media (max-width: 700px) {
  .console-header,
  .world-grid,
  .primary-grid {
    grid-template-columns: 1fr;
  }

  .stability-gauge {
    display: flex;
    min-height: auto;
    justify-content: space-between;
    gap: 10px;
    background: var(--panel);
    background: color-mix(in oklch, var(--safe-soft) 26%, var(--panel));
  }

  .debug-console[data-stability='warn'] .stability-gauge {
    background: color-mix(in oklch, var(--warn-soft) 28%, var(--panel));
  }

  .debug-console[data-stability='danger'] .stability-gauge {
    background: color-mix(in oklch, var(--danger-soft) 28%, var(--panel));
  }

  .stability-gauge strong {
    margin-left: auto;
    font-size: 24px;
  }

  .signal-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 460px) {
  .debug-console {
    padding: 9px;
    border-radius: 7px;
  }

  .rule-panel,
  .change-item header,
  .item-row,
  .signal-board {
    grid-template-columns: 1fr;
  }

  .rule-panel > strong {
    min-height: 32px;
  }
}
</style>
