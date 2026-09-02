<template>
  <div class="panel-container">
    <!-- 世界档案卡片 -->
    <article class="dossier-card">
      <header class="card-head">
        <div class="head-left">
          <BookOpen :size="16" class="head-icon" />
          <h2 class="card-title">世界档案 · 运行状态</h2>
        </div>
        <span class="status-seal">{{ data.现实编辑器.状态 }}</span>
      </header>

      <div class="card-body-sections">
        <div class="meta-pills-row">
          <div class="meta-pill">
            <span class="pill-label">主角状态</span>
            <span class="pill-value">{{ data.主角.启用 ? '已启用（在场）' : '未启用（故事外）' }}</span>
          </div>
          <div class="meta-pill">
            <span class="pill-label">编辑器显现</span>
            <span class="pill-value">{{ data.现实编辑器.是否显现 ? '已显现于世' : '潜伏（未显现）' }}</span>
          </div>
        </div>

        <div class="field-stack state-highlight">
          <span class="field-label">现实编辑器 · 最近反馈</span>
          <div class="field-value">{{ data.现实编辑器.最近反馈 || '暂无异常变动' }}</div>
        </div>

        <div class="field-stack">
          <span class="field-label">当前场景摘要</span>
          <div class="field-value">{{ data.当前场景.摘要 || '暂无摘要' }}</div>
        </div>
      </div>
    </article>

    <!-- 现实编辑器与生效规则 -->
    <article class="dossier-card">
      <header class="card-head">
        <div class="head-left">
          <ShieldCheck :size="16" class="head-icon" />
          <h2 class="card-title">现实编辑器 · 生效规则</h2>
        </div>
        <div class="head-badges">
          <span class="status-seal">{{ data.现实编辑器.状态 }}</span>
          <button class="mini-rule-btn" type="button" @click="$emit('openRuleEditor')">
            <PenLine :size="12" />
            <span>修订规则</span>
          </button>
        </div>
      </header>

      <div v-if="ruleScopeCount > 0" class="rules-tree">
        <details v-for="scope in ruleScopes" :key="scope.key" class="rule-scope-group" open>
          <summary class="scope-summary">
            <span class="scope-title">{{ scope.title }}</span>
            <span class="scope-count-badge">{{ scope.count }} 条生效</span>
          </summary>

          <template v-if="scope.key === '世界规则'">
            <ul class="rule-list">
              <li v-for="(content, name) in data.生效规则.世界规则" :key="name" class="rule-item">
                <strong class="rule-name">{{ name }}</strong>
                <span class="rule-colon">：</span>
                <span class="rule-desc">{{ content }}</span>
              </li>
            </ul>
          </template>

          <template v-else>
            <details
              v-for="[target, rules] in Object.entries(scope.entries || {})"
              :key="target"
              class="rule-subscope-group"
              open
            >
              <summary class="subscope-summary">
                <span class="subscope-target">作用对象：{{ target }}</span>
                <span class="subscope-count-badge">{{ Object.keys(rules).length }}</span>
              </summary>
              <ul class="rule-list">
                <li v-for="(content, name) in rules" :key="name" class="rule-item">
                  <strong class="rule-name">{{ name }}</strong>
                  <span class="rule-colon">：</span>
                  <span class="rule-desc">{{ content }}</span>
                </li>
              </ul>
            </details>
          </template>
        </details>
      </div>

      <div v-else class="empty-rules-box">
        <p class="empty-text">当前尚未签发生效规则。可点击右上角「修订规则」随时通过现实编辑器写入新秩序。</p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BookOpen, PenLine, ShieldCheck } from '@lucide/vue';

const props = defineProps<{
  data: any;
  formatLocation: string;
}>();

defineEmits<{
  (e: 'openRuleEditor'): void;
}>();

const ruleScopes = computed(() => {
  const rules = props.data.生效规则 || {};
  return [
    {
      key: '世界规则' as const,
      title: '世界级规则',
      count: Object.keys(rules.世界规则 ?? {}).length,
      entries: null,
    },
    {
      key: '区域规则' as const,
      title: '区域级规则',
      count: Object.values(rules.区域规则 ?? {}).reduce(
        (sum: number, group: any) => sum + Object.keys(group || {}).length,
        0,
      ),
      entries: rules.区域规则 ?? {},
    },
    {
      key: '个人规则' as const,
      title: '个人级规则',
      count: Object.values(rules.个人规则 ?? {}).reduce(
        (sum: number, group: any) => sum + Object.keys(group || {}).length,
        0,
      ),
      entries: rules.个人规则 ?? {},
    },
  ];
});

const ruleScopeCount = computed(() => ruleScopes.value.reduce((sum, scope) => sum + scope.count, 0));
</script>

<style scoped>
.panel-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.dossier-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.2s ease;
}

.dossier-card:hover {
  border-color: var(--border-subtle);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
}

.head-left {
  display: flex;
  align-items: center;
  gap: 7px;
}

.head-icon {
  color: var(--cinnabar);
}

.card-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-heading);
}

.card-tag {
  font-size: 11px;
  color: var(--ink-muted);
  white-space: normal;
  word-break: break-word;
}

.head-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-seal {
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--brass-soft);
  color: var(--brass);
  border-radius: var(--radius-sm);
}

.mini-rule-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--cinnabar-soft);
  border: 1px solid var(--cinnabar);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  color: var(--cinnabar);
  transition: all 0.15s ease;
}

.mini-rule-btn:hover {
  background: var(--cinnabar);
  color: #fff;
}

.card-body-sections {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

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

.state-highlight {
  background: var(--paper-subtle);
  border-left: 3px solid var(--cinnabar);
}

.state-highlight .field-label {
  color: var(--cinnabar);
}

/* 生效规则树状折叠组 */
.rules-tree {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-scope-group {
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.scope-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  background: var(--paper-subtle);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-heading);
}

.scope-count-badge {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 1px 6px;
  background: var(--brass-soft);
  color: var(--brass);
  border-radius: var(--radius-pill);
}

.rule-subscope-group {
  margin: 6px 10px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
}

.subscope-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: var(--ink-muted);
}

.subscope-count-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  background: var(--paper-elevated);
  border-radius: var(--radius-pill);
}

.rule-list {
  margin: 0;
  padding: 6px 12px 8px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-item {
  font-size: 12px;
  line-height: 1.5;
  padding: 3px 0;
  border-bottom: 1px dashed var(--border-hairline);
}

.rule-item:last-child {
  border-bottom: none;
}

.rule-name {
  color: var(--ink-heading);
  font-weight: 600;
}

.rule-colon {
  color: var(--ink-muted);
}

.rule-desc {
  color: var(--ink-body);
}

.empty-rules-box {
  padding: 18px 14px;
  text-align: center;
}

.empty-text {
  margin: 0;
  font-size: 12px;
  color: var(--ink-muted);
  line-height: 1.5;
}
</style>
