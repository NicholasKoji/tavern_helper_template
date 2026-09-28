<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">05 · 现实编辑器</div>
      <h2 class="banner-title">现实编辑器的运行法则与干涉边界</h2>
      <p class="banner-desc">设定编辑器的显现形态、作用范围、常识同步机制与限制代价。</p>
    </div>

    <div class="layer-fields">
      <!-- 表现形式与可见知晓 -->
      <div class="grid-2-col">
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">显现表现形式</h3>
            <span class="choice-tag">{{ form.现实编辑器.表现形式 }}</span>
          </div>
          <p class="choice-hint">现实编辑器在情境中以何种形态被感知或操作：</p>
          <div class="pill-group">
            <button
              v-for="opt in editorFormOptions"
              :key="opt"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.表现形式 === opt }"
              @click="form.现实编辑器.表现形式 = opt"
            >
              {{ optionLabel(opt) }}
            </button>
          </div>
        </div>

        <QuestionField
          title="感知知晓与权限边界"
          hint="谁能感知并使用现实编辑器？他人是否会察觉异常现象？"
          :model-value="form.现实编辑器.可见与知晓"
          placeholder="例如：仅主角可见并可操作；NPC 无法感知界面，但能感知到世界发生变化后的结果…"
          ai-key="editor.visibility"
          :is-ai-busy="aiBusyKey === 'editor.visibility'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          :rows="2"
          @update:model-value="form.现实编辑器.可见与知晓 = $event"
          @assist="$emit('assist', $event)"
        />
      </div>

      <!-- 可修改范围与常识同步 -->
      <div class="grid-3-col">
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">生效范围 (作用域)</h3>
            <span class="choice-tag">{{ form.现实编辑器.可修改范围.join('、') || '无' }}</span>
          </div>
          <p class="choice-hint">允许编辑器作用的规则层级（可多选）：</p>
          <div class="checkbox-group">
            <label
              v-for="scope in editorScopes"
              :key="scope.value"
              class="custom-check-item"
              :class="{ 'is-checked': form.现实编辑器.可修改范围.includes(scope.value) }"
            >
              <input
                type="checkbox"
                :checked="form.现实编辑器.可修改范围.includes(scope.value)"
                @change="toggleScope(scope.value)"
              />
              <span class="check-text">
                <strong>{{ scope.label }}</strong>
                <small>{{ scope.description }}</small>
              </span>
            </label>
          </div>
        </div>

        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">常识同步机制</h3>
            <span class="choice-tag">{{ optionLabel(form.现实编辑器.常识同步) }}</span>
          </div>
          <p class="choice-hint">规则修改后，世人如何认知并合理化现实变动：</p>
          <div class="pill-group vertical-pills">
            <button
              v-for="opt in editorSyncOptions"
              :key="opt"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.常识同步 === opt }"
              @click="form.现实编辑器.常识同步 = opt"
            >
              {{ optionLabel(opt) }}
            </button>
          </div>
        </div>

        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">记忆保留策略</h3>
            <span class="choice-tag">{{ form.现实编辑器.记忆保留 }}</span>
          </div>
          <p class="choice-hint">规则修改后，旧世界的记忆与认知由谁保留：</p>
          <div class="pill-group vertical-pills">
            <button
              v-for="opt in editorMemoryOptions"
              :key="opt"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.记忆保留 === opt }"
              @click="form.现实编辑器.记忆保留 = opt"
            >
              {{ optionLabel(opt) }}
            </button>
          </div>
        </div>
      </div>

      <!-- 主角受影响与自主执行 -->
      <div class="grid-2-col">
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">主角是否受规则约束</h3>
            <span class="choice-tag">{{ form.现实编辑器.主角受影响 }}</span>
          </div>
          <p class="choice-hint">新规则生效时，是否同等强制约束主角自身：</p>
          <div class="pill-group">
            <button
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.主角受影响 === '是' }"
              @click="form.现实编辑器.主角受影响 = '是'"
            >
              是（主角亦受新规则与常识同化）
            </button>
            <button
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.主角受影响 === '否' }"
              @click="form.现实编辑器.主角受影响 = '否'"
            >
              否（主角保持独立清醒与绝对豁免）
            </button>
          </div>
        </div>

        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">自主执行倾向</h3>
            <span class="choice-tag">{{ autonomyLabel }}</span>
          </div>
          <p class="choice-hint">编辑器是否会脱离玩家直接指令自行演化变动规则：</p>
          <div class="pill-group vertical-pills">
            <button
              v-for="opt in editorAutonomyOptions"
              :key="opt.value"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.自主执行 === opt.value }"
              @click="form.现实编辑器.自主执行 = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid-2-col">
        <QuestionField
          title="使用限制与干涉代价"
          hint="修改现实需承受的副作用、冷却条件或能量负荷。"
          :model-value="form.现实编辑器.限制与代价"
          placeholder="例如：单日修改不得超过三次；不可直接无中生有创造违背物理法则的实体"
          ai-key="editor.limit"
          :is-ai-busy="aiBusyKey === 'editor.limit'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          :rows="2"
          @update:model-value="form.现实编辑器.限制与代价 = $event"
          @assist="$emit('assist', $event)"
        />

        <QuestionField
          title="自然语言指令约定"
          hint="玩家在正文中向编辑器下达指令与确认修改的约定形式。"
          :model-value="form.现实编辑器.自然语言修改"
          placeholder="例如：玩家在对话中说出明确诉求后，编辑器以悬浮面板形式提供修改确认草案…"
          ai-key="editor.language"
          :is-ai-busy="aiBusyKey === 'editor.language'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          :rows="2"
          @update:model-value="form.现实编辑器.自然语言修改 = $event"
          @assist="$emit('assist', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import QuestionField from './QuestionField.vue';

const props = defineProps<{
  form: any;
  aiBusyKey: string;
  editorFormOptions: string[];
  editorScopes: Array<{ value: string; label: string; description: string }>;
  editorSyncOptions: string[];
  editorMemoryOptions: string[];
  editorAutonomyOptions: Array<{ value: string; label: string }>;
}>();

defineEmits<{
  (e: 'assist', key: string): void;
}>();

function optionLabel(value: string): string {
  const labels: Record<string, string> = {
    立即同步: '即时覆写（所有人视新规则为理所当然）',
    渐进同步: '渐进认知（世人逐渐接受变动，初期有违和感）',
    只对受影响对象同步: '仅受众生效（仅目标认知改变，旁观者觉察异常）',
    '由 AI 结合前文整理': '依据情境推演生成',
  };
  return labels[value] ?? value;
}

const autonomyLabel = computed(() => {
  const match = props.editorAutonomyOptions.find(opt => opt.value === props.form.现实编辑器.自主执行);
  return match ? match.label : props.form.现实编辑器.自主执行;
});

function toggleScope(scopeVal: string) {
  const current = props.form.现实编辑器.可修改范围 as string[];
  if (current.includes(scopeVal)) {
    props.form.现实编辑器.可修改范围 = current.filter(item => item !== scopeVal);
  } else {
    props.form.现实编辑器.可修改范围 = [...current, scopeVal];
  }
}
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
  grid-template-columns: 1fr;
  gap: 14px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.grid-3-col {
  display: grid;
  grid-template-columns: 1fr;
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
  flex-wrap: wrap;
  gap: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.choice-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14.5px;
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
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.vertical-pills {
  flex-direction: column;
}

.pill-btn {
  padding: 5px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--ink-body);
  transition: all 0.15s ease;
  text-align: left;
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

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.custom-check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.custom-check-item:hover {
  background: var(--paper-subtle);
  border-color: var(--border-subtle);
}

.custom-check-item.is-checked {
  border-color: var(--brass-border);
  background: var(--brass-soft);
}

.custom-check-item input {
  margin-top: 3px;
  accent-color: var(--cinnabar);
}

.check-text strong {
  display: block;
  font-size: 12.5px;
  color: var(--ink-heading);
}

.check-text small {
  display: block;
  font-size: 11px;
  color: var(--ink-muted);
}

@media (max-width: 768px) {
  .grid-2-col {
    grid-template-columns: 1fr;
  }
}
</style>
