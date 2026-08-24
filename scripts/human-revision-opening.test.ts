import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  applyOpeningPatchToMvuData,
  appendOpeningUpdateVariable,
  buildChatLoreSpecs,
  buildOpeningJsonPatch,
  REALITY_EDITOR_ENABLED,
  buildOpeningState,
  buildOpeningUpdateVariable,
  normalizeOpeningMvuData,
  type OpeningFormSnapshot,
} from '../src/人间修订中/界面/世界配置/opening';
import {
  commitCurrentChatLore,
  rollbackChatLoreMutation,
  verifyChatLoreMutation,
  upsertChatLoreEntries,
} from '../src/人间修订中/界面/世界配置/chat-lore';

const snapshot: OpeningFormSnapshot = {
  让现实编辑器参与世界观生成: true,
  体验与叙事方向: {
    故事体验: '在一座会记住每次选择的城市里调查失踪案',
    主角处境: '刚接手一间濒临停业的旧书店',
    冲突与成长: '在真相和安稳生活之间作出选择',
    叙事视角: '第三人称限定',
    文风: '细腻写实',
  },
  世界与故事骨架: {
    世界规则: '城市的公共记录会在午夜自动重排',
    时代与舞台: '近未来沿海城市',
    社会后果: '人们习惯在日落前核对身份记录',
    核心矛盾与推进: '失踪者的记录仍在持续更新',
  },
  主角: {
    启用: true,
    性别: '女',
    年龄: '28',
    外貌: { 身高: '168cm', 体型: '清瘦', 面容气质: '眼神疲惫', 身体特征: '左手有旧墨渍' },
    身份与位置: '旧书店店主',
    追求: '找到失踪的姐姐',
    处境与压力: '店铺即将被收回',
    性格与声音: '谨慎、擅长观察细节',
    补充设定: '不轻易向陌生人求助',
  },
  重要角色: [
    {
      姓名: '林澈',
      性别: '男',
      年龄: '31',
      身高: '182cm',
      体型: '修长',
      面容气质: '说话很慢',
      身体特征: '右眉有疤',
      关系定位: '档案馆调查员',
      欲望与压力: '想保护自己的调查资格',
      性格与声音: '克制、直白',
      当前关联: '带来一份异常档案',
    },
  ],
  世界落地与开场准备: {
    起始地点: '东港 / 旧城区 / 雾灯旧书店',
    日常秩序: '所有人出门前都核对记录',
    组织势力: '市政档案馆和旧城区商会',
    必要规则: '午夜后不得修改纸质档案',
    当前矛盾与开场: '姐姐的失踪记录在店门口更新为明天',
  },
  现实编辑器: {
    表现形式: '悬浮面板',
    可见与知晓: '只有玩家与主角可见',
    可修改范围: ['世界', '区域'],
    常识同步: '渐进同步',
    记忆保留: '只有主角保留',
    主角受影响: '是',
    自主执行: 'D-完全禁止',
    限制与代价: '每次修改都要留下可追溯的反馈',
    自然语言修改: '玩家说出明确目标后才提出规则草案',
  },
};

const specs = buildChatLoreSpecs(snapshot);
assert.deepEqual(
  specs.map(spec => spec.name),
  ['人间修订中｜本会话世界与叙事设定', '人间修订中｜本会话现实编辑器设定'],
);
assert.match(specs[0].content, /近未来沿海城市/);
assert.match(specs[1].content, /每次修改都要留下可追溯的反馈/);

const closedSnapshot: OpeningFormSnapshot = {
  ...snapshot,
  让现实编辑器参与世界观生成: false,
};
const closedSpecs = buildChatLoreSpecs(closedSnapshot);
assert.equal(closedSpecs.length, 2);
assert.equal(closedSpecs[0].name, '人间修订中｜本会话世界与叙事设定');
assert.equal(closedSpecs[1].name, '人间修订中｜本会话现实编辑器设定');
assert.doesNotMatch(closedSpecs[0].content, /现实编辑器/);
assert.match(closedSpecs[1].content, /每次修改都要留下可追溯的反馈/);
assert.equal(REALITY_EDITOR_ENABLED, true);
assert.equal(buildOpeningState(closedSnapshot, { protagonistName: '玩家' }).现实编辑器.是否显现, true);
assert.equal(buildOpeningState(closedSnapshot, { protagonistName: '玩家' }).现实编辑器.状态, '正常');
assert.match(buildOpeningUpdateVariable(closedSnapshot), /现实编辑器保持生效/);

const entries = upsertChatLoreEntries([], specs);
assert.equal(entries.length, 2);
assert.ok(entries.every(entry => entry.enabled && entry.probability === 100));
assert.ok(entries.every(entry => entry.strategy.type === 'constant' && entry.strategy.keys.length === 0));
assert.ok(entries.every(entry => entry.position.type === 'after_character_definition'));
assert.ok(entries.every(entry => entry.position.order === 14730));
assert.ok(entries.every(entry => entry.uid === undefined));
assert.deepEqual(
  entries.map(entry => entry.extra?.human_revision?.kind),
  ['world', 'editor'],
);
const disabledEntries = upsertChatLoreEntries(entries, [specs[0]]);
assert.deepEqual(
  disabledEntries.map(entry => entry.name),
  ['人间修订中｜本会话世界与叙事设定'],
);
const preservedUidEntries = upsertChatLoreEntries([{ ...entries[0], uid: 731 }], [specs[0]]);
assert.equal(preservedUidEntries[0].uid, 731);

const patch = buildOpeningJsonPatch(snapshot, { protagonistName: '玩家' });
assert.deepEqual(
  patch.map(operation => operation.path),
  ['/当前场景', '/主角', '/NPC序列', '/现实编辑器', '/生效规则'],
);
assert.ok(patch.every(operation => operation.op === 'replace'));
const updateVariable = buildOpeningUpdateVariable(snapshot, { protagonistName: '玩家' });
assert.match(updateVariable, /<UpdateVariable>/);
assert.match(updateVariable, /<JSONPatch>/);
assert.ok(updateVariable.includes(JSON.stringify(patch, null, 2)));

const finalMessage = appendOpeningUpdateVariable('开场正文\\n<StatusPlaceHolderImpl/>', updateVariable);
assert.ok(finalMessage.indexOf('开场正文') < finalMessage.indexOf('<UpdateVariable>'));
assert.ok(finalMessage.endsWith('<StatusPlaceHolderImpl/>'));

const openingSource = fs.readFileSync(path.resolve(__dirname, '../src/人间修订中/界面/世界配置/opening.ts'), 'utf8');
assert.equal(/\bnew Date\s*\(/.test(openingSource), false);
const openingState = buildOpeningState(snapshot, { protagonistName: '玩家' });
assert.deepEqual(openingState.当前场景.日期, { 年: null, 月: null, 日: null });
assert.deepEqual(openingState.当前场景.时间, { 时: null, 分: null });

const worldConfigSource = fs.readFileSync(path.resolve(__dirname, '../src/人间修订中/界面/世界配置/App.vue'), 'utf8');
assert.match(
  worldConfigSource,
  /const updateVariable = buildOpeningUpdateVariable\(snapshot,\s*\{\s*protagonistName:\s*protagonistName\.value\s*\}\);/s,
);
const productionPersonaName = '生产路径当前人设';
const productionUpdateVariable = buildOpeningUpdateVariable(snapshot, {
  protagonistName: productionPersonaName,
});
assert.match(productionUpdateVariable, new RegExp(`姓名\\": \\"${productionPersonaName}\\"`));

const oldData = {
  initialized_lorebooks: { 旧世界书: [] },
  stat_data: {
    世界配置: { 世界观描述: '旧值' },
    当前场景: { 摘要: '旧摘要' },
    主角: { 启用: false },
    NPC序列: {},
    现实编辑器: { 状态: '待机', 生效规则: { 世界规则: { 旧规则: '旧值' } } },
  },
};
const normalized = normalizeOpeningMvuData(oldData);
const next = applyOpeningPatchToMvuData(normalized, finalMessage);
assert.deepEqual(Object.keys(next.stat_data).sort(), ['NPC序列', '主角', '当前场景', '现实编辑器', '生效规则']);
assert.deepEqual(next.stat_data, buildOpeningState(snapshot, { protagonistName: '玩家' }));
assert.equal(next.stat_data.当前场景.地点.三级地点, '雾灯旧书店');
assert.equal(next.stat_data.主角.基础信息.姓名, '玩家');
assert.equal(next.stat_data.NPC序列.林澈.基础信息.姓名, '林澈');
assert.equal(next.stat_data.现实编辑器.是否显现, true);
assert.deepEqual(next.stat_data.生效规则, { 世界规则: {}, 区域规则: {}, 个人规则: {} });

async function testChatLoreTransactionRollback() {
  const runtime = globalThis as Record<string, any>;
  const worldbooks = new Map<string, Array<Record<string, any>>>();
  const unbindArguments: Array<string | null> = [];
  let currentChatWorldbook: string | null = null;
  let nextUid = 400;

  runtime.getChatWorldbookName = () => currentChatWorldbook;
  runtime.getWorldbookNames = () => [...worldbooks.keys()];
  runtime.getOrCreateChatWorldbook = async () => {
    if (currentChatWorldbook && worldbooks.has(currentChatWorldbook)) return currentChatWorldbook;
    const name = '人间修订中·测试当前聊天世界书';
    if (!worldbooks.has(name)) worldbooks.set(name, []);
    currentChatWorldbook = name;
    return name;
  };
  runtime.getWorldbook = async (name: string) => JSON.parse(JSON.stringify(worldbooks.get(name) ?? []));
  runtime.createOrReplaceWorldbook = async (name: string, incoming: Array<Record<string, any>> = []) => {
    worldbooks.set(
      name,
      incoming.map(entry => ({ ...entry, uid: entry.uid === undefined ? nextUid++ : entry.uid })),
    );
    return true;
  };
  runtime.setChatLorebook = async (name: string | null) => {
    unbindArguments.push(name);
    currentChatWorldbook = name;
  };
  runtime.deleteWorldbook = async (name: string) => worldbooks.delete(name);

  const mutation = await commitCurrentChatLore(snapshot);
  const createdEntries = worldbooks.get(mutation.worldbookName) ?? [];
  assert.equal(mutation.originalWorldbookName, null);
  assert.equal(mutation.worldbookCreated, true);
  assert.equal(createdEntries.length, 2);
  assert.ok(createdEntries.every(entry => Number.isInteger(entry.uid) && entry.uid >= 400));
  assert.ok(createdEntries.every(entry => entry.uid !== -1));
  const verified = await verifyChatLoreMutation(mutation);
  assert.equal(verified.binding, mutation.worldbookName);
  assert.equal(verified.managedEntries.length, 2);
  assert.deepEqual(
    verified.managedEntries.map(entry => entry.extra?.human_revision?.kind),
    ['world', 'editor'],
  );

  try {
    throw new Error('simulated message creation failure');
  } catch {
    await rollbackChatLoreMutation(mutation);
  }
  assert.equal(unbindArguments.at(-1), null);
  assert.equal(currentChatWorldbook, null);
  assert.equal(worldbooks.has(mutation.worldbookName), false);

  const failedDeleteName = '人间修订中·测试删除失败世界书';
  worldbooks.set(failedDeleteName, [{ uid: 501, name: '残留条目' }]);
  currentChatWorldbook = failedDeleteName;
  const failedDeleteMutation = {
    worldbookName: failedDeleteName,
    originalWorldbookName: null,
    originalEntries: [],
    beforeEntries: [],
    worldbookCreated: true,
  };
  const deleteWorldbookBeforeFailure = runtime.deleteWorldbook;
  runtime.deleteWorldbook = async () => false;
  await assert.rejects(
    () => rollbackChatLoreMutation(failedDeleteMutation),
    /deleteWorldbook 返回 false，世界书仍在运行时列表中/,
  );
  assert.equal(currentChatWorldbook, null);
  assert.equal(worldbooks.has(failedDeleteName), true);
  runtime.deleteWorldbook = deleteWorldbookBeforeFailure;
  worldbooks.delete(failedDeleteName);

  const failedWriteCreateOrReplace = runtime.createOrReplaceWorldbook;
  currentChatWorldbook = null;
  runtime.createOrReplaceWorldbook = async (name: string) => {
    worldbooks.set(name, []);
    return true;
  };
  await assert.rejects(
    () => commitCurrentChatLore(snapshot),
    /Chat Lore 写后校验失败/,
  );
  assert.equal(currentChatWorldbook, null);
  assert.equal(worldbooks.has('人间修订中·测试当前聊天世界书'), false);
  runtime.createOrReplaceWorldbook = failedWriteCreateOrReplace;

  const originalWorldbookName = '人间修订中·测试原有聊天世界书';
  const originalEntries = [{ uid: 77, name: '原有条目', content: '原始内容' }];
  worldbooks.set(originalWorldbookName, JSON.parse(JSON.stringify(originalEntries)));
  currentChatWorldbook = originalWorldbookName;
  const existingMutation = await commitCurrentChatLore(snapshot);
  assert.equal(existingMutation.originalWorldbookName, originalWorldbookName);
  assert.equal(existingMutation.worldbookCreated, false);
  assert.equal((worldbooks.get(originalWorldbookName) ?? []).length, 3);
  await rollbackChatLoreMutation(existingMutation);
  assert.equal(currentChatWorldbook, originalWorldbookName);
  assert.deepEqual(worldbooks.get(originalWorldbookName), originalEntries);

  const appSource = fs.readFileSync(
    path.resolve(__dirname, '../src/人间修订中/界面/世界配置/App.vue'),
    'utf8',
  );
  assert.match(appSource, /getChatMessages\('0-\{\{lastMessageId\}\}'\)/);
  assert.match(appSource, /await SillyTavern\.saveChat\(\);/);
  assert.match(appSource, /新消息写后回读已确认/);
  assert.doesNotMatch(appSource, /const afterMessageId = getLastMessageId\(\)/);
}

testChatLoreTransactionRollback()
  .then(() => console.log('human-revision opening tests: PASS'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
