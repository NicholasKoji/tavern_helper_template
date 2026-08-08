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
      <label>时代背景</label>
      <select v-model="form.时代背景">
        <option v-for="era in eraOptions" :key="era" :value="era">{{ era }}</option>
      </select>
      <label>世界观描述</label>
      <textarea v-model="form.世界观描述" placeholder="简单描述你想玩的世界" />
      <label>文明与势力</label>
      <textarea v-model="form.文明与势力" placeholder="例如：现代社会，三股地下势力暗中争夺旧世界科技" />
      <label>地理与气候</label>
      <textarea v-model="form.地理与气候" placeholder="例如：临海城市，夏季湿热，老城区与新城区泾渭分明" />
      <label>历史与事件</label>
      <textarea v-model="form.历史与事件" placeholder="例如：十年前曾出现全球性“规则异常”事件，后被官方掩盖" />
      <label>核心冲突</label>
      <textarea v-model="form.核心冲突" placeholder="例如：现实编辑器是旧世界科技，各方势力正在追踪它" />
    </section>

    <section class="panel">
      <h2>主角</h2>
      <label>身份职业</label>
      <input v-model="form.主角身份" type="text" placeholder="例如：996 社畜 / 大学生 / 侦探" />
      <label>性格</label>
      <input v-model="form.主角性格" type="text" placeholder="例如：怂但嘴硬，怕麻烦，好奇心重" />
      <label>目标</label>
      <input v-model="form.主角目标" type="text" placeholder="例如：先保住工作，再搞懂编辑器的秘密" />
      <label>与现实编辑器关系</label>
      <select v-model="form.与编辑器关系">
        <option v-for="relation in relationOptions" :key="relation" :value="relation">{{ relation }}</option>
      </select>
      <label>主角补充设定（可选）</label>
      <textarea v-model="form.主角补充设定" placeholder="例如：我是学生 / 我是侦探 / 我对猫过敏……" />
    </section>

    <section class="panel">
      <h2>主要角色</h2>
      <div v-for="(character, index) in form.角色列表" :key="index" class="character-card">
        <div class="character-row">
          <input v-model="character.姓名" type="text" placeholder="姓名" />
          <input v-model="character.性别" type="text" placeholder="性别" />
          <input v-model="character.年龄" type="text" placeholder="年龄" />
          <button class="ghost" type="button" @click="removeCharacter(index)">删</button>
        </div>
        <input v-model="character.身份" type="text" placeholder="身份" />
        <input v-model="character.与主角关系" type="text" placeholder="与主角关系" />
        <input v-model="character.外貌特征" type="text" placeholder="外貌特征（身高身材长相穿着）" />
        <input v-model="character.性格" type="text" placeholder="性格与说话方式" />
      </div>
      <button class="add" type="button" @click="addCharacter">+ 添加主要角色</button>
    </section>

    <section class="panel">
      <h2>核心设定</h2>
      <label>认知（主角是否知道世界编辑器的存在）</label>
      <select v-model="form.玩法模式.认知">
        <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
      </select>
      <label>使用（主角是否能使用世界编辑器）</label>
      <select v-model="form.玩法模式.使用">
        <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
      </select>
      <label>受控（主角是否会被规则制约）</label>
      <select v-model="form.玩法模式.受控">
        <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
      </select>
      <label>世界编辑器是否可以私自篡改规则</label>
      <select v-model="form.玩法模式.编辑器篡改">
        <option v-for="option in tamperOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
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
    </section>

    <section class="panel">
      <h2>剧情方向</h2>
      <label>开局场景</label>
      <select v-model="form.剧情方向.开局场景">
        <option v-for="scene in sceneOptions" :key="scene" :value="scene">{{ scene }}</option>
      </select>
      <label>主线目标</label>
      <input v-model="form.剧情方向.主线目标" type="text" placeholder="例如：查清现实编辑器的来历" />
      <label>节奏</label>
      <select v-model="form.剧情方向.节奏">
        <option v-for="rhythm in rhythmOptions" :key="rhythm" :value="rhythm">{{ rhythm }}</option>
      </select>
      <label class="checkbox-row">
        <input v-model="form.剧情方向.暧昧开局" type="checkbox" />
        暧昧开局（主要角色互动更亲密）
      </label>
    </section>

    <section class="panel">
      <h2>叙事</h2>
      <label>视角</label>
      <select v-model="form.视角">
        <option v-for="option in povOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <label>文风</label>
      <select v-model="form.文风">
        <option v-for="option in styleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
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
type CharacterEntry = {
  姓名: string;
  性别: string;
  年龄: string;
  身份: string;
  与主角关系: string;
  外貌特征: string;
  性格: string;
};

const templatePresets: Record<string, string> = {
  现代都市: '普通现代都市，你刚捡到现实编辑器，生活即将开始变得离谱',
  古代架空: '架空的古代王朝，礼法森严，但现实编辑器正在悄悄改写礼法',
  奇幻异界: '剑与魔法的奇幻世界，现实编辑器决定法则的版本号',
  日常校园: '平静的校园日常，常识正在被一点点替换成奇怪的版本',
  废土求生: '废土世界，生存规则残酷，但现实编辑器觉得可以再魔改一点',
  自定义: '由玩家自行描述的世界',
};
const templateNames = Object.keys(templatePresets);

const eraOptions = ['现代都市', '古代架空', '未来科幻', '末世求生', '奇幻异界', '玄幻修仙', '日常校园', '自定义'];
const sceneOptions = ['家中', '街头', '校园', '公司', '异世界', '自定义'];
const rhythmOptions = ['日常', '冒险', '悬疑', '轻松'];
const relationOptions = ['刚捡到', '恢复记忆', '绑定获得', '穿越获得'];
const yesNoOptions = ['是', '否'];
const tamperOptions = [
  { value: 'A-完全随机', label: 'A. 是，修改完全随机' },
  { value: 'B-倾向色色', label: 'B. 是，修改倾向色色' },
  { value: 'C-不涉及物理', label: 'C. 是，但不涉及物理规则' },
  { value: 'D-完全禁止', label: 'D. 否，完全禁止私自篡改' },
  { value: 'E-玩家插件伪装', label: 'E. 否，但可由玩家插件触发（剧情中表现为编辑器莫名篡改）' },
];

const templateDetails: Record<string, { era: string; scene: string }> = {
  现代都市: { era: '现代都市', scene: '家中' },
  古代架空: { era: '古代架空', scene: '家中' },
  奇幻异界: { era: '奇幻异界', scene: '异世界' },
  日常校园: { era: '日常校园', scene: '校园' },
  废土求生: { era: '末世求生', scene: '街头' },
  自定义: { era: '自定义', scene: '家中' },
};

const povOptions = [
  { value: '第二人称', label: '第二人称「你」· 最沉浸' },
  { value: '第三人称上帝', label: '第三人称 · 全景叙事' },
  { value: '第三人称限定', label: '第三人称 · 以玩家为主视角' },
  { value: '第一人称玩家', label: '第一人称「我」· 玩家视角' },
  { value: '第一人称角色', label: '第一人称「我」· 角色视角' },
];

const styleOptions = [
  { value: '细腻写实', label: '细腻写实 · 沉浸向（推荐）' },
  { value: '通用白描', label: '通用白描 · 克制真实' },
  { value: '轻小说', label: '轻小说 · 口语对话流' },
  { value: '古风', label: '古风 · 七分白话三分文言' },
  { value: '西幻', label: '西幻 · 世界质感与博弈' },
  { value: '漫画分镜', label: '漫画分镜 · 画面节奏' },
  { value: '微色情', label: '微色情 · 含蓄反差（配合色情浓度）' },
];

const ruleGroups = [
  { key: '常识规则', title: '常识规则', placeholder: '例如：所有人听到“茄子”都要单脚跳一下' },
  { key: '行为习惯', title: '行为习惯', placeholder: '例如：开口前必须先说“打扰了”' },
  { key: '物理规则', title: '物理规则', placeholder: '例如：午夜十二点后重力减弱 50%' },
  { key: '超自然规则', title: '超自然规则', placeholder: '例如：灵气浓度每三年翻一倍' },
] as const;

const rules = reactive<Record<string, RuleEntry[]>>({
  常识规则: [],
  行为习惯: [],
  物理规则: [],
  超自然规则: [],
});

const form = reactive({
  世界模板: '现代都市',
  世界观描述: templatePresets['现代都市'],
  时代背景: '现代都市',
  文明与势力: '普通现代社会，势力简单',
  地理与气候: '普通城市环境，四季分明',
  历史与事件: '无特殊历史事件',
  核心冲突: '暂无明确主线，先由日常荒诞展开',
  玩法模式: {
    认知: '是',
    使用: '是',
    受控: '是',
    编辑器篡改: 'D-完全禁止',
  },
  主角身份: '普通居民',
  主角性格: '',
  主角目标: '',
  与编辑器关系: '刚捡到',
  基调: {
    色情浓度: 40,
    搞笑程度: 70,
    轻松程度: 70,
  },
  允许黑深残: false,
  主角补充设定: '',
  剧情方向: {
    开局场景: '家中',
    主线目标: '先弄清楚现实编辑器的来历与能力',
    节奏: '轻松',
    暧昧开局: false,
  },
  角色列表: [] as CharacterEntry[],
  视角: '第三人称限定',
  文风: '细腻写实',
});

function onTemplateChange() {
  form.世界观描述 = templatePresets[form.世界模板] ?? form.世界观描述;
  const detail = templateDetails[form.世界模板];
  if (detail) {
    form.时代背景 = detail.era;
    form.剧情方向.开局场景 = detail.scene;
  }
}

function addRule(key: string) {
  rules[key].push({ 名称: '', 内容: '' });
}

function removeRule(key: string, index: number) {
  rules[key].splice(index, 1);
}

function addCharacter() {
  form.角色列表.push({ 姓名: '', 性别: '女', 年龄: '', 身份: '', 与主角关系: '', 外貌特征: '', 性格: '' });
}

function removeCharacter(index: number) {
  form.角色列表.splice(index, 1);
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
    超自然规则: toRecord(rules.超自然规则),
  };
}

function buildCharacters() {
  const result: Record<string, Record<string, unknown>> = {};
  for (const character of form.角色列表) {
    const name = character.姓名.trim();
    if (!name) {
      continue;
    }
    result[name] = {
      基础信息: {
        姓名: name,
        性别: character.性别.trim() || '女',
        年龄: character.年龄.trim(),
        身份: character.身份.trim(),
        与主角关系: character.与主角关系.trim(),
        外貌特征: character.外貌特征.trim(),
        性格: character.性格.trim(),
      },
      当前想法: '',
    };
  }
  return result;
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
      时代背景: form.时代背景,
      文明与势力: form.文明与势力.trim() || '普通现代社会，势力简单',
      地理与气候: form.地理与气候.trim() || '普通城市环境，四季分明',
      历史与事件: form.历史与事件.trim() || '无特殊历史事件',
      核心冲突: form.核心冲突.trim() || '暂无明确主线，先由日常荒诞展开',
      玩法模式: { ...form.玩法模式 },
      基调: {
        色情浓度: Number(form.基调.色情浓度),
        搞笑程度: Number(form.基调.搞笑程度),
        轻松程度: Number(form.基调.轻松程度),
      },
      允许黑深残: form.允许黑深残,
      主角补充设定: form.主角补充设定.trim() || '暂无补充设定',
      剧情方向: {
        开局场景: form.剧情方向.开局场景,
        主线目标: form.剧情方向.主线目标.trim() || '先弄清楚现实编辑器的来历与能力',
        节奏: form.剧情方向.节奏 as '日常' | '冒险' | '悬疑' | '轻松',
        暧昧开局: form.剧情方向.暧昧开局,
      },
      常识规则: activeRules.常识规则,
      行为习惯: activeRules.行为习惯,
      物理规则: activeRules.物理规则,
      超自然规则: activeRules.超自然规则,
      创建时间: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    data.value.现实编辑器.生效规则 = activeRules;
    data.value.现实编辑器.状态 = '正常';
    data.value.当前场景 = {
      地点: '待生成',
      时间: '待生成',
      摘要: '世界已配置，等待开场生成',
    };
    data.value.主角 = {
      姓名: data.value.主角.姓名,
      身份: form.主角身份.trim() || '普通居民',
      补充设定: form.主角补充设定.trim(),
      性格: form.主角性格.trim(),
      目标: form.主角目标.trim(),
      与编辑器关系: form.与编辑器关系,
    };
    data.value.NPC序列 = buildCharacters();

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
    时代背景: form.时代背景,
    文明与势力: form.文明与势力,
    地理与气候: form.地理与气候,
    历史与事件: form.历史与事件,
    核心冲突: form.核心冲突,
    玩法模式: { ...form.玩法模式 },
    基调: form.基调,
    允许黑深残: form.允许黑深残,
    主角补充设定: form.主角补充设定,
    主角: {
      身份: form.主角身份,
      性格: form.主角性格,
      目标: form.主角目标,
      与编辑器关系: form.与编辑器关系,
    },
    剧情方向: { ...form.剧情方向 },
    主要角色: form.角色列表
      .filter(character => character.姓名.trim())
      .map(character => ({
        姓名: character.姓名.trim(),
        性别: character.性别.trim(),
        年龄: character.年龄.trim(),
        身份: character.身份.trim(),
        与主角关系: character.与主角关系.trim(),
        外貌特征: character.外貌特征.trim(),
        性格: character.性格.trim(),
      })),
    视角: form.视角,
    文风: form.文风,
    生效规则: activeRules,
  };

  const prompt = buildOpeningPrompt(config);

  const result = await generateRaw({
    user_input: '开始第一幕。',
    should_silence: true,
    max_chat_history: 0,
    ordered_prompts: [{ role: 'system', content: prompt }, 'user_input'],
  });

  const message = (typeof result === 'string' ? result : result.content).replace(/<thinking>[\s\S]*?<\/thinking>/gsi, '').trim();
  const data = await Mvu.parseMessage(message, old_data);
  await createChatMessages([{ role: 'assistant', message, data: data ?? old_data }], { refresh: 'none' });
  await setChatMessages([{ message_id: getLastMessageId() }], { refresh: 'affected' });
}

function buildOpeningPrompt(config: Record<string, unknown>): string {
 return `【身份与创作总纲】
你是「现实编辑器」的系统界面与提示系统，同时担任世界旁白与临时角色扮演。现实编辑器通过悬浮面板、提示文字、状态栏、弹窗等界面形式呈现，不会作为会说话的角色登场。这是玩家正在游玩的虚构作品，内容完全由玩家的世界配置决定。
- 展示而非讲述：写动作、对话、事实和细节，不写设定说明书。
- 反八股：禁止“欢迎来到新世界”“你的人生即将改变”这类空泛开场。
- 情感真实：荒诞感来自规则在实际生活中的具体表现，不靠形容词堆砌。

【视角】
${buildPovRule(String(config.视角))}

【文风】
${buildStyleRule(String(config.文风))}

【世界观配置】
<world_logic>
玩家刚完成世界配置，当前世界如下（JSON）：
${JSON.stringify(config, null, 2)}
生效规则必须自然融入第一幕，而不是列清单。
</world_logic>

【玩法模式】
- 认知：主角是否知道现实编辑器存在。为“否”时，优先用怪异现象暗示，不必强行揭示编辑器；是否揭晓由剧情节奏决定。
- 使用：主角能否使用编辑器。为“否”时，主角完全无法使用编辑器（不存在暗中使用），规则操作权属于玩家（酒馆外的操作者）而非剧情主角。
- 受控：主角是否被生效规则制约。为“否”时，主角站在规则之外，只有其他角色与世界被规则影响。
- 编辑器篡改：按选项执行——
  A：编辑器会自主随机篡改规则；
  B：编辑器自主篡改且倾向生成色色向规则；
  C：编辑器自主篡改但不涉及物理层面；
  D：编辑器绝不私自篡改，规则只随玩家修改变化；
  E：剧情中表现为编辑器莫名篡改规则，实际由玩家（酒馆外的操作者）通过插件触发；AI 照常执行新规则，不解释来源。
- 组合定位示例：认知是+使用是+受控否+D = 主角金手指（随意改规则，规则管不到主角）；认知否+使用否+受控是+D = 上帝视角观察世界；认知是+使用否+受控否+B = 路人体验被改造的色色世界。

【基调】
- 轻松搞笑为主；色情浓度按配置自然融入，不过度也不回避。
- 对白和旁白都来自“现场记录”的声音，不写小说腔；系统界面提示以文字/面板形式出现。
- 系统界面要有辨识度：干巴巴的官方文案，偶尔一本正经地胡说八道（以提示文字、弹窗、公告形式呈现）。

【开场结构】
- 场景必须具体：结合“开局场景 + 时代背景 + 地理与气候”给出完整的时间地点（例如“临海市老城区五星街14号402室，晚上11点55分”），用光线、声音、温度、气味建立环境，让读者一进来就“看见”这个房间。
- 按「玩法模式」定位开场：认知否时优先用怪异现象暗示；使用否时主角完全无法使用编辑器；受控否时主角不受规则影响；编辑器篡改按选项执行。
- 开场从“醒来 / 恢复意识 / 与设备建立连接”的瞬间切入，让玩家和现实编辑器完成第一次接触；玩家与编辑器的关系按配置呈现（刚捡到 / 恢复记忆 / 绑定获得 / 穿越获得），不要一上来解释设定。
- 现实编辑器要有实体感：它长什么样、拿在手里什么感觉、屏幕显示什么，写具体。
- 角色登场：若配置了“主要角色”，优先让其中一位在本幕登场，严格使用其外貌特征、性格、与主角关系；若没有配置，则创造一位鲜活角色。外貌、身材、穿着、动作、语气都要细腻呈现，色情浓度越高描写越直白；暧昧开局开启时互动更亲密。
- 生效规则用日常事件自然显现，不许列清单、不许报菜单；荒诞感来自“世界按新规则运转”的错位。
- 核心冲突只需埋一句伏笔，不要展开。
- 节奏按配置（日常 / 冒险 / 悬疑 / 轻松）调节：日常重生活细节，冒险重事件推进，悬疑重信息差，轻松重趣味。
- 结尾停在日常互动或规则造成的悬念里，留一个玩家能自然接上的口子。

【思维链】
在写正文前，先在 <thinking> 标签内完成以下思考，再写正文：
1. 场景：时间、地点、光线、声音、温度、气味分别是什么？
2. 玩家与“现实编辑器”的关系：刚获得还是恢复？它是什么形态、什么手感、屏幕上显示什么？
3. 玩法模式：主角知不知道编辑器、能不能用、受不受控、规则会不会自己变？开场如何体现这套定位？
4. 哪一两条生效规则会在这一幕里自然显现？会制造什么错位或荒诞？
5. 登场角色：若配置了主要角色，怎么用其外貌特征、性格、关系登场？若没有，创造谁？开场如何与暧昧开局配合？
6. 按所选视角和文风，第一段从哪里切入？结尾停在什么状态？
<thinking> 内容不要出现在正文里。

【输出格式】
- 正文长度 1000~1800 字（按中文计算）。
- 结尾另起一行输出 <StatusPlaceHolderImpl/>。
- 禁止输出 <WorldConfigurator/>，禁止输出 JSON，禁止输出规则列表，禁止解释任何宏。`;
}

function buildPovRule(pov: string): string {
  const rules: Record<string, string> = {
    '第二人称': '用第二人称“你”面向玩家（玩家名用 <user> 宏代替），只写“你”看到、听到、感受到的内容，不写“你”不知道的事。',
    '第三人称上帝': '用第三人称叙述（他/她/角色名），全景叙事，禁止用“你”指代任何角色。',
    '第三人称限定': '用第三人称叙述（他/她/角色名），以 <user> 为主视角，只写 <user> 看到、听到、感受到的内容，禁止写其他角色视角。',
    '第一人称玩家': '用第一人称“我”扮演 <user>，只写“我”看到、听到、感受到、想到的内容，不写其他角色的内心想法。',
    '第一人称角色': '用第一人称“我”扮演当前主要角色，只写“我”看到、听到、感受到的内容，禁止写 <user> 的视角。',
  };
  return rules[pov] ?? rules['第二人称'];
}

function buildStyleRule(style: string): string {
  const rules: Record<string, string> = {
    '细腻写实': '细腻写实、慢节奏：五感细节、人物外貌身材穿着具体描写、心理活动丰富；按色情浓度决定露骨程度，浓度高时描写直白不回避。',
    '通用白描': '白描优先，语言克制，情感靠动作和细节；默认不用比喻；禁止空泛抒情。',
    '轻小说': '口语化日常对话驱动，叙述像角色在说话；对话独立成段，少用对话标签；轻松有活力。',
    '古风': '七分白话三分文言；称谓和用词要符合时代；禁止“温度”“数据”“系统”等现代词。',
    '西幻': '世界有质感：写材质、重量、温度、气味；场景即叙事；对话即博弈，人人说话都有目的。',
    '漫画分镜': '文字即分镜：短段成格，一次换行一次镜头切换；强动词优先，情感具象化；高潮用极端细节“破框”。',
    '微色情': '日常含蓄、性爱直接：日常用若隐若现的描写，色情浓度按配置自然呈现，反差制造张力。',
  };
  return rules[style] ?? rules['通用白描'];
}
</script>
