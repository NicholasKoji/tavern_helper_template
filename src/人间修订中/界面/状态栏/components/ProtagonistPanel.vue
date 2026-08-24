<template>
  <div class="panel-container">
    <article v-if="protagonist.启用" class="dossier-card protagonist-card">
      <header class="card-head">
        <div class="head-left">
          <User :size="16" class="head-icon" />
          <h2 class="card-title">{{ protagonist.基础信息.姓名 || '主角档案' }}</h2>
        </div>
        <span class="card-tag">{{ protagonist.基础信息.身份 || '身份未记录' }}</span>
      </header>

      <div class="card-body-sections">
        <!-- 基础信息 -->
        <section class="section-block">
          <h3 class="section-title">基础档案</h3>
          <div class="data-grid-2col">
            <div class="data-row">
              <span class="data-key">姓名</span>
              <span class="data-val">{{ protagonist.基础信息.姓名 || '未记录' }}</span>
            </div>
            <div class="data-row">
              <span class="data-key">性别</span>
              <span class="data-val">{{ protagonist.基础信息.性别 || '未指定' }}</span>
            </div>
            <div class="data-row">
              <span class="data-key">年龄</span>
              <span class="data-val">{{ formatAge(protagonist.基础信息.年龄) }}</span>
            </div>
            <div class="data-row">
              <span class="data-key">身份</span>
              <span class="data-val">{{ protagonist.基础信息.身份 || '未指定' }}</span>
            </div>
            <div class="data-row span-2">
              <span class="data-key">目标</span>
              <span class="data-val">{{ protagonist.基础信息.目标 || '未指定' }}</span>
            </div>
            <div class="data-row span-2">
              <span class="data-key">与编辑器关系</span>
              <span class="data-val">{{ protagonist.基础信息.与编辑器关系 || '未指定' }}</span>
            </div>
          </div>
        </section>

        <!-- 外貌特征 -->
        <section class="section-block">
          <h3 class="section-title">外貌身形</h3>
          <div class="data-grid-2col">
            <div class="data-row">
              <span class="data-key">身高</span>
              <span class="data-val">{{ protagonist.外貌.身高 || '未指定' }}</span>
            </div>
            <div class="data-row">
              <span class="data-key">体型</span>
              <span class="data-val">{{ protagonist.外貌.体型 || '未指定' }}</span>
            </div>
            <div class="data-row span-2">
              <span class="data-key">面容气质</span>
              <span class="data-val">{{ protagonist.外貌.面容气质 || '未指定' }}</span>
            </div>
            <div class="data-row span-2">
              <span class="data-key">身体特征</span>
              <span class="data-val">{{ protagonist.外貌.身体特征 || '未指定' }}</span>
            </div>
          </div>
        </section>

        <!-- 性格底色 -->
        <section class="section-block">
          <h3 class="section-title">性格心性</h3>
          <div class="data-grid-2col">
            <div class="data-row">
              <span class="data-key">底色</span>
              <span class="data-val">{{ protagonist.性格.底色 || '未指定' }}</span>
            </div>
            <div class="data-row">
              <span class="data-key">主色调</span>
              <span class="data-val">{{ protagonist.性格.主色调 || '未指定' }}</span>
            </div>
          </div>
        </section>

        <!-- 当前状态 -->
        <section v-if="protagonist.当前状态" class="section-block">
          <h3 class="section-title">当前状态</h3>
          <p class="narrative-paragraph">{{ protagonist.当前状态 }}</p>
        </section>

        <!-- 穿着打扮 -->
        <section class="section-block">
          <h3 class="section-title">当前穿着</h3>
          <div class="clothing-grid">
            <div v-for="(val, part) in clothingMap" :key="part" class="clothing-tag">
              <span class="cloth-part">{{ part }}：</span>
              <span class="cloth-val">{{ val || '默认' }}</span>
            </div>
          </div>
        </section>

        <!-- 补充设定 -->
        <section v-if="protagonist.补充设定" class="section-block">
          <h3 class="section-title">补充设定</h3>
          <p class="narrative-paragraph">{{ protagonist.补充设定 }}</p>
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

    <!-- 未启用主角提示 -->
    <div v-else class="notice-card">
      <h3 class="notice-title">主角未启用</h3>
      <p class="notice-desc">玩家当前为故事外操作者与现实编辑器持有者，正文中不生成主角人物角色。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { User } from '@lucide/vue';

const props = defineProps<{
  protagonist: any;
}>();

function formatAge(value: unknown): string {
  return Number(value) === -1 ? '待定' : String(value ?? '待定');
}

const clothingMap = computed(() => {
  const c = props.protagonist.穿着 || {};
  return {
    上装: c.上装,
    下装: c.下装,
    内衣: c.内衣,
    袜子: c.袜子,
    鞋子: c.鞋子,
    配饰: c.配饰,
  };
});

const privateEntries = computed(() => Object.entries(props.protagonist.私密状态 || {}));
</script>

<style scoped>
.panel-container {
  padding: 12px;
}

.dossier-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.protagonist-card {
  border-top: 3px solid var(--cinnabar);
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
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-heading);
}

.card-tag {
  font-size: 11px;
  color: var(--brass);
  font-weight: 600;
  padding: 2px 6px;
  background: var(--brass-soft);
  border-radius: var(--radius-sm);
}

.card-body-sections {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 6px 12px;
}

.span-2 {
  grid-column: span 2;
}

.data-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
  padding: 3px 0;
  border-bottom: 1px dashed var(--border-hairline);
}

.data-key {
  color: var(--ink-muted);
  font-weight: 600;
}

.data-val {
  color: var(--ink-body);
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
}

.clothing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.clothing-tag {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
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

@media (max-width: 600px) {
  .data-grid-2col,
  .clothing-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
}
</style>
