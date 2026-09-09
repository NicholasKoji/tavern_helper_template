<template>
  <div class="rule-modal-backdrop" @click.self="$emit('close')" @keydown.esc="$emit('close')">
    <section ref="modalCard" class="rule-modal-card" role="dialog" aria-modal="true" aria-labelledby="rule-modal-title">
      <header class="modal-header">
        <div class="header-left">
          <span class="modal-kicker">REALITY EDITOR · REVISION</span>
          <h2 id="rule-modal-title" class="modal-title">现实编辑器 · 规则修订</h2>
        </div>
        <button class="close-btn" type="button" aria-label="关闭规则编辑器" @click="$emit('close')">
          <X :size="16" />
        </button>
      </header>

      <div class="modal-body-scroll">
        <p class="modal-lead">在此签发、修订或废止生效规则。确认后立即写入最新楼层变量，下一轮正文将按新常识显化。</p>

        <!-- AI 起草方向提示词 -->
        <div class="ai-hint-box">
          <label class="hint-label" for="rule-ai-hint-input">
            <Sparkles :size="13" class="hint-icon" />
            <span>AI 篡改方向（可选输入）</span>
          </label>
          <textarea
            id="rule-ai-hint-input"
            :value="aiHint"
            class="dossier-textarea ai-hint-input"
            rows="3"
            placeholder="例如：设定该区域的所有人在午夜前必须穿戴特定样式的配饰…"
            @input="$emit('update:aiHint', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>

        <!-- 三类规则编辑板块 -->
        <section v-for="group in editorGroups" :key="group.key" class="rule-group-card">
          <header class="group-header">
            <div class="group-title-wrap">
              <h3 class="group-title">{{ group.title }}</h3>
              <span class="group-count-badge">{{ ruleEditorState[group.key].length }}</span>
            </div>

            <div class="group-actions">
              <button
                class="rule-tool-btn ai-tamper-btn"
                type="button"
                :class="{ 'is-busy': aiBusy[group.key] }"
                :disabled="aiBusy[group.key]"
                @click="$emit('suggestRules', group.key)"
              >
                <WandSparkles :size="13" />
                <span>{{ aiBusy[group.key] ? '篡改中…' : '常识篡改' }}</span>
              </button>
              <button class="rule-tool-btn add-btn" type="button" @click="$emit('addRuleRow', group.key)">
                <Plus :size="13" stroke-width="2.2" />
                <span>添加</span>
              </button>
            </div>
          </header>

          <!-- AI 体系草稿横幅 -->
          <div v-if="aiDraft[group.key].主题" class="ai-draft-banner">
            <span class="draft-tag">AI 体系草稿</span>
            <strong class="draft-theme">{{ aiDraft[group.key].主题 }}</strong>
            <p v-if="aiDraft[group.key].说明" class="draft-desc">{{ aiDraft[group.key].说明 }}</p>
            <p v-if="group.scoped && aiDraft[group.key].对象" class="draft-scope">
              作用范围：{{ aiDraft[group.key].对象 }}
            </p>
          </div>

          <!-- 空列表提示 -->
          <p v-if="ruleEditorState[group.key].length === 0" class="group-empty-notice">
            该类暂无生效规则，留空即保持默认秩序。
          </p>

          <!-- 规则行列表 -->
          <div class="rule-rows-list">
            <div
              v-for="(row, index) in ruleEditorState[group.key]"
              :key="`${group.key}-${index}`"
              class="rule-row-card"
              :class="{ 'is-scoped': group.scoped }"
            >
              <div class="row-inputs-grid">
                <input
                  v-if="group.scoped"
                  v-model="row.对象"
                  class="dossier-input scope-input"
                  type="text"
                  :placeholder="group.scopePlaceholder"
                  :aria-label="`${group.title}生效范围`"
                />
                <input
                  v-model="row.名称"
                  class="dossier-input name-input"
                  type="text"
                  placeholder="规则名称"
                  :aria-label="`${group.title}规则名称`"
                />
                <textarea
                  v-model="row.内容"
                  class="dossier-textarea content-input"
                  rows="2"
                  placeholder="规则内容（具体社会后果或物理变化）"
                  :aria-label="`${group.title}规则内容`"
                ></textarea>
              </div>

              <div class="row-action-side">
                <span v-if="row._ai" class="ai-badge">AI</span>
                <button
                  class="remove-row-btn"
                  type="button"
                  :aria-label="`删除${group.title}第 ${index + 1} 条`"
                  @click="$emit('removeRuleRow', group.key, index)"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 底部操作与错误反馈 -->
      <footer class="modal-footer">
        <p v-if="editorError" class="footer-error-alert">{{ editorError }}</p>
        <div class="footer-actions">
          <button class="btn ghost-btn" type="button" :disabled="busy" @click="$emit('close')">取消</button>
          <button class="btn primary-btn" type="button" :disabled="busy || anyAiBusy" @click="$emit('confirmRules')">
            <Stamp :size="15" />
            <span>{{ busy ? '写入中…' : '签发并写入' }}</span>
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Plus, Sparkles, Stamp, Trash2, WandSparkles, X } from '@lucide/vue';

type RuleGroupKey = '世界规则' | '区域规则' | '个人规则';
type RuleRowDraft = { 对象: string; 名称: string; 内容: string; _ai?: boolean };
type RuleEditorState = Record<RuleGroupKey, RuleRowDraft[]>;
type AiSystemDraft = { 主题: string; 说明: string; 对象: string };

const props = defineProps<{
  ruleEditorState: RuleEditorState;
  aiBusy: Record<RuleGroupKey, boolean>;
  aiHint: string;
  aiDraft: Record<RuleGroupKey, AiSystemDraft>;
  editorError: string;
  busy: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'update:aiHint', value: string): void;
  (e: 'suggestRules', groupKey: RuleGroupKey): void;
  (e: 'addRuleRow', groupKey: RuleGroupKey): void;
  (e: 'removeRuleRow', groupKey: RuleGroupKey, index: number): void;
  (e: 'confirmRules'): void;
}>();

const editorGroups: Array<{
  key: RuleGroupKey;
  title: string;
  scoped: boolean;
  scopePlaceholder: string;
}> = [
  { key: '世界规则', title: '世界级规则', scoped: false, scopePlaceholder: '' },
  { key: '区域规则', title: '区域级规则', scoped: true, scopePlaceholder: '区域名（如：东港旧书店）' },
  { key: '个人规则', title: '个人级规则', scoped: true, scopePlaceholder: '对象名（如：沈青梧）' },
];

const anyAiBusy = computed(() => Object.values(props.aiBusy).some(Boolean));

const modalCard = ref<HTMLElement | null>(null);

function fitLongTextareasOnOpen() {
  modalCard.value?.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(textarea => {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  });
}

onMounted(async () => {
  await nextTick();
  fitLongTextareasOnOpen();
});
</script>

<style scoped>
.rule-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 15, 0.48);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.rule-modal-card {
  width: min(640px, 100%);
  max-height: min(840px, calc(100vh - 32px));
  max-height: min(840px, calc(100dvh - 32px));
  display: flex;
  flex-direction: column;
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
}

.modal-kicker {
  display: block;
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.08em;
}

.modal-title {
  margin: 1px 0 0;
  font-family: var(--font-display);
  font-size: 16px;
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
  color: var(--ink-muted);
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--paper-base);
  color: var(--ink-heading);
}

.modal-lead {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-muted);
  line-height: 1.45;
}

.ai-hint-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hint-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--cinnabar);
}

.modal-body-scroll {
  min-height: 0;
  flex: 1 1 auto;
  padding: 10px 16px 14px;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-group-card {
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.group-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink-heading);
}

.group-count-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  background: var(--brass-soft);
  color: var(--brass);
  font-weight: 600;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rule-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.ai-tamper-btn {
  background: var(--cinnabar-soft);
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar);
}

.ai-tamper-btn:hover:not(:disabled) {
  background: var(--cinnabar);
  color: #fff;
}

.add-btn {
  background: var(--paper-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--ink-body);
}

.add-btn:hover {
  border-color: var(--brass-border);
  background: var(--paper-subtle);
}

.ai-draft-banner {
  padding: 6px 10px;
  background: var(--brass-soft);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}

.draft-tag {
  display: inline-block;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--brass);
  margin-right: 6px;
}

.draft-theme {
  font-size: 12px;
  color: var(--ink-heading);
}

.draft-desc,
.draft-scope {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--ink-muted);
}

.group-empty-notice {
  margin: 4px 0;
  font-size: 11.5px;
  color: var(--ink-muted);
  text-align: center;
  padding: 8px;
}

.rule-rows-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-row-card {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
}

.row-inputs-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dossier-input,
.dossier-textarea {
  width: 100%;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  padding: 5px 8px;
  font-size: 12px;
  color: var(--ink-body);
}

.dossier-input:focus,
.dossier-textarea:focus {
  outline: none;
  border-color: var(--brass);
  box-shadow: 0 0 0 1px var(--brass-soft);
}

.dossier-textarea {
  resize: vertical;
  line-height: 1.4;
}

.ai-hint-input {
  min-height: 66px;
}

.row-action-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ai-badge {
  font-size: 9px;
  padding: 1px 4px;
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
  border-radius: 3px;
  font-weight: 700;
}

.remove-row-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: transparent;
  border: none;
  color: var(--ink-muted);
  border-radius: 3px;
  transition: all 0.15s ease;
}

.remove-row-btn:hover {
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 16px;
  background: var(--paper-subtle);
  border-top: 1px solid var(--border-hairline);
}

.footer-error-alert {
  margin: 0;
  padding: 4px 8px;
  background: oklch(0.5 0.18 25 / 0.12);
  color: oklch(0.5 0.2 25);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.ghost-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--ink-muted);
}

.ghost-btn:hover {
  background: var(--paper-base);
  color: var(--ink-heading);
}

.primary-btn {
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar-hover);
  color: #fff;
  box-shadow: 0 1px 6px var(--cinnabar-glow);
}

.primary-btn:hover:not(:disabled) {
  background: var(--cinnabar-hover);
}

.primary-btn:disabled {
  opacity: 0.5;
}

@media (max-width: 720px) {
  .rule-modal-backdrop {
    padding: 8px 4px;
  }

  .rule-modal-card {
    width: 100%;
    max-height: calc(100vh - 16px);
    max-height: calc(100dvh - 16px);
  }
}

@media (max-width: 520px) {
  .rule-modal-backdrop {
    padding-inline: 2px;
  }
}
</style>
