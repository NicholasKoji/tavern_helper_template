<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">04 · 落地与开局</div>
      <h2 class="banner-title">故事第一幕从哪里展开？</h2>
      <p class="banner-desc">将前面的宏观设定落地为开场立刻能接触到的具体空间、秩序与突发危机。</p>
    </div>

    <div class="layer-fields">
      <QuestionField
        title="故事从哪里开始？（起始地点）"
        hint="请按“一级区域 / 二级区域 / 三级地点”层级描述，如：沿海雾都 / 旧城区档案街 / 雾灯旧书店。"
        :model-value="form.世界落地与开场准备.起始地点"
        placeholder="例如：东港市 / 旧城区梧桐街 / 雾灯旧书店"
        ai-key="grounding.place"
        :is-ai-busy="aiBusyKey === 'grounding.place'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        :presets="['东港沿海 / 旧城区 / 雾灯旧书店', '中央王城 / 禁书档案馆 / 地下修复室', '第七区 / 霓虹雨巷 / 义体维修铺']"
        @update:model-value="form.世界落地与开场准备.起始地点 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="起始地点的日常秩序与生活常识？"
        hint="在这个具体地点里，人们在不发生意外时如何生活？有哪些显而易见的习惯与规矩？"
        :model-value="form.世界落地与开场准备.日常秩序"
        placeholder="例如：书店每晚九点准时点亮黄色煤气灯；熟客进门必须在登记册上留下今日天气代号…"
        ai-key="grounding.order"
        :is-ai-busy="aiBusyKey === 'grounding.order'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.世界与故事骨架.日常秩序 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="涉及到哪些组织、势力或群体？"
        hint="当前开局阶段真正会产生影响的外部力量或监管机构。"
        :model-value="form.世界落地与开场准备.组织势力"
        placeholder="例如：市政档案管理局、旧城区商会稽查队、地下暗行者同盟…"
        ai-key="grounding.factions"
        :is-ai-busy="aiBusyKey === 'grounding.factions'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.世界落地与开场准备.组织势力 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="第一幕必须生效的特定规则？"
        hint="为了让本次开场成立并产生戏剧张力，哪些特定规则必须在第一幕直接显现？"
        :model-value="form.世界落地与开场准备.必要规则"
        placeholder="例如：午夜后禁止以任何形式借阅或转让纸质旧书；违者将被即刻锁定位置…"
        ai-key="grounding.rules"
        :is-ai-busy="aiBusyKey === 'grounding.rules'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.世界落地与开场准备.必要规则 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="当前矛盾与唯一开场情境？"
        hint="故事开幕时画面停留在什么瞬间？发生了什么突发事件让玩家立刻能够做出回应？"
        :model-value="form.世界落地与开场准备.当前矛盾与开场"
        placeholder="例如：暴雨之夜，主角正准备关店打烊，门铃突然响起，一位面色苍白的调查员推门而入…"
        ai-key="grounding.opening"
        :is-ai-busy="aiBusyKey === 'grounding.opening'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.世界落地与开场准备.当前矛盾与开场 = $event"
        @assist="$emit('assist', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import QuestionField from './QuestionField.vue';

defineProps<{
  form: any;
  aiBusyKey: string;
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
}

.layer-banner {
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
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
}
</style>
