<template>
  <div class="panel-container">
    <div v-if="npcEntries.length" class="npc-workspace">
      <!-- NPC 角色名册选择器 -->
      <aside class="npc-roster" aria-label="NPC 名册">
        <div class="roster-track">
          <button
            v-for="[name, npc] in npcEntries"
            :key="name"
            class="roster-item"
            :class="{ active: selectedName === name }"
            type="button"
            @click="$emit('selectNpc', name)"
          >
            <div class="roster-main">
              <strong class="roster-name">{{ name }}</strong>
              <span class="roster-identity">{{ npc.基础信息.身份 || '身份未记录' }}</span>
            </div>
            <div class="roster-favor">
              <span class="favor-label">好感</span>
              <span class="favor-val">{{ npc.基础信息.好感度 ?? '--' }}</span>
            </div>
          </button>
        </div>
      </aside>

      <!-- 选中 NPC 的详尽档案卡 -->
      <article v-if="selectedNpc" class="dossier-card npc-card">
        <header class="card-head">
          <div class="head-left">
            <Users :size="16" class="head-icon" />
            <h2 class="card-title">{{ selectedName }}</h2>
            <span class="card-role-tag">{{ selectedNpc.基础信息.关系定位 || '关系未指定' }}</span>
          </div>
          <button
            class="lore-action"
            type="button"
            :disabled="loreBusy"
            :aria-busy="loreBusy"
            @click="$emit('persistNpcLore', { name: selectedName, npc: selectedNpc })"
          >
            <span v-if="loreBusy">整理中…</span>
            <span v-else-if="loreManaged">重新整理并更新</span>
            <span v-else>整理并存入世界书</span>
          </button>
        </header>

        <!-- 好感度全宽沉浸式遥测条 -->
        <section class="favor-full-strip" aria-label="好感度">
          <div class="favor-info-row">
            <span class="favor-title-group">
              <Heart :size="13" class="favor-heart-icon" />
              <span class="favor-title">好感度</span>
            </span>
            <span class="favor-score">
              <strong class="score-val">{{ selectedNpc.基础信息.好感度 ?? '--' }}</strong>
              <span class="score-max">/ 100</span>
            </span>
          </div>
          <div
            class="favor-progress-track"
            role="progressbar"
            :aria-valuenow="selectedNpc.基础信息.好感度 || 0"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="favor-progress-fill"
              :style="{ width: `${Math.min(selectedNpc.基础信息.好感度 || 0, 100)}%` }"
            ></div>
          </div>
        </section>

        <div class="card-body-sections">
          <!-- 基础信息 -->
          <section class="section-block">
            <h3 class="section-title">基础档案</h3>
            <div class="meta-pills-row">
              <div class="meta-pill">
                <span class="pill-label">性别</span>
                <span class="pill-value">{{ selectedNpc.基础信息.性别 || '未指定' }}</span>
              </div>
              <div class="meta-pill">
                <span class="pill-label">年龄</span>
                <span class="pill-value">{{ formatAge(selectedNpc.基础信息.年龄) }}</span>
              </div>
            </div>
            <div class="field-stack">
              <span class="field-label">身份</span>
              <div class="field-value">{{ selectedNpc.基础信息.身份 || '未指定' }}</div>
            </div>
            <div class="field-stack">
              <span class="field-label">关系定位</span>
              <div class="field-value">{{ selectedNpc.基础信息.关系定位 || '未指定' }}</div>
            </div>
          </section>

          <!-- 外貌身形 -->
          <section class="section-block">
            <h3 class="section-title">外貌身形</h3>
            <div class="meta-pills-row">
              <div class="meta-pill">
                <span class="pill-label">身高</span>
                <span class="pill-value">{{ selectedNpc.外貌.身高 || '未指定' }}</span>
              </div>
              <div class="meta-pill">
                <span class="pill-label">罩杯</span>
                <span class="pill-value">{{ selectedNpc.外貌.罩杯 || '未指定' }}</span>
              </div>
            </div>
            <div class="field-stack">
              <span class="field-label">体型</span>
              <div class="field-value">{{ selectedNpc.外貌.体型 || '未指定' }}</div>
            </div>
            <div class="field-stack">
              <span class="field-label">面容气质</span>
              <div class="field-value">{{ selectedNpc.外貌.面容气质 || '未指定' }}</div>
            </div>
            <div class="field-stack">
              <span class="field-label">身体特征</span>
              <div class="field-value">{{ selectedNpc.外貌.身体特征 || '未指定' }}</div>
            </div>
          </section>

          <!-- 性格心性 -->
          <section class="section-block">
            <h3 class="section-title">性格心性</h3>
            <div class="field-stack">
              <span class="field-label">底色</span>
              <div class="field-value">{{ selectedNpc.性格.底色 || '未指定' }}</div>
            </div>
            <div class="field-stack">
              <span class="field-label">主色调</span>
              <div class="field-value">{{ selectedNpc.性格.主色调 || '未指定' }}</div>
            </div>
          </section>

          <!-- 当前状态 -->
          <section v-if="selectedNpc.当前状态" class="section-block">
            <h3 class="section-title">当前状态</h3>
            <p class="narrative-paragraph">{{ selectedNpc.当前状态 }}</p>
          </section>

          <!-- 当前穿着 -->
          <section class="section-block">
            <h3 class="section-title">当前穿着</h3>
            <div class="clothing-stack">
              <div v-for="(val, part) in clothingMap" :key="part" class="clothing-item-card">
                <span class="clothing-part-tag">{{ part }}</span>
                <span class="clothing-desc-text">{{ val || '默认' }}</span>
              </div>
            </div>
          </section>

          <!-- 当前想法 -->
          <section v-if="selectedNpc.当前想法" class="section-block">
            <h3 class="section-title">当前内心想法</h3>
            <p class="narrative-paragraph thought-paragraph">{{ selectedNpc.当前想法 }}</p>
          </section>

          <!-- 私密状态折叠卡片组 -->
          <section v-if="privateEntries.length" class="section-block">
            <h3 class="section-title">私密状态</h3>
            <div class="private-states-list">
              <details v-for="[part, state] in privateEntries" :key="part" class="private-card" open>
                <summary class="private-summary">
                  <span class="private-part-title">{{ part }}</span>
                  <ChevronDown :size="14" class="private-arrow" />
                </summary>
                <div class="private-body">
                  <div class="field-stack">
                    <span class="field-label">外观描述</span>
                    <div class="field-value">{{ state.外观描述 || '无特殊记录' }}</div>
                  </div>
                  <div class="field-stack state-highlight">
                    <span class="field-label">当前状态</span>
                    <div class="field-value">{{ state.当前状态 || '无特殊记录' }}</div>
                  </div>
                </div>
              </details>
            </div>
          </section>
        </div>
      </article>
    </div>

    <!-- 暂无 NPC -->
    <div v-else class="notice-card">
      <h3 class="notice-title">暂无登场 NPC 记录</h3>
      <p class="notice-desc">当前剧情尚未写入特定登场 NPC，随着正文推进将自动记录重要互动人物。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronDown, Heart, Users } from '@lucide/vue';

const props = defineProps<{
  npcEntries: Array<[string, any]>;
  selectedName: string;
  selectedNpc: any;
  loreManaged: boolean;
  loreBusy: boolean;
}>();

defineEmits<{
  (e: 'selectNpc', name: string): void;
  (e: 'persistNpcLore', payload: { name: string; npc: unknown }): void;
}>();

function formatAge(value: unknown): string {
  return Number(value) === -1 ? '待定' : String(value ?? '待定');
}

const clothingMap = computed(() => {
  if (!props.selectedNpc) return {};
  const c = props.selectedNpc.穿着 || {};
  return {
    上装: c.上装,
    下装: c.下装,
    内衣: c.内衣,
    袜子: c.袜子,
    鞋子: c.鞋子,
    配饰: c.配饰,
  };
});

const privateEntries = computed(() => {
  if (!props.selectedNpc) return [];
  return Object.entries(props.selectedNpc.私密状态 || {});
});
</script>

<style scoped>
.panel-container {
  padding: 12px;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.npc-workspace {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  min-width: 0;
  max-width: 100%;
}

.npc-roster {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 8px;
  box-shadow: var(--shadow-sm);
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.roster-track {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.roster-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.15s ease;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.roster-item:hover {
  background: var(--paper-subtle);
}

.roster-item.active {
  background: var(--paper-subtle);
  border-color: var(--brass-border);
  box-shadow: var(--shadow-sm);
}

.roster-main {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
}

.roster-name {
  display: block;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-heading);
  white-space: normal;
  word-break: break-word;
}

.roster-identity {
  display: block;
  font-size: 11px;
  color: var(--ink-muted);
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.roster-favor {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: var(--font-mono);
  font-size: 10px;
  flex-shrink: 0;
}

.favor-label {
  color: var(--ink-muted);
}

.favor-val {
  color: var(--cinnabar);
  font-weight: 700;
}

/* 详尽档案卡 */
.dossier-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.npc-card {
  border-top: 3px solid var(--brass);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
}

.head-left {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  flex: 1 1 auto;
}

.head-icon {
  color: var(--brass);
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-heading);
  min-width: 0;
  white-space: normal;
  word-break: break-word;
}

.card-role-tag {
  font-size: 11px;
  color: var(--ink-muted);
  white-space: normal;
  word-break: break-word;
  min-width: 0;
}

.lore-action {
  min-height: 28px;
  padding: 5px 12px;
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-sm);
  background: var(--paper-base);
  color: var(--ink-heading);
  font-family: var(--font-mono);
  font-size: 10.5px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    opacity 0.15s ease;
}

.lore-action:hover:not(:disabled) {
  background: var(--brass);
  color: var(--paper-base);
}

.lore-action:disabled {
  cursor: wait;
  opacity: 0.62;
}

/* 好感度全宽遥测条 */
.favor-full-strip {
  padding: 10px 14px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
}

.favor-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.favor-title-group {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-heading);
}

.favor-heart-icon {
  color: var(--cinnabar);
}

.favor-score {
  font-family: var(--font-mono);
}

.score-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--cinnabar);
}

.score-max {
  font-size: 11px;
  color: var(--ink-muted);
  margin-left: 2px;
}

.favor-progress-track {
  width: 100%;
  height: 8px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.favor-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brass), var(--cinnabar));
  border-radius: var(--radius-pill);
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-body-sections {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.section-title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* 短字段紧凑标签矩阵 */
.meta-pills-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
}

.meta-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.pill-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-muted);
  flex-shrink: 0;
}

.pill-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-heading);
  white-space: normal;
  word-break: break-word;
}

/* 长字段上下分布流式块 */
.field-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.field-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--ink-muted);
  letter-spacing: 0.04em;
}

.field-value {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink-body);
  white-space: normal;
  word-break: break-word;
}

.narrative-paragraph {
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-body);
  line-height: 1.6;
  background: var(--paper-base);
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-hairline);
  white-space: normal;
  word-break: break-word;
}

.thought-paragraph {
  font-style: italic;
  color: var(--ink-muted);
}

/* 当前穿着流式卡片 */
.clothing-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.clothing-item-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  min-width: 0;
}

.clothing-part-tag {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 700;
  color: var(--brass);
  letter-spacing: 0.05em;
}

.clothing-desc-text {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-body);
  white-space: normal;
  word-break: break-word;
}

/* 私密状态 */
.private-states-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.private-card {
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  overflow: hidden;
  min-width: 0;
}

.private-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 12.5px;
  background: var(--paper-subtle);
  border-bottom: 1px solid transparent;
  transition: background 0.15s ease;
}

.private-summary:hover {
  background: var(--paper-elevated);
}

.private-part-title {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink-heading);
}

.private-arrow {
  color: var(--ink-muted);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.private-card[open] .private-arrow {
  transform: rotate(180deg);
}

.private-card[open] .private-summary {
  border-bottom-color: var(--border-hairline);
}

.private-body {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.state-highlight {
  background: var(--paper-subtle);
  border-left: 3px solid var(--cinnabar);
}

.state-highlight .field-label {
  color: var(--cinnabar);
}

.notice-card {
  padding: 24px;
  text-align: center;
  background: var(--paper-elevated);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-lg);
}

.notice-title {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--ink-heading);
}

.notice-desc {
  margin: 0;
  font-size: 12px;
  color: var(--ink-muted);
}

@media (max-width: 720px) {
  .npc-workspace {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .npc-roster {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .roster-track {
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .roster-track::-webkit-scrollbar {
    display: none;
  }
  .roster-item {
    min-width: 140px;
    max-width: 220px;
    flex: 0 0 auto;
  }
  .roster-track > .roster-item:only-child {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
  }
  .roster-track > .roster-item:only-child .roster-identity {
    white-space: normal;
    word-break: break-word;
  }
  .card-head {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
    width: 100%;
  }
  .head-left {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 8px;
    row-gap: 2px;
    min-width: 0;
  }
  .lore-action {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: center;
  }
}
</style>
