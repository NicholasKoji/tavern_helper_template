<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">01 · 体验与叙事</div>
      <h2 class="banner-title">你想经历一段怎样的故事？</h2>
      <p class="banner-desc">先确立阅读与游玩时的核心快感与镜头视角，不必急于为世界定名。</p>
    </div>

    <div class="layer-fields">
      <QuestionField
        title="想体验怎样的故事？"
        hint="先说阅读时最想获得的体验与基调，例如悬疑探索、日常陪伴、逆境求生等。"
        :model-value="form.体验与叙事方向.故事体验"
        placeholder="例如：在一座规则不断被修改的城市里调查失踪案，感受秩序与常识被逐步重塑的荒诞与压迫感…"
        ai-key="experience.story"
        :is-ai-busy="aiBusyKey === 'experience.story'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        :presets="['悬疑调查与常识异化', '温馨日常与微妙规则干涉', '高压博弈与规则反制', '荒诞轻喜剧']"
        @update:model-value="form.体验与叙事方向.故事体验 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="主角处于怎样的处境，正在追求什么？"
        hint="主角此刻的生活状态、正在面临的压力与主动想达成的目标。"
        :model-value="form.体验与叙事方向.主角处境"
        placeholder="例如：刚接手一家濒临破产的旧书店，急需查明上一任店主留下的异常账目…"
        ai-key="experience.situation"
        :is-ai-busy="aiBusyKey === 'experience.situation'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.体验与叙事方向.主角处境 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="核心冲突与成长体验？"
        hint="故事推进的动力来源：是面临伦理抉择、克服心理阴影，还是与现实体制对抗？"
        :model-value="form.体验与叙事方向.冲突与成长"
        placeholder="例如：在保护身边人安稳生活与揭开残酷真相之间做出不可逆的选择…"
        ai-key="experience.conflict"
        :is-ai-busy="aiBusyKey === 'experience.conflict'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.体验与叙事方向.冲突与成长 = $event"
        @assist="$emit('assist', $event)"
      />

      <div class="grid-2-col">
        <!-- 叙事视角选择 -->
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">叙事视角</h3>
            <span class="choice-tag">{{ form.体验与叙事方向.叙事视角 }}</span>
          </div>
          <p class="choice-hint">决定 AI 叙述时镜头的人称和信息知晓边界。</p>
          <div class="pill-group">
            <button
              v-for="opt in povOptions"
              :key="opt.value"
              type="button"
              class="pill-btn"
              :class="{ active: form.体验与叙事方向.叙事视角 === opt.value }"
              @click="form.体验与叙事方向.叙事视角 = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 叙事文风选择 -->
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">叙事文风</h3>
            <span class="choice-tag">{{ form.体验与叙事方向.文风 }}</span>
          </div>
          <p class="choice-hint">指导 AI 输出的正文语言质感与描写侧重。</p>
          <div class="pill-group">
            <button
              v-for="opt in styleOptions"
              :key="opt.value"
              type="button"
              class="pill-btn"
              :class="{ active: form.体验与叙事方向.文风 === opt.value }"
              @click="form.体验与叙事方向.文风 = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionField from './QuestionField.vue';

defineProps<{
  form: any;
  aiBusyKey: string;
  povOptions: Array<{ value: string; label: string }>;
  styleOptions: Array<{ value: string; label: string }>;
}>();

defineEmits<{
  (e: 'assist', key: string): void;
}>();
</script>

<style scoped>
.layer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.layer-banner {
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.banner-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.banner-title {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-heading);
}

.banner-desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-muted);
  line-height: 1.45;
}

.layer-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.grid-2-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.choice-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.choice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.choice-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-heading);
}

.choice-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--brass-soft);
  color: var(--brass);
  border-radius: 4px;
}

.choice-hint {
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-muted);
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pill-btn {
  padding: 5px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  font-size: 12px;
  color: var(--ink-body);
  transition: all 0.15s ease;
}

.pill-btn:hover {
  border-color: var(--brass-border);
  background: var(--paper-subtle);
}

.pill-btn.active {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 1px 4px var(--cinnabar-soft);
}

@media (max-width: 640px) {
  .grid-2-col {
    grid-template-columns: 1fr;
  }
}
</style>
