<template>
  <header class="dossier-masthead">
    <div class="masthead-top">
      <div class="masthead-brand">
        <div class="eyebrow-badge">
          <span class="eyebrow-seal">受理</span>
          <span class="eyebrow-text">创作访谈 · 开场配置</span>
        </div>
        <h1 class="dossier-title">人间修订中</h1>
        <p class="dossier-subtitle">先说想经历什么，再让世界长出能够开始游玩的形状。</p>
      </div>

      <div class="masthead-controls">
        <div class="registry-tag" :title="activeThemeMeta.caption">
          <component :is="activeThemeMeta.icon" :size="13" class="registry-icon" />
          <span>{{ activeThemeMeta.registry }}</span>
        </div>
        <button
          class="settings-btn"
          type="button"
          :class="{ active: settingsOpen }"
          aria-label="设置与主题偏好"
          @click="settingsOpen = !settingsOpen"
        >
          <Settings :size="16" stroke-width="1.8" />
        </button>
      </div>
    </div>

    <!-- 现实编辑器参与世界观生成开关条 -->
    <div class="integrator-bar" :class="{ 'is-active': modelValue }">
      <div class="integrator-info">
        <span class="integrator-icon-wrap">
          <Globe :size="15" stroke-width="1.8" />
        </span>
        <div class="integrator-text">
          <strong class="integrator-title">让现实编辑器参与世界观生成</strong>
          <p v-if="modelValue" class="integrator-hint">
            已开启：世界骨架会将编辑器的存在、传闻或规则异动纳入设计。
          </p>
          <p v-else class="integrator-hint">
            默认关闭：世界骨架完全不提及也不围绕它设计；它会在之后作为突发外来事物进入。
          </p>
        </div>
      </div>
      <label class="switch-toggle" aria-label="切换现实编辑器参与世界观生成">
        <input
          type="checkbox"
          role="switch"
          :checked="modelValue"
          @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
        <span class="switch-slider"></span>
      </label>
    </div>

    <!-- 偏好设置与主题选择弹窗 -->
    <transition name="fade-slide">
      <section
        v-if="settingsOpen"
        class="settings-dropdown"
        role="dialog"
        aria-modal="false"
        aria-labelledby="settings-title"
      >
        <header class="settings-head">
          <div class="head-copy">
            <span class="head-kicker">PREFERENCES</span>
            <h2 id="settings-title">视觉风格偏好</h2>
          </div>
          <button class="close-btn" type="button" aria-label="关闭设置" @click="settingsOpen = false">
            <X :size="16" />
          </button>
        </header>

        <p class="settings-lead">所有预设共用同一套响应式排版与字段架构，仅调整阅读质感与色调氛围：</p>

        <div class="theme-grid" role="radiogroup" aria-label="选择主题">
          <button
            v-for="theme in themeOptions"
            :key="theme.id"
            class="theme-card"
            :class="{ active: theme.id === activeTheme }"
            type="button"
            role="radio"
            :aria-checked="theme.id === activeTheme"
            @click="selectTheme(theme.id)"
          >
            <span class="theme-swatch" :data-theme-swatch="theme.id" aria-hidden="true" />
            <div class="theme-card-info">
              <div class="theme-name-row">
                <strong class="theme-name">{{ theme.name }}</strong>
                <span class="theme-seal-badge">{{ theme.seal }}</span>
              </div>
              <small class="theme-caption">{{ theme.caption }}</small>
            </div>
            <span v-if="theme.id === activeTheme" class="check-badge">
              <Check :size="13" stroke-width="2.4" />
            </span>
          </button>
        </div>
      </section>
    </transition>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Check, Globe, Settings, X } from '@lucide/vue';
import { themeOptions, type ThemeId } from '../../theme';

defineProps<{
  modelValue: boolean;
  activeTheme: ThemeId;
  activeThemeMeta: (typeof themeOptions)[number] & { icon: any };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'selectTheme', theme: ThemeId): void;
}>();

const settingsOpen = ref(false);

function selectTheme(theme: ThemeId) {
  emit('selectTheme', theme);
}
</script>

<style scoped>
.dossier-masthead {
  position: relative;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 20px 24px 18px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.masthead-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.masthead-brand {
  flex: 1;
}

.eyebrow-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px 2px 4px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-muted);
  margin-bottom: 8px;
  letter-spacing: 0.04em;
}

.eyebrow-seal {
  background: var(--cinnabar);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  line-height: 1.3;
}

.dossier-title {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: clamp(22px, 3.2vw, 30px);
  font-weight: 700;
  color: var(--ink-heading);
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.dossier-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
}

.masthead-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.registry-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
  transition: all 0.18s ease;
}

.settings-btn:hover,
.settings-btn.active {
  background: var(--paper-elevated);
  border-color: var(--cinnabar);
  color: var(--cinnabar);
  box-shadow: 0 0 0 2px var(--cinnabar-soft);
}

/* 现实编辑器世界观开关条 */
.integrator-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.integrator-bar.is-active {
  border-color: var(--brass-border);
  background: var(--brass-soft);
}

.integrator-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.integrator-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--paper-elevated);
  color: var(--brass);
  border: 1px solid var(--border-hairline);
  flex-shrink: 0;
}

.integrator-title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-heading);
}

.integrator-hint {
  margin: 1px 0 0;
  font-size: 11.5px;
  color: var(--ink-muted);
  line-height: 1.4;
}

/* Switch Toggle */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  background-color: var(--border-subtle);
  border-radius: var(--radius-pill);
  transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-slider::before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-toggle input:checked + .switch-slider {
  background-color: var(--cinnabar);
}

.switch-toggle input:checked + .switch-slider::before {
  transform: translateX(18px);
}

/* 设置面板浮层 */
.settings-dropdown {
  margin-top: 16px;
  padding: 16px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.settings-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.head-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.08em;
}

.head-copy h2 {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-heading);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
}

.close-btn:hover {
  background: var(--paper-subtle);
  color: var(--ink-heading);
}

.settings-lead {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--ink-muted);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.theme-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.18s ease;
}

.theme-card:hover {
  border-color: var(--brass-border);
  background: var(--paper-elevated);
}

.theme-card.active {
  border-color: var(--cinnabar);
  background: var(--paper-elevated);
  box-shadow: 0 0 0 1px var(--cinnabar);
}

.theme-swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-top: 3px;
  flex-shrink: 0;
}

.theme-swatch[data-theme-swatch='archive'] {
  background: #c84b31;
  box-shadow: 0 0 0 2px #f4f0ea;
}
.theme-swatch[data-theme-swatch='astrolabe'] {
  background: #c29b38;
  box-shadow: 0 0 0 2px #262c3e;
}
.theme-swatch[data-theme-swatch='terminal'] {
  background: #d64045;
  box-shadow: 0 0 0 2px #f1ede2;
}
.theme-swatch[data-theme-swatch='neon'] {
  background: #ff3399;
  box-shadow: 0 0 0 2px #1f142b;
}

.theme-card-info {
  flex: 1;
  min-width: 0;
}

.theme-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-name {
  font-size: 13px;
  color: var(--ink-heading);
}

.theme-seal-badge {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--brass-soft);
  color: var(--brass);
  font-weight: 600;
}

.theme-caption {
  display: block;
  font-size: 11px;
  color: var(--ink-muted);
  margin-top: 2px;
  line-height: 1.35;
}

.check-badge {
  color: var(--cinnabar);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .dossier-masthead {
    padding: 14px 16px 12px;
  }
  .masthead-top {
    flex-direction: column-reverse;
    gap: 8px;
  }
  .masthead-controls {
    width: 100%;
    justify-content: space-between;
  }
  .theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
