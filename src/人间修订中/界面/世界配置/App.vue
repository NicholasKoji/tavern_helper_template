<!-- eslint-disable better-tailwindcss/no-unknown-classes -->
<template>
  <div class="world-forge" :data-theme="activeTheme">
    <header class="masthead">
      <div class="masthead-copy">
        <p class="registry-no">{{ activeThemeMeta.registry }}</p>
        <h1>人间修订中</h1>
        <p class="masthead-subtitle">旧章沉入昨夜，新律化作寻常。</p>
      </div>
      <div class="masthead-seal" aria-hidden="true">
        <component :is="activeThemeMeta.icon" :size="24" stroke-width="1.7" />
        <span>{{ activeThemeMeta.seal }}</span>
      </div>
    </header>

    <section class="theme-dock" aria-labelledby="theme-dock-title">
      <div class="theme-dock-heading">
        <span id="theme-dock-title">界面主题</span>
        <strong>{{ themeOptions.length }} 款</strong>
      </div>
      <div class="theme-options" role="radiogroup" aria-label="选择世界配置界面主题">
        <button
          v-for="theme in themeOptions"
          :key="theme.id"
          class="theme-option"
          :class="{ active: theme.id === activeTheme }"
          :data-theme-option="theme.id"
          type="button"
          role="radio"
          :aria-checked="theme.id === activeTheme"
          :aria-label="`${theme.name}：${theme.caption}`"
          @click="setTheme(theme.id)"
        >
          <span class="theme-glyph" aria-hidden="true">
            <component :is="theme.icon" :size="17" stroke-width="1.8" />
          </span>
          <span class="theme-option-copy">
            <strong>{{ theme.name }}</strong>
            <small>{{ theme.caption }}</small>
          </span>
          <Check v-if="theme.id === activeTheme" class="theme-check" :size="15" stroke-width="2.5" />
        </button>
      </div>
    </section>

    <nav class="chapter-strip" aria-label="世界配置章节">
      <button
        v-for="(step, index) in steps"
        :key="step.key"
        class="chapter-tab"
        :class="{ active: index === currentStep, complete: index < currentStep || index < maxVisitedStep }"
        :disabled="index > maxVisitedStep"
        :aria-current="index === currentStep ? 'step' : undefined"
        type="button"
        @click="goToStep(index)"
      >
        <span class="chapter-icon" aria-hidden="true">
          <Check v-if="index < currentStep || index < maxVisitedStep" :size="15" stroke-width="2.4" />
          <component :is="step.icon" v-else :size="16" stroke-width="1.9" />
        </span>
        <span class="chapter-copy">
          <small>{{ step.kicker }}</small>
          <strong>{{ step.title }}</strong>
        </span>
      </button>
    </nav>

    <main class="dossier">
      <div class="paper-notch" aria-hidden="true" />
      <header class="chapter-heading">
        <div>
          <p>
            {{ steps[currentStep].kicker }} · {{ activeThemeMeta.chapterLabel }}
            {{ String(currentStep + 1).padStart(2, '0') }}
          </p>
          <h2>{{ steps[currentStep].title }}</h2>
        </div>
        <span class="chapter-folio"
          >{{ String(currentStep + 1).padStart(2, '0') }} / {{ String(stepCount).padStart(2, '0') }}</span
        >
      </header>

      <div :key="currentStep" class="chapter-body" :class="{ 'step-back': slideDir === 'back' }">
        <template v-if="currentStep === 0">
          <p class="chapter-lead">先给世界定下骨架。编辑器会补全留白，但你写下的细节拥有最高优先级。</p>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><BookOpen :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.world }} 01</span>
                <h3>世界骨架</h3>
              </div>
            </div>
            <div class="form-grid two-col">
              <label class="field">
                <span class="field-label">世界模板</span>
                <span class="select-wrap">
                  <select v-model="form.世界模板" class="control" @change="onTemplateChange">
                    <option v-for="preset in templateNames" :key="preset" :value="preset">{{ preset }}</option>
                  </select>
                </span>
              </label>
              <label class="field">
                <span class="field-label">时代背景</span>
                <span class="select-wrap">
                  <select v-model="form.时代背景" class="control">
                    <option v-for="era in eraOptions" :key="era" :value="era">{{ era }}</option>
                  </select>
                </span>
              </label>
            </div>
            <label class="field">
              <span class="field-label">世界观描述</span>
              <textarea v-model="form.世界观描述" class="control" rows="3" placeholder="简单描述你想进入的世界" />
            </label>
          </section>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><Landmark :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.world }} 02</span>
                <h3>文明纹理</h3>
              </div>
            </div>
            <div class="form-grid two-col">
              <label class="field">
                <span class="field-label"><Landmark :size="14" />文明与势力</span>
                <textarea v-model="form.文明与势力" class="control" rows="3" placeholder="有哪些组织、阵营或文明" />
              </label>
              <label class="field">
                <span class="field-label"><Map :size="14" />地理与气候</span>
                <textarea v-model="form.地理与气候" class="control" rows="3" placeholder="地点、地貌、季节与气候" />
              </label>
              <label class="field">
                <span class="field-label"><History :size="14" />历史与事件</span>
                <textarea v-model="form.历史与事件" class="control" rows="3" placeholder="塑造当下的历史事件" />
              </label>
              <label class="field">
                <span class="field-label"><Swords :size="14" />核心冲突</span>
                <textarea v-model="form.核心冲突" class="control" rows="3" placeholder="推动故事前进的矛盾" />
              </label>
            </div>
          </section>
        </template>

        <template v-else-if="currentStep === 1">
          <p class="chapter-lead">先确定叙述镜头与文字质感。人物是否进入故事，将在下一章由主角档案开关决定。</p>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><Feather :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.narrative }} 01</span>
                <h3>叙事定位</h3>
              </div>
            </div>
            <div class="form-grid two-col">
              <label class="field">
                <span class="field-label">叙事视角</span>
                <span class="select-wrap">
                  <select v-model="form.视角" class="control">
                    <option v-for="option in povOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </span>
              </label>
              <label class="field">
                <span class="field-label">叙事文风</span>
                <span class="select-wrap">
                  <select v-model="form.文风" class="control">
                    <option v-for="option in styleOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </span>
              </label>
            </div>
            <div class="narrative-brief">
              <Feather :size="18" aria-hidden="true" />
              <p>{{ povSummary }}</p>
            </div>
          </section>
        </template>

        <template v-else-if="currentStep === 2">
          <p class="chapter-lead">登记你的入世身份与关键关系。姓名继续使用当前玩家名，无需重复填写。</p>

          <section class="dossier-section" :class="{ 'protagonist-disabled': !form.主角启用 }">
            <div class="section-heading section-heading-actions protagonist-heading">
              <span class="section-icon"><UserRound :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.people }} 01</span>
                <h3>主角档案</h3>
              </div>
              <label class="record-switch">
                <input v-model="form.主角启用" type="checkbox" role="switch" aria-label="启用主角档案" />
              </label>
            </div>
            <fieldset class="protagonist-fields" :disabled="!form.主角启用">
              <div class="form-grid two-col">
                <label class="field">
                  <span class="field-label">身份职业</span>
                  <input v-model="form.主角身份" class="control" type="text" placeholder="例如：调查记者、大学生" />
                </label>
                <label class="field">
                  <span class="field-label">与编辑器关系</span>
                  <span class="select-wrap">
                    <select v-model="form.与编辑器关系" class="control">
                      <option v-for="relation in relationOptions" :key="relation" :value="relation">
                        {{ relation }}
                      </option>
                    </select>
                  </span>
                </label>
                <label class="field">
                  <span class="field-label">性格关键词</span>
                  <input v-model="form.主角性格" class="control" type="text" placeholder="例如：嘴硬、敏锐、怕麻烦" />
                </label>
                <label class="field">
                  <span class="field-label">当前目标</span>
                  <input v-model="form.主角目标" class="control" type="text" placeholder="此刻最想完成什么" />
                </label>
              </div>
              <label class="field">
                <span class="field-label">补充设定 <em>选填</em></span>
                <textarea
                  v-model="form.主角补充设定"
                  class="control"
                  rows="3"
                  placeholder="习惯、秘密、偏好或其他需要被记住的细节"
                />
              </label>
            </fieldset>
          </section>

          <section class="dossier-section">
            <div class="section-heading section-heading-actions">
              <span class="section-icon"><UsersRound :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.people }} 02</span>
                <h3>主要角色</h3>
              </div>
              <button class="text-action" type="button" @click="addCharacter"><Plus :size="16" />登记角色</button>
            </div>

            <div v-if="form.角色列表.length === 0" class="empty-record">
              <UsersRound :size="28" stroke-width="1.5" aria-hidden="true" />
              <div>
                <strong>尚未登记主要角色</strong>
                <p>可以留空；第一幕严格按登记名单生成，名单为空时采用纯环境开场。</p>
              </div>
              <button type="button" @click="addCharacter"><Plus :size="16" />添加第一位角色</button>
            </div>

            <article v-for="(character, index) in form.角色列表" :key="index" class="character-record">
              <header>
                <div>
                  <span>{{ activeThemeMeta.characterFile }}</span
                  ><strong>角色档案 {{ String(index + 1).padStart(2, '0') }}</strong>
                </div>
                <button
                  class="icon-button danger"
                  type="button"
                  :aria-label="`删除角色 ${index + 1}`"
                  @click="removeCharacter(index)"
                >
                  <Trash2 :size="17" />
                </button>
              </header>
              <div class="form-grid compact-grid">
                <label class="field"
                  ><span class="field-label">姓名</span
                  ><input v-model="character.姓名" class="control" type="text" placeholder="姓名"
                /></label>
                <label class="field"
                  ><span class="field-label">性别</span
                  ><input v-model="character.性别" class="control" type="text" placeholder="性别"
                /></label>
                <label class="field"
                  ><span class="field-label">年龄</span
                  ><input v-model="character.年龄" class="control" type="text" placeholder="年龄"
                /></label>
              </div>
              <div class="form-grid two-col">
                <label class="field"
                  ><span class="field-label">身份</span
                  ><input v-model="character.身份" class="control" type="text" placeholder="职业或身份"
                /></label>
                <label class="field"
                  ><span class="field-label">关系定位</span
                  ><input
                    v-model="character.关系定位"
                    class="control"
                    type="text"
                    placeholder="与主角、其他角色或世界的关系"
                /></label>
              </div>
              <label class="field"
                ><span class="field-label">外貌特征</span
                ><input v-model="character.外貌特征" class="control" type="text" placeholder="身形、长相、穿着与辨识点"
              /></label>
              <label class="field"
                ><span class="field-label">性格与说话方式</span
                ><input v-model="character.性格" class="control" type="text" placeholder="性格、口癖与相处方式"
              /></label>
            </article>

            <label v-if="needsFocalCharacter" class="field focal-character-field">
              <span class="field-label">视角角色</span>
              <span class="select-wrap">
                <select v-model="form.视角角色" class="control">
                  <option value="" disabled>请选择一名已登记主要角色</option>
                  <option v-for="character in namedCharacters" :key="character.姓名" :value="character.姓名.trim()">
                    {{ character.姓名.trim() }}
                  </option>
                </select>
              </span>
            </label>
          </section>
        </template>

        <template v-else-if="currentStep === 3">
          <p class="chapter-lead">决定现实编辑器能做什么、谁会被规则影响，以及这个世界应当保持怎样的温度。</p>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><Scale :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.rules }} 01</span>
                <h3>权限边界</h3>
              </div>
            </div>
            <div class="form-grid two-col">
              <label class="field" :class="{ 'field-disabled': !form.主角启用 }"
                ><span class="field-label">主角知道编辑器存在</span
                ><span class="select-wrap"
                  ><select v-model="form.玩法模式.认知" class="control" :disabled="!form.主角启用">
                    <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
                  </select></span
                ></label
              >
              <label class="field" :class="{ 'field-disabled': !form.主角启用 }"
                ><span class="field-label">主角可以使用编辑器</span
                ><span class="select-wrap"
                  ><select v-model="form.玩法模式.使用" class="control" :disabled="!form.主角启用">
                    <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
                  </select></span
                ></label
              >
              <label class="field" :class="{ 'field-disabled': !form.主角启用 }"
                ><span class="field-label">主角受规则制约</span
                ><span class="select-wrap"
                  ><select v-model="form.玩法模式.受控" class="control" :disabled="!form.主角启用">
                    <option v-for="option in yesNoOptions" :key="option" :value="option">{{ option }}</option>
                  </select></span
                ></label
              >
              <label class="field"
                ><span class="field-label">编辑器私自篡改规则</span
                ><span class="select-wrap"
                  ><select v-model="form.玩法模式.编辑器篡改" class="control">
                    <option v-for="option in tamperOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select></span
                ></label
              >
            </div>
          </section>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><Gauge :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.rules }} 02</span>
                <h3>世界基调</h3>
              </div>
            </div>
            <div class="tone-list">
              <label class="tone-row"
                ><span><strong>色情浓度</strong><small>亲密描写的直接程度</small></span
                ><input v-model.number="form.基调.色情浓度" type="range" min="0" max="100" step="5" /><output>{{
                  form.基调.色情浓度
                }}</output></label
              >
              <label class="tone-row"
                ><span><strong>搞笑程度</strong><small>荒诞与幽默出现的频率</small></span
                ><input v-model.number="form.基调.搞笑程度" type="range" min="0" max="100" step="5" /><output>{{
                  form.基调.搞笑程度
                }}</output></label
              >
              <label class="tone-row"
                ><span><strong>轻松程度</strong><small>整体情绪的明亮程度</small></span
                ><input v-model.number="form.基调.轻松程度" type="range" min="0" max="100" step="5" /><output>{{
                  form.基调.轻松程度
                }}</output></label
              >
            </div>
            <label class="switch-row"
              ><span><strong>允许黑深残走向</strong><small>允许剧情进入更压抑、残酷的分支</small></span
              ><input v-model="form.允许黑深残" type="checkbox" role="switch"
            /></label>
          </section>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><ScrollText :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.rules }} 03</span>
                <h3>生效规则</h3>
              </div>
            </div>
            <div class="rule-tabs" role="tablist" aria-label="规则类型">
              <button
                v-for="group in ruleGroups"
                :key="group.key"
                class="rule-tab"
                :class="{ active: activeRuleGroup === group.key }"
                type="button"
                role="tab"
                :aria-selected="activeRuleGroup === group.key"
                @click="activeRuleGroup = group.key"
              >
                {{ group.title }}<span>{{ rules[group.key].length }}</span>
              </button>
            </div>
            <div v-if="rules[activeRuleGroup].length === 0" class="rule-empty">
              <WandSparkles :size="22" />
              <p>这一类还没有规则，留空即不设限。</p>
            </div>
            <div v-for="(rule, index) in rules[activeRuleGroup]" :key="index" class="rule-record">
              <input v-model="rule.名称" class="control" type="text" placeholder="规则名称" />
              <input
                v-model="rule.内容"
                class="control"
                type="text"
                :placeholder="groupInfo(activeRuleGroup).placeholder"
              />
              <button
                class="icon-button danger"
                type="button"
                :aria-label="`删除规则 ${index + 1}`"
                @click="removeRule(activeRuleGroup, index)"
              >
                <Trash2 :size="17" />
              </button>
            </div>
            <button class="add-record" type="button" @click="addRule(activeRuleGroup)">
              <Plus :size="17" />添加{{ groupInfo(activeRuleGroup).title }}
            </button>
          </section>
        </template>

        <template v-else>
          <p class="chapter-lead">补上第一幕的叙事方向，然后核对整份卷宗。签发后，编辑器将据此生成新的聊天楼层。</p>

          <section class="dossier-section">
            <div class="section-heading">
              <span class="section-icon"><Feather :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.issue }} 01</span>
                <h3>叙事开局</h3>
              </div>
            </div>
            <div class="form-grid two-col">
              <label class="field"
                ><span class="field-label">开局场景</span
                ><span class="select-wrap"
                  ><select v-model="form.剧情方向.开局场景" class="control">
                    <option v-for="scene in sceneOptions" :key="scene" :value="scene">{{ scene }}</option>
                  </select></span
                ></label
              >
              <label class="field"
                ><span class="field-label">剧情节奏</span
                ><span class="select-wrap"
                  ><select v-model="form.剧情方向.节奏" class="control">
                    <option v-for="rhythm in rhythmOptions" :key="rhythm" :value="rhythm">{{ rhythm }}</option>
                  </select></span
                ></label
              >
            </div>
            <label class="field"
              ><span class="field-label">主线目标</span
              ><input
                v-model="form.剧情方向.主线目标"
                class="control"
                type="text"
                placeholder="第一幕之后，故事要往哪里走"
            /></label>
            <label class="switch-row">
              <span
                ><strong>暧昧开局</strong
                ><small>{{
                  openingCastCount < 2 ? '开场人物少于两人，当前不可用' : '让开场人物在第一幕有更亲密的互动'
                }}</small></span
              ><input v-model="form.剧情方向.暧昧开局" type="checkbox" role="switch" :disabled="openingCastCount < 2"
            /></label>
          </section>

          <section class="dossier-section issue-section">
            <div class="section-heading">
              <span class="section-icon"><Stamp :size="19" /></span>
              <div>
                <span>{{ activeThemeMeta.sectionLabels.issue }} 02</span>
                <h3>世界回执</h3>
              </div>
            </div>
            <div class="receipt-group">
              <header>
                <div><BookOpen :size="18" /><strong>世界骨架</strong></div>
                <button type="button" @click="goToStep(0)"><Pencil :size="14" />修改</button>
              </header>
              <dl>
                <div>
                  <dt>世界模板</dt>
                  <dd>{{ receipt.世界模板 }}</dd>
                </div>
                <div>
                  <dt>核心冲突</dt>
                  <dd>{{ form.核心冲突 }}</dd>
                </div>
              </dl>
            </div>
            <div class="receipt-group">
              <header>
                <div><Feather :size="18" /><strong>叙事定位</strong></div>
                <button type="button" @click="goToStep(1)"><Pencil :size="14" />修改</button>
              </header>
              <dl>
                <div>
                  <dt>叙事</dt>
                  <dd>{{ receipt.叙事 }}</dd>
                </div>
                <div>
                  <dt>视角角色</dt>
                  <dd>{{ receipt.视角角色 }}</dd>
                </div>
              </dl>
            </div>
            <div class="receipt-group">
              <header>
                <div><UsersRound :size="18" /><strong>人物档案</strong></div>
                <button type="button" @click="goToStep(2)"><Pencil :size="14" />修改</button>
              </header>
              <dl>
                <div>
                  <dt>主角</dt>
                  <dd>{{ receipt.主角 }}</dd>
                </div>
                <div>
                  <dt>主要角色</dt>
                  <dd>{{ receipt.主要角色 }}</dd>
                </div>
                <div>
                  <dt>第一幕人物</dt>
                  <dd>{{ receipt.开场人物 }}</dd>
                </div>
              </dl>
            </div>
            <div class="receipt-group">
              <header>
                <div><Scale :size="18" /><strong>法则与基调</strong></div>
                <button type="button" @click="goToStep(3)"><Pencil :size="14" />修改</button>
              </header>
              <dl>
                <div>
                  <dt>玩法模式</dt>
                  <dd>{{ receipt.玩法模式 }}</dd>
                </div>
                <div>
                  <dt>基调</dt>
                  <dd>{{ receipt.基调 }}</dd>
                </div>
                <div>
                  <dt>生效规则</dt>
                  <dd>{{ receipt.生效规则 }}</dd>
                </div>
              </dl>
            </div>
            <div class="receipt-group">
              <header>
                <div><Stamp :size="18" /><strong>开局签发</strong></div>
                <span class="verified"><Check :size="13" />已核</span>
              </header>
              <dl>
                <div>
                  <dt>剧情方向</dt>
                  <dd>{{ receipt.剧情方向 }}</dd>
                </div>
                <div>
                  <dt>额外人物</dt>
                  <dd>禁止加入第一幕</dd>
                </div>
              </dl>
            </div>
            <div class="approval-mark" aria-hidden="true">
              <component :is="activeThemeMeta.icon" :size="28" /><span>{{ activeThemeMeta.approval }}</span
              ><small>{{ activeThemeMeta.approvalCaption }}</small>
            </div>
          </section>
        </template>
      </div>
    </main>

    <nav class="action-bar" aria-label="配置操作">
      <button v-if="currentStep > 0" class="button secondary" type="button" @click="goPrev">
        <ChevronLeft :size="18" />上一步
      </button>
      <span v-else class="action-spacer" aria-hidden="true" />
      <button v-if="!isLastStep" class="button primary" type="button" @click="goNext">
        下一步：{{ steps[currentStep + 1].title }}<ChevronRight :size="18" />
      </button>
      <button v-else class="button issue-button" type="button" :disabled="starting" @click="startGame">
        <Sparkles :class="{ spinning: starting }" :size="19" />{{ starting ? '正在生成第一幕…' : '开始游玩' }}
      </button>
    </nav>

    <p
      v-if="status"
      class="status-message"
      :class="{ error: status.includes('失败'), success: status.includes('已生成') }"
      role="status"
      aria-live="polite"
    >
      <CircleAlert v-if="status.includes('失败')" :size="16" /><Check
        v-else-if="status.includes('已生成')"
        :size="16"
      /><Sparkles v-else :size="16" />{{ status }}
    </p>
    <p class="legal-note">{{ activeThemeMeta.footer }} · 本次签发仅影响即将生成的世界</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudSun,
  Cpu,
  Feather,
  Gauge,
  History,
  Landmark,
  Map,
  Pencil,
  Plus,
  Scale,
  ScrollText,
  Sparkles,
  Stamp,
  Swords,
  Trash2,
  UserRound,
  UsersRound,
  WandSparkles,
} from '@lucide/vue';
import { storeToRefs } from 'pinia';
import themeArchiveFontUrl from './fonts/theme-archive.woff2?url';
import themeAstrolabeFontUrl from './fonts/theme-astrolabe.woff2?url';
import themeNeonFontUrl from './fonts/theme-neon.woff2?url';
import themeTerminalFontUrl from './fonts/theme-terminal.woff2?url';
import { useDataStore } from './store';

const themeFontStyleId = 'human-revision-theme-preview-fonts';
let injectedThemeFontStyle: HTMLStyleElement | null = null;

onMounted(() => {
  if (document.getElementById(themeFontStyleId)) return;

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
    @font-face {
      font-family: 'Theme Astrolabe Preview';
      src: url("${themeAstrolabeFontUrl}") format('woff2');
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: 'Theme Terminal Preview';
      src: url("${themeTerminalFontUrl}") format('woff2');
      font-display: swap;
      font-style: normal;
      font-weight: 400;
    }
    @font-face {
      font-family: 'Theme Neon Preview';
      src: url("${themeNeonFontUrl}") format('woff2');
      font-display: swap;
      font-style: oblique;
      font-weight: 400;
    }
  `;
  document.head.appendChild(style);
  injectedThemeFontStyle = style;
});

onUnmounted(() => {
  injectedThemeFontStyle?.remove();
  injectedThemeFontStyle = null;
});

type RuleEntry = { 名称: string; 内容: string };
type CharacterEntry = {
  姓名: string;
  性别: string;
  年龄: string;
  身份: string;
  关系定位: string;
  外貌特征: string;
  性格: string;
};
type RuleGroup = { key: string; title: string; placeholder: string };

const themeOptions = [
  {
    id: 'archive',
    name: '官署卷宗',
    caption: '仿古官署卷宗风格，以暖纸、黛墨和朱砂红为主色。',
    registry: 'WORLD REGISTRY · NO. 0047',
    seal: '受理',
    chapterLabel: 'CHAPTER',
    characterFile: 'CHARACTER FILE',
    sectionLabels: { world: '卷宗', narrative: '叙事卷', people: '人事卷', rules: '敕令', issue: '签发' },
    approval: '准予签发',
    approvalCaption: 'REALITY EDITOR',
    footer: 'WORLD ARCHIVE',
    icon: Stamp,
  },
  {
    id: 'astrolabe',
    name: '命盘推演',
    caption: '东方星盘仪轨风格，以墨蓝、铜金和米白微光为主色。',
    registry: 'FATE ORBIT · CALC. 0047',
    seal: '推演',
    chapterLabel: 'ORBIT',
    characterFile: 'FATE SUBJECT',
    sectionLabels: { world: '天盘', narrative: '镜盘', people: '人盘', rules: '律盘', issue: '定盘' },
    approval: '推演成局',
    approvalCaption: 'FATE ENGINE',
    footer: 'ORBITAL DIVINATION',
    icon: Sparkles,
  },
  {
    id: 'terminal',
    name: '管理终端',
    caption: '冷峻工业控制台风格，以骨白、碳黑和警示红为主色。',
    registry: 'REALITY CONTROL · NODE. 0047',
    seal: '在线',
    chapterLabel: 'STAGE',
    characterFile: 'SUBJECT RECORD',
    sectionLabels: { world: 'WORLD', narrative: 'CAMERA', people: 'IDENTITY', rules: 'POLICY', issue: 'EXECUTE' },
    approval: '参数就绪',
    approvalCaption: 'REALITY NODE',
    footer: 'CONTROL PLANE',
    icon: Gauge,
  },
  {
    id: 'neon',
    name: '霓虹夜城',
    caption: '赛博朋克夜城风格，以深紫黑、电光青和霓虹粉为主色。',
    registry: 'NIGHT CITY // LINK 0047',
    seal: '接入',
    chapterLabel: 'SECTOR',
    characterFile: 'IDENTITY SHARD',
    sectionLabels: { world: 'ZONE', narrative: 'LENS', people: 'AVATAR', rules: 'PROTOCOL', issue: 'DEPLOY' },
    approval: '链路已同步',
    approvalCaption: 'NEON GRID',
    footer: 'NIGHT CITY PROTOCOL',
    icon: Cpu,
  },
] as const;

type ThemeId = (typeof themeOptions)[number]['id'];

const THEME_STORAGE_KEY = 'zaohua-world-config-theme';

function readSavedTheme(): ThemeId {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (themeOptions.some(theme => theme.id === savedTheme)) {
      return savedTheme as ThemeId;
    }
  } catch (error) {
    console.warn('[人间修订中·世界配置] 主题偏好读取失败，将使用默认主题。', error);
  }
  return 'archive';
}

const activeTheme = ref<ThemeId>(readSavedTheme());
const activeThemeMeta = computed(() => themeOptions.find(theme => theme.id === activeTheme.value) ?? themeOptions[0]);

function setTheme(theme: ThemeId) {
  activeTheme.value = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('[人间修订中·世界配置] 主题偏好保存失败，本次切换仍然有效。', error);
  }
}

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

const ruleGroups: RuleGroup[] = [
  { key: '常识规则', title: '常识规则', placeholder: '例如：所有人听到“茄子”都要单脚跳一下' },
  { key: '行为习惯', title: '行为习惯', placeholder: '例如：开口前必须先说“打扰了”' },
  { key: '物理规则', title: '物理规则', placeholder: '例如：午夜十二点后重力减弱 50%' },
  { key: '超自然规则', title: '超自然规则', placeholder: '例如：灵气浓度每三年翻一倍' },
];

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
  主角启用: true,
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
  视角角色: '',
});

const steps = [
  { key: 'world', kicker: '第一章', title: '世界底稿', icon: BookOpen },
  { key: 'narrative', kicker: '第二章', title: '叙事定位', icon: Feather },
  { key: 'people', kicker: '第三章', title: '人物档案', icon: UsersRound },
  { key: 'rules', kicker: '第四章', title: '法则敕令', icon: Scale },
  { key: 'issue', kicker: '第五章', title: '开局签发', icon: Stamp },
] as const;

const stepCount = steps.length;
const currentStep = ref(0);
const maxVisitedStep = ref(0);
const slideDir = ref<'next' | 'back'>('next');
const activeRuleGroup = ref('常识规则');

const isLastStep = computed(() => currentStep.value === stepCount - 1);
const namedCharacters = computed(() => form.角色列表.filter(character => character.姓名.trim()));
const needsFocalCharacter = computed(
  () =>
    form.视角 === '第一人称角色' ||
    (form.视角 === '第三人称限定' && !form.主角启用 && namedCharacters.value.length > 0),
);
const openingCastNames = computed(() => [
  ...(form.主角启用 ? ['主角（<user>）'] : []),
  ...namedCharacters.value.map(character => character.姓名.trim()),
]);
const openingCastCount = computed(() => openingCastNames.value.length);
const povSummary = computed(() => buildPovRule(form.视角, form.主角启用, form.视角角色 || '待指定'));
const ruleCount = computed(() =>
  Object.values(rules).reduce((sum, list) => sum + list.filter(rule => rule.名称.trim()).length, 0),
);

const receipt = computed(() => ({
  世界模板: `${form.世界模板} · ${form.时代背景}`,
  叙事: `${form.视角} · ${form.文风}`,
  视角角色: needsFocalCharacter.value ? form.视角角色 || '待指定' : '由当前视角自动确定',
  主角: form.主角启用 ? `启用 · ${form.主角身份.trim() || '普通居民'}` : '关闭',
  主要角色: namedCharacters.value.length
    ? namedCharacters.value.map(character => character.姓名.trim()).join('、')
    : '未登记',
  开场人物: openingCastNames.value.length ? openingCastNames.value.join('、') : '无人物 · 纯环境开场',
  玩法模式: form.主角启用
    ? `认知 ${form.玩法模式.认知} · 使用 ${form.玩法模式.使用} · 受控 ${form.玩法模式.受控} · 篡改 ${form.玩法模式.编辑器篡改.split('-')[1] ?? form.玩法模式.编辑器篡改}`
    : `主角权限停用 · 篡改 ${form.玩法模式.编辑器篡改.split('-')[1] ?? form.玩法模式.编辑器篡改}`,
  基调: `色情 ${form.基调.色情浓度} · 搞笑 ${form.基调.搞笑程度} · 轻松 ${form.基调.轻松程度}${form.允许黑深残 ? ' · 允许黑深残' : ''}`,
  生效规则: `${ruleCount.value} 条`,
  剧情方向: `${form.剧情方向.开局场景} · ${form.剧情方向.主线目标.trim() || '未填写'} · ${form.剧情方向.节奏}${form.剧情方向.暧昧开局 && openingCastCount.value >= 2 ? ' · 暧昧开局' : ''}`,
}));

watch(openingCastCount, count => {
  if (count < 2) form.剧情方向.暧昧开局 = false;
});

function moveToStep(index: number) {
  if (index < 0 || index >= stepCount || index > maxVisitedStep.value) {
    return;
  }
  slideDir.value = index >= currentStep.value ? 'next' : 'back';
  currentStep.value = index;
  requestAnimationFrame(() => document.querySelector('.world-forge')?.scrollIntoView({ block: 'start' }));
}

function goToStep(index: number) {
  moveToStep(index);
}

function goNext() {
  if (currentStep.value < stepCount - 1) {
    const nextStep = currentStep.value + 1;
    maxVisitedStep.value = Math.max(maxVisitedStep.value, nextStep);
    moveToStep(nextStep);
  }
}

function goPrev() {
  if (currentStep.value > 0) {
    moveToStep(currentStep.value - 1);
  }
}

function groupInfo(key: string): RuleGroup {
  return ruleGroups.find(group => group.key === key) ?? ruleGroups[0];
}

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
  form.角色列表.push({ 姓名: '', 性别: '女', 年龄: '', 身份: '', 关系定位: '', 外貌特征: '', 性格: '' });
}

function removeCharacter(index: number) {
  const removedName = form.角色列表[index]?.姓名.trim();
  form.角色列表.splice(index, 1);
  if (removedName && form.视角角色 === removedName) form.视角角色 = '';
}

const store = useDataStore();
const { data } = storeToRefs(store);
const starting = ref(false);
const status = ref('');

function toRecord(entries: RuleEntry[]) {
  return Object.fromEntries(
    entries.filter(item => item.名称.trim()).map(item => [item.名称.trim(), item.内容.trim() || '已生效']),
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
        关系定位: character.关系定位.trim(),
        外貌特征: character.外貌特征.trim(),
        性格: character.性格.trim(),
      },
      当前想法: '',
    };
  }
  return result;
}

function validateConfiguration(): string | null {
  const blankIndex = form.角色列表.findIndex(character => !character.姓名.trim());
  if (blankIndex >= 0) return `角色档案 ${blankIndex + 1} 缺少姓名`;

  const names = namedCharacters.value.map(character => character.姓名.trim());
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) return `主要角色姓名重复：${duplicate}`;

  if (needsFocalCharacter.value) {
    if (!names.length) return `${form.视角}需要至少登记一名主要角色`;
    if (!names.includes(form.视角角色)) return '请选择一名已登记主要角色作为视角角色';
  }

  return null;
}

async function startGame() {
  if (starting.value) {
    return;
  }

  const validationError = validateConfiguration();
  if (validationError) {
    status.value = `配置失败：${validationError}`;
    toastr.warning(validationError, '请检查人物档案');
    if (maxVisitedStep.value >= 2) moveToStep(2);
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
      主角启用: form.主角启用,
      叙事视角: form.视角 as '第二人称' | '第三人称上帝' | '第三人称限定' | '第一人称玩家' | '第一人称角色',
      叙事文风: form.文风 as '细腻写实' | '通用白描' | '轻小说' | '古风' | '西幻' | '漫画分镜' | '微色情',
      视角角色: needsFocalCharacter.value ? form.视角角色 : '',
      玩法模式: { ...form.玩法模式 },
      基调: {
        色情浓度: Number(form.基调.色情浓度),
        搞笑程度: Number(form.基调.搞笑程度),
        轻松程度: Number(form.基调.轻松程度),
      },
      允许黑深残: form.允许黑深残,
      主角补充设定: form.主角启用 ? form.主角补充设定.trim() || '暂无补充设定' : '',
      剧情方向: {
        开局场景: form.剧情方向.开局场景,
        主线目标: form.剧情方向.主线目标.trim() || '先弄清楚现实编辑器的来历与能力',
        节奏: form.剧情方向.节奏 as '日常' | '冒险' | '悬疑' | '轻松',
        暧昧开局: form.剧情方向.暧昧开局 && openingCastCount.value >= 2,
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
    data.value.主角 = form.主角启用
      ? {
          姓名: data.value.主角.姓名,
          身份: form.主角身份.trim() || '普通居民',
          补充设定: form.主角补充设定.trim(),
          性格: form.主角性格.trim(),
          目标: form.主角目标.trim(),
          与编辑器关系: form.与编辑器关系,
        }
      : {
          姓名: '',
          身份: '',
          补充设定: '',
          性格: '',
          目标: '',
          与编辑器关系: '',
        };
    data.value.NPC序列 = buildCharacters();

    status.value = '正在生成开场…';
    await generateOpening(activeRules);
    status.value = '开场已生成！往下翻看新楼层，开始游玩。';
  } catch (error) {
    console.error('[人间修订中·世界配置]', error);
    toastr.error(error instanceof Error ? error.message : String(error), '现实编辑器报错');
    status.value = '生成失败，可重试';
  } finally {
    starting.value = false;
  }
}

async function generateOpening(activeRules: Record<string, Record<string, string>>) {
  const old_data = Mvu.getMvuData({ type: 'message', message_id: getCurrentMessageId() });
  const mainCharacters = form.角色列表.map(character => ({
    姓名: character.姓名.trim(),
    性别: character.性别.trim(),
    年龄: character.年龄.trim(),
    身份: character.身份.trim(),
    关系定位: character.关系定位.trim(),
    外貌特征: character.外貌特征.trim(),
    性格: character.性格.trim(),
  }));
  const targetLengthExtra = Math.max(0, openingCastCount.value - 4);
  const config = {
    世界模板: form.世界模板,
    世界观描述: form.世界观描述,
    时代背景: form.时代背景,
    文明与势力: form.文明与势力,
    地理与气候: form.地理与气候,
    历史与事件: form.历史与事件,
    核心冲突: form.核心冲突,
    主角启用: form.主角启用,
    玩法模式: { ...form.玩法模式 },
    基调: form.基调,
    允许黑深残: form.允许黑深残,
    主角: form.主角启用
      ? {
          身份: form.主角身份.trim() || '普通居民',
          性格: form.主角性格.trim(),
          目标: form.主角目标.trim(),
          补充设定: form.主角补充设定.trim(),
          与编辑器关系: form.与编辑器关系,
        }
      : null,
    剧情方向: {
      ...form.剧情方向,
      暧昧开局: form.剧情方向.暧昧开局 && openingCastCount.value >= 2,
    },
    主要角色: mainCharacters,
    视角: form.视角,
    文风: form.文风,
    视角角色: needsFocalCharacter.value ? form.视角角色 : '',
    生效规则: activeRules,
    开场人物约束: {
      必须登场: [...openingCastNames.value],
      允许登场: [...openingCastNames.value],
      额外人物: '禁止',
    },
    目标篇幅: `${1000 + targetLengthExtra * 160}~${1800 + targetLengthExtra * 240}字`,
  };

  const prompt = buildOpeningPrompt(config);
  const generationBaseId = `human-revision-opening-${Date.now()}`;
  let message = await requestOpening(prompt, '开始第一幕。', generationBaseId);
  let missingCharacters = findMissingCharacters(message, mainCharacters);

  if (missingCharacters.length) {
    const repairPrompt = `${prompt}\n\n【本次修订】\n上一稿遗漏了以下必须登场人物：${missingCharacters.join('、')}。重新生成完整第一幕，确保“必须登场”中的每一名主要角色都以姓名明确出现。`;
    message = await requestOpening(repairPrompt, '重新生成符合人物集合约束的完整第一幕。', `${generationBaseId}-retry`);
    missingCharacters = findMissingCharacters(message, mainCharacters);
  }

  if (missingCharacters.length) throw new Error(`第一幕遗漏主要角色：${missingCharacters.join('、')}`);
  if (!message.includes('<StatusPlaceHolderImpl/>')) message = `${message}\n<StatusPlaceHolderImpl/>`;

  const data = await Mvu.parseMessage(message, old_data);
  await createChatMessages([{ role: 'assistant', message, data: data ?? old_data }], { refresh: 'none' });
  await setChatMessages([{ message_id: getLastMessageId() }], { refresh: 'affected' });
}

async function requestOpening(prompt: string, userInput: string, generationId: string): Promise<string> {
  const result = await generateRaw({
    user_input: userInput,
    should_silence: true,
    generation_id: generationId,
    ordered_prompts: [{ role: 'system', content: prompt }, 'user_input'],
  });

  return (typeof result === 'string' ? result : result.content).replace(/<thinking>[\s\S]*?<\/thinking>/gis, '').trim();
}

function findMissingCharacters(message: string, characters: Array<{ 姓名: string }>): string[] {
  return characters.map(character => character.姓名).filter(name => !message.includes(name));
}

function buildOpeningPrompt(config: Record<string, unknown>): string {
  const protagonistEnabled = Boolean(config.主角启用);
  const pov = String(config.视角);
  const focusCharacter = String(config.视角角色 || '');
  return `【本次任务】
你是第一幕叙事引擎。只根据本提示词生成世界配置完成后的第一幕。现实编辑器以悬浮面板、提示文字、状态栏或弹窗呈现，始终是非人格化界面。

【创作总纲】
- 展示而非讲述：通过动作、对话、事实与可观察细节呈现设定。
- 视觉先行：先建立具体时间、地点、光线、声音、温度与气味，再推动事件。
- 配置优先：留白可以合理补全，已配置内容保持原意。
- 反八股：从开局场景里最早发生的具体变化切入，不使用空泛欢迎词或命运宣告。

【世界配置】
<opening_config>
${JSON.stringify(config, null, 2)}
</opening_config>

【叙事身份】
${buildPlayerRoleRule(protagonistEnabled)}
${buildPovRule(pov, protagonistEnabled, focusCharacter)}

【文风与基调】
${buildStyleRule(String(config.文风))}
色情浓度、搞笑程度、轻松程度是三个独立的 0~100 强度值：0 表示正文中不主动表现，100 表示该维度占据显著比重。严格按配置决定尺度，不预设轻松或搞笑为主。

【开场人物集合】
- “必须登场”和“允许登场”是同一个封闭集合，正文人物集合必须与它完全相等。
- 人物指具有人格化身份、动作、台词、心理或观察视角的存在；现实编辑器界面、环境、物体与自然现象不计为人物。
- “必须登场”中的每一名主要角色都要在第一幕明确出现，姓名至少出现一次，并具有可辨认的动作、台词或现场反应。
- 集合为空时，整幕只写环境、物体、事件与现实编辑器界面，以世界变化构成承接点。
- 暧昧开局只有在集合中至少有两名人物时生效。

【玩法模式】
${buildGameplayRule(protagonistEnabled)}
- 编辑器篡改严格按配置值执行：A 可随机改动；B 可自主改动且倾向色色；C 可自主改动但避开物理层面；D 只执行玩家明确修改；E 只执行玩家插件触发的变更，正文不解释来源。

【场景构造】
- 根据“开局场景 + 时代背景 + 地理与气候”给出完整而具体的时间地点。
- 从当前场景里最早发生的变化切入；主角启用时可以表现其与编辑器建立联系，主角关闭时通过登记角色、环境或界面事件表现编辑器生效。
- 生效规则通过允许人物、物体或环境变化自然显现，不列清单，不解释“因为规则”。
- 核心冲突只埋入一句或一个可感知迹象，不在第一幕展开说明。
- 结尾停在未完成动作、规则变化、环境异常或人物互动上，留下自然承接点。

【写前检查】
在 <thinking> 标签内依次核对：
1. 主角开关如何决定玩家在故事内外的身份？
2. 当前视角跟随谁，信息边界是什么？
3. 必须登场人物是否全部获得明确位置和动作？
4. 草稿人物集合是否与允许登场集合完全相等？
5. 规则通过哪些允许人物、物体或环境变化体现？
6. 结尾如何让玩家自然承接？
</thinking> 结束后直接输出正文。

【输出格式】
- 正文目标长度：${String(config.目标篇幅)}。
- 结尾另起一行输出 <StatusPlaceHolderImpl/>。
- 最终输出只包含正文和状态栏占位符，省略配置 JSON、规则列表、宏解释和思考内容。`;
}

function buildPlayerRoleRule(protagonistEnabled: boolean): string {
  return protagonistEnabled
    ? '- 主角启用：<user> 是世界中的主角，也是现实编辑器的持有者；主角档案与玩法模式中的认知、使用、受控均生效。'
    : '- 主角关闭：<user> 是故事外的现实编辑器操作者，不作为人物进入正文；主角档案以及认知、使用、受控均不参与本幕。';
}

function buildGameplayRule(protagonistEnabled: boolean): string {
  return protagonistEnabled
    ? '- 认知决定主角是否知道编辑器存在；使用决定主角是否能操作编辑器；受控决定主角是否受生效规则制约。三个字段彼此独立。'
    : '- 主角关闭时，认知、使用、受控字段全部忽略；规则作用于已登记主要角色与世界，仍严格服从具体作用范围。';
}

function buildPovRule(pov: string, protagonistEnabled = true, focusCharacter = ''): string {
  const rules: Record<string, string> = {
    第二人称: protagonistEnabled
      ? '使用第二人称“你”指代 <user>，只呈现主角能够观察或感受到的信息。'
      : '使用第二人称“你”指代故事外的编辑器操作者；“你”只观察界面与世界，不作为正文人物行动。',
    第三人称上帝: '用第三人称叙述（他/她/角色名），全景叙事，禁止用“你”指代任何角色。',
    第三人称限定: protagonistEnabled
      ? '使用第三人称，以 <user> 为唯一限定视角，只呈现主角能够观察或感受到的信息。'
      : focusCharacter
        ? `使用第三人称，以主要角色“${focusCharacter}”为唯一限定视角，只呈现该角色能够观察或感受到的信息。`
        : '开场人物集合为空，使用第三人称环境镜头，只呈现可观察的空间、物体与事件，不建立人物焦点。',
    第一人称玩家: protagonistEnabled
      ? '使用第一人称“我”指代 <user>，只呈现主角能够观察、感受到或想到的信息。'
      : '使用第一人称“我”指代故事外的编辑器操作者，只描述界面观察与操作，不把“我”写成正文人物。',
    第一人称角色: `使用第一人称“我”扮演主要角色“${focusCharacter}”，只呈现该角色能够观察、感受到或想到的信息；<user> 是否为主角由主角开关单独决定。`,
  };
  return rules[pov] ?? rules['第二人称'];
}

function buildStyleRule(style: string): string {
  const rules: Record<string, string> = {
    细腻写实:
      '细腻写实、慢节奏：五感细节、人物外貌身材穿着具体描写、心理活动丰富；按色情浓度决定露骨程度，浓度高时描写直白不回避。',
    通用白描: '白描优先，语言克制，情感靠动作和细节；默认不用比喻；禁止空泛抒情。',
    轻小说: '口语化日常对话驱动，叙述像角色在说话；对话独立成段，少用对话标签；轻松有活力。',
    古风: '七分白话三分文言；称谓和用词要符合时代；禁止“温度”“数据”“系统”等现代词。',
    西幻: '世界有质感：写材质、重量、温度、气味；场景即叙事；对话即博弈，人人说话都有目的。',
    漫画分镜: '文字即分镜：短段成格，一次换行一次镜头切换；强动词优先，情感具象化；高潮用极端细节“破框”。',
    微色情: '日常含蓄、性爱直接：日常用若隐若现的描写，色情浓度按配置自然呈现，反差制造张力。',
  };
  return rules[style] ?? rules['通用白描'];
}
</script>

<style scoped>
.world-forge {
  --ui-font: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  --mono-font: 'IBM Plex Mono', 'Cascadia Mono', 'Microsoft YaHei', monospace;
  --canvas: oklch(0.16 0.012 55);
  --canvas-raised: oklch(0.21 0.014 55);
  --paper: oklch(0.92 0.025 78);
  --paper-deep: oklch(0.86 0.032 75);
  --paper-soft: oklch(0.955 0.018 78);
  --ink: oklch(0.24 0.02 55);
  --ink-muted: oklch(0.48 0.025 60);
  --ink-faint: oklch(0.62 0.024 65);
  --cinnabar: oklch(0.49 0.15 31);
  --cinnabar-active: oklch(0.56 0.17 31);
  --brass: oklch(0.66 0.08 72);
  --line: oklch(0.58 0.04 65 / 0.28);
  --line-strong: oklch(0.48 0.05 62 / 0.48);
  --shell-ink: oklch(0.92 0.025 78);
  --shell-muted: oklch(0.76 0.03 72);
  --shell-border: oklch(0.55 0.05 65 / 0.22);
  --shell-background: radial-gradient(circle at 14% 0%, oklch(0.28 0.025 55 / 0.42), transparent 34%), var(--canvas);
  --shell-shadow: 0 26px 70px oklch(0.08 0.01 50 / 0.44);
  --theme-panel: oklch(0.2 0.015 55 / 0.86);
  --theme-border: oklch(0.58 0.045 68 / 0.26);
  --theme-hover: oklch(0.29 0.022 55 / 0.72);
  --seal-border: oklch(0.58 0.17 31 / 0.72);
  --seal-color: oklch(0.65 0.18 31);
  --tab-line: oklch(0.56 0.04 65 / 0.24);
  --tab-muted: oklch(0.61 0.025 68);
  --tab-hover: oklch(0.28 0.018 55 / 0.48);
  --tab-complete: oklch(0.75 0.065 73);
  --dossier-background:
    linear-gradient(90deg, oklch(0.75 0.035 72 / 0.18), transparent 9%, transparent 91%, oklch(0.68 0.035 72 / 0.16)),
    repeating-linear-gradient(0deg, transparent 0 5px, oklch(0.5 0.03 65 / 0.018) 5px 6px), var(--paper);
  --dossier-shadow: inset 0 0 0 1px oklch(0.45 0.045 62 / 0.26), 0 18px 40px oklch(0.08 0.01 50 / 0.3);
  --control-surface: oklch(0.96 0.016 78 / 0.54);
  --control-placeholder: oklch(0.58 0.02 65);
  --control-hover-border: oklch(0.46 0.055 62 / 0.66);
  --focus-ring: oklch(0.5 0.15 31 / 0.14);
  --record-surface: oklch(0.95 0.018 78 / 0.28);
  --switch-off: oklch(0.58 0.02 65);
  --switch-shadow: oklch(0.25 0.02 55 / 0.35);
  --count-surface: oklch(0.58 0.03 65 / 0.15);
  --selected-surface: oklch(0.5 0.15 31 / 0.08);
  --approval-color: oklch(0.49 0.15 31 / 0.72);
  --action-border: oklch(0.55 0.05 65 / 0.2);
  --action-shadow: 0 -16px 30px oklch(0.08 0.01 50 / 0.25);
  --secondary-border: oklch(0.7 0.055 72 / 0.38);
  --secondary-text: oklch(0.78 0.04 72);
  --button-border: oklch(0.63 0.17 31 / 0.85);
  --button-inset: oklch(0.92 0.04 65 / 0.2);
  --button-shadow: oklch(0.17 0.08 31 / 0.28);
  --button-text: oklch(0.96 0.02 78);
  --legal-text: oklch(0.58 0.025 68);
  position: relative;
  isolation: isolate;
  width: min(100%, 760px);
  margin: 0 auto;
  overflow: clip;
  border: 1px solid var(--shell-border);
  border-radius: 18px;
  background: var(--shell-background);
  box-shadow: var(--shell-shadow);
  color: var(--shell-ink);
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'SimSun', serif;
  text-rendering: optimizeLegibility;
  container-type: inline-size;
  transition:
    background-color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    color 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.world-forge[data-theme='astrolabe'] {
  --canvas: oklch(0.14 0.032 255);
  --canvas-raised: oklch(0.19 0.038 250);
  --paper: oklch(0.205 0.036 252);
  --paper-deep: oklch(0.17 0.034 254);
  --paper-soft: oklch(0.255 0.038 248);
  --ink: oklch(0.91 0.024 82);
  --ink-muted: oklch(0.73 0.032 82);
  --ink-faint: oklch(0.59 0.035 78);
  --cinnabar: oklch(0.72 0.105 74);
  --cinnabar-active: oklch(0.81 0.12 78);
  --brass: oklch(0.69 0.115 58);
  --line: oklch(0.68 0.055 76 / 0.22);
  --line-strong: oklch(0.74 0.075 76 / 0.4);
  --shell-ink: oklch(0.91 0.024 82);
  --shell-muted: oklch(0.72 0.042 80);
  --shell-border: oklch(0.71 0.095 72 / 0.38);
  --shell-background:
    radial-gradient(
      circle at 50% -8%,
      transparent 0 64px,
      oklch(0.74 0.1 75 / 0.22) 65px 66px,
      transparent 67px 112px,
      oklch(0.74 0.1 75 / 0.12) 113px 114px,
      transparent 115px
    ),
    radial-gradient(circle at 85% 9%, oklch(0.34 0.075 245 / 0.46), transparent 31%), var(--canvas);
  --shell-shadow: 0 30px 80px oklch(0.055 0.025 255 / 0.62);
  --theme-panel: oklch(0.18 0.04 252 / 0.9);
  --theme-border: oklch(0.7 0.085 74 / 0.3);
  --theme-hover: oklch(0.28 0.058 246 / 0.78);
  --seal-border: oklch(0.74 0.11 75 / 0.7);
  --seal-color: oklch(0.81 0.12 78);
  --tab-line: oklch(0.72 0.07 75 / 0.2);
  --tab-muted: oklch(0.62 0.045 80);
  --tab-hover: oklch(0.27 0.05 246 / 0.72);
  --tab-complete: oklch(0.78 0.09 76);
  --dossier-background:
    radial-gradient(
      circle at 50% 2%,
      transparent 0 72px,
      oklch(0.74 0.095 76 / 0.12) 73px 74px,
      transparent 75px 116px,
      oklch(0.74 0.095 76 / 0.07) 117px 118px,
      transparent 119px
    ),
    linear-gradient(145deg, oklch(0.26 0.045 245 / 0.52), transparent 48%), var(--paper);
  --dossier-shadow: inset 0 0 0 1px oklch(0.74 0.09 75 / 0.26), 0 20px 44px oklch(0.055 0.024 255 / 0.46);
  --control-surface: oklch(0.245 0.037 249 / 0.88);
  --control-placeholder: oklch(0.59 0.032 80);
  --control-hover-border: oklch(0.76 0.1 76 / 0.7);
  --focus-ring: oklch(0.75 0.11 76 / 0.18);
  --record-surface: oklch(0.245 0.04 248 / 0.64);
  --switch-off: oklch(0.39 0.04 247);
  --switch-shadow: oklch(0.06 0.02 255 / 0.5);
  --count-surface: oklch(0.72 0.09 76 / 0.13);
  --selected-surface: oklch(0.72 0.1 76 / 0.12);
  --approval-color: oklch(0.78 0.11 76 / 0.78);
  --action-border: oklch(0.72 0.08 75 / 0.24);
  --action-shadow: 0 -18px 34px oklch(0.055 0.025 255 / 0.42);
  --secondary-border: oklch(0.7 0.08 76 / 0.42);
  --secondary-text: oklch(0.82 0.07 79);
  --button-border: oklch(0.82 0.12 78 / 0.9);
  --button-inset: oklch(0.96 0.03 82 / 0.18);
  --button-shadow: oklch(0.05 0.03 255 / 0.42);
  --button-text: oklch(0.18 0.035 252);
  --legal-text: oklch(0.58 0.04 80);
  border-radius: 28px;
}

.world-forge[data-theme='terminal'] {
  --canvas: oklch(0.93 0.008 80);
  --canvas-raised: oklch(0.89 0.009 75);
  --paper: oklch(0.975 0.006 82);
  --paper-deep: oklch(0.92 0.009 78);
  --paper-soft: oklch(0.99 0.004 82);
  --ink: oklch(0.19 0.012 55);
  --ink-muted: oklch(0.43 0.014 58);
  --ink-faint: oklch(0.58 0.012 60);
  --cinnabar: oklch(0.53 0.205 29);
  --cinnabar-active: oklch(0.47 0.215 29);
  --brass: oklch(0.34 0.012 60);
  --line: oklch(0.34 0.015 58 / 0.22);
  --line-strong: oklch(0.25 0.014 58 / 0.48);
  --shell-ink: oklch(0.16 0.012 55);
  --shell-muted: oklch(0.4 0.014 58);
  --shell-border: oklch(0.18 0.012 55 / 0.78);
  --shell-background:
    repeating-linear-gradient(0deg, transparent 0 23px, oklch(0.2 0.01 55 / 0.035) 23px 24px),
    linear-gradient(120deg, oklch(0.98 0.006 82), oklch(0.9 0.01 74));
  --shell-shadow: 10px 10px 0 oklch(0.18 0.012 55 / 0.88);
  --theme-panel: oklch(0.965 0.006 82 / 0.94);
  --theme-border: oklch(0.2 0.012 55 / 0.3);
  --theme-hover: oklch(0.89 0.012 74 / 0.9);
  --seal-border: oklch(0.53 0.205 29 / 0.82);
  --seal-color: oklch(0.48 0.205 29);
  --tab-line: oklch(0.24 0.012 55 / 0.24);
  --tab-muted: oklch(0.46 0.012 58);
  --tab-hover: oklch(0.88 0.012 75 / 0.84);
  --tab-complete: oklch(0.31 0.018 55);
  --dossier-background:
    linear-gradient(90deg, oklch(0.2 0.01 55 / 0.04) 1px, transparent 1px),
    linear-gradient(oklch(0.2 0.01 55 / 0.035) 1px, transparent 1px), var(--paper);
  --dossier-shadow: inset 0 0 0 1px oklch(0.19 0.012 55 / 0.72), 6px 6px 0 oklch(0.18 0.012 55 / 0.16);
  --control-surface: oklch(0.99 0.004 82);
  --control-placeholder: oklch(0.58 0.012 60);
  --control-hover-border: oklch(0.28 0.015 55 / 0.76);
  --focus-ring: oklch(0.53 0.205 29 / 0.16);
  --record-surface: oklch(0.94 0.008 78 / 0.7);
  --switch-off: oklch(0.64 0.01 65);
  --switch-shadow: oklch(0.18 0.012 55 / 0.34);
  --count-surface: oklch(0.27 0.012 55 / 0.09);
  --selected-surface: oklch(0.53 0.205 29 / 0.08);
  --approval-color: oklch(0.5 0.205 29 / 0.82);
  --action-border: oklch(0.2 0.012 55 / 0.32);
  --action-shadow: 0 -10px 0 oklch(0.18 0.012 55 / 0.05);
  --secondary-border: oklch(0.23 0.012 55 / 0.54);
  --secondary-text: oklch(0.22 0.012 55);
  --button-border: oklch(0.43 0.2 29 / 0.92);
  --button-inset: oklch(0.96 0.02 75 / 0.16);
  --button-shadow: oklch(0.18 0.08 29 / 0.2);
  --button-text: oklch(0.98 0.006 82);
  --legal-text: oklch(0.43 0.012 58);
  border-radius: 7px;
  color-scheme: light;
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}

.world-forge[data-theme='neon'] {
  --canvas: oklch(0.105 0.045 285);
  --canvas-raised: oklch(0.155 0.055 275);
  --paper: oklch(0.145 0.048 278);
  --paper-deep: oklch(0.12 0.045 282);
  --paper-soft: oklch(0.2 0.06 270);
  --ink: oklch(0.92 0.03 205);
  --ink-muted: oklch(0.72 0.05 210);
  --ink-faint: oklch(0.57 0.055 220);
  --cinnabar: oklch(0.82 0.15 195);
  --cinnabar-active: oklch(0.87 0.18 192);
  --brass: oklch(0.72 0.22 330);
  --line: oklch(0.78 0.14 195 / 0.17);
  --line-strong: oklch(0.79 0.15 195 / 0.42);
  --shell-ink: oklch(0.94 0.035 205);
  --shell-muted: oklch(0.72 0.06 215);
  --shell-border: oklch(0.78 0.17 195 / 0.52);
  --shell-background:
    repeating-linear-gradient(0deg, transparent 0 3px, oklch(0.86 0.18 195 / 0.025) 3px 4px),
    radial-gradient(circle at 8% 0%, oklch(0.54 0.2 330 / 0.23), transparent 29%),
    radial-gradient(circle at 92% 6%, oklch(0.62 0.16 195 / 0.2), transparent 31%), var(--canvas);
  --shell-shadow:
    0 0 0 1px oklch(0.72 0.22 330 / 0.18), 0 0 34px oklch(0.77 0.17 195 / 0.2), 0 30px 80px oklch(0.035 0.025 285 / 0.7);
  --theme-panel: oklch(0.13 0.05 280 / 0.92);
  --theme-border: oklch(0.76 0.16 195 / 0.3);
  --theme-hover: oklch(0.24 0.075 275 / 0.82);
  --seal-border: oklch(0.72 0.22 330 / 0.82);
  --seal-color: oklch(0.87 0.18 192);
  --tab-line: oklch(0.78 0.16 195 / 0.22);
  --tab-muted: oklch(0.59 0.06 215);
  --tab-hover: oklch(0.24 0.07 275 / 0.76);
  --tab-complete: oklch(0.77 0.18 330);
  --dossier-background:
    linear-gradient(90deg, oklch(0.78 0.15 195 / 0.055) 1px, transparent 1px),
    linear-gradient(oklch(0.78 0.15 195 / 0.045) 1px, transparent 1px), var(--paper);
  --dossier-shadow:
    inset 0 0 0 1px oklch(0.78 0.15 195 / 0.32), 7px 7px 0 oklch(0.72 0.22 330 / 0.12),
    0 20px 50px oklch(0.035 0.025 285 / 0.55);
  --control-surface: oklch(0.18 0.055 275 / 0.9);
  --control-placeholder: oklch(0.55 0.055 220);
  --control-hover-border: oklch(0.86 0.18 192 / 0.74);
  --focus-ring: oklch(0.82 0.15 195 / 0.2);
  --record-surface: oklch(0.2 0.06 275 / 0.6);
  --switch-off: oklch(0.34 0.055 275);
  --switch-shadow: oklch(0.03 0.02 285 / 0.66);
  --count-surface: oklch(0.72 0.22 330 / 0.14);
  --selected-surface: oklch(0.82 0.15 195 / 0.13);
  --approval-color: oklch(0.78 0.19 330 / 0.86);
  --action-border: oklch(0.78 0.15 195 / 0.25);
  --action-shadow: 0 -14px 32px oklch(0.035 0.025 285 / 0.52);
  --secondary-border: oklch(0.77 0.18 330 / 0.46);
  --secondary-text: oklch(0.85 0.12 330);
  --button-border: oklch(0.87 0.18 192 / 0.94);
  --button-inset: oklch(0.98 0.03 205 / 0.22);
  --button-shadow: oklch(0.71 0.18 195 / 0.34);
  --button-text: oklch(0.12 0.045 282);
  --legal-text: oklch(0.56 0.06 220);
  border-radius: 6px;
  color-scheme: dark;
  font-family: 'IBM Plex Mono', 'Cascadia Mono', 'Microsoft YaHei', monospace;
}

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 24px 20px;
}

.registry-no,
.chapter-heading p,
.section-heading span,
.character-record header span,
.legal-note {
  margin: 0;
  font-family: var(--mono-font);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.registry-no {
  color: var(--brass);
  letter-spacing: 0.12em;
}

.masthead h1 {
  margin: 7px 0 3px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0.16em;
  line-height: 1.05;
}

.masthead-subtitle {
  margin: 0;
  color: var(--shell-muted);
  font-family: var(--ui-font);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.03em;
}

.masthead-seal {
  display: grid;
  flex: 0 0 58px;
  place-items: center;
  aspect-ratio: 1;
  border: 1px solid var(--seal-border);
  color: var(--seal-color);
  transform: rotate(3deg);
  transition:
    border-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.masthead-seal span {
  margin-top: -7px;
  font-family: var(--ui-font);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.theme-dock {
  display: grid;
  gap: 12px;
  padding: 0 20px 20px;
}

.theme-dock-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: var(--shell-muted);
  font-family: var(--ui-font);
}

.theme-dock-heading span {
  color: var(--shell-ink);
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0.04em;
}

.theme-dock-heading > strong {
  color: var(--brass);
  font-size: 12px;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--theme-border);
  border-radius: 8px;
  background: var(--theme-panel);
}

.theme-option {
  --preview-accent: var(--cinnabar-active);
  --preview-background: var(--theme-panel);
  --preview-border: var(--theme-border);
  --preview-ink: var(--shell-ink);
  --preview-muted: var(--shell-muted);
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 168px;
  grid-template-columns: 1fr;
  align-content: start;
  gap: 11px;
  border: 0;
  border-right: 1px solid var(--theme-border);
  background: var(--preview-background);
  color: var(--preview-ink);
  padding: 14px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-option:last-child {
  border-right: 0;
}

.theme-option:hover {
  z-index: 1;
  color: var(--preview-ink);
  transform: translateY(-2px);
}

.theme-option:focus-visible {
  z-index: 2;
  outline: 2px solid var(--preview-accent);
  outline-offset: -3px;
}

.theme-option.active {
  z-index: 1;
  color: var(--preview-ink);
  box-shadow: inset 0 0 0 2px var(--preview-accent);
}

.theme-glyph {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
  color: var(--preview-accent);
}

.theme-option-copy {
  display: grid;
  min-width: 0;
  gap: 5px;
  font-family: var(--ui-font);
}

.theme-option-copy strong,
.theme-option-copy small {
  overflow: hidden;
}

.theme-option-copy strong {
  color: inherit;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

.theme-option-copy small {
  display: -webkit-box;
  color: var(--preview-muted);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.theme-check {
  position: absolute;
  top: 12px;
  right: 12px;
  color: var(--preview-accent);
}

.theme-option[data-theme-option='archive'] {
  --preview-accent: oklch(0.54 0.18 31);
  --preview-background:
    repeating-linear-gradient(0deg, transparent 0 5px, oklch(0.42 0.04 58 / 0.035) 5px 6px), oklch(0.91 0.03 78);
  --preview-ink: oklch(0.25 0.025 55);
  --preview-muted: oklch(0.43 0.03 60);
}

.theme-option[data-theme-option='archive'] .theme-glyph {
  border-radius: 3px;
  transform: rotate(-3deg);
}

.theme-option[data-theme-option='archive'] .theme-option-copy strong {
  font-family: 'Theme Archive Preview', 'Noto Serif SC', 'Songti SC', serif;
  font-size: 18px;
  font-weight: 400;
}

.theme-option[data-theme-option='astrolabe'] {
  --preview-accent: oklch(0.78 0.12 76);
  --preview-background:
    radial-gradient(circle at 78% 18%, transparent 0 18px, oklch(0.78 0.11 76 / 0.16) 19px 20px, transparent 21px),
    radial-gradient(circle at 78% 18%, oklch(0.38 0.07 247 / 0.55), transparent 42%), oklch(0.17 0.04 252);
  --preview-ink: oklch(0.94 0.025 82);
  --preview-muted: oklch(0.76 0.04 80);
}

.theme-option[data-theme-option='astrolabe'] .theme-glyph {
  box-shadow: 0 0 18px oklch(0.78 0.12 76 / 0.2);
}

.theme-option[data-theme-option='astrolabe'] .theme-option-copy strong {
  font-family: 'Theme Astrolabe Preview', 'STKaiti', 'KaiTi', serif;
  font-size: 21px;
  font-weight: 400;
  letter-spacing: 0.08em;
}

.theme-option[data-theme-option='terminal'] {
  --preview-accent: oklch(0.5 0.22 29);
  --preview-background:
    linear-gradient(90deg, oklch(0.24 0.01 55 / 0.055) 1px, transparent 1px),
    linear-gradient(oklch(0.24 0.01 55 / 0.05) 1px, transparent 1px), oklch(0.96 0.008 80);
  --preview-ink: oklch(0.18 0.012 55);
  --preview-muted: oklch(0.39 0.014 58);
  background-size: 14px 14px;
}

.theme-option[data-theme-option='terminal'] .theme-glyph {
  border-width: 2px;
  border-radius: 2px;
}

.theme-option[data-theme-option='terminal'] .theme-option-copy strong {
  font-family: 'Theme Terminal Preview', 'Cascadia Mono', 'Microsoft YaHei', monospace;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.06em;
}

.theme-option[data-theme-option='neon'] {
  --preview-accent: oklch(0.84 0.17 194);
  --preview-background:
    linear-gradient(135deg, oklch(0.72 0.22 330 / 0.16), transparent 38%),
    repeating-linear-gradient(0deg, transparent 0 3px, oklch(0.84 0.17 194 / 0.035) 3px 4px), oklch(0.125 0.052 282);
  --preview-ink: oklch(0.94 0.04 205);
  --preview-muted: oklch(0.75 0.075 214);
}

.theme-option[data-theme-option='neon'] .theme-glyph {
  border-radius: 2px;
  box-shadow: 0 0 14px oklch(0.84 0.17 194 / 0.2);
}

.theme-option[data-theme-option='neon'] .theme-option-copy strong {
  color: oklch(0.78 0.2 330);
  font-family: 'Theme Neon Preview', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 18px;
  font-style: oblique;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-shadow: 0 0 14px oklch(0.78 0.2 330 / 0.24);
}

.world-forge[data-theme='astrolabe'] .masthead-seal {
  position: relative;
  border-radius: 50%;
  box-shadow: 0 0 24px oklch(0.75 0.11 76 / 0.16);
  transform: none;
}

.world-forge[data-theme='astrolabe'] .masthead-seal::before {
  position: absolute;
  inset: -7px;
  border: 1px solid oklch(0.74 0.1 75 / 0.28);
  border-radius: 50%;
  content: '';
  transform: rotate(24deg) scaleX(0.76);
}

.world-forge[data-theme='astrolabe'] .theme-options,
.world-forge[data-theme='astrolabe'] .dossier {
  border-radius: 14px;
}

.world-forge[data-theme='astrolabe'] .control,
.world-forge[data-theme='astrolabe'] .button,
.world-forge[data-theme='astrolabe'] .rule-tab,
.world-forge[data-theme='astrolabe'] .add-record,
.world-forge[data-theme='astrolabe'] .character-record {
  border-radius: 9px;
}

.world-forge[data-theme='astrolabe'] .paper-notch {
  top: -6px;
  width: 12px;
  height: 12px;
  background: var(--cinnabar);
  clip-path: none;
  transform: translateX(-50%) rotate(45deg);
}

.world-forge[data-theme='terminal'] .masthead-seal {
  border-width: 2px;
  border-radius: 2px;
  transform: none;
}

.world-forge[data-theme='terminal'] .masthead h1,
.world-forge[data-theme='terminal'] .chapter-heading h2 {
  font-family: 'IBM Plex Mono', 'Cascadia Mono', 'Microsoft YaHei', monospace;
  letter-spacing: 0.08em;
}

.world-forge[data-theme='terminal'] .theme-options,
.world-forge[data-theme='terminal'] .dossier,
.world-forge[data-theme='terminal'] .control,
.world-forge[data-theme='terminal'] .button,
.world-forge[data-theme='terminal'] .rule-tab,
.world-forge[data-theme='terminal'] .add-record,
.world-forge[data-theme='terminal'] .character-record {
  border-radius: 0;
}

.world-forge[data-theme='terminal'] .theme-glyph,
.world-forge[data-theme='terminal'] .chapter-icon,
.world-forge[data-theme='terminal'] .section-icon,
.world-forge[data-theme='terminal'] .icon-button {
  border-radius: 3px;
}

.world-forge[data-theme='terminal'] .dossier {
  background-size: 24px 24px;
}

.world-forge[data-theme='terminal'] .paper-notch {
  top: 0;
  width: 34px;
  height: 5px;
  background: var(--cinnabar);
  clip-path: none;
}

.world-forge[data-theme='terminal'] .approval-mark {
  width: 112px;
  height: 72px;
  border: 2px solid currentColor;
  border-radius: 0;
  transform: none;
}

.world-forge[data-theme='terminal'] .approval-mark::after {
  border-radius: 0;
}

.world-forge[data-theme='neon'] .masthead-seal {
  border-width: 2px;
  border-radius: 0;
  background: oklch(0.16 0.06 278 / 0.84);
  box-shadow:
    inset 0 0 14px oklch(0.82 0.15 195 / 0.14),
    0 0 18px oklch(0.72 0.22 330 / 0.24);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transform: none;
}

.world-forge[data-theme='neon'] .masthead h1,
.world-forge[data-theme='neon'] .chapter-heading h2 {
  font-family: 'IBM Plex Mono', 'Cascadia Mono', 'Microsoft YaHei', monospace;
  text-shadow: 0 0 18px oklch(0.82 0.15 195 / 0.18);
}

.world-forge[data-theme='neon'] .theme-options,
.world-forge[data-theme='neon'] .dossier,
.world-forge[data-theme='neon'] .control,
.world-forge[data-theme='neon'] .button,
.world-forge[data-theme='neon'] .rule-tab,
.world-forge[data-theme='neon'] .add-record,
.world-forge[data-theme='neon'] .character-record {
  border-radius: 3px;
}

.world-forge[data-theme='neon'] .theme-glyph,
.world-forge[data-theme='neon'] .chapter-icon,
.world-forge[data-theme='neon'] .section-icon,
.world-forge[data-theme='neon'] .icon-button {
  border-radius: 2px;
  box-shadow: 0 0 12px oklch(0.82 0.15 195 / 0.12);
}

.world-forge[data-theme='neon'] .dossier {
  background-size: 28px 28px;
}

.world-forge[data-theme='neon'] .paper-notch {
  top: 0;
  width: 72px;
  height: 3px;
  background: linear-gradient(90deg, var(--brass) 0 28%, var(--cinnabar) 28% 100%);
  box-shadow: 0 0 12px var(--cinnabar);
  clip-path: none;
}

.world-forge[data-theme='neon'] .approval-mark {
  width: 118px;
  height: 76px;
  border: 2px solid currentColor;
  border-radius: 0;
  box-shadow: 0 0 18px oklch(0.72 0.22 330 / 0.2);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  transform: none;
}

.world-forge[data-theme='neon'] .approval-mark::after {
  border-radius: 0;
}

.chapter-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: 0 20px 18px;
}

.chapter-tab {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 70px;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 0;
  border-bottom: 1px solid var(--tab-line);
  background: transparent;
  color: var(--tab-muted);
  text-align: left;
  cursor: pointer;
  transition:
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.chapter-tab::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: transparent;
  content: '';
  transition: background-color 180ms ease-out;
}

.chapter-tab:not(:disabled):hover {
  background: var(--tab-hover);
  color: var(--shell-ink);
}
.chapter-tab:disabled {
  cursor: default;
  opacity: 0.72;
}
.chapter-tab.active {
  color: var(--shell-ink);
}
.chapter-tab.active::after {
  background: var(--cinnabar-active);
}
.chapter-tab.complete {
  color: var(--tab-complete);
}

.chapter-icon {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.chapter-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
  font-family: var(--ui-font);
}
.chapter-copy small {
  font:
    12px/1.3 'IBM Plex Mono',
    'Cascadia Mono',
    sans-serif;
  letter-spacing: 0.05em;
}
.chapter-copy strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 720;
  line-height: 1.3;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dossier {
  position: relative;
  margin: 0 12px;
  background: var(--dossier-background);
  background-size: auto;
  box-shadow: var(--dossier-shadow);
  color: var(--ink);
  transition:
    background-color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1),
    color 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.paper-notch {
  position: absolute;
  top: 0;
  left: 50%;
  width: 26px;
  height: 9px;
  background: var(--canvas);
  clip-path: polygon(0 0, 100% 0, 64% 100%, 36% 100%);
  transform: translateX(-50%);
}

.chapter-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  padding: 34px 28px 22px;
  border-bottom: 1px solid var(--line-strong);
}

.chapter-heading p {
  color: var(--cinnabar);
}
.chapter-heading h2 {
  margin: 7px 0 0;
  font-size: 30px;
  font-weight: 850;
  letter-spacing: 0.12em;
  line-height: 1.15;
}
.chapter-folio {
  color: var(--ink-muted);
  font:
    700 12px/1 'IBM Plex Mono',
    'Cascadia Mono',
    monospace;
  letter-spacing: 0.12em;
}

.chapter-body {
  padding: 0 28px 34px;
  animation: page-forward 240ms cubic-bezier(0.16, 1, 0.3, 1);
}
.chapter-body.step-back {
  animation-name: page-back;
}

@keyframes page-forward {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes page-back {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chapter-lead {
  max-width: 62ch;
  margin: 0;
  padding: 18px 0 22px;
  color: var(--ink-muted);
  font-size: 13px;
  line-height: 1.8;
}

.dossier-section {
  padding: 26px 0 28px;
  border-top: 1px solid var(--line);
}
.chapter-lead + .dossier-section {
  padding-top: 4px;
  border-top: 0;
}

.section-heading {
  display: grid;
  grid-template-columns: 36px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.section-heading-actions {
  grid-template-columns: 36px 1fr auto;
}

.narrative-brief {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-left: 3px solid var(--cinnabar);
  background: var(--record-surface);
  color: var(--ink-muted);
}
.narrative-brief svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--cinnabar);
}
.narrative-brief p {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
}

.protagonist-fields {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  transition: opacity 160ms ease-out;
}
.protagonist-disabled .protagonist-fields {
  opacity: 0.42;
}
.protagonist-fields:disabled .control,
.field-disabled .control {
  cursor: not-allowed;
}
.field-disabled {
  opacity: 0.48;
}
.focal-character-field {
  margin-top: 18px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.section-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--seal-border);
  border-radius: 50%;
  color: var(--cinnabar);
}
.section-heading div > span {
  color: var(--cinnabar);
}
.section-heading h3 {
  margin: 3px 0 0;
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.form-grid {
  display: grid;
  gap: 0 16px;
}
.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.compact-grid {
  grid-template-columns: 1.3fr 0.7fr 0.7fr;
}

.field {
  display: grid;
  gap: 7px;
  margin-bottom: 16px;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  font-weight: 720;
  letter-spacing: 0.04em;
}
.field-label em {
  color: var(--ink-faint);
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.4;
}

.control {
  width: 100%;
  min-height: 48px;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  outline: none;
  background: var(--control-surface);
  color: var(--ink);
  font:
    500 14px/1.55 'Noto Sans SC',
    'Microsoft YaHei',
    sans-serif;
  padding: 11px 12px;
  transition:
    border-color 160ms ease-out,
    box-shadow 160ms ease-out,
    background-color 160ms ease-out;
}

textarea.control {
  min-height: 82px;
  resize: vertical;
}
.control::placeholder {
  color: var(--control-placeholder);
}
.control:hover {
  border-color: var(--control-hover-border);
  background: var(--paper-soft);
}
.control:focus-visible {
  border-color: var(--cinnabar);
  background: var(--paper-soft);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.select-wrap {
  position: relative;
  display: block;
}
.select-wrap::after {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 7px;
  height: 7px;
  border-right: 1.5px solid var(--ink-muted);
  border-bottom: 1.5px solid var(--ink-muted);
  content: '';
  pointer-events: none;
  transform: translateY(-70%) rotate(45deg);
}
.select-wrap select {
  appearance: none;
  padding-right: 36px;
}

.text-action,
.receipt-group button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--cinnabar);
  font:
    700 12px/1 'Noto Sans SC',
    'Microsoft YaHei',
    sans-serif;
  cursor: pointer;
}

.text-action:hover,
.receipt-group button:hover {
  color: var(--cinnabar-active);
}

.empty-record {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px dashed var(--line-strong);
  color: var(--ink-muted);
}

.empty-record strong {
  color: var(--ink);
  font-size: 13px;
}
.empty-record p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
}
.empty-record button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  background: transparent;
  color: var(--ink);
  font:
    700 12px/1 'Noto Sans SC',
    sans-serif;
  padding: 0 12px;
  cursor: pointer;
}

.character-record {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid var(--line-strong);
  background: var(--record-surface);
}
.character-record > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}
.character-record header div {
  display: grid;
  gap: 3px;
}
.character-record header span {
  color: var(--cinnabar);
}
.character-record header strong {
  font-size: 14px;
  letter-spacing: 0.06em;
}

.icon-button {
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
}
.icon-button:hover {
  border-color: currentColor;
}
.icon-button.danger:hover {
  color: var(--cinnabar);
}

.tone-list {
  display: grid;
  gap: 6px;
}
.tone-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.9fr) minmax(140px, 1.4fr) 44px;
  align-items: center;
  gap: 14px;
  min-height: 62px;
  border-bottom: 1px solid var(--line);
}
.tone-row > span {
  display: grid;
  gap: 3px;
}
.tone-row strong,
.switch-row strong {
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
}
.tone-row small,
.switch-row small {
  color: var(--ink-muted);
  font-family: 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  line-height: 1.5;
}
.tone-row input {
  width: 100%;
  accent-color: var(--cinnabar);
  cursor: pointer;
}
.tone-row output {
  color: var(--cinnabar);
  font:
    750 14px/1 'IBM Plex Mono',
    'Cascadia Mono',
    monospace;
  text-align: right;
}

.switch-row {
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 12px;
  padding: 8px 0;
  cursor: pointer;
}
.switch-row > span {
  display: grid;
  gap: 4px;
}
.switch-row input,
.record-switch input {
  position: relative;
  width: 46px;
  height: 26px;
  flex: 0 0 46px;
  appearance: none;
  border: 1px solid var(--line-strong);
  border-radius: 99px;
  background: var(--switch-off);
  cursor: pointer;
  transition: background-color 160ms ease-out;
}
.switch-row input::after,
.record-switch input::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--paper-soft);
  box-shadow: 0 1px 3px var(--switch-shadow);
  content: '';
  transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
.switch-row input:checked,
.record-switch input:checked {
  border-color: var(--cinnabar);
  background: var(--cinnabar);
}
.switch-row input:checked::after,
.record-switch input:checked::after {
  transform: translateX(20px);
}
.switch-row input:focus-visible,
.record-switch input:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
.switch-row input:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.record-switch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  min-height: 40px;
  cursor: pointer;
}

.rule-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.rule-tab {
  display: inline-flex;
  min-width: max-content;
  min-height: 42px;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: transparent;
  color: var(--ink-muted);
  font:
    700 12px/1 'Noto Sans SC',
    sans-serif;
  padding: 0 12px;
  cursor: pointer;
}
.rule-tab span {
  display: grid;
  min-width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  background: var(--count-surface);
  font-size: 12px;
}
.rule-tab.active {
  border-color: var(--cinnabar);
  background: var(--selected-surface);
  color: var(--cinnabar);
}
.rule-empty {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--ink-muted);
}
.rule-empty p {
  margin: 0;
  font-size: 12px;
}
.rule-record {
  display: grid;
  grid-template-columns: minmax(110px, 0.75fr) minmax(180px, 1.4fr) 40px;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}
.add-record {
  display: flex;
  width: 100%;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 10px;
  border: 1px dashed var(--line-strong);
  border-radius: 4px;
  background: transparent;
  color: var(--ink-muted);
  font:
    700 12px/1 'Noto Sans SC',
    sans-serif;
  cursor: pointer;
}
.add-record:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.issue-section {
  position: relative;
  padding-bottom: 90px;
}
.receipt-group {
  padding: 18px 0;
  border-top: 1px solid var(--line);
}
.receipt-group:first-of-type {
  border-top: 0;
}
.receipt-group header {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.receipt-group header > div {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--cinnabar);
}
.receipt-group header strong {
  color: var(--ink);
  font-size: 15px;
  letter-spacing: 0.06em;
}
.receipt-group dl {
  display: grid;
  gap: 8px;
  margin: 10px 0 0 27px;
}
.receipt-group dl div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  font-size: 12px;
  line-height: 1.6;
}
.receipt-group dt {
  color: var(--ink-muted);
}
.receipt-group dd {
  margin: 0;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.verified {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--cinnabar);
  font:
    700 12px/1.2 'Noto Sans SC',
    sans-serif;
}

.approval-mark {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: grid;
  width: 86px;
  height: 86px;
  place-items: center;
  border: 3px double var(--approval-color);
  border-radius: 50%;
  color: var(--approval-color);
  transform: rotate(-8deg);
}
.approval-mark::after {
  position: absolute;
  inset: 6px;
  border: 1px solid currentColor;
  border-radius: 50%;
  content: '';
}
.approval-mark span {
  margin-top: -16px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.approval-mark small {
  margin-top: -16px;
  font:
    650 12px/1 'IBM Plex Mono',
    monospace;
}

.action-bar {
  position: sticky;
  z-index: 10;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  padding: 14px max(16px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
  border-top: 1px solid var(--action-border);
  background: var(--canvas-raised);
  box-shadow: var(--action-shadow);
}

.action-spacer {
  width: 104px;
}
.button {
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 5px;
  font:
    760 13px/1 'Noto Sans SC',
    'Microsoft YaHei',
    sans-serif;
  letter-spacing: 0.06em;
  padding: 0 18px;
  cursor: pointer;
  transition:
    background-color 160ms ease-out,
    border-color 160ms ease-out,
    transform 120ms ease-out;
}
.button:active {
  transform: translateY(1px);
}
.button.secondary {
  border: 1px solid var(--secondary-border);
  background: transparent;
  color: var(--secondary-text);
}
.button.secondary:hover {
  border-color: var(--brass);
  color: var(--shell-ink);
}
.button.primary,
.button.issue-button {
  min-width: 188px;
  border: 1px solid var(--button-border);
  background: var(--cinnabar);
  box-shadow:
    inset 0 0 0 1px var(--button-inset),
    0 8px 18px var(--button-shadow);
  color: var(--button-text);
}
.button.primary:hover,
.button.issue-button:hover:not(:disabled) {
  background: var(--cinnabar-active);
}
.button.issue-button {
  min-width: 210px;
  font-size: 15px;
  letter-spacing: 0.14em;
}
.button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.status-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 12px 16px 0;
  color: var(--brass);
  font:
    650 12px/1.5 'Noto Sans SC',
    sans-serif;
  text-align: center;
}
.status-message.error {
  color: oklch(0.72 0.16 30);
}
.status-message.success {
  color: oklch(0.77 0.1 145);
}
.legal-note {
  margin: 14px 16px 18px;
  color: var(--legal-text);
  text-align: center;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@container (max-width: 620px) {
  .masthead {
    padding: 20px 18px 16px;
  }
  .masthead h1 {
    font-size: 28px;
  }
  .masthead-seal {
    flex-basis: 50px;
  }
  .theme-dock {
    padding: 0 12px 16px;
  }
  .theme-options {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .theme-option {
    min-height: 174px;
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px 10px;
  }
  .theme-glyph {
    width: 32px;
    height: 32px;
  }
  .chapter-strip {
    padding: 0 12px 14px;
  }
  .chapter-tab {
    justify-content: center;
    gap: 0;
    padding: 9px 4px;
    text-align: center;
  }
  .chapter-icon {
    width: 30px;
    height: 30px;
  }
  .chapter-copy small {
    display: none;
  }
  .chapter-copy strong {
    max-width: 4.4em;
    margin-left: 6px;
    font-size: 13px;
    white-space: normal;
  }
  .dossier {
    margin: 0 7px;
  }
  .chapter-heading {
    padding: 29px 18px 18px;
  }
  .chapter-heading h2 {
    font-size: 25px;
  }
  .chapter-body {
    padding: 0 18px 26px;
  }
  .two-col,
  .compact-grid {
    grid-template-columns: 1fr;
  }
  .empty-record {
    grid-template-columns: auto 1fr;
  }
  .empty-record button {
    grid-column: 1 / -1;
  }
  .tone-row {
    grid-template-columns: 1fr 48px;
    gap: 8px 12px;
    padding: 10px 0;
  }
  .tone-row input {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .tone-row output {
    grid-column: 2;
    grid-row: 1;
  }
  .rule-record {
    grid-template-columns: 1fr 40px;
  }
  .rule-record .control:nth-child(2) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .rule-record .icon-button {
    grid-column: 2;
    grid-row: 1;
  }
  .receipt-group dl {
    margin-left: 0;
  }
}

@container (max-width: 460px) {
  .masthead {
    align-items: flex-start;
  }
  .registry-no {
    font-size: 12px;
  }
  .masthead h1 {
    font-size: 26px;
  }
  .masthead-subtitle {
    font-size: 14px;
  }
  .masthead-seal {
    flex-basis: 52px;
  }
  .theme-options {
    grid-template-columns: 1fr;
    border-radius: 5px;
  }
  .theme-option {
    min-height: 82px;
    grid-template-columns: 32px minmax(0, 1fr) 16px;
    gap: 10px;
    border-right: 0;
    border-bottom: 1px solid var(--theme-border);
    padding: 10px 12px;
  }
  .theme-option:last-child {
    border-right: 0;
    border-bottom: 0;
  }
  .theme-glyph {
    width: 32px;
    height: 32px;
  }
  .theme-option-copy strong {
    font-size: 14px;
    white-space: normal;
  }
  .theme-option-copy small {
    display: -webkit-box;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.5;
    text-overflow: clip;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .theme-check {
    position: absolute;
    top: 4px;
    right: 4px;
  }
  .chapter-tab {
    min-height: 72px;
    flex-direction: column;
    gap: 6px;
  }
  .chapter-copy {
    display: block;
  }
  .chapter-copy strong {
    max-width: none;
    margin-left: 0;
    font-size: 13px;
    white-space: nowrap;
  }
  .chapter-heading h2 {
    font-size: 23px;
  }
  .chapter-folio {
    font-size: 12px;
  }
  .section-heading-actions {
    grid-template-columns: 36px 1fr;
  }
  .section-heading-actions.protagonist-heading {
    grid-template-columns: 36px 1fr auto;
  }
  .section-heading-actions .text-action {
    grid-column: 1 / -1;
    justify-self: stretch;
    border: 1px solid var(--line);
  }
  .receipt-group dl div {
    grid-template-columns: 72px 1fr;
    gap: 8px;
  }
  .action-bar {
    padding-inline: 10px;
  }
  .action-spacer {
    width: 0;
  }
  .button {
    min-width: 0;
    padding: 0 13px;
  }
  .button.primary {
    flex: 1;
  }
  .button.issue-button {
    flex: 1;
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-body,
  .spinning {
    animation: none;
  }
  .chapter-tab,
  .theme-option,
  .masthead-seal,
  .button,
  .control,
  .switch-row input,
  .switch-row input::after,
  .record-switch input,
  .record-switch input::after {
    transition-duration: 0.01ms;
  }
}
</style>
