<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">{{ meta.order }} · {{ meta.title }}</div>
      <h2 class="banner-title">{{ meta.question }}</h2>
      <p class="banner-desc">有想法就写下来，没想好的可以先跳过。留空的内容不会带入故事。</p>
    </div>
    <div class="layer-fields">
      <QuestionField
        v-for="field in fields"
        :key="field.id"
        :title="field.title"
        :hint="field.hint"
        :placeholder="field.placeholder"
        :model-value="read(field)"
        :ai-key="field.id"
        :is-ai-busy="aiBusyKey === field.id"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="write(field, $event)"
        @assist="$emit('assist', $event)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import type { OpeningFormSnapshot } from '../opening';
import { worldFields } from '../world-fields';
import QuestionField from './QuestionField.vue';
const props = defineProps<{
  layer: 'foundation' | 'society' | 'history';
  form: OpeningFormSnapshot;
  aiBusyKey: string;
}>();
defineEmits<{ (e: 'assist', key: string): void }>();
const metadata = {
  foundation: { order: '01', title: '世界基础', question: '这个世界原本是什么样？' },
  society: { order: '02', title: '社会生活', question: '人们怎样组织社会、过日子？' },
  history: { order: '03', title: '历史与现状', question: '世界如何走到今天，现在是什么局面？' },
};
const meta = computed(() => metadata[props.layer]);
const fields = computed(() => worldFields.filter(field => field.layer === props.layer));
type Field = (typeof worldFields)[number];
function read(field: Field) {
  return (props.form[field.section] as Record<string, string>)[field.field];
}
function write(field: Field, value: string) {
  (props.form[field.section] as Record<string, string>)[field.field] = value;
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

.banner-badge {
  font-size: 12px;
}
</style>
