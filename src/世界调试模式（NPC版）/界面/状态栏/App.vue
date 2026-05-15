<template>
  <section class="debug-console">
    <header class="console-header">
      <div class="title-block">
        <p class="eyebrow">NPC WORLD DEBUG</p>
        <h1>世界调试模式</h1>
        <p class="subtitle">{{ data.杨世发.身份 }} · {{ data.杨世发.年级 }}</p>
      </div>

      <div class="status-stack" aria-label="核心状态">
        <div class="status-token">
          <span>规则</span>
          <strong>{{ ruleEntries.length }}</strong>
          <small>生效中</small>
        </div>
        <div class="status-token">
          <span>NPC</span>
          <strong>{{ npcEntries.length }}</strong>
          <small>已记录</small>
        </div>
      </div>
    </header>

    <section class="world-strip" aria-label="世界坐标">
      <div>
        <span>时间</span>
        <strong>{{ data.世界.当前时间 }}</strong>
      </div>
      <div>
        <span>地点</span>
        <strong>{{ data.世界.当前地点 }}</strong>
      </div>
    </section>

    <nav class="tab-list" aria-label="状态栏分页">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        :aria-selected="activeTab === tab.id"
        @click="activeTab = tab.id"
      >
        <span>{{ tab.label }}</span>
        <small>{{ tab.count }}</small>
      </button>
    </nav>

    <section v-if="activeTab === 'overview'" class="tab-panel" aria-label="总览">
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

      <div class="fact-cluster">
        <div class="fact-block">
          <h2>杨世发</h2>
          <dl>
            <div>
              <dt>年龄</dt>
              <dd>{{ data.杨世发.年龄 }} 岁</dd>
            </div>
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
        </div>

        <div class="fact-block">
          <h2>最高风险</h2>
          <p class="risk-line">{{ topRisk.label }} · {{ topRisk.value }} · {{ toneText(topRisk.tone) }}</p>
          <p class="soft-copy">{{ newestChangeText }}</p>
        </div>
      </div>
    </section>

    <section v-else-if="activeTab === 'rules'" class="tab-panel" aria-label="规则">
      <section class="rules-readout" aria-label="规则核心读数">
        <ValueMeter label="遮蔽强度" :value="data.调试者遮蔽.遮蔽强度" />
        <ValueMeter label="认知压力" :value="data.杨世发.异常认知压力" inverse />
      </section>

      <AccordionGroup title="生效规则" :count="ruleEntries.length" unit="项">
        <details v-for="[name, rule] in ruleEntries" :key="name" class="fold-row">
          <summary>
            <strong>{{ name }}</strong>
            <span class="summary-meta">
              <b>{{ rule.规则类型 }}</b>
              <em>{{ rule.目标范围 }}</em>
            </span>
          </summary>
          <dl class="detail-grid">
            <div>
              <dt>生效方式</dt>
              <dd>{{ rule.生效方式 }}</dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>{{ rule.当前状态 }}</dd>
            </div>
            <div class="wide">
              <dt>摘要</dt>
              <dd>{{ rule.规则摘要 }}</dd>
            </div>
            <div class="wide">
              <dt>社会表现</dt>
              <dd>{{ rule.社会表现 }}</dd>
            </div>
            <div class="wide">
              <dt>影响维度</dt>
              <dd class="dimension-list">
                <span v-for="[dimension, note] in Object.entries(rule.影响维度)" :key="dimension">
                  <b>{{ dimension }}</b>
                  {{ note }}
                </span>
              </dd>
            </div>
            <div class="wide">
              <dt>杨世发观测</dt>
              <dd>{{ rule.杨世发观测 }}</dd>
            </div>
          </dl>
        </details>
      </AccordionGroup>
    </section>

    <section v-else-if="activeTab === 'npcs'" class="tab-panel" aria-label="重要NPC">
      <div v-if="!npcEntries.length" class="empty-state">尚未记录重要 NPC</div>
      <details v-for="[code, npc] in npcEntries" :key="code" class="npc-fold">
        <summary>
          <div>
            <strong>{{ npc.基本信息.姓名或称呼 }}</strong>
            <span>{{ npc.基本信息.性别 }} · {{ npc.基本信息.年龄 }}岁 · {{ npc.基本信息.身份 }}</span>
          </div>
          <small>{{ npc.基本信息.关系定位 }}</small>
        </summary>

        <div class="npc-body">
          <div class="relation-grid">
            <ValueMeter label="好感" :value="npc.关系指标.好感度" />
            <ValueMeter label="信任" :value="npc.关系指标.信任度" />
            <ValueMeter label="警觉" :value="npc.关系指标.警觉度" inverse />
          </div>

          <section class="npc-profile" aria-label="NPC外观与心理">
            <div class="profile-copy">
              <h3>容貌</h3>
              <p>{{ npc.外观.容貌 }}</p>
            </div>
            <div class="profile-copy">
              <h3>身材</h3>
              <p>{{ npc.外观.身材 }}</p>
            </div>
            <div class="profile-copy wide">
              <h3>身体特征</h3>
              <dl class="body-features">
                <div>
                  <dt>身高</dt>
                  <dd>{{ npc.外观.身体特征.身高 }}</dd>
                </div>
                <div>
                  <dt>罩杯</dt>
                  <dd>{{ npc.外观.身体特征.罩杯 }}</dd>
                </div>
                <div class="wide">
                  <dt>胸部</dt>
                  <dd>{{ npc.外观.身体特征.胸部 }}</dd>
                </div>
                <div class="wide">
                  <dt>臀部</dt>
                  <dd>{{ npc.外观.身体特征.臀部 }}</dd>
                </div>
                <div class="wide">
                  <dt>腿部</dt>
                  <dd>{{ npc.外观.身体特征.腿部 }}</dd>
                </div>
              </dl>
            </div>
            <div class="profile-copy wide">
              <h3>心理话</h3>
              <p>{{ npc.心理话 }}</p>
            </div>
          </section>

          <section class="outfit-panel" aria-label="NPC着装">
            <h3>着装拆解</h3>
            <dl>
              <div>
                <dt>发型</dt>
                <dd>{{ npc.外观.着装.发型 }}</dd>
              </div>
              <div>
                <dt>上装</dt>
                <dd>{{ npc.外观.着装.上装 }}</dd>
              </div>
              <div>
                <dt>下装</dt>
                <dd>{{ npc.外观.着装.下装 }}</dd>
              </div>
              <div>
                <dt>鞋袜</dt>
                <dd>{{ npc.外观.着装.鞋袜 }}</dd>
              </div>
              <div>
                <dt>配饰</dt>
                <dd>{{ npc.外观.着装.配饰 }}</dd>
              </div>
              <div>
                <dt>随身物</dt>
                <dd>{{ npc.外观.着装.随身物 }}</dd>
              </div>
              <div class="wide">
                <dt>状态细节</dt>
                <dd>{{ npc.外观.着装.状态细节 }}</dd>
              </div>
            </dl>
          </section>

          <dl class="detail-grid">
            <div class="wide section-label">人物档案</div>
            <div class="wide">
              <dt>关系</dt>
              <dd>{{ npc.人物档案.关系 }}</dd>
            </div>
            <div class="wide">
              <dt>性格</dt>
              <dd>{{ npc.人物档案.性格 }}</dd>
            </div>
            <div class="wide">
              <dt>背景</dt>
              <dd>{{ npc.人物档案.背景 }}</dd>
            </div>

            <div class="wide section-label">互动与状态</div>
            <div>
              <dt>所在地点</dt>
              <dd>{{ npc.基本信息.所在地点 }}</dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>{{ npc.当前状态 }}</dd>
            </div>
            <div>
              <dt>对杨世发态度</dt>
              <dd>{{ npc.对杨世发态度 }}</dd>
            </div>
            <div>
              <dt>当前动作</dt>
              <dd>{{ npc.互动记录.当前动作 }}</dd>
            </div>
            <div class="wide">
              <dt>最近互动</dt>
              <dd>{{ npc.互动记录.最近互动 }}</dd>
            </div>

            <div class="wide section-label">亲密档案</div>
            <div>
              <dt>小穴</dt>
              <dd>{{ npc.亲密档案.小穴 }}</dd>
            </div>
            <div>
              <dt>肛门</dt>
              <dd>{{ npc.亲密档案.肛门 }}</dd>
            </div>
            <div>
              <dt>嘴部</dt>
              <dd>{{ npc.亲密档案.嘴部 }}</dd>
            </div>
            <div>
              <dt>特殊性技</dt>
              <dd>{{ npc.亲密档案.特殊性技 }}</dd>
            </div>
            <div class="wide">
              <dt>性癖喜好</dt>
              <dd>{{ npc.亲密档案.性癖喜好 }}</dd>
            </div>

            <div class="wide section-label">状态标记</div>
            <div>
              <dt>怀孕情况</dt>
              <dd>{{ npc.亲密档案.怀孕情况 }}</dd>
            </div>
            <div>
              <dt>性交次数</dt>
              <dd>{{ npc.性交次数 }}</dd>
            </div>
            <div>
              <dt>是否为处女</dt>
              <dd>{{ npc.是否为处女 ? '是' : '否' }}</dd>
            </div>
            <div>
              <dt>是否有对象</dt>
              <dd>{{ npc.是否有对象 ? '是' : '否' }}</dd>
            </div>
            <div>
              <dt>是否结婚</dt>
              <dd>{{ npc.是否结婚 ? '是' : '否' }}</dd>
            </div>
          </dl>
        </div>
      </details>
    </section>

    <section v-else-if="activeTab === 'items'" class="tab-panel" aria-label="物品">
      <div v-if="!inventory.length" class="empty-state">暂无随身物品</div>
      <details v-for="[name, item] in inventory" :key="name" class="fold-row">
        <summary>
          <strong>{{ name }}</strong>
          <span>x{{ item.数量 }}</span>
        </summary>
        <p class="fold-copy">{{ item.描述 }}</p>
      </details>
    </section>

    <section v-else class="tab-panel" aria-label="遮蔽">
      <div class="veil-grid">
        <div class="fact-block">
          <h2>调试者遮蔽</h2>
          <dl>
            <div>
              <dt>存在事实</dt>
              <dd>{{ data.调试者遮蔽._存在事实 }}</dd>
            </div>
            <div>
              <dt>身份状态</dt>
              <dd>{{ data.调试者遮蔽._身份状态 }}</dd>
            </div>
            <div>
              <dt>遮蔽强度</dt>
              <dd>
                <ValueMeter label="遮蔽强度" :value="data.调试者遮蔽.遮蔽强度" compact />
              </dd>
            </div>
          </dl>
        </div>

        <div class="fact-block">
          <h2>许可状态</h2>
          <div class="permission-row">
            <span :data-enabled="data.调试者遮蔽._交流许可">交流 {{ permissionText(data.调试者遮蔽._交流许可) }}</span>
            <span :data-enabled="data.调试者遮蔽._互知许可">互知 {{ permissionText(data.调试者遮蔽._互知许可) }}</span>
          </div>
          <p class="soft-copy">{{ data.调试者遮蔽.叙事备注 }}</p>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from 'vue';
import { useDataStore } from './store';

type MeterTone = 'safe' | 'warn' | 'danger';
type TabId = 'overview' | 'rules' | 'npcs' | 'items' | 'veil';

const AccordionGroup = defineComponent({
  props: {
    title: { type: String, required: true },
    count: { type: Number, required: true },
    unit: { type: String, default: '项' },
  },
  setup(props, { slots }) {
    return () =>
      h('section', { class: 'accordion-group' }, [
        h('header', { class: 'group-title' }, [
          h('div', { class: 'group-title-main' }, [
            h('span', { class: 'group-kicker' }, 'RULE STACK'),
            h('h2', props.title),
          ]),
          h('span', { class: 'group-count', 'aria-label': `${props.title} ${props.count}${props.unit}` }, [
            h('strong', String(props.count)),
            h('small', props.unit),
          ]),
        ]),
        props.count > 0 ? slots.default?.() : h('div', { class: 'empty-state' }, '暂无记录'),
      ]);
  },
});

const ValueMeter = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    inverse: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const value = normalizePercent(props.value);
      const tone = getMeterTone(value, props.inverse);
      return h('div', { class: ['value-meter', { compact: props.compact }], 'data-tone': tone }, [
        h('div', { class: 'value-meter-head' }, [h('span', props.label), h('strong', `${value}%`)]),
        h('div', { class: 'meter-track', 'aria-label': `${props.label} ${value}` }, [
          h('div', { class: 'meter-fill', style: { width: `${value}%` } }),
        ]),
      ]);
    };
  },
});

const store = useDataStore();
const data = store.data;
const activeTab = ref<TabId>('overview');

const inventory = computed(() => Object.entries(data.杨世发.随身物品));
const ruleEntries = computed(() => Object.entries(data.世界.生效规则));
const npcEntries = computed(() => Object.entries(data.重要NPC));

const meters = computed(() =>
  [
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
  const riskMeters = meters.value.filter(meter => meter.label !== '遮蔽强度');
  return riskMeters.reduce((current, meter) => (meter.value > current.value ? meter : current), riskMeters[0]);
});

const newestChangeText = computed(() => {
  const latest = ruleEntries.value.at(-1);
  return latest ? `${latest[0]}：${latest[1].杨世发观测}` : '暂无生效规则观测';
});

const tabs = computed<Array<{ id: TabId; label: string; count: number | string }>>(() => [
  { id: 'overview', label: '总览', count: `${ruleEntries.value.length}规` },
  {
    id: 'rules',
    label: '规则',
    count: `${ruleEntries.value.length}条`,
  },
  { id: 'npcs', label: 'NPC', count: `${npcEntries.value.length}人` },
  { id: 'items', label: '物品', count: `${inventory.value.length}件` },
  { id: 'veil', label: '遮蔽', count: `${normalizePercent(data.调试者遮蔽.遮蔽强度)}%` },
]);

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
  --surface: oklch(22% 0.014 182);
  --panel: oklch(27% 0.014 182);
  --panel-raised: oklch(31% 0.016 178);
  --line: oklch(45% 0.024 176);
  --line-soft: oklch(38% 0.018 176);
  --text: oklch(92% 0.01 124);
  --muted: oklch(74% 0.02 150);
  --faint: oklch(61% 0.018 155);
  --safe: oklch(72% 0.13 155);
  --safe-soft: oklch(36% 0.048 155);
  --warn: oklch(78% 0.13 82);
  --warn-soft: oklch(39% 0.052 82);
  --danger: oklch(65% 0.15 30);
  --danger-soft: oklch(37% 0.06 30);
  width: auto;
  max-width: 820px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 11px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(180deg, oklch(26% 0.018 182), transparent 220px),
    repeating-linear-gradient(90deg, transparent 0 18px, oklch(30% 0.012 182 / 0.2) 18px 19px), var(--surface);
  color: var(--text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'Microsoft YaHei UI', system-ui, sans-serif;
  font-size: 13px;
  line-height: 1.45;
}

.console-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(142px, 0.34fr);
  gap: 8px;
  align-items: stretch;
}

.title-block,
.status-token,
.world-strip,
.tab-list,
.tab-panel {
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--line-soft);
  border-radius: 8px;
  background: color-mix(in oklch, var(--panel) 92%, oklch(35% 0.018 182));
}

.title-block {
  padding: 12px 13px;
}

.eyebrow,
.world-strip span,
dt,
.signal-meter small,
.status-token span,
.status-token small {
  color: var(--faint);
  font-size: 11px;
  font-weight: 760;
}

.eyebrow {
  margin: 0 0 3px;
  letter-spacing: 0;
}

h1,
h2,
h3,
p,
dl {
  margin: 0;
}

h1 {
  color: var(--text);
  font-size: 21px;
  font-weight: 850;
  line-height: 1.15;
}

h2 {
  color: var(--text);
  font-size: 13px;
  font-weight: 850;
}

h3 {
  color: var(--text);
  font-size: 12px;
  font-weight: 850;
}

.subtitle {
  margin-top: 5px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.status-stack {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.status-token {
  display: grid;
  align-content: center;
  min-height: 78px;
  padding: 9px;
}

.status-token strong {
  color: var(--text);
  font-size: 25px;
  font-weight: 900;
  line-height: 1.05;
}

.status-token:first-child {
  border-color: color-mix(in oklch, var(--safe) 34%, var(--line-soft));
  background: color-mix(in oklch, var(--safe-soft) 26%, var(--panel));
}

.world-strip {
  display: grid;
  grid-template-columns: 0.72fr 1.28fr;
  gap: 1px;
  margin-top: 8px;
  overflow: hidden;
  background: var(--line-soft);
}

.world-strip div {
  min-width: 0;
  padding: 8px 10px;
  background: var(--panel);
}

.world-strip strong {
  display: block;
  margin-top: 3px;
  color: var(--text);
  font-size: 12px;
  font-weight: 760;
  overflow-wrap: anywhere;
}

.tab-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 4px;
  margin-top: 8px;
  padding: 4px;
}

.tab-button {
  display: flex;
  min-width: 0;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.tab-button:hover,
.tab-button:focus-visible {
  border-color: var(--line);
  outline: none;
  background: var(--panel-raised);
}

.tab-button.active {
  border-color: color-mix(in oklch, var(--safe) 36%, var(--line));
  background: color-mix(in oklch, var(--safe-soft) 34%, var(--panel));
  color: var(--text);
}

.tab-button small {
  min-width: 22px;
  padding: 1px 5px;
  border-radius: 999px;
  background: oklch(20% 0.012 182);
  color: var(--faint);
  font-size: 11px;
  font-weight: 850;
}

.tab-panel {
  margin-top: 8px;
  padding: 10px;
}

.signal-board,
.fact-cluster,
.veil-grid {
  display: grid;
  gap: 8px;
}

.signal-board {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.signal-meter,
.fact-block,
.accordion-group,
.fold-row,
.npc-fold {
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--line-soft);
  border-radius: 7px;
  background: var(--panel-raised);
}

.signal-meter {
  --tone: var(--safe);
  --tone-soft: var(--safe-soft);
  padding: 8px;
}

.signal-meter[data-tone='warn'],
.value-meter[data-tone='warn'] {
  --tone: var(--warn);
  --tone-soft: var(--warn-soft);
}

.signal-meter[data-tone='danger'],
.value-meter[data-tone='danger'] {
  --tone: var(--danger);
  --tone-soft: var(--danger-soft);
}

.meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.meter-head span,
.value-meter-head span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 760;
}

.meter-head strong,
.value-meter-head strong {
  color: var(--text);
  font-size: 15px;
  font-weight: 870;
}

.meter-track {
  height: 6px;
  margin-top: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: oklch(19% 0.01 182);
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

.fact-cluster,
.veil-grid {
  grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr);
  margin-top: 8px;
}

.fact-block {
  padding: 10px;
}

.fact-block dl,
.detail-grid,
.outfit-panel dl {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-grid .wide {
  grid-column: 1 / -1;
}

.detail-grid .section-label {
  margin-top: 6px;
  padding: 6px 0 2px;
  border-bottom: 1px solid var(--line-soft);
  color: var(--safe);
  font-size: 11px;
  font-weight: 860;
  letter-spacing: 0.06em;
}

.detail-grid .section-label:first-child {
  margin-top: 0;
}

.body-features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.body-features .wide {
  grid-column: 1 / -1;
}

.body-features dt {
  color: var(--faint);
  font-size: 11px;
  font-weight: 720;
}

.body-features dd {
  margin-top: 1px;
  color: var(--text);
}

dt {
  margin: 0;
}

dd {
  margin: 2px 0 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

.dimension-list {
  display: grid;
  gap: 5px;
}

.dimension-list span {
  display: block;
  min-width: 0;
  padding: 6px 7px;
  border: 1px solid var(--line-soft);
  border-radius: 6px;
  background: color-mix(in oklch, var(--panel) 82%, var(--panel-raised));
}

.dimension-list b {
  display: inline-block;
  margin-right: 6px;
  color: var(--safe);
  font-weight: 850;
}

.risk-line {
  margin-top: 8px;
  color: var(--warn);
  font-weight: 860;
}

.soft-copy,
.fold-copy {
  color: var(--muted);
  overflow-wrap: anywhere;
}

.soft-copy {
  margin-top: 8px;
}

.accordion-group + .accordion-group,
.fold-row + .fold-row,
.npc-fold + .npc-fold {
  margin-top: 8px;
}

.rules-readout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.accordion-group :deep(.group-title) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 8px 8px 0;
  padding: 8px 9px;
  border-bottom: 1px solid var(--line-soft);
  border: 1px solid color-mix(in oklch, var(--safe) 26%, var(--line-soft));
  border-radius: 7px;
  background:
    linear-gradient(90deg, color-mix(in oklch, var(--safe-soft) 28%, transparent), transparent 58%),
    color-mix(in oklch, var(--panel) 90%, oklch(34% 0.014 180));
}

.accordion-group :deep(.group-title-main) {
  min-width: 0;
}

.accordion-group :deep(.group-title h2) {
  margin-top: 1px;
  font-size: 14px;
  line-height: 1.1;
}

.accordion-group :deep(.group-kicker) {
  display: block;
  color: var(--faint);
  font-size: 10px;
  font-weight: 820;
  line-height: 1;
}

.accordion-group :deep(.group-count) {
  display: inline-grid;
  grid-template-columns: auto auto;
  align-items: baseline;
  gap: 3px;
  min-width: 42px;
  padding: 4px 8px;
  border: 1px solid color-mix(in oklch, var(--safe) 32%, var(--line-soft));
  border-radius: 999px;
  background: oklch(20% 0.012 182);
  color: var(--text);
  white-space: nowrap;
}

.accordion-group :deep(.group-count strong) {
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
}

.accordion-group :deep(.group-count small) {
  color: var(--faint);
  font-size: 10px;
  font-weight: 820;
}

.fold-row,
.npc-fold {
  background: oklch(29% 0.014 180);
}

.accordion-group .fold-row {
  margin: 8px;
}

.fold-row summary,
.npc-fold summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 9px 10px;
  cursor: pointer;
  list-style: none;
}

.npc-fold summary {
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 0.9fr);
}

.fold-row summary::-webkit-details-marker,
.npc-fold summary::-webkit-details-marker {
  display: none;
}

.fold-row summary::before,
.npc-fold summary::before {
  content: '+';
  width: 18px;
  height: 18px;
  grid-row: 1;
  align-self: center;
  border-radius: 999px;
  background: oklch(20% 0.012 182);
  color: var(--safe);
  font-size: 13px;
  font-weight: 900;
  line-height: 18px;
  text-align: center;
}

.fold-row[open] summary::before,
.npc-fold[open] summary::before {
  content: '−';
}

.fold-row summary strong,
.npc-fold summary strong {
  color: var(--text);
  font-weight: 850;
  overflow-wrap: anywhere;
}

.fold-row summary span,
.npc-fold summary span,
.npc-fold summary small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 720;
  overflow-wrap: anywhere;
}

.fold-row summary > strong {
  grid-column: 1;
}

.fold-row summary > span {
  grid-column: 2;
}

.summary-meta {
  display: grid;
  gap: 2px;
}

.summary-meta b,
.summary-meta em {
  min-width: 0;
  color: inherit;
  font: inherit;
  overflow-wrap: anywhere;
}

.summary-meta b {
  color: var(--text);
  font-weight: 790;
}

.summary-meta em {
  color: var(--muted);
  font-style: normal;
}

.fold-row summary::before {
  grid-column: 1;
}

.fold-row summary > strong {
  grid-column: 2;
}

.fold-row summary > span {
  grid-column: 3;
}

.npc-fold summary::before {
  grid-column: 1;
}

.npc-fold summary > div {
  grid-column: 2;
}

.npc-fold summary small {
  grid-column: 3;
}

.fold-row .detail-grid,
.npc-body,
.fold-copy {
  padding: 0 10px 10px;
}

.relation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.npc-profile,
.outfit-panel {
  min-width: 0;
  box-sizing: border-box;
  margin-bottom: 10px;
  border: 1px solid var(--line-soft);
  border-radius: 7px;
  background: color-mix(in oklch, var(--panel) 84%, oklch(34% 0.014 180));
}

.npc-profile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  background: var(--line-soft);
}

.profile-copy {
  min-width: 0;
  padding: 9px;
  background: color-mix(in oklch, var(--panel-raised) 86%, var(--panel));
}

.profile-copy.wide {
  grid-column: 1 / -1;
  background: color-mix(in oklch, var(--safe-soft) 18%, var(--panel-raised));
}

.profile-copy p,
.outfit-panel dd {
  margin-top: 4px;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.outfit-panel {
  padding: 9px;
}

.outfit-panel dl {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.outfit-panel .wide {
  grid-column: 1 / -1;
}

.value-meter {
  --tone: var(--safe);
  --tone-soft: var(--safe-soft);
  padding: 8px;
  border: 1px solid color-mix(in oklch, var(--tone) 28%, var(--line-soft));
  border-radius: 7px;
  background: color-mix(in oklch, var(--tone-soft) 24%, var(--panel));
}

.value-meter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.value-meter.compact {
  padding: 7px;
  background: color-mix(in oklch, var(--tone-soft) 18%, var(--panel));
}

.permission-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.permission-row span {
  padding: 4px 7px;
  border: 1px solid color-mix(in oklch, var(--danger) 35%, var(--line-soft));
  border-radius: 999px;
  background: color-mix(in oklch, var(--danger-soft) 28%, var(--panel));
  color: var(--danger);
  font-size: 12px;
  font-weight: 820;
}

.permission-row span[data-enabled='true'] {
  border-color: color-mix(in oklch, var(--safe) 40%, var(--line-soft));
  background: color-mix(in oklch, var(--safe-soft) 30%, var(--panel));
  color: var(--safe);
}

.empty-state {
  padding: 10px;
  border: 1px dashed var(--line-soft);
  border-radius: 7px;
  color: var(--faint);
  text-align: center;
}

@media (max-width: 700px) {
  .console-header,
  .world-strip,
  .fact-cluster,
  .veil-grid {
    grid-template-columns: 1fr;
  }

  .signal-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rules-readout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .debug-console {
    padding: 8px;
    border-radius: 7px;
  }

  .status-stack,
  .tab-list,
  .detail-grid,
  .npc-profile,
  .outfit-panel dl,
  .relation-grid,
  .fold-row summary,
  .npc-fold summary {
    grid-template-columns: 1fr;
  }

  .fold-row summary::before,
  .npc-fold summary::before {
    grid-column: 1;
    grid-row: 1;
  }

  .fold-row summary > strong,
  .npc-fold summary > div,
  .npc-fold summary small {
    grid-column: 1;
  }

  .fold-row summary > span {
    grid-column: 1;
  }

  .tab-button {
    justify-content: space-between;
  }
}
</style>
