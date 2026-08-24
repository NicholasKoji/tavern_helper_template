<template>
  <header class="status-topbar">
    <div class="topbar-identity">
      <div class="kicker-group">
        <span class="kicker-seal">修</span>
        <span class="kicker-text">REALITY EDITOR</span>
      </div>
      <h1 class="topbar-title">人间修订中</h1>
    </div>

    <div class="topbar-status-group">
      <span class="editor-status-pill" :class="`is-${editorStatus}`">
        <span class="status-dot"></span>
        <span>{{ editorStatus }}</span>
      </span>
      <span class="manifest-pill" :class="{ 'is-manifest': editorManifested }">
        {{ editorManifested ? '已显现' : '未显现' }}
      </span>
    </div>

    <div class="topbar-actions">
      <button class="rule-edit-btn" type="button" @click="$emit('openRuleEditor')">
        <PenLine :size="14" stroke-width="2" />
        <span>改规则</span>
      </button>
      <button
        class="settings-btn"
        :class="{ active: settingsOpen }"
        type="button"
        aria-label="偏好设置"
        @click="settingsOpen = !settingsOpen"
      >
        <Settings :size="15" stroke-width="1.8" />
      </button>
    </div>

    <!-- 偏好设置弹窗 -->
    <transition name="dropdown-fade">
      <section
        v-if="settingsOpen"
        class="status-settings-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="status-settings-title"
      >
        <header class="settings-head">
          <div class="settings-head-copy">
            <span class="settings-kicker">PREFERENCES</span>
            <h2 id="status-settings-title">视觉风格偏好</h2>
          </div>
          <button class="close-btn" type="button" aria-label="关闭设置" @click="settingsOpen = false">
            <X :size="16" />
          </button>
        </header>

        <p class="settings-desc">四个视觉预设共用同一套状态栏信息架构，只改变配色与阅读氛围：</p>

        <div class="theme-options-grid" role="radiogroup" aria-label="选择主题">
          <button
            v-for="theme in themeOptions"
            :key="theme.id"
            class="theme-option-card"
            :class="{ active: theme.id === activeTheme }"
            type="button"
            role="radio"
            :aria-checked="theme.id === activeTheme"
            @click="selectTheme(theme.id)"
          >
            <span class="theme-swatch" :data-theme-swatch="theme.id" aria-hidden="true" />
            <div class="theme-info">
              <div class="theme-name-row">
                <strong class="theme-name">{{ theme.name }}</strong>
                <span class="theme-seal">{{ theme.seal }}</span>
              </div>
              <small class="theme-caption">{{ theme.caption }}</small>
            </div>
            <span v-if="theme.id === activeTheme" class="check-icon">
              <Check :size="13" stroke-width="2.5" />
            </span>
          </button>
        </div>
      </section>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Check, PenLine, Settings, X } from '@lucide/vue';
import { themeOptions, type ThemeId } from '../../theme';

defineProps<{
  editorStatus: string;
  editorManifested: boolean;
  activeTheme: ThemeId;
}>();

const emit = defineEmits<{
  (e: 'openRuleEditor'): void;
  (e: 'selectTheme', theme: ThemeId): void;
}>();

const settingsOpen = ref(false);

function selectTheme(theme: ThemeId) {
  emit('selectTheme', theme);
}
</script>

<style scoped>
.status-topbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--paper-elevated);
  border-bottom: 1px solid var(--border-hairline);
  box-shadow: var(--shadow-sm);
}

.topbar-identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kicker-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.kicker-seal {
  background: var(--cinnabar);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: var(--radius-pill);
  line-height: 1.2;
}

.kicker-text {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-muted);
  letter-spacing: 0.08em;
}

.topbar-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-heading);
  line-height: 1.2;
}

.topbar-status-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-body);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cinnabar);
}

.manifest-pill {
  padding: 2px 7px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  font-size: 10.5px;
  color: var(--ink-muted);
}

.manifest-pill.is-manifest {
  background: var(--brass-soft);
  border-color: var(--brass-border);
  color: var(--brass);
  font-weight: 600;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.rule-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--cinnabar-soft);
  border: 1px solid var(--cinnabar);
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  color: var(--cinnabar);
  transition: all 0.18s ease;
}

.rule-edit-btn:hover {
  background: var(--cinnabar);
  color: #fff;
  box-shadow: 0 2px 8px var(--cinnabar-glow);
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
  transition: all 0.15s ease;
}

.settings-btn:hover,
.settings-btn.active {
  background: var(--paper-elevated);
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

/* 偏好设置浮层 */
.status-settings-panel {
  position: absolute;
  top: 100%;
  right: 12px;
  z-index: 50;
  width: min(340px, calc(100vw - 32px));
  margin-top: 6px;
  padding: 14px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.settings-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.settings-kicker {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.08em;
}

.settings-head-copy h2 {
  margin: 1px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-heading);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  color: var(--ink-muted);
  border-radius: var(--radius-sm);
}

.close-btn:hover {
  background: var(--paper-subtle);
  color: var(--ink-heading);
}

.settings-desc {
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-muted);
  line-height: 1.4;
}

.theme-options-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-option-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.15s ease;
}

.theme-option-card:hover {
  background: var(--paper-elevated);
  border-color: var(--brass-border);
}

.theme-option-card.active {
  background: var(--paper-elevated);
  border-color: var(--cinnabar);
  box-shadow: 0 0 0 1px var(--cinnabar);
}

.theme-swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.theme-swatch[data-theme-swatch='archive'] {
  background: #c84b31;
}
.theme-swatch[data-theme-swatch='astrolabe'] {
  background: #c29b38;
}
.theme-swatch[data-theme-swatch='terminal'] {
  background: #d64045;
}
.theme-swatch[data-theme-swatch='neon'] {
  background: #ff3399;
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.theme-name {
  font-size: 12px;
  color: var(--ink-heading);
}

.theme-seal {
  font-size: 9.5px;
  padding: 1px 4px;
  background: var(--brass-soft);
  color: var(--brass);
  border-radius: 3px;
  font-weight: 600;
}

.theme-caption {
  display: block;
  font-size: 10.5px;
  color: var(--ink-muted);
}

.check-icon {
  color: var(--cinnabar);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 600px) {
  .status-topbar {
    padding: 10px 12px;
    flex-wrap: wrap;
  }
  .topbar-status-group {
    order: 3;
    width: 100%;
    margin-top: 4px;
  }
}
</style>
