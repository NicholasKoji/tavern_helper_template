<!-- eslint-disable better-tailwindcss/no-unknown-classes -->
<template>
  <main class="status-shell" data-status-bar="human-revision-status-v1" :data-theme="themeId">
    <header class="topbar">
      <div class="topbar-identity">
        <span class="kicker">REALITY EDITOR</span>
        <h1 class="title">人间修订中</h1>
      </div>
      <span class="editor-badge">{{ data.现实编辑器.状态 }}</span>
      <span class="version">{{ data.现实编辑器.版本 }}</span>
      <button class="rule-edit-button" type="button" @click="openRuleEditor">
        <PenLine :size="14" stroke-width="1.8" />改规则
      </button>
    </header>

    <section class="meta-strip" aria-label="当前场景">
      <div class="meta-item">
        <span class="label"><CalendarDays :size="13" stroke-width="1.8" />日期</span>
        <span class="value">{{ formatDate }}</span>
      </div>
      <div class="meta-item">
        <span class="label"><Clock3 :size="13" stroke-width="1.8" />时间</span>
        <span class="value">{{ formatTime }}</span>
      </div>
      <div class="meta-item location">
        <span class="label"><MapPin :size="13" stroke-width="1.8" />地点</span>
        <span class="value">{{ formatLocation }}</span>
      </div>
      <div class="meta-item summary">
        <span class="label"><ScrollText :size="13" stroke-width="1.8" />摘要</span>
        <span class="value summary-text" :title="scene.摘要">{{ scene.摘要 }}</span>
      </div>
    </section>

    <nav class="tabs" role="tablist" aria-label="状态栏页签">
      <button
        v-for="tab in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        role="tab"
        type="button"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="activeTab === tab.id ? 0 : -1"
        @click="setTab(tab.id)"
        @keydown="onTabKeydown"
      >
        <component :is="tab.icon" :size="16" stroke-width="1.8" />
        {{ tab.label }}
      </button>
    </nav>

    <div class="content">
      <section
        v-show="activeTab === 'overview'"
        id="panel-overview"
        class="panel"
        :class="{ active: activeTab === 'overview' }"
        role="tabpanel"
        aria-labelledby="tab-overview"
      >
        <article class="card">
          <header class="card-header">
            <h2 class="card-title"><BookOpen :size="17" stroke-width="1.8" />世界档案</h2>
          </header>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">世界模板</div>
              <div class="data-val">{{ data.世界配置.世界模板 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">时代背景</div>
              <div class="data-val">{{ data.世界配置.时代背景 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">主线目标</div>
              <div class="data-val">{{ data.世界配置.剧情方向.主线目标 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">叙事视角</div>
              <div class="data-val">{{ data.世界配置.叙事视角 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">叙事文风</div>
              <div class="data-val">{{ data.世界配置.叙事文风 }}</div>
            </div>
          </div>
        </article>

        <article class="card">
          <header class="card-header">
            <h2 class="card-title"><ShieldCheck :size="17" stroke-width="1.8" />现实编辑器</h2>
            <span class="status-tag">{{ data.现实编辑器.状态 }}</span>
          </header>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">版本</div>
              <div class="data-val">{{ data.现实编辑器.版本 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">权限</div>
              <div class="data-val perms">
                <span class="perm ok">改规则 ✓</span>
                <span class="perm no">改权限 ✗</span>
                <span class="perm no">卸载 ✗</span>
              </div>
            </div>
          </div>
          <div v-if="ruleScopeCount > 0" class="rules">
            <details v-for="scope in ruleScopes" :key="scope.key" class="rule-group" open>
              <summary>
                <span>{{ scope.title }}</span>
                <span class="rule-count">{{ scope.count }}</span>
              </summary>
              <template v-if="scope.key === '世界规则'">
                <ul>
                  <li v-for="(content, name) in data.现实编辑器.生效规则.世界规则" :key="name">
                    <b>{{ name }}</b
                    >：{{ content }}
                  </li>
                </ul>
              </template>
              <template v-else>
                <details
                  v-for="[target, rules] in Object.entries(scope.entries)"
                  :key="target"
                  class="rule-subgroup"
                  open
                >
                  <summary>
                    <span>{{ target }}</span>
                    <span class="rule-count">{{ Object.keys(rules).length }}</span>
                  </summary>
                  <ul>
                    <li v-for="(content, name) in rules" :key="name">
                      <b>{{ name }}</b
                      >：{{ content }}
                    </li>
                  </ul>
                </details>
              </template>
            </details>
          </div>
          <p v-else class="empty-state">暂无生效规则</p>
        </article>
      </section>

      <section
        v-show="activeTab === 'protagonist'"
        id="panel-protagonist"
        class="panel"
        :class="{ active: activeTab === 'protagonist' }"
        role="tabpanel"
        aria-labelledby="tab-protagonist"
      >
        <article v-if="protagonistEnabled" class="card">
          <header class="card-header">
            <h2 class="card-title"><User :size="17" stroke-width="1.8" />主角档案</h2>
            <span class="status-tag">{{ data.主角.基础信息.身份 || '身份未记录' }}</span>
          </header>

          <h3 class="sub-title">基础信息</h3>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">姓名</div>
              <div class="data-val">{{ data.主角.基础信息.姓名 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">性别</div>
              <div class="data-val">{{ data.主角.基础信息.性别 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">年龄</div>
              <div class="data-val">{{ data.主角.基础信息.年龄 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">身份</div>
              <div class="data-val">{{ data.主角.基础信息.身份 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">目标</div>
              <div class="data-val">{{ data.主角.基础信息.目标 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">与编辑器关系</div>
              <div class="data-val">{{ data.主角.基础信息.与编辑器关系 }}</div>
            </div>
          </div>

          <h3 class="sub-title">外貌</h3>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">身高</div>
              <div class="data-val">{{ data.主角.外貌.身高 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">体型</div>
              <div class="data-val">{{ data.主角.外貌.体型 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">面容气质</div>
              <div class="data-val">{{ data.主角.外貌.面容气质 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">身体特征</div>
              <div class="data-val">{{ data.主角.外貌.身体特征 }}</div>
            </div>
          </div>

          <h3 class="sub-title">性格</h3>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">底色</div>
              <div class="data-val">{{ data.主角.性格.底色 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">主色调</div>
              <div class="data-val">{{ data.主角.性格.主色调 }}</div>
            </div>
          </div>

          <h3 class="sub-title">当前状态</h3>
          <p class="paragraph">{{ data.主角.当前状态 }}</p>

          <h3 class="sub-title">穿着</h3>
          <div class="data-list">
            <div class="data-row">
              <div class="data-key">上装</div>
              <div class="data-val">{{ data.主角.穿着.上装 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">下装</div>
              <div class="data-val">{{ data.主角.穿着.下装 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">内衣</div>
              <div class="data-val">{{ data.主角.穿着.内衣 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">袜子</div>
              <div class="data-val">{{ data.主角.穿着.袜子 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">鞋子</div>
              <div class="data-val">{{ data.主角.穿着.鞋子 }}</div>
            </div>
            <div class="data-row">
              <div class="data-key">配饰</div>
              <div class="data-val">{{ data.主角.穿着.配饰 }}</div>
            </div>
          </div>

          <h3 class="sub-title">补充设定</h3>
          <p class="paragraph">{{ data.主角.补充设定 }}</p>

          <div v-if="protagonistPrivateEntries.length" class="private-state">
            <h3 class="sub-title">私密状态</h3>
            <details v-for="[part, state] in protagonistPrivateEntries" :key="part" class="sub-block" open>
              <summary>{{ part }}</summary>
              <div class="detail-body">
                <div class="data-row">
                  <div class="data-key">外观描述</div>
                  <div class="data-val">{{ state.外观描述 }}</div>
                </div>
                <div class="data-row">
                  <div class="data-key">当前状态</div>
                  <div class="data-val">{{ state.当前状态 }}</div>
                </div>
              </div>
            </details>
          </div>
          <p v-else class="empty-state">暂无私密状态记录</p>
        </article>
        <p v-else class="notice-state">
          <strong>主角未启用</strong>
          玩家为故事外操作者，主角档案不参与叙事。
        </p>
      </section>

      <section
        v-show="activeTab === 'npc'"
        id="panel-npc"
        class="panel"
        :class="{ active: activeTab === 'npc' }"
        role="tabpanel"
        aria-labelledby="tab-npc"
      >
        <div v-if="npcEntries.length" class="npc-layout">
          <aside class="npc-list" aria-label="NPC 列表">
            <button
              v-for="[name, npc] in npcEntries"
              :key="name"
              class="npc-select"
              :class="{ active: selectedNpcName === name }"
              type="button"
              @click="selectedNpcName = name"
            >
              <strong>{{ name }}</strong>
              <span>{{ npc.基础信息.身份 || '身份未记录' }}</span>
              <span class="npc-favor">好感 {{ npc.基础信息.好感度 ?? '--' }}</span>
            </button>
          </aside>
          <article v-if="selectedNpc" class="card npc-detail">
            <header class="card-header">
              <h2 class="card-title"><Users :size="17" stroke-width="1.8" />{{ selectedNpcName }}</h2>
              <span class="status-tag">好感 {{ selectedNpc.基础信息.好感度 ?? '--' }}</span>
            </header>

            <h3 class="sub-title">基础信息</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">性别</div>
                <div class="data-val">{{ selectedNpc.基础信息.性别 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">年龄</div>
                <div class="data-val">{{ selectedNpc.基础信息.年龄 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">身份</div>
                <div class="data-val">{{ selectedNpc.基础信息.身份 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">关系定位</div>
                <div class="data-val">{{ selectedNpc.基础信息.关系定位 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">好感度</div>
                <div class="data-val favor-row">
                  <span class="meter" aria-hidden="true">
                    <span class="meter-fill" :style="{ width: `${selectedNpc.基础信息.好感度 || 0}%` }" />
                  </span>
                  <span class="tone-value">{{ selectedNpc.基础信息.好感度 }}</span>
                </div>
              </div>
            </div>

            <h3 class="sub-title">外貌</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">身高</div>
                <div class="data-val">{{ selectedNpc.外貌.身高 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">罩杯</div>
                <div class="data-val">{{ selectedNpc.外貌.罩杯 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">体型</div>
                <div class="data-val">{{ selectedNpc.外貌.体型 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">面容气质</div>
                <div class="data-val">{{ selectedNpc.外貌.面容气质 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">身体特征</div>
                <div class="data-val">{{ selectedNpc.外貌.身体特征 }}</div>
              </div>
            </div>

            <h3 class="sub-title">性格</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">底色</div>
                <div class="data-val">{{ selectedNpc.性格.底色 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">主色调</div>
                <div class="data-val">{{ selectedNpc.性格.主色调 }}</div>
              </div>
            </div>

            <h3 class="sub-title">当前状态</h3>
            <p class="paragraph">{{ selectedNpc.当前状态 }}</p>

            <h3 class="sub-title">穿着</h3>
            <div class="data-list">
              <div class="data-row">
                <div class="data-key">上装</div>
                <div class="data-val">{{ selectedNpc.穿着.上装 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">下装</div>
                <div class="data-val">{{ selectedNpc.穿着.下装 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">内衣</div>
                <div class="data-val">{{ selectedNpc.穿着.内衣 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">袜子</div>
                <div class="data-val">{{ selectedNpc.穿着.袜子 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">鞋子</div>
                <div class="data-val">{{ selectedNpc.穿着.鞋子 }}</div>
              </div>
              <div class="data-row">
                <div class="data-key">配饰</div>
                <div class="data-val">{{ selectedNpc.穿着.配饰 }}</div>
              </div>
            </div>

            <h3 class="sub-title">当前想法</h3>
            <p class="paragraph">{{ selectedNpc.当前想法 }}</p>

            <div v-if="privateStateEntries.length" class="private-state">
              <h3 class="sub-title">私密状态</h3>
              <details v-for="[part, state] in privateStateEntries" :key="part" class="sub-block" open>
                <summary>{{ part }}</summary>
                <div class="detail-body">
                  <div class="data-row">
                    <div class="data-key">外观描述</div>
                    <div class="data-val">{{ state.外观描述 }}</div>
                  </div>
                  <div class="data-row">
                    <div class="data-key">当前状态</div>
                    <div class="data-val">{{ state.当前状态 }}</div>
                  </div>
                </div>
              </details>
            </div>
            <p v-else class="empty-state">暂无私密状态记录</p>
          </article>
        </div>
        <p v-else class="notice-state">
          <strong>暂无 NPC 记录</strong>
          当前剧情尚未写入可展示的 NPC。
        </p>
      </section>
    </div>

    <div
      v-if="ruleEditorOpen"
      class="rule-editor-backdrop"
      @click.self="closeRuleEditor"
      @keydown.esc="closeRuleEditor"
    >
      <section class="rule-editor" role="dialog" aria-modal="true" aria-labelledby="rule-editor-title">
        <header class="rule-editor-header">
          <div>
            <span class="rule-editor-kicker">REALITY EDITOR · RULE REVISION</span>
            <h2 id="rule-editor-title">现实编辑器 · 规则修订</h2>
          </div>
          <button class="rule-editor-close" type="button" aria-label="关闭规则编辑器" @click="closeRuleEditor">
            <X :size="18" />
          </button>
        </header>

        <p class="rule-editor-lead">
          在此签发、修订或废止生效规则。确认后立即写入最新楼层变量，下一轮正文将按协议显化。
        </p>

        <label class="ai-hint">
          <span>AI 起草方向（可选）</span>
          <input
            v-model="aiHint"
            class="rule-control"
            type="text"
            maxlength="120"
            placeholder="例如：来一条让主角在奶茶店尴尬的规则"
          />
        </label>

        <div class="rule-editor-groups">
          <section v-for="group in editorGroups" :key="group.key" class="rule-editor-group">
            <header class="rule-editor-group-header">
              <h3>{{ group.title }}</h3>
              <span class="rule-editor-count">{{ ruleEditorState[group.key].length }}</span>
              <span class="rule-editor-group-actions">
                <button
                  class="rule-tool-button"
                  type="button"
                  :disabled="aiBusy[group.key]"
                  @click="suggestRules(group.key)"
                >
                  <WandSparkles :size="14" />{{ aiBusy[group.key] ? '篡改中…' : '常识篡改' }}
                </button>
                <button class="rule-tool-button" type="button" @click="addRuleRow(group.key)">
                  <Plus :size="14" />添加
                </button>
              </span>
            </header>

            <div v-if="aiDraft[group.key].主题" class="ai-system-banner">
              <span class="ai-system-tag">AI 体系草稿</span>
              <strong>{{ aiDraft[group.key].主题 }}</strong>
              <p v-if="aiDraft[group.key].说明">{{ aiDraft[group.key].说明 }}</p>
              <p v-if="group.scoped && aiDraft[group.key].对象" class="ai-system-scope">
                作用范围：{{ aiDraft[group.key].对象 }}
              </p>
            </div>

            <p v-if="ruleEditorState[group.key].length === 0" class="rule-editor-empty">该类暂无规则，留空即不设限。</p>

            <div
              v-for="(row, index) in ruleEditorState[group.key]"
              :key="`${group.key}-${index}`"
              class="rule-editor-row"
              :class="{ scoped: group.scoped }"
            >
              <input
                v-if="group.scoped"
                v-model="row.对象"
                class="rule-control"
                type="text"
                :placeholder="group.scopePlaceholder"
                :aria-label="`${group.title}生效范围`"
              />
              <input
                v-model="row.名称"
                class="rule-control"
                type="text"
                placeholder="规则名称"
                :aria-label="`${group.title}规则名称`"
              />
              <textarea
                v-model="row.内容"
                v-auto-grow
                class="rule-control"
                rows="1"
                placeholder="规则内容"
                :aria-label="`${group.title}规则内容`"
              ></textarea>
              <div class="rule-editor-row-actions">
                <span v-if="row._ai" class="rule-ai-badge">AI 草稿</span>
                <button
                  class="rule-row-remove"
                  type="button"
                  :aria-label="`删除${group.title}第 ${index + 1} 条`"
                  @click="removeRuleRow(group.key, index)"
                >
                  <Trash2 :size="15" />
                </button>
              </div>
            </div>
          </section>
        </div>

        <footer class="rule-editor-footer">
          <p v-if="editorError" class="rule-editor-error">{{ editorError }}</p>
          <div class="rule-editor-actions">
            <button class="rule-action ghost" type="button" :disabled="busy" @click="closeRuleEditor">取消</button>
            <button class="rule-action primary" type="button" :disabled="busy || anyAiBusy" @click="confirmRules">
              {{ busy ? '写入中…' : '确认修订' }}
            </button>
          </div>
        </footer>
      </section>
    </div>

    <div v-if="announcement" class="system-notice" role="status" aria-live="polite">
      <header>
        <span>现实编辑器 · 系统公告</span>
        <button type="button" aria-label="关闭公告" @click="announcement = null">
          <X :size="14" />
        </button>
      </header>
      <ul>
        <li v-for="item in announcement.items" :key="item.编号">
          <b>{{ item.编号 }}</b> {{ item.类型 }} {{ item.范围 }}「{{ item.名称 }}」：{{ item.内容 }}
        </li>
      </ul>
    </div>
  </main>
  <div class="sr-only" aria-live="polite">{{ announcer }}</div>
</template>

<script setup lang="ts">
import {
  CalendarDays,
  BookOpen,
  Clock3,
  LayoutDashboard,
  MapPin,
  PenLine,
  Plus,
  ScrollText,
  ShieldCheck,
  Trash2,
  User,
  Users,
  WandSparkles,
  X,
} from '@lucide/vue';
import { useLocalStorage } from '@vueuse/core';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { Directive } from 'vue';
import themeArchiveFontUrl from '../世界配置/fonts/theme-archive.woff2?url';
import { useDataStore } from './store';

type TabId = 'overview' | 'protagonist' | 'npc';

const store = useDataStore();
const data = computed(() => store.data);
const scene = computed(() => data.value.当前场景);
const activeTab = useLocalStorage<TabId>('human-revision:status_tab', 'overview');
const selectedNpcName = useLocalStorage('human-revision:selected_npc', '');
const announcer = ref('');
const themeId = ref<'archive'>('archive');

const THEME_STORAGE_KEY = 'zaohua-world-config-theme';
const themeFontStyleId = 'human-revision-status-fonts';
let injectedThemeFontStyle: HTMLStyleElement | null = null;

function autosizeTextarea(element: HTMLTextAreaElement) {
  element.style.height = 'auto';
  const totalBorder = element.offsetHeight - element.clientHeight;
  element.style.height = `${Math.max(element.scrollHeight + totalBorder, 32)}px`;
}

const vAutoGrow: Directive<HTMLTextAreaElement> = {
  mounted: element => autosizeTextarea(element),
  updated: element => autosizeTextarea(element),
};

function autosizeAllRuleTextareas() {
  document
    .querySelectorAll<HTMLTextAreaElement>('.rule-editor textarea.rule-control')
    .forEach(element => autosizeTextarea(element));
}

const tabs = [
  { id: 'overview' as const, label: '总览', icon: LayoutDashboard },
  { id: 'protagonist' as const, label: '主角', icon: User },
  { id: 'npc' as const, label: 'NPC', icon: Users },
];

const protagonistEnabled = computed(() => data.value.世界配置.主角启用);
const npcEntries = computed(() => Object.entries(data.value.NPC序列 ?? {}));
const selectedNpc = computed(() => (selectedNpcName.value ? data.value.NPC序列[selectedNpcName.value] : undefined));
const ruleScopes = computed(() => {
  const rules = data.value.现实编辑器.生效规则;
  return [
    {
      key: '世界规则' as const,
      title: '世界规则',
      count: Object.keys(rules.世界规则 ?? {}).length,
      entries: null,
    },
    {
      key: '区域规则' as const,
      title: '区域规则',
      count: Object.values(rules.区域规则 ?? {}).reduce((sum, group) => sum + Object.keys(group).length, 0),
      entries: rules.区域规则 ?? {},
    },
    {
      key: '个人规则' as const,
      title: '个人规则',
      count: Object.values(rules.个人规则 ?? {}).reduce((sum, group) => sum + Object.keys(group).length, 0),
      entries: rules.个人规则 ?? {},
    },
  ];
});
const ruleScopeCount = computed(() => ruleScopes.value.reduce((sum, scope) => sum + scope.count, 0));
const privateStateEntries = computed(() => Object.entries(selectedNpc.value?.私密状态 ?? {}));
const protagonistPrivateEntries = computed(() => Object.entries(data.value.主角.私密状态 ?? {}));

const formatDate = computed(() => {
  const date = scene.value.日期;
  if (date.年 == null && date.月 == null && date.日 == null) {
    return '待生成';
  }
  return `${date.年 ?? '--'}年${date.月 ?? '--'}月${date.日 ?? '--'}日`;
});

const formatTime = computed(() => {
  const time = scene.value.时间;
  if (time.时 == null && time.分 == null) {
    return '待生成';
  }
  const hour = time.时 == null ? '--' : String(time.时).padStart(2, '0');
  const minute = time.分 == null ? '--' : String(time.分).padStart(2, '0');
  return `${hour}:${minute}`;
});

const formatLocation = computed(() => {
  const place = scene.value.地点;
  const parts = [place.一级区域, place.二级区域, place.三级地点];
  if (parts.every(value => !value || value === '待生成')) {
    return '待生成';
  }
  return parts.map(value => (value && value !== '待生成' ? value : '待生成')).join(' / ');
});

watch(
  npcEntries,
  entries => {
    if (!entries.length) {
      selectedNpcName.value = '';
      return;
    }
    if (!selectedNpcName.value || !data.value.NPC序列[selectedNpcName.value]) {
      selectedNpcName.value = entries[0][0];
    }
  },
  { immediate: true },
);

onMounted(() => {
  try {
    if (localStorage.getItem(THEME_STORAGE_KEY) !== 'archive') {
      themeId.value = 'archive';
    }
  } catch (error) {
    console.warn('[人间修订中·状态栏] 主题偏好读取失败，使用档案主题。', error);
  }

  if (document.getElementById(themeFontStyleId)) {
    return;
  }
  const style = document.createElement('style');
  style.id = themeFontStyleId;
  style.textContent = `
    @font-face {
      font-family: 'Theme Archive Preview';
      src: url("${themeArchiveFontUrl}") format('woff2');
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }
  `;
  document.head.appendChild(style);
  injectedThemeFontStyle = style;
  window.addEventListener('resize', autosizeAllRuleTextareas);
});

onUnmounted(() => {
  window.removeEventListener('resize', autosizeAllRuleTextareas);
  injectedThemeFontStyle?.remove();
  injectedThemeFontStyle = null;
});

type RuleGroupKey = '世界规则' | '区域规则' | '个人规则';
type RuleRowDraft = {
  对象: string;
  名称: string;
  内容: string;
  _ai?: boolean;
};
type RuleEditorState = Record<RuleGroupKey, RuleRowDraft[]>;
type RulePatchOp = { op: 'insert' | 'replace' | 'remove'; path: string; value?: string };
type AnnouncementItem = {
  编号: string;
  类型: '新增' | '修订' | '废止';
  名称: string;
  内容: string;
  范围: string;
};
type AiSystemDraft = {
  主题: string;
  说明: string;
  对象: string;
};

const ruleEditorOpen = ref(false);
const busy = ref(false);
const aiBusy = reactive<Record<RuleGroupKey, boolean>>({
  世界规则: false,
  区域规则: false,
  个人规则: false,
});
const aiHint = ref('');
const editorError = ref('');
const announcement = ref<{ items: AnnouncementItem[] } | null>(null);
const aiDraft = reactive<Record<RuleGroupKey, AiSystemDraft>>({
  世界规则: { 主题: '', 说明: '', 对象: '' },
  区域规则: { 主题: '', 说明: '', 对象: '' },
  个人规则: { 主题: '', 说明: '', 对象: '' },
});
let modSeq = 0;
const anyAiBusy = computed(() => Object.values(aiBusy).some(Boolean));

const editorGroups: Array<{
  key: RuleGroupKey;
  title: string;
  scoped: boolean;
  scopePlaceholder: string;
}> = [
  { key: '世界规则', title: '世界规则', scoped: false, scopePlaceholder: '' },
  { key: '区域规则', title: '区域规则', scoped: true, scopePlaceholder: '区域名（如：云溪城）' },
  { key: '个人规则', title: '个人规则', scoped: true, scopePlaceholder: '对象名（如：沈青梧）' },
];

const ruleEditorState = reactive<RuleEditorState>({
  世界规则: [],
  区域规则: [],
  个人规则: [],
});

function toScopedDrafts(record: Record<string, Record<string, string>>): RuleRowDraft[] {
  return Object.entries(record).flatMap(([target, rules]) =>
    Object.entries(rules).map(([名称, 内容]) => ({ 对象: target, 名称, 内容 })),
  );
}

function openRuleEditor() {
  editorError.value = '';
  aiDraft.世界规则 = { 主题: '', 说明: '', 对象: '' };
  aiDraft.区域规则 = { 主题: '', 说明: '', 对象: '' };
  aiDraft.个人规则 = { 主题: '', 说明: '', 对象: '' };
  const rules = data.value.现实编辑器.生效规则;
  ruleEditorState.世界规则 = Object.entries(rules.世界规则 ?? {}).map(([名称, 内容]) => ({ 对象: '', 名称, 内容 }));
  ruleEditorState.区域规则 = toScopedDrafts(rules.区域规则 ?? {});
  ruleEditorState.个人规则 = toScopedDrafts(rules.个人规则 ?? {});
  ruleEditorOpen.value = true;
}

function closeRuleEditor() {
  if (busy.value) {
    return;
  }
  ruleEditorOpen.value = false;
  editorError.value = '';
}

function addRuleRow(groupKey: RuleGroupKey) {
  ruleEditorState[groupKey].push({ 对象: '', 名称: '', 内容: '' });
}

function removeRuleRow(groupKey: RuleGroupKey, index: number) {
  ruleEditorState[groupKey].splice(index, 1);
}

function assertSafePathSegment(value: string, label: string, errors: string[]) {
  if (/[/~.]/.test(value)) {
    errors.push(`${label}「${value}」不能包含 / ~ . 字符`);
  }
}

function buildRuleDiff(): { error?: string; ops: RulePatchOp[]; items: AnnouncementItem[] } {
  const rules = data.value.现实编辑器.生效规则;
  const current = {
    世界规则: rules.世界规则 ?? {},
    区域规则: rules.区域规则 ?? {},
    个人规则: rules.个人规则 ?? {},
  };
  const ops: RulePatchOp[] = [];
  const items: AnnouncementItem[] = [];
  const errors: string[] = [];

  const worldNames = new Set<string>();
  for (const row of ruleEditorState.世界规则) {
    const name = row.名称.trim();
    if (!name) {
      errors.push('世界规则存在未命名的规则');
      continue;
    }
    assertSafePathSegment(name, '规则名', errors);
    if (worldNames.has(name)) {
      errors.push(`世界规则规则名重复：${name}`);
      continue;
    }
    worldNames.add(name);
    const content = row.内容.trim() || '已生效';
    const path = `/现实编辑器/生效规则/世界规则/${name}`;
    if (current.世界规则[name] === undefined) {
      ops.push({ op: 'insert', path, value: content });
      items.push({ 编号: '', 类型: '新增', 名称: name, 内容: content, 范围: '整个世界' });
    } else if (current.世界规则[name] !== content) {
      ops.push({ op: 'replace', path, value: content });
      items.push({ 编号: '', 类型: '修订', 名称: name, 内容: content, 范围: '整个世界' });
    }
  }
  for (const name of Object.keys(current.世界规则)) {
    if (!worldNames.has(name)) {
      ops.push({ op: 'remove', path: `/现实编辑器/生效规则/世界规则/${name}` });
      items.push({ 编号: '', 类型: '废止', 名称: name, 内容: '', 范围: '整个世界' });
    }
  }

  const handleScoped = (groupKey: '区域规则' | '个人规则') => {
    const scopeLabel = groupKey === '区域规则' ? '区域名' : '对象名';
    const seenKeys = new Set<string>();
    for (const row of ruleEditorState[groupKey]) {
      const target = row.对象?.trim() ?? '';
      const name = row.名称.trim();
      if (!target) {
        errors.push(`${groupKey}存在未填写${scopeLabel}的行`);
        continue;
      }
      if (!name) {
        errors.push(`${groupKey}「${target}」存在未命名的规则`);
        continue;
      }
      assertSafePathSegment(target, scopeLabel, errors);
      assertSafePathSegment(name, '规则名', errors);
      const mapKey = `${target}\u0000${name}`;
      if (seenKeys.has(mapKey)) {
        errors.push(`${groupKey}重复：${target} / ${name}`);
        continue;
      }
      seenKeys.add(mapKey);
      const content = row.内容.trim() || '已生效';
      const path = `/现实编辑器/生效规则/${groupKey}/${target}/${name}`;
      const scopeText = groupKey === '区域规则' ? `指定区域（${target}）` : `指定对象（${target}）`;
      const oldContent = current[groupKey][target]?.[name];
      if (oldContent === undefined) {
        ops.push({ op: 'insert', path, value: content });
        items.push({ 编号: '', 类型: '新增', 名称: name, 内容: content, 范围: scopeText });
      } else if (oldContent !== content) {
        ops.push({ op: 'replace', path, value: content });
        items.push({ 编号: '', 类型: '修订', 名称: name, 内容: content, 范围: scopeText });
      }
    }
    for (const [target, ruleMap] of Object.entries(current[groupKey] ?? {})) {
      for (const name of Object.keys(ruleMap)) {
        if (!seenKeys.has(`${target}\u0000${name}`)) {
          ops.push({ op: 'remove', path: `/现实编辑器/生效规则/${groupKey}/${target}/${name}` });
          items.push({
            编号: '',
            类型: '废止',
            名称: name,
            内容: '',
            范围: groupKey === '区域规则' ? `指定区域（${target}）` : `指定对象（${target}）`,
          });
        }
      }
    }
  };

  handleScoped('区域规则');
  handleScoped('个人规则');

  if (errors.length) {
    return { error: errors.join('；') };
  }
  return { ops, items };
}

async function confirmRules() {
  if (busy.value) {
    return;
  }
  const { error, ops, items } = buildRuleDiff();
  if (error) {
    editorError.value = error;
    return;
  }
  if (!items.length) {
    editorError.value = '没有检测到任何规则变更';
    return;
  }

  busy.value = true;
  editorError.value = '';
  try {
    const patchMessage = `<UpdateVariable>\n<Analysis>现实编辑器持有者签发规则修订。</Analysis>\n<JSONPatch>\n${JSON.stringify(ops, null, 2)}\n</JSONPatch>\n</UpdateVariable>`;
    const oldData = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
    const newData = await Mvu.parseMessage(patchMessage, oldData);
    await Mvu.replaceMvuData(newData, { type: 'message', message_id: getCurrentMessageId() });
    data.value.现实编辑器.生效规则 = newData.stat_data.现实编辑器.生效规则;

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    announcement.value = {
      items: items.map(item => ({
        ...item,
        编号: `MOD-${stamp}-${String(++modSeq).padStart(3, '0')}`,
      })),
    };
    ruleEditorOpen.value = false;
    window.setTimeout(() => {
      if (announcement.value) {
        announcement.value = null;
      }
    }, 12000);
  } catch (error) {
    console.error('[人间修订中·状态栏] 规则修订失败', error);
    toastr.error(error instanceof Error ? error.message : String(error), '现实编辑器报错');
  } finally {
    busy.value = false;
  }
}

function parseJsonLoose(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('AI 返回的内容不是可解析的 JSON');
  }
}

function extractRecentStoryBodies(maxLayers = 3): string[] {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 0) {
    return [];
  }
  const assistantMessages = getChatMessages(`0-${lastMessageId}`, {
    role: 'assistant',
    hide_state: 'unhidden',
  });
  const bodies: string[] = [];
  for (let index = assistantMessages.length - 1; index >= 0 && bodies.length < maxLayers; index -= 1) {
    const match = assistantMessages[index].message.match(/<content>([\s\S]*?)<\/content>/i);
    const body = match?.[1]?.trim();
    if (body) {
      bodies.push(body);
    }
  }
  return bodies.reverse();
}

function buildWorldviewPrompt(groupKey: RuleGroupKey, hint: string): string {
  const world = data.value.世界配置;
  const scene = data.value.当前场景;
  const recentBodies = extractRecentStoryBodies();
  const recentStory = recentBodies.length
    ? recentBodies.map((body, index) => `第 ${index + 1} 层：\n${body}`).join('\n\n')
    : '（暂无可用正文楼层）';
  const scopeRule =
    groupKey === '世界规则'
      ? '作用于整个世界与所有公共场景，不点名具体对象；体系应塑造整个社会的运转逻辑。'
      : groupKey === '区域规则'
        ? '必须绑定一个清晰空间边界（区域名，如建筑、房间、街区、场馆），只在该区域内生效；体系应解释该区域为何如此运转、与外界的关系、区域内人群的默认观念，以及离开区域后的边界。'
        : '必须绑定一个具体对象（角色或物品名），只影响该对象；体系应解释该对象的行为逻辑、自我认同、内在矛盾，以及外人视角下的怪异或正常。';
  const ruleCount = groupKey === '世界规则' ? '5~8 条' : '3~5 条';
  const scopeNameField = groupKey === '区域规则' ? '「区域名」' : groupKey === '个人规则' ? '「对象名」' : '';
  const formatJson =
    groupKey === '世界规则'
      ? '{"主题":"...","说明":"...","规则列表":[{"名称":"...","内容":"..."}]}'
      : groupKey === '区域规则'
        ? '{"主题":"...","说明":"...","区域名":"...","规则列表":[{"名称":"...","内容":"..."}]}'
        : '{"主题":"...","说明":"...","对象名":"...","规则列表":[{"名称":"...","内容":"..."}]}';
  return `你是「现实编辑器」的规则世界观起草引擎。玩家会通过状态栏把整套规则写入世界，并在下一轮剧情中立即显化。你的任务不是列点子，而是生成一套逻辑自洽、互相咬合、能产生叙事摩擦的规则体系。
【目标类别】${groupKey}
${hint ? `【玩家方向】${hint}` : '【玩家方向】未指定，请结合世界配置自由发挥一个有吸引力的主题。'}

【世界背景】
- 世界模板：${world.世界模板}
- 时代背景：${world.时代背景}
- 核心冲突：${world.核心冲突}
- 叙事文风：${world.叙事文风}
- 允许黑深残：${world.允许黑深残 ? '是' : '否'}
- 玩法模式.编辑器篡改：${world.玩法模式.编辑器篡改}
- 主角启用：${world.主角启用 ? '是' : '否'}
【当前场景】${scene.地点.一级区域}/${scene.地点.二级区域}/${scene.地点.三级地点}
【当前 MVU 变量快照】
${JSON.stringify(data.value, null, 2)}
【最近剧情正文（仅取 AI 回复中的 <content> 正文，按时间先后，最多三层）】
${recentStory}
【体系结构要求】
一套${groupKey}体系必须按以下层次组织（每层至少覆盖一项，可合并但不得缺失逻辑环节）：
1. 起因：打破常态的前提或危机（它制造什么问题）。
2. 机制：社会或对象如何回应（制度、行为机制、习惯）。
3. 伦理或常识配套：社会共识如何改写，让机制运转而不崩（区域：该地人群的默认观念；个人：该对象的自我说服或习惯）。
4. 张力与摩擦：保留某样人性常态或矛盾，制造持续冲突。
5. 日常纹理：一条恒定、可感知、被视为理所当然的规则，渗透进日常生活。
6. 收束：边界、例外或后果，让体系闭环。

【一致性自检】
为每条规则依次回答：制造什么问题 / 解决什么问题 / 需要什么配套 / 产生什么摩擦。答不上来或与其它规则矛盾的，必须调整或删除。规则之间允许有因果链，禁止孤立堆砌。

【作用域】
${scopeRule}

【尺度与文风】
- 内容尺度服从世界配置：${world.允许黑深残 ? '允许黑深残走向，可涉及压抑、残酷、制度性压迫，但不得无故堆砌' : '禁止苦大仇深'}；成人向内容按既有文风自然融入，不回避，但必须服务于体系逻辑与叙事。
- 规则内容必须具体、可显现：落到动作、对白、身体反应、环境细节或社会惯例，禁止抽象口号。
- 禁止出现“规则”“编辑器”“系统”等元叙述词；正文角色把它当作天然秩序。

【输出】
产出 ${ruleCount}${groupKey}，全部属于同一套体系；${scopeNameField ? `并在${scopeNameField}中填写统一作用范围。` : ''}每条「名称」2~12 字，「内容」一句话以内、明确无歧义。
只输出 JSON，不要输出任何解释、Markdown 代码块或额外文本。格式：${formatJson}`;
}

function suggestionSchema(groupKey: RuleGroupKey) {
  const rootProperties: Record<string, unknown> = {
    主题: { type: 'string' },
    说明: { type: 'string' },
  };
  const rootRequired = ['主题', '说明', '规则列表'];
  if (groupKey === '区域规则') {
    rootProperties.区域名 = { type: 'string' };
    rootRequired.push('区域名');
  } else if (groupKey === '个人规则') {
    rootProperties.对象名 = { type: 'string' };
    rootRequired.push('对象名');
  }
  return {
    name: `rule_suggestions_${groupKey}`,
    description: `为${groupKey}起草规则体系建议`,
    value: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ...rootProperties,
        规则列表: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              名称: { type: 'string' },
              内容: { type: 'string' },
            },
            required: ['名称', '内容'],
          },
        },
      },
      required: rootRequired,
    },
  };
}

function extractGenerateText(
  result: string | { content?: string; tool_calls?: Array<{ arguments?: string; function?: { arguments?: string } }> },
): string {
  if (typeof result === 'string') {
    return result;
  }
  const calls = result?.tool_calls;
  if (Array.isArray(calls) && calls.length) {
    const args = calls[0]?.function?.arguments ?? calls[0]?.arguments ?? '';
    if (args) {
      return args;
    }
  }
  return result?.content ?? '';
}

async function suggestRules(groupKey: RuleGroupKey) {
  if (aiBusy[groupKey]) {
    return;
  }
  aiBusy[groupKey] = true;
  editorError.value = '';
  try {
    const hint = aiHint.value.trim();
    const prompt = buildWorldviewPrompt(groupKey, hint);
    let parsed: {
      主题?: string;
      说明?: string;
      区域名?: string;
      对象名?: string;
      规则列表?: Array<{ 名称?: string; 内容?: string }>;
    } | null = null;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt += 1) {
      try {
        const result = await generateRaw({
          user_input: hint || '按以上要求起草规则建议。',
          should_silence: true,
          generation_id: `human-revision-rule-suggest-${groupKey}-${Date.now()}-${attempt}`,
          ordered_prompts: [{ role: 'system', content: prompt }, 'user_input'],
          ...(attempt === 0 ? { json_schema: suggestionSchema(groupKey) } : {}),
        });
        const text = extractGenerateText(result);
        if (!text.trim()) {
          lastError = new Error('AI 返回为空');
          continue;
        }
        try {
          parsed = parseJsonLoose(text) as {
            主题?: string;
            说明?: string;
            区域名?: string;
            对象名?: string;
            规则列表?: Array<{ 名称?: string; 内容?: string }>;
          };
        } catch (error) {
          lastError = error;
          console.warn(
            `[人间修订中·状态栏] 常识篡改第 ${attempt + 1} 次结果无法解析，将${attempt === 0 ? '改用普通格式重试' : '终止'}。`,
            text.slice(0, 200),
          );
        }
      } catch (error) {
        lastError = error;
        console.warn(
          `[人间修订中·状态栏] 常识篡改第 ${attempt + 1} 次请求失败${attempt === 0 ? '，将改用普通格式重试' : ''}。`,
          error,
        );
      }
    }
    if (!parsed) {
      throw new Error(lastError instanceof Error ? lastError.message : String(lastError));
    }
    const list = Array.isArray(parsed?.规则列表) ? parsed.规则列表 : [];
    if (!list.length) {
      throw new Error('AI 未返回可用的规则体系');
    }
    const scopeName =
      groupKey === '世界规则'
        ? ''
        : (parsed.区域名 ?? parsed.对象名 ?? '').trim() || ruleEditorState[groupKey][0]?.对象?.trim() || '';
    if (groupKey !== '世界规则' && !scopeName) {
      throw new Error(groupKey === '区域规则' ? 'AI 未返回区域名' : 'AI 未返回对象名');
    }
    aiDraft[groupKey] = {
      主题: (parsed.主题 ?? '').trim() || `${groupKey}体系`,
      说明: (parsed.说明 ?? '').trim(),
      对象: scopeName,
    };
    let added = 0;
    for (const item of list) {
      const name = (item.名称 ?? '').trim();
      const content = (item.内容 ?? '').trim();
      if (!name || !content) {
        continue;
      }
      if (!ruleEditorOpen.value) {
        return;
      }
      if (groupKey === '世界规则') {
        ruleEditorState.世界规则.push({ 对象: '', 名称: name, 内容: content, _ai: true });
      } else {
        ruleEditorState[groupKey].push({ 对象: scopeName, 名称: name, 内容: content, _ai: true });
      }
      added += 1;
    }
    if (!added) {
      throw new Error('AI 返回的规则缺少名称或内容');
    }
    toastr.success(`已生成 ${added} 条${groupKey}草稿，请核对后确认`, '现实编辑器');
  } catch (error) {
    console.error('[人间修订中·状态栏] AI 起草失败', error);
    const message = error instanceof Error ? error.message : String(error);
    editorError.value = `起草失败：${message}`;
    toastr.error(message, '起草失败');
  } finally {
    aiBusy[groupKey] = false;
  }
}

function setTab(tab: TabId) {
  activeTab.value = tab;
  const found = tabs.find(item => item.id === tab);
  announcer.value = found ? `已切换到${found.label}页签` : '';
}

function onTabKeydown(event: KeyboardEvent) {
  const target = event.currentTarget as HTMLButtonElement;
  const id = target.id.replace('tab-', '') as TabId;
  const currentIndex = tabs.findIndex(tab => tab.id === id);
  if (currentIndex < 0) {
    return;
  }

  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }
  event.preventDefault();
  setTab(tabs[nextIndex].id);
  requestAnimationFrame(() => document.getElementById(`tab-${tabs[nextIndex].id}`)?.focus());
}
</script>
