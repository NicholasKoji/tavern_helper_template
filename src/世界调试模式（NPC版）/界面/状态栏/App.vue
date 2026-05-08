<template>
  <section class="debug-panel">
    <header class="panel-header">
      <div class="title-block">
        <p class="eyebrow">WORLD DEBUG // NPC VIEW</p>
        <h1>世界调试模式</h1>
        <p class="subtitle">{{ data.杨世发.身份 }} · {{ data.杨世发.年级 }}</p>
      </div>
      <div class="stability-card">
        <span>规则稳定</span>
        <strong>{{ data.世界.规则稳定度 }}</strong>
      </div>
    </header>

    <div class="world-strip">
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
    </div>

    <section class="rule-section">
      <span>当前规则摘要</span>
      <p>{{ data.世界.当前规则摘要 }}</p>
    </section>

    <section class="meter-board">
      <div v-for="meter in meters" :key="meter.label" class="meter-row" :data-tone="meter.tone">
        <div class="meter-head">
          <span>{{ meter.label }}</span>
          <strong>{{ meter.value }}</strong>
        </div>
        <div class="meter-track">
          <div class="meter-fill" :style="{ width: `${meter.value}%` }"></div>
        </div>
      </div>
    </section>

    <div class="detail-grid">
      <section class="info-section">
        <div class="section-heading">
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

      <section class="info-section">
        <div class="section-heading">
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
          <span :data-enabled="data.调试者遮蔽._交流许可"
            >交流许可：{{ permissionText(data.调试者遮蔽._交流许可) }}</span
          >
          <span :data-enabled="data.调试者遮蔽._互知许可"
            >互知许可：{{ permissionText(data.调试者遮蔽._互知许可) }}</span
          >
        </div>
      </section>
    </div>

    <section v-if="inventory.length" class="info-section">
      <div class="section-heading">
        <span>随身物品</span>
        <strong>{{ inventory.length }}</strong>
      </div>
      <div class="item-list">
        <article v-for="[name, item] in inventory" :key="name" class="list-item">
          <div>
            <strong>{{ name }}</strong>
            <p>{{ item.描述 }}</p>
          </div>
          <span>x{{ item.数量 }}</span>
        </article>
      </div>
    </section>

    <section v-if="recentChanges.length" class="info-section">
      <div class="section-heading">
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

    <footer>
      <span>叙事备注</span>
      <p>{{ data.调试者遮蔽.叙事备注 }}</p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const data = store.data;

const inventory = computed(() => Object.entries(data.杨世发.随身物品));
const recentChanges = computed(() => Object.entries(data.世界.最近变更));

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

function normalizePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

function getMeterTone(value: number, inverse: boolean): 'safe' | 'warn' | 'danger' {
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

function permissionText(value: boolean): string {
  return value ? '开启' : '关闭';
}
</script>

<style scoped>
.debug-panel {
  width: 100%;
  max-width: 760px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 14px;
  border: 1px solid #26343b;
  background: #f7f7f4;
  color: #172026;
  font-family: Inter, 'Noto Sans SC', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.45;
}

.panel-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #b8c0bd;
}

.title-block {
  min-width: 0;
}

.eyebrow {
  margin: 0 0 4px;
  color: #52646b;
  font-size: 11px;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
}

.subtitle {
  margin: 4px 0 0;
  color: #59676a;
  overflow-wrap: anywhere;
}

.stability-card {
  width: 86px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  border: 1px solid #26343b;
  background: #dbe9e5;
}

.stability-card span,
.rule-section span,
footer span {
  color: #52646b;
  font-size: 12px;
}

.stability-card strong {
  font-size: 24px;
  line-height: 1;
}

.world-strip,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.world-strip article,
.info-section,
.rule-section {
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #c7cfcc;
  background: #ffffff;
}

.world-strip article {
  padding: 8px;
}

.world-strip span {
  display: block;
  color: #647174;
  font-size: 12px;
}

.world-strip strong {
  display: block;
  margin-top: 2px;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.rule-section {
  margin-top: 10px;
  padding: 10px;
  border-left: 4px solid #2c7a73;
  background: #eef6f4;
}

.rule-section p {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  font-weight: 700;
}

.meter-board {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.meter-row {
  min-width: 0;
  padding: 8px;
  border: 1px solid #c7cfcc;
  background: #ffffff;
}

.meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.meter-head span {
  color: #52646b;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.meter-head strong {
  font-size: 14px;
}

.meter-track {
  height: 8px;
  margin-top: 7px;
  overflow: hidden;
  background: #e1e5e3;
}

.meter-fill {
  height: 100%;
  background: #2c7a73;
}

.meter-row[data-tone='warn'] .meter-fill {
  background: #b7791f;
}

.meter-row[data-tone='danger'] .meter-fill {
  background: #b6423c;
}

.info-section {
  margin-top: 10px;
  padding: 10px;
}

.detail-grid .info-section {
  margin-top: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 7px;
  border-bottom: 1px solid #dde3e0;
}

.section-heading span {
  color: #26343b;
  font-size: 13px;
  font-weight: 800;
}

.section-heading strong {
  color: #2c7a73;
  font-size: 13px;
}

.fact-list {
  display: grid;
  gap: 8px;
  margin: 8px 0 0;
}

.fact-list div {
  min-width: 0;
}

dt {
  color: #647174;
  font-size: 12px;
}

dd {
  margin: 2px 0 0;
  overflow-wrap: anywhere;
}

.permission-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.permission-row span {
  padding: 3px 6px;
  border: 1px solid #d1d7d4;
  background: #f3f4f2;
  color: #6d3531;
  font-size: 12px;
}

.permission-row span[data-enabled='true'] {
  color: #1e6a61;
}

.item-list,
.change-list {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.list-item,
.change-item {
  min-width: 0;
  padding: 8px;
  border: 1px solid #dde3e0;
  background: #fbfcfb;
}

.list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.list-item strong,
.change-item strong {
  overflow-wrap: anywhere;
}

.list-item p,
.change-item p {
  margin: 3px 0 0;
  color: #526064;
  overflow-wrap: anywhere;
}

.list-item > span {
  color: #b7791f;
  font-weight: 800;
}

.change-item header {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.change-item header span,
.change-item small {
  color: #647174;
  overflow-wrap: anywhere;
}

.change-item small {
  display: block;
  margin-top: 5px;
}

footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #b8c0bd;
}

footer p {
  margin: 3px 0 0;
  overflow-wrap: anywhere;
}

@media (max-width: 680px) {
  .world-strip,
  .detail-grid,
  .meter-board {
    grid-template-columns: 1fr;
  }

  .panel-header {
    align-items: flex-start;
  }
}

@media (max-width: 440px) {
  .panel-header {
    display: grid;
  }

  .stability-card {
    width: 100%;
    min-height: 56px;
  }

  .change-item header {
    grid-template-columns: 1fr;
  }
}
</style>
