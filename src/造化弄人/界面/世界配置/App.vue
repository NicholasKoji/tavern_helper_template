<template>
  <div class="world-config">
    <header>
      <h1>现实编辑器 v0.1.0 · 世界配置终端</h1>
      <p>「造化弄人」初始化流程：选世界 → 定基调 → 改规则 → 开始游玩</p>
    </header>

    <section class="panel">
      <h2>世界</h2>
      <label>世界模板</label>
      <select v-model="form.世界模板" @change="onTemplateChange">
        <option v-for="preset in templateNames" :key="preset" :value="preset">{{ preset }}</option>
      </select>
      <label>世界观描述</label>
      <textarea v-model="form.世界观描述" placeholder="简单描述你想玩的世界" />
      <label>主角补充设定（可选）</label>
      <textarea v-model="form.主角补充设定" placeholder="例如：我是学生 / 我是侦探 / 我对猫过敏……" />
    </section>

    <section class="panel">
      <h2>基调</h2>
      <div class="slider-row">
        <label>色情浓度</label>
        <input v-model.number="form.基调.色情浓度" type="range" min="0" max="100" step="5" />
        <span>{{ form.基调.色情浓度 }}</span>
      </div>
      <div class="slider-row">
        <label>搞笑程度</label>
        <input v-model.number="form.基调.搞笑程度" type="range" min="0" max="100" step="5" />
        <span>{{ form.基调.搞笑程度 }}</span>
      </div>
      <div class="slider-row">
        <label>轻松程度</label>
        <input v-model.number="form.基调.轻松程度" type="range" min="0" max="100" step="5" />
        <span>{{ form.基调.轻松程度 }}</span>
      </div>
      <label class="checkbox-row">
        <input v-model="form.允许黑深残" type="checkbox" />
        允许黑深残走向
      </label>
      <label class="checkbox-row">
        <input v-model="form.允许抽风" type="checkbox" />
        允许现实编辑器自主抽风
      </label>
      <label v-if="form.允许抽风">抽风频率</label>
      <select v-if="form.允许抽风" v-model="form.抽风频率">
        <option>低</option>
        <option>中</option>
        <option>高</option>
        <option>随心所欲</option>
      </select>
    </section>

    <section v-for="group in ruleGroups" :key="group.key" class="panel">
      <h2>{{ group.title }}</h2>
      <div v-for="(rule, index) in rules[group.key]" :key="index" class="rule-row">
        <input v-model="rule.名称" type="text" placeholder="规则名" />
        <input v-model="rule.内容" type="text" :placeholder="group.placeholder" />
        <button class="ghost" type="button" @click="removeRule(group.key, index)">删</button>
      </div>
      <button class="add" type="button" @click="addRule(group.key)">+ 添加{{ group.title }}</button>
    </section>

    <footer>
      <button class="primary" type="button" :disabled="starting" @click="startGame">
        {{ starting ? '正在生成开场…' : '开始游玩' }}
      </button>
      <p v-if="status" class="status">{{ status }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from './store';

type RuleEntry = { 名称: string; 内容: string };

const templatePresets: Record<string, string> = {
  现代都市: '普通现代都市，你刚捡到现实编辑器，生活即将开始变得离谱',
  古代架空: '架空的古代王朝，礼法森严，但现实编辑器正在悄悄改写礼法',
  奇幻异界: '剑与魔法的奇幻世界，现实编辑器决定法则的版本号',
  日常校园: '平静的校园日常，常识正在被一点点替换成奇怪的版本',
  废土求生: '废土世界，生存规则残酷，但现实编辑器觉得可以再魔改一点',
  自定义: '由玩家自行描述的世界',
};
const templateNames = Object.keys(templatePresets);

const ruleGroups = [
  { key: '常识规则', title: '常识规则', placeholder: '例如：所有人听到“茄子”都要单脚跳一下' },
  { key: '行为习惯', title: '行为习惯', placeholder: '例如：开口前必须先说“打扰了”' },
  { key: '物理规则', title: '物理规则', placeholder: '例如：午夜十二点后重力减弱 50%' },
] as const;

const rules = reactive<Record<string, RuleEntry[]>>({
  常识规则: [],
  行为习惯: [],
  物理规则: [],
});

const form = reactive({
  世界模板: '现代都市',
  世界观描述: templatePresets['现代都市'],
  基调: {
    色情浓度: 40,
    搞笑程度: 70,
    轻松程度: 70,
  },
  允许黑深残: false,
  允许抽风: true,
  抽风频率: '中',
  主角补充设定: '',
});

function onTemplateChange() {
  form.世界观描述 = templatePresets[form.世界模板] ?? form.世界观描述;
}

function addRule(key: string) {
  rules[key].push({ 名称: '', 内容: '' });
}

function removeRule(key: string, index: number) {
  rules[key].splice(index, 1);
}

const store = useDataStore();
const { data } = storeToRefs(store);
const starting = ref(false);
const status = ref('');

function toRecord(entries: RuleEntry[]) {
  return Object.fromEntries(
    entries
      .filter(item => item.名称.trim())
      .map(item => [item.名称.trim(), item.内容.trim() || '已生效']),
  );
}

function buildActiveRules() {
  return {
    常识规则: toRecord(rules.常识规则),
    行为习惯: toRecord(rules.行为习惯),
    物理规则: toRecord(rules.物理规则),
  };
}

async function startGame() {
  if (starting.value) {
    return;
  }
  starting.value = true;
  status.value = '正在写入世界配置…';

  try {
    const activeRules = buildActiveRules();
    data.value.世界配置 = {
      世界模板: form.世界模板,
      世界观描述: form.世界观描述.trim() || templatePresets[form.世界模板],
      基调: {
        色情浓度: Number(form.基调.色情浓度),
        搞笑程度: Number(form.基调.搞笑程度),
        轻松程度: Number(form.基调.轻松程度),
      },
      允许黑深残: form.允许黑深残,
      允许抽风: form.允许抽风,
      抽风频率: form.抽风频率 as '低' | '中' | '高' | '随心所欲',
      主角补充设定: form.主角补充设定.trim() || '暂无补充设定',
      常识规则: activeRules.常识规则,
      行为习惯: activeRules.行为习惯,
      物理规则: activeRules.物理规则,
      创建时间: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    data.value.现实编辑器.生效规则 = activeRules;
    data.value.现实编辑器.状态 = '正常';
    data.value.当前场景 = {
      地点: '待生成',
      时间: '待生成',
      摘要: '世界已配置，等待开场生成',
    };
    data.value.主角.补充设定 = form.主角补充设定.trim();

    status.value = '正在生成开场…';
    await generateOpening(activeRules);
    status.value = '开场已生成！往下翻看新楼层，开始游玩。';
  } catch (error) {
    console.error('[造化弄人·世界配置]', error);
    toastr.error(error instanceof Error ? error.message : String(error), '现实编辑器报错');
    status.value = '生成失败，可重试';
  } finally {
    starting.value = false;
  }
}

async function generateOpening(activeRules: Record<string, Record<string, string>>) {
  const old_data = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
  const config = {
    世界模板: form.世界模板,
    世界观描述: form.世界观描述,
    基调: form.基调,
    允许黑深残: form.允许黑深残,
    允许抽风: form.允许抽风,
    抽风频率: form.抽风频率,
    主角补充设定: form.主角补充设定,
    生效规则: activeRules,
  };

  const prompt = `你是「现实编辑器」的系统音，同时负责世界旁白和临时角色扮演。
玩家刚刚通过世界配置终端完成了世界设定，配置如下（JSON）：
${JSON.stringify(config, null, 2)}

请根据这份配置，直接写出世界的第一幕开场：
- 用第二人称“你”面向玩家（玩家名字用 <user> 宏代替，不要出现“<user>”字样的解释）
- 自然展示玩家获得/持有现实编辑器，以及当前世界的一两条生效规则带来的荒诞感
- 风格轻松搞笑，色情浓度按配置自然融入，不要写成设定说明
- 在回复结尾另起一行输出 <StatusPlaceHolderImpl/>
- 不要输出世界配置界面标签 <WorldConfigurator/>`;

  const result = await generateRaw({
    user_input: '开始第一幕。',
    should_silence: true,
    ordered_prompts: [{ role: 'system', content: prompt }, 'user_input'],
  });

  const message = typeof result === 'string' ? result : result.content;
  const data = await Mvu.parseMessage(message, old_data);
  await createChatMessages([{ role: 'assistant', message, data: data ?? old_data }], { refresh: 'none' });
  await setChatMessages([{ message_id: getLastMessageId() }], { refresh: 'affected' });
}
</script>
