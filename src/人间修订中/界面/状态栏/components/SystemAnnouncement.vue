<template>
  <transition name="announcement-fade">
    <div v-if="announcement" class="system-announcement-card" role="status" aria-live="polite">
      <header class="announcement-head">
        <div class="head-left">
          <span class="announcement-seal">公告</span>
          <strong class="head-title">现实编辑器 · 规则变动通告</strong>
        </div>
        <button class="close-btn" type="button" aria-label="关闭通告" @click="$emit('dismiss')">
          <X :size="14" />
        </button>
      </header>

      <ul class="announcement-list">
        <li v-for="item in announcement.items" :key="item.编号" class="announcement-item">
          <span class="mod-id">{{ item.编号 }}</span>
          <span class="mod-type" :class="`type-${item.类型}`">{{ item.类型 }}</span>
          <span class="mod-scope">[{{ item.范围 }}]</span>
          <strong class="mod-name">「{{ item.名称 }}」</strong>
          <span v-if="item.内容" class="mod-content">：{{ item.内容 }}</span>
        </li>
      </ul>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue';

defineProps<{
  announcement: {
    items: Array<{
      编号: string;
      类型: '新增' | '修订' | '废止';
      名称: string;
      内容: string;
      范围: string;
    }>;
  } | null;
}>();

defineEmits<{
  (e: 'dismiss'): void;
}>();
</script>

<style scoped>
.system-announcement-card {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 200;
  width: min(420px, calc(100vw - 24px));
  background: var(--paper-overlay);
  backdrop-filter: blur(10px) saturate(160%);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  box-shadow: var(--shadow-lg);
}

.announcement-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.announcement-seal {
  padding: 1px 5px;
  background: var(--cinnabar);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 9.5px;
  font-weight: 700;
}

.head-title {
  font-family: var(--font-display);
  font-size: 12.5px;
  color: var(--ink-heading);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--ink-muted);
  border-radius: 3px;
}

.close-btn:hover {
  background: var(--paper-subtle);
  color: var(--ink-heading);
}

.announcement-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.announcement-item {
  font-size: 11.5px;
  line-height: 1.4;
  color: var(--ink-body);
}

.mod-id {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-muted);
  margin-right: 4px;
}

.mod-type {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
}

.type-新增 {
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
}

.type-修订 {
  background: var(--brass-soft);
  color: var(--brass);
}

.type-废止 {
  background: oklch(0.5 0.18 25 / 0.15);
  color: oklch(0.5 0.2 25);
}

.mod-scope {
  color: var(--ink-muted);
  margin-right: 2px;
}

.mod-name {
  color: var(--ink-heading);
}

.mod-content {
  color: var(--ink-body);
}

.announcement-fade-enter-active,
.announcement-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.announcement-fade-enter-from,
.announcement-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
