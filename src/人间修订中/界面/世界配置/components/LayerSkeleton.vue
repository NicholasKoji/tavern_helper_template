<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">02 · 世界与骨架</div>
      <h2 class="banner-title">这个世界的基本秩序与矛盾是什么？</h2>
      <p class="banner-desc">只留下会真实影响人物选择与行动的世界事实，让舞台紧密服务于故事。</p>
    </div>

    <div class="layer-fields">
      <QuestionField
        title="世界运转的基本规则？"
        hint="存在哪些公认的自然公理、社会制度、魔法/科技法则或不可逆规则？"
        :model-value="form.世界与故事骨架.世界规则"
        placeholder="例如：每个公民在18岁后都会收到一份《人生修订案》，上面的既定事件会在特定时刻显现…"
        ai-key="world.rules"
        :is-ai-busy="aiBusyKey === 'world.rules'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        :presets="['规则随午夜钟声重排', '言语承诺具有物理契约力', '记忆可被作为等价货币抵押', '身份等级由现实编辑器即时裁定']"
        @update:model-value="form.世界与故事骨架.世界规则 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="时代背景与舞台环境？"
        hint="故事发生的大时代、地理环境、城市风貌与技术/力量水平。"
        :model-value="form.世界与故事骨架.时代与舞台"
        placeholder="例如：近未来沿海雾都，新旧城区隔海相望，高科技监控与阴暗狭窄的纸质档案街并存…"
        ai-key="world.stage"
        :is-ai-busy="aiBusyKey === 'world.stage'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        :presets="['近未来沿海旧城区', '架空东方古代官署与市井', '维多利亚蒸汽与神秘学都市', '赛博低生活与高压霓虹夜城']"
        @update:model-value="form.世界与故事骨架.时代与舞台 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="规则带来的社会后果与日常生态？"
        hint="人们在这些规则下养成了什么生活习惯、禁忌，诞生了哪些职业或机构？"
        :model-value="form.世界与故事骨架.社会后果"
        placeholder="例如：市民出门前必须到街角核对今日公示板；诞生了专门替人销毁旧记录的“清道夫”职业…"
        ai-key="world.consequence"
        :is-ai-busy="aiBusyKey === 'world.consequence'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.世界与故事骨架.社会后果 = $event"
        @assist="$emit('assist', $event)"
      />

      <QuestionField
        title="当前的核心矛盾与推进动力？"
        hint="是什么打破了表面的平静？为什么主角或各方势力必须在此时此刻采取行动？"
        :model-value="form.世界与故事骨架.核心矛盾与推进"
        placeholder="例如：一份已经被官方宣布废止的旧档案，突然在黑市重新流通，且记录了主角失踪姐姐的名字…"
        ai-key="world.conflict"
        :is-ai-busy="aiBusyKey === 'world.conflict'"
        :is-any-ai-busy="Boolean(aiBusyKey)"
        @update:model-value="form.世界与故事骨架.核心矛盾与推进 = $event"
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
</style>
