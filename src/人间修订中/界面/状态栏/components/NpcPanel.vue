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
          <div class="card-head-actions">
            <div class="favor-head-badge">
              <span class="favor-title">好感度</span>
              <span class="meter-bar" aria-hidden="true">
                <span
                  class="meter-fill"
                  :style="{ width: `${Math.min(selectedNpc.基础信息.好感度 || 0, 100)}%` }"
                ></span>
              </span>
              <span class="favor-num">{{ selectedNpc.基础信息.好感度 ?? '--' }}</span>
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
          </div>
        </header>

        <div class="card-body-sections">
          <!-- 基础信息 -->
          <section class="section-block">
            <h3 class="section-title">基础档案</h3>
            <div class="data-grid-2col">
              <div class="data-row">
                <span class="data-key">性别</span>
                <span class="data-val">{{ selectedNpc.基础信息.性别 || '未指定' }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">年龄</span>
                <span class="data-val">{{ formatAge(selectedNpc.基础信息.年龄) }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">身份</span>
                <span class="data-val">{{ selectedNpc.基础信息.身份 || '未指定' }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">关系定位</span>
                <span class="data-val">{{ selectedNpc.基础信息.关系定位 || '未指定' }}</span>
              </div>
            </div>
          </section>

          <!-- 外貌特征 -->
          <section class="section-block">
            <h3 class="section-title">外貌身形</h3>
            <div class="data-grid-2col">
              <div class="data-row">
                <span class="data-key">身高</span>
                <span class="data-val">{{ selectedNpc.外貌.身高 || '未指定' }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">罩杯</span>
                <span class="data-val">{{ selectedNpc.外貌.罩杯 || '未指定' }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">体型</span>
                <span class="data-val">{{ selectedNpc.外貌.体型 || '未指定' }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">面容气质</span>
                <span class="data-val">{{ selectedNpc.外貌.面容气质 || '未指定' }}</span>
              </div>
              <div class="data-row span-2">
                <span class="data-key">身体特征</span>
                <span class="data-val">{{ selectedNpc.外貌.身体特征 || '未指定' }}</span>
              </div>
            </div>
          </section>

          <!-- 性格底色 -->
          <section class="section-block">
            <h3 class="section-title">性格心性</h3>
            <div class="data-grid-2col">
              <div class="data-row">
                <span class="data-key">底色</span>
                <span class="data-val">{{ selectedNpc.性格.底色 || '未指定' }}</span>
              </div>
              <div class="data-row">
                <span class="data-key">主色调</span>
                <span class="data-val">{{ selectedNpc.性格.主色调 || '未指定' }}</span>
              </div>
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
            <div class="clothing-grid">
              <div v-for="(val, part) in clothingMap" :key="part" class="clothing-tag">
                <span class="cloth-part">{{ part }}：</span>
                <span class="cloth-val">{{ val || '默认' }}</span>
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
                  <span class="private-part">{{ part }}</span>
                  <span class="private-status-tag">{{ state.当前状态 || '正常' }}</span>
                </summary>
                <div class="private-body">
                  <div class="data-row">
                    <span class="data-key">外观描述</span>
                    <span class="data-val">{{ state.外观描述 || '无特殊记录' }}</span>
                  </div>
                  <div class="data-row">
                    <span class="data-key">当前状态</span>
                    <span class="data-val">{{ state.当前状态 || '无特殊记录' }}</span>
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
import { Users } from '@lucide/vue';

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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.roster-identity {
  display: block;
  font-size: 11px;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  overflow-wrap: anywhere;
}

.card-role-tag {
  font-size: 11px;
  color: var(--ink-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.favor-head-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  flex-shrink: 0;
}

.card-head-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.lore-action {
  min-height: 28px;
  padding: 5px 9px;
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-sm);
  background: var(--paper-base);
  color: var(--ink-heading);
  font-family: var(--font-mono);
  font-size: 10px;
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

.favor-title {
  color: var(--ink-muted);
  font-size: 10.5px;
}

.meter-bar {
  display: block;
  width: 60px;
  height: 6px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  overflow: hidden;
}

.meter-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--brass), var(--cinnabar));
  border-radius: var(--radius-pill);
}

.favor-num {
  font-weight: 700;
  color: var(--cinnabar);
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

.data-grid-2col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 12px;
  min-width: 0;
}

.span-2 {
  grid-column: span 2;
}

.data-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
  padding: 3px 0;
  border-bottom: 1px dashed var(--border-hairline);
  min-width: 0;
}

.data-key {
  color: var(--ink-muted);
  font-weight: 600;
  min-width: 0;
}

.data-val {
  color: var(--ink-body);
  word-break: break-word;
  min-width: 0;
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
}

.thought-paragraph {
  font-style: italic;
  color: var(--ink-muted);
}

.clothing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  min-width: 0;
}

.clothing-tag {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  min-width: 0;
}

.cloth-part {
  color: var(--ink-muted);
  font-weight: 600;
}

.cloth-val {
  color: var(--ink-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* 私密状态 */
.private-states-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.private-card {
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.private-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  background: var(--paper-subtle);
}

.private-part {
  font-weight: 600;
  color: var(--ink-heading);
}

.private-status-tag {
  font-size: 10.5px;
  color: var(--cinnabar);
}

.private-body {
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
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
  .data-grid-2col,
  .clothing-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .span-2 {
    grid-column: span 1;
  }
  .card-head {
    align-items: flex-start;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
    width: 100%;
  }
  .head-left {
    display: grid;
    width: 100%;
    max-width: 100%;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    column-gap: 7px;
    row-gap: 2px;
    min-width: 0;
  }
  .head-icon {
    grid-column: 1;
    grid-row: 1 / span 2;
    margin-top: 2px;
    flex-shrink: 0;
  }
  .card-title {
    grid-column: 2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .card-role-tag {
    grid-column: 2;
    width: 100%;
    max-width: 100%;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .card-head-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    max-width: 100%;
    align-items: stretch;
    justify-content: stretch;
    gap: 8px;
    min-width: 0;
  }
  .favor-head-badge,
  .lore-action {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
  .lore-action {
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: center;
  }
}
</style>
