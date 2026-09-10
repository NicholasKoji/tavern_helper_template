<template>
  <div class="story-image-root">
    <!-- 设置窗口使用浏览器 top layer，不受酒馆移动端容器层叠影响。 -->
    <Transition name="story-modal-fade">
      <dialog
        v-if="isModalOpen"
        ref="modalBackdropEl"
        class="story-image-modal-backdrop"
        tabindex="-1"
        @click.self="closeModal"
        @cancel.prevent="closeModal"
      >
        <div
          ref="modalEl"
          class="story-image-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-image-modal-title"
          tabindex="-1"
          @click.stop
          @keydown="handleModalKeyDown"
        >
          <!-- 头部 -->
          <div class="story-image-modal-header">
            <div id="story-image-modal-title" class="story-image-modal-title">
              <div class="story-image-brand-icon">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <div class="story-image-brand-text">
                <span class="story-image-brand-name">剧情生图</span>
              </div>
            </div>

            <div class="story-image-header-actions">
              <label class="story-image-switch-mini" title="插件启用状态">
                <input v-model="settings.enabled" type="checkbox" />
                <span class="story-image-switch-slider"></span>
                <span class="story-image-switch-label">{{ settings.enabled ? '已启用' : '已停用' }}</span>
              </label>
              <button
                type="button"
                class="story-image-modal-close"
                title="关闭设置"
                aria-label="关闭设置"
                @click="closeModal"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          <!-- 标签栏 -->
          <div class="story-image-tabs" role="tablist">
            <button
              type="button"
              class="story-image-tab-btn"
              role="tab"
              :aria-selected="currentTab === 'connection'"
              :class="{ active: currentTab === 'connection' }"
              @click="currentTab = 'connection'"
            >
              <i class="fa-solid fa-network-wired"></i>
              <span>连接与模型</span>
            </button>
            <button
              type="button"
              class="story-image-tab-btn"
              role="tab"
              :aria-selected="currentTab === 'canvas'"
              :class="{ active: currentTab === 'canvas' }"
              @click="currentTab = 'canvas'"
            >
              <i class="fa-solid fa-palette"></i>
              <span>画布与视觉</span>
            </button>
            <button
              type="button"
              class="story-image-tab-btn"
              role="tab"
              :aria-selected="currentTab === 'behavior'"
              :class="{ active: currentTab === 'behavior' }"
              @click="currentTab = 'behavior'"
            >
              <i class="fa-solid fa-sliders"></i>
              <span>行为与偏好</span>
            </button>
            <button
              type="button"
              class="story-image-tab-btn"
              role="tab"
              :aria-selected="currentTab === 'mvu'"
              :class="{ active: currentTab === 'mvu' }"
              @click="currentTab = 'mvu'"
            >
              <i class="fa-solid fa-sitemap"></i>
              <span>角色状态 (MVU)</span>
            </button>
            <button
              type="button"
              class="story-image-tab-btn"
              role="tab"
              :aria-selected="currentTab === 'references'"
              :class="{ active: currentTab === 'references' }"
              @click="currentTab = 'references'"
            >
              角色参考库
            </button>
          </div>

          <!-- 内容区 -->
          <div class="story-image-modal-body">
            <!-- TAB 1: 连接与模型 -->
            <div v-show="currentTab === 'connection'" class="story-image-tab-pane">
              <!-- A. 提示词模型 -->
              <div class="story-image-section">
                <div class="story-image-section-title">
                  <i class="fa-solid fa-camera-rotate"></i>
                  <span>A. 提示词模型 (Prompt Planner)</span>
                </div>

                <!-- 提示词连接模式 -->
                <div class="story-image-form-group">
                  <label>提示词接口模式</label>
                  <div class="story-image-protocol-cards">
                    <button
                      type="button"
                      class="story-image-proto-card"
                      :class="{ active: (settings.planner.connectionMode || 'follow-tavern') === 'follow-tavern' }"
                      :aria-pressed="(settings.planner.connectionMode || 'follow-tavern') === 'follow-tavern'"
                      @click="settings.planner.connectionMode = 'follow-tavern'"
                    >
                      <span class="proto-card-title">跟随酒馆当前连接</span>
                      <span class="proto-card-desc">复用酒馆主界面配置的当前模型，免配置独立 Key</span>
                    </button>
                    <button
                      type="button"
                      class="story-image-proto-card"
                      :class="{ active: settings.planner.connectionMode === 'custom-openai' }"
                      :aria-pressed="settings.planner.connectionMode === 'custom-openai'"
                      @click="settings.planner.connectionMode = 'custom-openai'"
                    >
                      <span class="proto-card-title">自定义 OpenAI 兼容接口</span>
                      <span class="proto-card-desc">独立配置 Chat Completions 模型与专用端点</span>
                    </button>
                  </div>
                </div>

                <!-- 跟随酒馆提示 -->
                <div
                  v-if="(settings.planner.connectionMode || 'follow-tavern') === 'follow-tavern'"
                  class="story-image-tip-card"
                >
                  <i class="fa-solid fa-circle-info"></i>
                  <div class="tip-content">
                    <div class="tip-title">正在使用酒馆主通道生成提示词</div>
                    <div class="tip-desc">
                      系统将调用酒馆内置的生文模型通道分析剧情并生成画面提示词，无需重复配置 API Key 或代理地址。
                    </div>
                  </div>
                </div>

                <!-- 自定义提示词模型配置表单 -->
                <template v-if="settings.planner.connectionMode === 'custom-openai'">
                  <!-- 基础服务地址 -->
                  <div class="story-image-form-group">
                    <label>提示词服务地址 (Base URL)</label>
                    <div class="story-image-desc">
                      支持输入服务根路径（如 http://127.0.0.1:8000/v1 或
                      https://api.openai.com/v1），失焦或回车自动推导接口。
                    </div>
                    <div class="story-image-input-wrap">
                      <input
                        v-model="plannerBaseUrlInputValue"
                        type="text"
                        class="story-image-input"
                        placeholder="例如: https://api.openai.com/v1 或 http://127.0.0.1:8000/v1"
                        @input="onPlannerBaseUrlInput"
                        @blur="commitPlannerBaseUrl"
                        @change="commitPlannerBaseUrl"
                        @paste="onPlannerBaseUrlPaste"
                        @keydown.enter="commitPlannerBaseUrl"
                      />
                    </div>
                  </div>

                  <!-- API Key -->
                  <div class="story-image-form-group">
                    <label>提示词 API Key</label>
                    <div class="story-image-input-wrap has-append">
                      <input
                        v-model="settings.planner.apiKey"
                        :type="plannerShowApiKey ? 'text' : 'password'"
                        class="story-image-input"
                        placeholder="留空则不附带 Bearer Authorization 请求头"
                        autocomplete="off"
                        @input="resetPlannerFetchStatus"
                      />
                      <button
                        type="button"
                        class="story-image-input-append-btn"
                        :title="plannerShowApiKey ? '隐藏 API Key' : '显示 API Key'"
                        :aria-label="plannerShowApiKey ? '隐藏 API Key' : '显示 API Key'"
                        @click="plannerShowApiKey = !plannerShowApiKey"
                      >
                        <i :class="plannerShowApiKey ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                      </button>
                    </div>
                  </div>

                  <!-- 模型拉取与选择 -->
                  <div class="story-image-form-group">
                    <div class="story-image-label-row">
                      <label>提示词模型 (Model)</label>
                      <button
                        type="button"
                        class="story-image-btn story-image-btn-sm story-image-btn-secondary"
                        :disabled="isFetchingPlannerModels"
                        @click="onFetchPlannerModelsClick"
                      >
                        <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isFetchingPlannerModels }"></i>
                        <span>{{ isFetchingPlannerModels ? '正在连接拉取…' : '连接并获取模型' }}</span>
                      </button>
                    </div>

                    <!-- 状态反馈条 -->
                    <div
                      v-if="plannerFetchStatus"
                      class="story-image-status-banner"
                      :class="plannerFetchStatus.type === 'success' ? 'is-success' : 'is-error'"
                    >
                      <i
                        :class="
                          plannerFetchStatus.type === 'success'
                            ? 'fa-solid fa-circle-check'
                            : 'fa-solid fa-circle-exclamation'
                        "
                      ></i>
                      <span>{{ plannerFetchStatus.message }}</span>
                    </div>

                    <!-- 模型下拉 + 自定义输入 -->
                    <div class="story-image-model-picker">
                      <select
                        v-if="settings.planner.availableModels && settings.planner.availableModels.length > 0"
                        v-model="plannerModelSelectValue"
                        class="story-image-select"
                        @change="onPlannerModelSelectChange"
                      >
                        <option value="__custom__">-- 手动输入自定义模型 --</option>
                        <option v-for="m in settings.planner.availableModels" :key="m" :value="m">
                          {{ m }}
                        </option>
                      </select>

                      <input
                        v-if="
                          !settings.planner.availableModels ||
                          settings.planner.availableModels.length === 0 ||
                          plannerModelSelectValue === '__custom__'
                        "
                        v-model="settings.planner.model"
                        type="text"
                        class="story-image-input"
                        placeholder="例如: gpt-4o-mini / gemini-2.0-flash / deepseek-chat"
                        @input="resetPlannerFetchStatus"
                      />
                    </div>
                  </div>

                  <!-- 高级接口展开 -->
                  <div class="story-image-advanced-box">
                    <button
                      type="button"
                      class="story-image-advanced-toggle"
                      :aria-expanded="plannerShowAdvanced"
                      @click="plannerShowAdvanced = !plannerShowAdvanced"
                    >
                      <span>提示词高级接口微调 (完整 Endpoint)</span>
                      <i class="fa-solid fa-chevron-right" :class="{ 'is-expanded': plannerShowAdvanced }"></i>
                    </button>

                    <div v-show="plannerShowAdvanced" class="story-image-advanced-content">
                      <label class="story-image-checkbox-row" style="margin-bottom: 8px">
                        <input v-model="settings.planner.customEndpointOverride" type="checkbox" />
                        <span>启用手动覆盖完整接口（禁用根据 Base URL 自动推导）</span>
                      </label>

                      <div class="story-image-form-group">
                        <label>完整对话接口 (Endpoint)</label>
                        <input
                          v-model="settings.planner.endpoint"
                          type="text"
                          class="story-image-input"
                          :disabled="!settings.planner.customEndpointOverride"
                          placeholder="例如: https://api.openai.com/v1/chat/completions"
                          @input="resetPlannerFetchStatus"
                        />
                      </div>

                      <div class="story-image-form-group">
                        <label>模型列表接口 (Models Endpoint)</label>
                        <input
                          v-model="settings.planner.modelsEndpoint"
                          type="text"
                          class="story-image-input"
                          :disabled="!settings.planner.customEndpointOverride"
                          placeholder="例如: https://api.openai.com/v1/models"
                          @input="resetPlannerFetchStatus"
                        />
                      </div>

                      <div class="story-image-form-group">
                        <label>提示词请求超时时间 (毫秒)</label>
                        <input
                          v-model.number="settings.planner.timeoutMs"
                          type="number"
                          min="5000"
                          step="1000"
                          class="story-image-input"
                          placeholder="60000"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- B. 生图模型 -->
              <div class="story-image-section">
                <div class="story-image-section-title">
                  <i class="fa-solid fa-image"></i>
                  <span>B. 生图模型 (Image Generator)</span>
                </div>

                <!-- 协议选择 -->
                <div class="story-image-form-group">
                  <label>生图接口协议</label>
                  <div class="story-image-protocol-cards">
                    <button
                      type="button"
                      class="story-image-proto-card"
                      :class="{ active: settings.provider.protocol === 'openai-images' }"
                      :aria-pressed="settings.provider.protocol === 'openai-images'"
                      @click="handleProtocolChange('openai-images')"
                    >
                      <span class="proto-card-title">OpenAI Images 兼容</span>
                      <span class="proto-card-desc">/v1/images/generations 标准生图接口</span>
                    </button>
                    <button
                      type="button"
                      class="story-image-proto-card"
                      :class="{ active: settings.provider.protocol === 'chat-completions' }"
                      :aria-pressed="settings.provider.protocol === 'chat-completions'"
                      @click="handleProtocolChange('chat-completions')"
                    >
                      <span class="proto-card-title">Chat Completions 对话</span>
                      <span class="proto-card-desc">/v1/chat/completions 多模态输出模型</span>
                    </button>
                  </div>
                </div>

                <!-- 基础服务地址 -->
                <div class="story-image-form-group">
                  <label>生图服务地址 (Base URL)</label>
                  <div class="story-image-desc">
                    支持输入服务根路径（如
                    http://127.0.0.1:8000/v1），失焦或按回车时自动推导；亦可直接粘贴完整接口地址。
                  </div>
                  <div class="story-image-input-wrap">
                    <input
                      v-model="baseUrlInputValue"
                      type="text"
                      class="story-image-input"
                      placeholder="例如: https://api.openai.com/v1 或 http://127.0.0.1:8000/v1"
                      @input="onBaseUrlInput"
                      @blur="commitBaseUrl"
                      @change="commitBaseUrl"
                      @paste="onBaseUrlPaste"
                      @keydown.enter="commitBaseUrl"
                    />
                  </div>
                </div>

                <!-- API Key -->
                <div class="story-image-form-group">
                  <label>生图 API Key</label>
                  <div class="story-image-input-wrap has-append">
                    <input
                      v-model="settings.provider.apiKey"
                      :type="showApiKey ? 'text' : 'password'"
                      class="story-image-input"
                      placeholder="留空则不附带 Bearer Authorization 请求头"
                      autocomplete="off"
                      @input="resetFetchStatus"
                    />
                    <button
                      type="button"
                      class="story-image-input-append-btn"
                      :title="showApiKey ? '隐藏 API Key' : '显示 API Key'"
                      :aria-label="showApiKey ? '隐藏 API Key' : '显示 API Key'"
                      @click="showApiKey = !showApiKey"
                    >
                      <i :class="showApiKey ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- 模型拉取与选择 -->
                <div class="story-image-form-group">
                  <div class="story-image-label-row">
                    <label>生图模型 (Model)</label>
                    <button
                      type="button"
                      class="story-image-btn story-image-btn-sm story-image-btn-secondary"
                      :disabled="isFetchingModels"
                      @click="onFetchModelsClick"
                    >
                      <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isFetchingModels }"></i>
                      <span>{{ isFetchingModels ? '正在连接拉取…' : '连接并获取模型' }}</span>
                    </button>
                  </div>

                  <!-- 状态反馈条 -->
                  <div
                    v-if="fetchStatus"
                    class="story-image-status-banner"
                    :class="fetchStatus.type === 'success' ? 'is-success' : 'is-error'"
                  >
                    <i
                      :class="
                        fetchStatus.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'
                      "
                    ></i>
                    <span>{{ fetchStatus.message }}</span>
                  </div>

                  <!-- 模型下拉 + 自定义输入 -->
                  <div class="story-image-model-picker">
                    <select
                      v-if="settings.provider.availableModels && settings.provider.availableModels.length > 0"
                      v-model="modelSelectValue"
                      class="story-image-select"
                      @change="onModelSelectChange"
                    >
                      <option value="__custom__">-- 手动输入自定义模型 --</option>
                      <option v-for="m in settings.provider.availableModels" :key="m" :value="m">
                        {{ m }}
                      </option>
                    </select>

                    <input
                      v-if="
                        !settings.provider.availableModels ||
                        settings.provider.availableModels.length === 0 ||
                        modelSelectValue === '__custom__'
                      "
                      v-model="settings.provider.model"
                      type="text"
                      class="story-image-input"
                      :placeholder="
                        settings.provider.protocol === 'openai-images'
                          ? '例如: gpt-image-1 / dall-e-3'
                          : '例如: gemini-2.5-flash-image / dall-e-3'
                      "
                      @input="resetFetchStatus"
                    />
                  </div>
                </div>

                <!-- 高级接口展开 -->
                <div class="story-image-advanced-box">
                  <button
                    type="button"
                    class="story-image-advanced-toggle"
                    :aria-expanded="showAdvancedEndpoints"
                    @click="showAdvancedEndpoints = !showAdvancedEndpoints"
                  >
                    <span>生图高级接口微调 (按需自定义完整 Endpoint)</span>
                    <i class="fa-solid fa-chevron-right" :class="{ 'is-expanded': showAdvancedEndpoints }"></i>
                  </button>

                  <div v-show="showAdvancedEndpoints" class="story-image-advanced-content">
                    <label class="story-image-checkbox-row" style="margin-bottom: 8px">
                      <input v-model="settings.provider.customEndpointOverride" type="checkbox" />
                      <span>启用手动覆盖完整接口（禁用根据 Base URL 自动推导）</span>
                    </label>

                    <div class="story-image-form-group">
                      <label>完整生图接口 (Endpoint)</label>
                      <input
                        v-model="settings.provider.endpoint"
                        type="text"
                        class="story-image-input"
                        :disabled="!settings.provider.customEndpointOverride"
                        placeholder="例如: https://api.openai.com/v1/images/generations"
                        @input="resetFetchStatus"
                      />
                    </div>

                    <div class="story-image-form-group">
                      <label>模型列表接口 (Models Endpoint)</label>
                      <input
                        v-model="settings.provider.modelsEndpoint"
                        type="text"
                        class="story-image-input"
                        :disabled="!settings.provider.customEndpointOverride"
                        placeholder="例如: https://api.openai.com/v1/models"
                        @input="resetFetchStatus"
                      />
                    </div>

                    <div class="story-image-form-group">
                      <label>超时时间 (毫秒，默认 10 分钟)</label>
                      <input
                        v-model.number="settings.provider.timeoutMs"
                        type="number"
                        min="5000"
                        step="1000"
                        class="story-image-input"
                        placeholder="600000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: 画布与视觉 -->
            <div v-show="currentTab === 'canvas'" class="story-image-tab-pane">
              <div class="story-image-section">
                <div class="story-image-section-title">
                  <i class="fa-solid fa-crop-simple"></i>
                  <span>画幅与尺寸</span>
                </div>

                <!-- 画幅选择 (卡片 Chip) -->
                <div class="story-image-form-group">
                  <label>目标画幅</label>
                  <div class="story-image-ratio-grid">
                    <button
                      v-for="preset in aspectRatioPresets"
                      :key="preset.id"
                      type="button"
                      class="story-image-ratio-card"
                      :class="{ active: settings.canvas.aspectRatioPreset === preset.id }"
                      :aria-pressed="settings.canvas.aspectRatioPreset === preset.id"
                      @click="selectAspectRatio(preset.id)"
                    >
                      <span class="ratio-preview-box">
                        <span class="ratio-preview-rect" :style="preset.style"></span>
                      </span>
                      <span class="ratio-label">{{ preset.label }}</span>
                      <span class="ratio-sub">{{ preset.sub }}</span>
                    </button>
                  </div>

                  <input
                    v-if="settings.canvas.aspectRatioPreset === 'custom'"
                    v-model="settings.canvas.customAspectRatio"
                    type="text"
                    class="story-image-input"
                    style="margin-top: 8px"
                    placeholder="自定义画幅，如 4:5 或 21:9"
                  />
                </div>

                <!-- 请求尺寸 -->
                <div class="story-image-form-group">
                  <label>请求尺寸 (Size)</label>
                  <select v-model="settings.canvas.sizePreset" class="story-image-select">
                    <option value="1024x1024">1024x1024 (正方形 1:1)</option>
                    <option value="1024x1536">1024x1536 (竖版 2:3 / 3:4 / 9:16)</option>
                    <option value="1536x1024">1536x1024 (横版 3:2 / 4:3 / 16:9)</option>
                    <option value="custom">自定义尺寸</option>
                  </select>

                  <input
                    v-if="settings.canvas.sizePreset === 'custom'"
                    v-model="settings.canvas.customSize"
                    type="text"
                    class="story-image-input"
                    style="margin-top: 6px"
                    placeholder="如 768x1152"
                  />
                </div>
              </div>

              <div class="story-image-section">
                <div class="story-image-section-title">
                  <i class="fa-solid fa-paintbrush"></i>
                  <span>画面表现与渲染偏好</span>
                </div>

                <!-- 构图要求 -->
                <div class="story-image-form-group">
                  <label>最大入画人数（上限，不必凑满）</label>
                  <input
                    v-model.number="settings.visual.maxVisiblePeople"
                    type="number"
                    min="1"
                    step="1"
                    class="story-image-input"
                  />
                </div>
                <div class="story-image-form-group">
                  <label>构图要求</label>
                  <div class="story-image-preset-combo">
                    <select v-model="settings.visual.compositionPreset" class="story-image-select">
                      <option value="根据剧情选择最能表达当前情节的镜头">
                        根据剧情选择最能表达当前情节的镜头 (推荐默认)
                      </option>
                      <option value="特写镜头，聚焦主体神态与细节">特写镜头，聚焦主体神态与细节</option>
                      <option value="中景镜头，展现人物互动与动作">中景镜头，展现人物互动与动作</option>
                      <option value="全景远景，展现环境与空间氛围">全景远景，展现环境与空间氛围</option>
                      <option value="低角度仰视，增强气势与压迫感">低角度仰视，增强气势与压迫感</option>
                      <option value="高角度俯视，展现全局与局势">高角度俯视，展现全局与局势</option>
                      <option value="电影级景深，虚化背景突出主体">电影级景深，虚化背景突出主体</option>
                      <option value="custom">仅使用下方自定义文本</option>
                    </select>
                    <input
                      v-model="settings.visual.compositionCustom"
                      type="text"
                      class="story-image-input"
                      placeholder="自定义构图补充说明（可选）"
                    />
                  </div>
                </div>

                <!-- 风格要求 -->
                <div class="story-image-form-group">
                  <label>风格要求</label>
                  <div class="story-image-preset-combo">
                    <select v-model="settings.visual.stylePreset" class="story-image-select">
                      <option v-for="preset in STYLE_PRESETS" :key="preset.id" :value="preset.id">
                        {{ preset.label }}
                      </option>
                      <option value="电影感叙事插画">电影感叙事插画（旧预设）</option>
                      <option value="二次元精致动漫风">二次元精致动漫风</option>
                      <option value="写实摄影质感">写实摄影质感</option>
                      <option value="古典油画质感">古典油画质感</option>
                      <option value="赛博朋克科幻风">赛博朋克科幻风</option>
                      <option value="水墨国风意境">水墨国风意境</option>
                      <option value="奇幻概念艺术">奇幻概念艺术</option>
                      <option value="custom">仅使用下方自定义文本</option>
                    </select>
                    <input
                      v-model="settings.visual.styleCustom"
                      type="text"
                      class="story-image-input"
                      placeholder="自定义风格补充说明（可选）"
                    />
                  </div>
                </div>

                <!-- 光线与色彩 -->
                <div class="story-image-form-group">
                  <label>女性人物特化</label>
                  <select v-model="settings.visual.characterSpecialization" class="story-image-select">
                    <option v-for="item in CHARACTER_SPECIALIZATIONS" :key="item.id" :value="item.id">
                      {{ item.label }}
                    </option>
                  </select>
                  <p>{{ selectedSpecialization.summary }}</p>
                  <p>仅女性：脸部、体型、比例、妆发和仪态优先于正文与风格；身份、明确年龄、服装与事件仍按剧情。</p>
                  <details v-if="selectedSpecialization.id !== 'none'">
                    <summary>编辑完整特化内容</summary>
                    <textarea
                      v-model="specializationContent"
                      class="story-image-input"
                      rows="14"
                      style="width: 100%; resize: vertical"
                    />
                    <button type="button" class="menu_button" @click="restoreSpecialization">
                      恢复当前选项默认内容
                    </button>
                  </details>
                </div>

                <div class="story-image-form-group">
                  <label>光线与色彩</label>
                  <div class="story-image-preset-combo">
                    <select v-model="settings.visual.lightingPreset" class="story-image-select">
                      <option value="符合场景时间、环境和情绪的自然光线">
                        符合场景时间、环境和情绪的自然光线 (推荐默认)
                      </option>
                      <option value="清晨柔和晨光，温暖通透">清晨柔和晨光，温暖通透</option>
                      <option value="正午强烈顶光，明暗对比分明">正午强烈顶光，明暗对比分明</option>
                      <option value="黄昏温暖夕阳，金橙色逆光轮廓">黄昏温暖夕阳，金橙色逆光轮廓</option>
                      <option value="夜晚幽暗月光，冷色微光与阴影">夜晚幽暗月光，冷色微光与阴影</option>
                      <option value="室内暖色漫射光，温馨静谧">室内暖色漫射光，温馨静谧</option>
                      <option value="戏剧性侧光，强烈丁达尔光束">戏剧性侧光，强烈丁达尔光束</option>
                      <option value="霓虹炫光，高饱和夜景色彩">霓虹炫光，高饱和夜景色彩</option>
                      <option value="custom">仅使用下方自定义文本</option>
                    </select>
                    <input
                      v-model="settings.visual.lightingCustom"
                      type="text"
                      class="story-image-input"
                      placeholder="自定义光线补充说明（可选）"
                    />
                  </div>
                </div>

                <!-- 质量要求 -->
                <div class="story-image-form-group">
                  <label>画面质量</label>
                  <div class="story-image-preset-combo">
                    <select v-model="settings.visual.qualityPreset" class="story-image-select">
                      <option value="主体清晰，空间关系明确，细节完整">
                        主体清晰，空间关系明确，细节完整 (推荐默认)
                      </option>
                      <option value="最高画质，大师级杰作，极致细节">最高画质，大师级杰作，极致细节</option>
                      <option value="高分辨率，精细纹理，电影级光影渲染">高分辨率，精细纹理，电影级光影渲染</option>
                      <option value="custom">仅使用下方自定义文本</option>
                    </select>
                    <input
                      v-model="settings.visual.qualityCustom"
                      type="text"
                      class="story-image-input"
                      placeholder="自定义质量补充说明（可选）"
                    />
                  </div>
                </div>

                <!-- 全局自定义要求 -->
                <div class="story-image-form-group">
                  <label>全局自定义要求 (正向提示)</label>
                  <textarea
                    v-model="settings.visual.globalRequirements"
                    rows="2"
                    class="story-image-settings-textarea"
                    placeholder="每次生图自动附带的全局要求（例如特定画风、特定氛围基调等）"
                  ></textarea>
                </div>

                <!-- 全局避免要求 -->
                <div class="story-image-form-group">
                  <label>全局避免要求 (负向提示)</label>
                  <textarea
                    v-model="settings.visual.avoidRequirements"
                    rows="2"
                    class="story-image-settings-textarea"
                    placeholder="要求画面严格避免出现的瑕疵或元素"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- TAB 3: 行为与偏好 -->
            <div v-show="currentTab === 'behavior'" class="story-image-tab-pane">
              <div class="story-image-section">
                <div class="story-image-section-title">
                  <i class="fa-solid fa-robot"></i>
                  <span>自动化与触发方式</span>
                </div>

                <!-- 总开关 -->
                <div class="story-image-setting-card">
                  <div class="setting-card-info">
                    <div class="setting-card-title">启用剧情生图助手</div>
                    <div class="setting-card-desc">开启后将在酒馆聊天楼层中显示插画与操作插槽。</div>
                  </div>
                  <label class="story-image-switch">
                    <input v-model="settings.enabled" type="checkbox" />
                    <span class="story-image-switch-slider"></span>
                  </label>
                </div>

                <!-- 1. 新回复自动生成提示词 -->
                <div class="story-image-setting-card">
                  <div class="setting-card-info">
                    <div class="setting-card-title">新回复自动生成提示词</div>
                    <div class="setting-card-desc">
                      开启后，AI 回复完成时自动分析剧情并生成画面提示词；关闭后需手动点击生成。
                    </div>
                  </div>
                  <label class="story-image-switch">
                    <input v-model="settings.behavior.autoPlanEnabled" type="checkbox" />
                    <span class="story-image-switch-slider"></span>
                  </label>
                </div>

                <!-- 2. 提示词完成后自动生成图片 -->
                <div class="story-image-setting-card">
                  <div class="setting-card-info">
                    <div class="setting-card-title">提示词完成后自动生成图片</div>
                    <div class="setting-card-desc">
                      开启后，无论提示词由新回复自动触发还是手动触发，AI
                      提示词生成成功后，所有返回场景都会进入队列，依次生成图片；单个失败不阻塞后续场景。
                    </div>
                  </div>
                  <label class="story-image-switch">
                    <input v-model="settings.behavior.autoGenerateImageEnabled" type="checkbox" />
                    <span class="story-image-switch-slider"></span>
                  </label>
                </div>

                <!-- 提示词上下文条数 -->
                <div class="story-image-form-group" style="margin-top: 14px">
                  <label>每楼场景数量</label>
                  <input
                    v-model.number="settings.planner.sceneCount"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    class="story-image-input"
                  />
                  <p>
                    最多规划 1～10
                    个不同场景，正文不足时可少于设置数量。各场景独立锚定，可任选生图；开启自动生图后全部串行生成。
                  </p>
                  <label>提示词参考上文条数: {{ settings.planner.contextMessageCount }} 条</label>
                  <div class="story-image-desc">生成提示词时附带当前楼层前的聊天记录条数（0 - 6）</div>
                  <input
                    v-model.number="settings.planner.contextMessageCount"
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    class="story-image-input"
                  />
                </div>
              </div>

              <div class="story-image-section">
                <div class="story-image-section-title">
                  <i class="fa-solid fa-hand-pointer"></i>
                  <span>交互手势与操作栏</span>
                </div>

                <!-- 双击触发 -->
                <div class="story-image-setting-card">
                  <div class="setting-card-info">
                    <div class="setting-card-title">桌面端双击助手正文快捷触发</div>
                    <div class="setting-card-desc">
                      仅桌面鼠标双击正文时打开选项框；移动端请点击楼层编辑按钮旁的「画图」。
                    </div>
                  </div>
                  <label class="story-image-switch">
                    <input v-model="settings.behavior.enableDoubleClick" type="checkbox" />
                    <span class="story-image-switch-slider"></span>
                  </label>
                </div>

                <!-- 移动端/助手显式画图按钮 -->
                <div class="story-image-setting-card">
                  <div class="setting-card-info">
                    <div class="setting-card-title">楼层画图入口</div>
                    <div class="setting-card-desc">
                      助手楼层编辑按钮旁固定显示「画图」，桌面与手机均可点击打开选项框，不直接生图。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ReferenceLibrary
              v-if="currentTab === 'references' && isModalOpen"
              :key="activeReferenceOwner"
              :settings="settings"
            />
            <!-- TAB 4: 角色状态 (MVU) -->
            <div v-show="currentTab === 'mvu'" class="story-image-tab-pane">
              <!-- 顶部状态与开关卡片 -->
              <div class="story-image-section">
                <div class="mvu-status-header">
                  <div class="mvu-status-info">
                    <div class="mvu-status-title">
                      <i class="fa-solid fa-id-card-clip"></i>
                      <span
                        >当前绑定角色卡：<strong>{{ activeCharName }}</strong></span
                      >
                    </div>
                    <div class="mvu-status-badges">
                      <span class="mvu-badge" :class="isMvuAvailable ? 'is-success' : 'is-warn'">
                        <i class="fa-solid" :class="isMvuAvailable ? 'fa-check' : 'fa-triangle-exclamation'"></i>
                        {{ isMvuAvailable ? 'MVU 框架已就绪' : '未检测到 MVU 全局环境' }}
                      </span>
                      <span class="mvu-badge is-info"> 独立保存至当前角色卡 </span>
                    </div>
                  </div>

                  <div class="mvu-status-toggle">
                    <label class="story-image-switch" title="是否将状态注入到场景提示词规划中">
                      <input v-model="charMvuSettings.enabled" type="checkbox" />
                      <span class="story-image-switch-slider"></span>
                    </label>
                    <span class="mvu-toggle-label">{{
                      charMvuSettings.enabled ? '已启用状态参考' : '已停用状态参考'
                    }}</span>
                  </div>
                </div>

                <div class="mvu-desc-card">
                  <i class="fa-solid fa-circle-info"></i>
                  <span>
                    在此勾选当前角色卡中需要提供给生图规划器的基准状态（如当前服装、发型、地点、随身物品等）。
                    系统会自动将其转换为<strong>无变量标记的自然语义参考</strong>注入提示词，让 AI
                    更好地统一画面的外观与场景细节。
                  </span>
                </div>
              </div>

              <!-- 树形结构选择区 -->
              <div class="story-image-section">
                <div class="story-image-section-title">
                  <div class="section-title-left">
                    <i class="fa-solid fa-folder-tree"></i>
                    <span>当前角色的状态树</span>
                    <span v-if="charMvuSettings.rules.length > 0" class="mvu-badge is-info"
                      >已选 {{ charMvuSettings.rules.length }} 项</span
                    >
                  </div>
                  <div class="section-title-actions">
                    <button
                      v-if="charMvuSettings.rules.length > 0"
                      type="button"
                      class="story-image-btn-sm"
                      title="清空所有已选状态项"
                      @click="clearAllMvuSelections"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                      <span>清空勾选</span>
                    </button>
                    <button
                      type="button"
                      class="story-image-btn-sm"
                      :disabled="isFetchingMvuTree"
                      @click="fetchCurrentMvuTree"
                    >
                      <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': isFetchingMvuTree }"></i>
                      <span>{{ isFetchingMvuTree ? '抓取中...' : '抓取当前聊天结构' }}</span>
                    </button>
                    <button
                      v-if="mvuTree.length > 0"
                      type="button"
                      class="story-image-btn-sm"
                      @click="expandAllMvuTree"
                    >
                      <i class="fa-solid fa-angles-down"></i>
                      <span>展开全部</span>
                    </button>
                    <button
                      v-if="mvuTree.length > 0"
                      type="button"
                      class="story-image-btn-sm"
                      @click="collapseAllMvuTree"
                    >
                      <i class="fa-solid fa-angles-up"></i>
                      <span>收起全部</span>
                    </button>
                  </div>
                </div>

                <!-- 搜索过滤 -->
                <div v-if="mvuTree.length > 0" class="mvu-search-bar">
                  <i class="fa-solid fa-magnifying-glass"></i>
                  <input
                    v-model="mvuSearchQuery"
                    type="text"
                    class="story-image-input"
                    placeholder="快速搜索路径或键名（如：服装、发型、地点）..."
                  />
                  <button
                    v-if="mvuSearchQuery"
                    type="button"
                    class="mvu-search-clear"
                    title="清空搜索"
                    @click="mvuSearchQuery = ''"
                  >
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <!-- 抓取报错提示 -->
                <div v-if="mvuFetchError" class="mvu-error-box">
                  <i class="fa-solid fa-circle-exclamation"></i>
                  <span>{{ mvuFetchError }}</span>
                </div>

                <!-- 树形展示容器 -->
                <div v-if="filteredMvuTree.length > 0" class="mvu-tree-container">
                  <MvuTreeNodeItem
                    v-for="rootNode in filteredMvuTree"
                    :key="rootNode.path"
                    :node="rootNode"
                    :depth="0"
                    :selected-paths="selectedMvuPaths"
                    :collapsed-paths="collapsedPaths"
                    @toggle-select="handleTreeToggleSelect"
                    @toggle-collapse="handleTreeToggleCollapse"
                  />
                </div>

                <!-- 未抓取或为空提示 -->
                <div v-else-if="!isFetchingMvuTree" class="mvu-empty-tree-box">
                  <div class="mvu-empty-icon">
                    <i class="fa-solid fa-sitemap"></i>
                  </div>
                  <div class="mvu-empty-text">
                    {{
                      mvuTree.length === 0 ? '暂未抓取当前角色的状态树，点击上方按钮一键读取' : '未找到匹配的状态节点'
                    }}
                  </div>
                  <button
                    v-if="mvuTree.length === 0"
                    type="button"
                    class="story-image-btn story-image-btn-primary"
                    @click="fetchCurrentMvuTree"
                  >
                    <i class="fa-solid fa-arrows-rotate"></i>
                    <span>抓取当前聊天状态结构</span>
                  </button>
                </div>
              </div>

              <!-- 实时注入效果预览 -->
              <div class="story-image-section">
                <div class="story-image-section-title">
                  <div class="section-title-left">
                    <i class="fa-solid fa-code"></i>
                    <span>状态注入快照预览（点击抓取刷新）</span>
                  </div>
                </div>
                <div class="mvu-preview-box">
                  <div class="mvu-preview-label">
                    <span
                      >来源消息 ID：{{ previewMessageId ?? '未读取' }}；{{
                        charMvuSettings.enabled ? '已启用' : '已关闭，不注入'
                      }}。历史楼层请求读取其自身状态。</span
                    >
                  </div>
                  <pre class="mvu-preview-code"><code>{{ mvuPreviewJson }}</code></pre>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部工具栏 -->
          <div class="story-image-modal-footer">
            <div class="story-image-footer-note">
              <i class="fa-solid fa-circle-check"></i>
              <span>设置实时生效并自动持久化保存</span>
            </div>
            <button type="button" class="story-image-btn story-image-btn-primary" @click="handleDoneClick">
              <i class="fa-solid fa-check"></i>
              <span>完成</span>
            </button>
          </div>
        </div>
      </dialog>
    </Transition>

    <!-- 快捷菜单使用原生顶层 dialog，避开宿主层叠与裁剪。 -->
    <Transition name="story-popover-fade">
      <dialog
        v-if="popoverState.visible"
        ref="popoverBackdropEl"
        class="story-image-popover-backdrop"
        tabindex="-1"
        @click.self="closeActionPopover"
        @cancel.prevent="closeActionPopover"
      >
        <div
          ref="popoverEl"
          class="story-image-popover-menu"
          :style="popoverStyle"
          role="menu"
          aria-label="剧情生图快捷操作菜单"
          tabindex="-1"
          @click.stop
          @keydown="handlePopoverKeyDown"
        >
          <div class="story-image-popover-header">
            <div class="story-image-popover-title">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>剧情生图 · 第 {{ popoverState.messageId + 1 }} 楼</span>
            </div>
            <button
              type="button"
              class="story-image-popover-close"
              title="关闭快捷菜单"
              aria-label="关闭快捷菜单"
              @click="closeActionPopover"
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="story-image-popover-body">
            <button
              v-for="(actionItem, idx) in popoverActions"
              :key="actionItem.id"
              :ref="el => setActionBtnRef(el, idx)"
              type="button"
              class="story-image-popover-item"
              role="menuitem"
              :tabindex="0"
              @click="triggerPopoverAction(actionItem.id, currentFloorState || popoverState.stateHint)"
            >
              <div class="popover-item-icon">
                <i :class="actionItem.icon"></i>
              </div>
              <div class="popover-item-content">
                <div class="popover-item-label">
                  <span>{{ actionItem.label }}</span>
                </div>
                <div class="popover-item-desc">{{ actionItem.desc }}</div>
              </div>
            </button>
          </div>
        </div>
      </dialog>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { STYLE_PRESETS } from './style-presets';
import { CHARACTER_SPECIALIZATIONS } from './character-specialization';
import { storeToRefs } from 'pinia';
import { deriveChatEndpoints, deriveEndpoints, fetchModels, useStoryImageSettingsStore } from './settings';
import { bindSettingsDialog } from './settings-dialog';
import { getTavernViewport, tavernDocument } from './tavern-dom';
import { closeActionPopover, closeModal, isModalOpen, popoverState, triggerPopoverAction } from './ui-state';
import { getSwipeState } from './message-state';
import MvuTreeNodeItem from './MvuTreeNodeItem.vue';
import ReferenceLibrary from './ReferenceLibrary.vue';
import { referenceOwner } from './reference-library';
import {
  buildMvuTree,
  extractSelectedMvuState,
  getActiveCharacterKey,
  getActiveCharacterName,
  getCharacterMvuSettings,
  safeCheckMvuAvailable,
  safeGetMvuData,
  saveCharacterMvuSettings,
} from './mvu-state';
import type { AspectRatioPreset, CharacterMvuSettings, MvuTreeNode, PopoverAction, ProviderProtocol } from './types';

const settingsStore = useStoryImageSettingsStore();
const { settings } = storeToRefs(settingsStore);
const selectedSpecialization = computed(
  () =>
    CHARACTER_SPECIALIZATIONS.find(item => item.id === settings.value.visual.characterSpecialization) ??
    CHARACTER_SPECIALIZATIONS[0],
);
const specializationContent = computed({
  get: () =>
    settings.value.visual.characterSpecializationEdits?.[selectedSpecialization.value.id] ??
    selectedSpecialization.value.content,
  set: value => {
    settings.value.visual.characterSpecializationEdits ??= {};
    settings.value.visual.characterSpecializationEdits[selectedSpecialization.value.id] = value;
  },
});
function restoreSpecialization() {
  delete settings.value.visual.characterSpecializationEdits[selectedSpecialization.value.id];
}

const activeReferenceOwner = ref(referenceOwner());
eventOn(tavern_events.CHAT_CHANGED, () => {
  activeReferenceOwner.value = referenceOwner();
});
const currentTab = ref<'connection' | 'canvas' | 'behavior' | 'mvu' | 'references'>('connection');

// --- 提示词模型 (Prompt Planner) ---
const plannerShowApiKey = ref(false);
const plannerShowAdvanced = ref(false);
const isFetchingPlannerModels = ref(false);
const plannerFetchStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const plannerBaseUrlInputValue = ref(settings.value.planner.baseUrl || '');

watch(
  () => settings.value.planner.baseUrl,
  newVal => {
    if (newVal !== plannerBaseUrlInputValue.value) {
      plannerBaseUrlInputValue.value = newVal;
    }
  },
);

function resetPlannerFetchStatus() {
  plannerFetchStatus.value = null;
}

function onPlannerBaseUrlInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  plannerBaseUrlInputValue.value = val;
  settings.value.planner.baseUrl = val;
  resetPlannerFetchStatus();
}

function commitPlannerBaseUrl() {
  const val = (plannerBaseUrlInputValue.value || '').trim();
  if (!settings.value.planner.customEndpointOverride && val) {
    const derived = deriveChatEndpoints(val);
    settings.value.planner.baseUrl = derived.baseUrl;
    plannerBaseUrlInputValue.value = derived.baseUrl;
    settings.value.planner.endpoint = derived.endpoint;
    settings.value.planner.modelsEndpoint = derived.modelsEndpoint;
  }
}

function onPlannerBaseUrlPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text') ?? '';
  if (pasted.includes('/chat/completions') || pasted.includes('/models')) {
    nextTick(() => {
      commitPlannerBaseUrl();
    });
  }
}

const plannerModelSelectValue = ref<string>(
  settings.value.planner.availableModels?.includes(settings.value.planner.model)
    ? settings.value.planner.model
    : '__custom__',
);

watch(
  () => settings.value.planner.model,
  newModel => {
    if (settings.value.planner.availableModels?.includes(newModel)) {
      plannerModelSelectValue.value = newModel;
    } else {
      plannerModelSelectValue.value = '__custom__';
    }
  },
);

function onPlannerModelSelectChange() {
  if (plannerModelSelectValue.value !== '__custom__') {
    settings.value.planner.model = plannerModelSelectValue.value;
  }
}

async function onFetchPlannerModelsClick() {
  if (isFetchingPlannerModels.value) return;
  plannerFetchStatus.value = null;

  let modelsUrl = settings.value.planner.modelsEndpoint;
  if (!modelsUrl && settings.value.planner.baseUrl) {
    const derived = deriveChatEndpoints(settings.value.planner.baseUrl);
    modelsUrl = derived.modelsEndpoint;
    settings.value.planner.modelsEndpoint = derived.modelsEndpoint;
  }

  if (!modelsUrl) {
    plannerFetchStatus.value = {
      type: 'error',
      message: '请先填写提示词接口基础服务地址 (Base URL) 或模型列表接口地址',
    };
    return;
  }

  isFetchingPlannerModels.value = true;
  try {
    const result = await fetchModels(modelsUrl, settings.value.planner.apiKey);
    if (result.success && result.models && result.models.length > 0) {
      settings.value.planner.availableModels = result.models;
      plannerFetchStatus.value = {
        type: 'success',
        message: `成功连接并获取到 ${result.models.length} 个可用模型`,
      };
      if (!settings.value.planner.model) {
        settings.value.planner.model = result.models[0];
        plannerModelSelectValue.value = result.models[0];
      } else if (result.models.includes(settings.value.planner.model)) {
        plannerModelSelectValue.value = settings.value.planner.model;
      } else {
        plannerModelSelectValue.value = '__custom__';
      }
    } else {
      plannerFetchStatus.value = {
        type: 'error',
        message: result.error || '未能获取到模型列表',
      };
    }
  } catch (err: any) {
    plannerFetchStatus.value = {
      type: 'error',
      message: String(err?.message ?? err),
    };
  } finally {
    isFetchingPlannerModels.value = false;
  }
}

// --- 生图模型 (Image Generator) ---
const showApiKey = ref(false);
const showAdvancedEndpoints = ref(false);
const isFetchingModels = ref(false);
const fetchStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const modalEl = ref<HTMLElement | null>(null);
const modalBackdropEl = ref<HTMLDialogElement | null>(null);
watch(
  modalBackdropEl,
  (dialog, _previous, onCleanup) => {
    if (dialog) onCleanup(bindSettingsDialog(dialog));
  },
  { flush: 'post' },
);
const popoverEl = ref<HTMLElement | null>(null);
const popoverBackdropEl = ref<HTMLDialogElement | null>(null);
watch(
  popoverBackdropEl,
  (dialog, _previous, onCleanup) => {
    if (dialog) onCleanup(bindSettingsDialog(dialog));
  },
  { flush: 'post' },
);
const actionBtnRefs = ref<HTMLElement[]>([]);

function setActionBtnRef(el: any, idx: number) {
  if (el) {
    actionBtnRefs.value[idx] = el as HTMLElement;
  }
}

// 原始输入的 Base URL，输入时不改写光标或自动清除尾部斜杠
const baseUrlInputValue = ref(settings.value.provider.baseUrl);

watch(
  () => settings.value.provider.baseUrl,
  newVal => {
    if (newVal !== baseUrlInputValue.value) {
      baseUrlInputValue.value = newVal;
    }
  },
);

function resetFetchStatus() {
  fetchStatus.value = null;
}

function onBaseUrlInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  baseUrlInputValue.value = val;
  settings.value.provider.baseUrl = val;
  resetFetchStatus();
}

function commitBaseUrl() {
  const val = (baseUrlInputValue.value || '').trim();
  if (!settings.value.provider.customEndpointOverride && val) {
    const derived = deriveEndpoints(val, settings.value.provider.protocol);
    if (derived.detectedProtocol) {
      settings.value.provider.protocol = derived.detectedProtocol;
    }
    settings.value.provider.baseUrl = derived.baseUrl;
    baseUrlInputValue.value = derived.baseUrl;
    settings.value.provider.endpoint = derived.endpoint;
    settings.value.provider.modelsEndpoint = derived.modelsEndpoint;
  }
}

function onBaseUrlPaste(e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text') ?? '';
  if (pasted.includes('/chat/completions') || pasted.includes('/images/generations') || pasted.includes('/models')) {
    nextTick(() => {
      commitBaseUrl();
    });
  }
}

const modelSelectValue = ref<string>(
  settings.value.provider.availableModels?.includes(settings.value.provider.model)
    ? settings.value.provider.model
    : '__custom__',
);

// 画幅预设列表
const aspectRatioPresets: {
  id: AspectRatioPreset;
  label: string;
  sub: string;
  style: { width: string; height: string };
}[] = [
  { id: '2:3', label: '2:3', sub: '竖版推荐', style: { width: '18px', height: '27px' } },
  { id: '1:1', label: '1:1', sub: '正方形', style: { width: '22px', height: '22px' } },
  { id: '3:2', label: '3:2', sub: '横版画卷', style: { width: '27px', height: '18px' } },
  { id: '3:4', label: '3:4', sub: '经典竖版', style: { width: '19px', height: '25px' } },
  { id: '4:3', label: '4:3', sub: '标准横版', style: { width: '25px', height: '19px' } },
  { id: '9:16', label: '9:16', sub: '手机全屏', style: { width: '15px', height: '27px' } },
  { id: '16:9', label: '16:9', sub: '宽屏壁纸', style: { width: '28px', height: '16px' } },
  { id: 'custom', label: '自定义', sub: '手动输入', style: { width: '22px', height: '22px' } },
];

function selectAspectRatio(ratio: AspectRatioPreset) {
  settings.value.canvas.aspectRatioPreset = ratio;
  if (ratio === '1:1') {
    settings.value.canvas.sizePreset = '1024x1024';
  } else if (ratio === '2:3' || ratio === '3:4' || ratio === '9:16') {
    settings.value.canvas.sizePreset = '1024x1536';
  } else if (ratio === '3:2' || ratio === '4:3' || ratio === '16:9') {
    settings.value.canvas.sizePreset = '1536x1024';
  }
}

function handleProtocolChange(newProtocol: ProviderProtocol) {
  settings.value.provider.protocol = newProtocol;
  resetFetchStatus();
  if (!settings.value.provider.customEndpointOverride && settings.value.provider.baseUrl) {
    const derived = deriveEndpoints(settings.value.provider.baseUrl, newProtocol);
    settings.value.provider.endpoint = derived.endpoint;
  }
}

function onModelSelectChange() {
  if (modelSelectValue.value !== '__custom__') {
    settings.value.provider.model = modelSelectValue.value;
  }
}

async function onFetchModelsClick() {
  if (isFetchingModels.value) return;
  fetchStatus.value = null;

  let modelsUrl = settings.value.provider.modelsEndpoint;
  if (!modelsUrl && settings.value.provider.baseUrl) {
    const derived = deriveEndpoints(settings.value.provider.baseUrl, settings.value.provider.protocol);
    modelsUrl = derived.modelsEndpoint;
    settings.value.provider.modelsEndpoint = derived.modelsEndpoint;
  }

  if (!modelsUrl) {
    fetchStatus.value = {
      type: 'error',
      message: '请先填写基础服务地址 (Base URL) 或模型列表接口地址',
    };
    return;
  }

  isFetchingModels.value = true;
  try {
    const result = await fetchModels(modelsUrl, settings.value.provider.apiKey);
    if (result.success && result.models && result.models.length > 0) {
      settings.value.provider.availableModels = result.models;
      fetchStatus.value = {
        type: 'success',
        message: `成功连接并获取到 ${result.models.length} 个可用模型`,
      };
      if (!settings.value.provider.model) {
        settings.value.provider.model = result.models[0];
        modelSelectValue.value = result.models[0];
      } else if (result.models.includes(settings.value.provider.model)) {
        modelSelectValue.value = settings.value.provider.model;
      } else {
        modelSelectValue.value = '__custom__';
      }
    } else {
      fetchStatus.value = {
        type: 'error',
        message: result.error || '未能获取到模型列表',
      };
    }
  } catch (err: any) {
    fetchStatus.value = {
      type: 'error',
      message: String(err?.message ?? err),
    };
  } finally {
    isFetchingModels.value = false;
  }
}

// 动态计算快捷操作菜单项，按楼层当前状态动态显示
const currentFloorState = computed(() => {
  if (popoverState.value.messageId < 0 || popoverState.value.swipeId < 0) return null;
  const persisted = getSwipeState(popoverState.value.messageId, popoverState.value.swipeId);
  const hint = popoverState.value.stateHint;
  if (persisted && hint) {
    return persisted.operationVersion >= hint.operationVersion ? persisted : hint;
  }
  return persisted || hint || null;
});

const popoverActions = computed<{ id: PopoverAction; icon: string; label: string; desc: string }[]>(() => {
  const state = currentFloorState.value;
  const hasPrompt = Boolean(state?.scenePrompt?.trim());
  const hasImage = Boolean(state?.currentImage);
  const autoGenImage = Boolean(settings.value.behavior?.autoGenerateImageEnabled);

  if (state?.scenes?.length) {
    return [
      {
        id: 'generate',
        icon: 'fa-solid fa-images',
        label: '生成全部未完成场景',
        desc: '已完成的图片保留，其余场景依次生图',
      },
      { id: 'edit-prompt', icon: 'fa-solid fa-pen', label: '查看各场景', desc: '在正文锚点处分别编辑、生成或重试' },
      {
        id: 'replan-only',
        icon: 'fa-solid fa-arrows-rotate',
        label: '重新规划全部场景',
        desc: '替换本楼场景规划，旧图片保留在历史中，本次不自动生图',
      },
      {
        id: 'replan-and-generate',
        icon: 'fa-solid fa-bolt',
        label: '重新规划并全部生图',
        desc: '按当前场景数量重新规划，然后串行生成全部图片',
      },
    ];
  }

  if (!hasPrompt) {
    if (!autoGenImage) {
      return [
        {
          id: 'plan',
          icon: 'fa-solid fa-wand-magic-sparkles',
          label: '生成提示词',
          desc: '根据当前剧情生成画面提示词',
        },
        {
          id: 'plan-and-generate',
          icon: 'fa-solid fa-bolt',
          label: '生成提示词并生图',
          desc: '先生成提示词，完成后继续生成图片',
        },
        {
          id: 'manual-prompt',
          icon: 'fa-solid fa-pen-to-square',
          label: '手动填写提示词',
          desc: '直接填写自己的画面提示词',
        },
      ];
    }

    return [
      {
        id: 'plan-and-generate',
        icon: 'fa-solid fa-bolt',
        label: '生成提示词并生图',
        desc: '生成提示词，完成后继续生成图片',
      },
      {
        id: 'plan-only',
        icon: 'fa-solid fa-wand-magic-sparkles',
        label: '仅生成提示词',
        desc: '本次仅生成提示词，不自动生成图片',
      },
      {
        id: 'manual-prompt',
        icon: 'fa-solid fa-pen-to-square',
        label: '手动填写提示词',
        desc: '直接填写自己的画面提示词',
      },
    ];
  }

  if (hasPrompt && !hasImage) {
    if (!autoGenImage) {
      return [
        {
          id: 'generate',
          icon: 'fa-solid fa-wand-magic-sparkles',
          label: '生成图片',
          desc: '使用当前提示词生成图片',
        },
        {
          id: 'replan',
          icon: 'fa-solid fa-arrows-rotate',
          label: '重新生成提示词',
          desc: '根据当前剧情重新生成画面提示词',
        },
        {
          id: 'edit-prompt',
          icon: 'fa-solid fa-pen-to-square',
          label: '修改提示词',
          desc: '编辑当前画面提示词',
        },
      ];
    }

    return [
      {
        id: 'generate',
        icon: 'fa-solid fa-wand-magic-sparkles',
        label: '生成图片',
        desc: '使用当前提示词生成图片',
      },
      {
        id: 'replan-and-generate',
        icon: 'fa-solid fa-bolt',
        label: '重新生成提示词并生图',
        desc: '重新生成提示词，完成后继续生成图片',
      },
      {
        id: 'replan-only',
        icon: 'fa-solid fa-arrows-rotate',
        label: '仅重新生成提示词',
        desc: '本次仅重新生成提示词，不自动生成图片',
      },
      {
        id: 'edit-prompt',
        icon: 'fa-solid fa-pen-to-square',
        label: '修改提示词',
        desc: '编辑当前画面提示词',
      },
    ];
  }

  // 楼层已经有图片时显示
  if (!autoGenImage) {
    return [
      {
        id: 'regenerate',
        icon: 'fa-solid fa-rotate-right',
        label: '重新生成图片',
        desc: '使用已有或微调后的提示词重新生图',
      },
      {
        id: 'replan',
        icon: 'fa-solid fa-arrows-rotate',
        label: '重新生成提示词',
        desc: '根据当前剧情重新生成画面提示词',
      },
      {
        id: 'edit-prompt',
        icon: 'fa-solid fa-pen-to-square',
        label: '修改提示词',
        desc: '编辑当前画面提示词',
      },
    ];
  }

  return [
    {
      id: 'regenerate',
      icon: 'fa-solid fa-rotate-right',
      label: '重新生成图片',
      desc: '使用已有或微调后的提示词重新生图',
    },
    {
      id: 'replan-and-generate',
      icon: 'fa-solid fa-bolt',
      label: '重新生成提示词并生图',
      desc: '重新生成提示词，完成后继续生成图片',
    },
    {
      id: 'replan-only',
      icon: 'fa-solid fa-arrows-rotate',
      label: '仅重新生成提示词',
      desc: '本次仅重新生成提示词，不自动生成图片',
    },
    {
      id: 'edit-prompt',
      icon: 'fa-solid fa-pen-to-square',
      label: '修改提示词',
      desc: '编辑当前画面提示词',
    },
  ];
});

// 浮层菜单位置计算 (使用酒馆真实视口)
const popoverStyle = computed(() => {
  if (!popoverState.value.visible) return {};

  const vp = getTavernViewport();
  const isMobile = vp.width <= 600;
  if (isMobile || typeof popoverState.value.x !== 'number') {
    return {};
  }

  const px = popoverState.value.x;
  const py = popoverState.value.y ?? 100;
  const menuWidth = 300;
  const menuHeight = 240;

  const left = Math.min(Math.max(16, px - 40), vp.width - menuWidth - 16);
  const top = Math.min(Math.max(16, py + 12), vp.height - menuHeight - 16);

  return {
    left: `${left}px`,
    top: `${top}px`,
  };
});

// --- MVU / 角色状态配置 ---
const isMvuAvailable = ref(safeCheckMvuAvailable());
const activeCharName = ref(getActiveCharacterName());
const charMvuSettings = ref<CharacterMvuSettings>(getCharacterMvuSettings());
const mvuTree = ref<MvuTreeNode[]>([]);
const isFetchingMvuTree = ref(false);
const mvuFetchError = ref<string | null>(null);
const collapsedPaths = ref<Set<string>>(new Set());
const mvuSearchQuery = ref('');

const previewState = ref<Record<string, any>>({});
const previewMessageId = ref<number | null>(null);
const mvuOwner = ref('');
const currentMvuOwner = () => String(SillyTavern.getCurrentChatId()) + ':' + String(getActiveCharacterKey());
const selectedMvuPaths = computed(() => new Set(charMvuSettings.value.rules.filter(r => r.enabled).map(r => r.path)));

function reloadCharMvuSettings() {
  mvuOwner.value = currentMvuOwner();
  activeCharName.value = getActiveCharacterName();
  isMvuAvailable.value = safeCheckMvuAvailable();
  charMvuSettings.value = getCharacterMvuSettings();
}

watch(
  charMvuSettings,
  newVal => {
    if (mvuOwner.value === currentMvuOwner()) saveCharacterMvuSettings(newVal);
  },
  { deep: true },
);

function fetchCurrentMvuTree() {
  isFetchingMvuTree.value = true;
  mvuFetchError.value = null;
  try {
    activeCharName.value = getActiveCharacterName();
    isMvuAvailable.value = safeCheckMvuAvailable();
    previewMessageId.value = getLastMessageId();
    const mvuData = safeGetMvuData(previewMessageId.value);
    previewState.value = mvuData?.stat_data ?? {};
    const statData = mvuData?.stat_data;
    if (!statData || typeof statData !== 'object' || Object.keys(statData).length === 0) {
      mvuTree.value = [];
      mvuFetchError.value = '未在当前聊天中检测到有效状态数据（请确认角色卡已初始化或已产生对话）';
    } else {
      mvuTree.value = buildMvuTree(statData);
      if (mvuTree.value.length === 0) {
        mvuFetchError.value = '解析到的状态树为空';
      }
    }
  } catch (e: any) {
    mvuFetchError.value = `抓取状态异常: ${e?.message ?? e}`;
  } finally {
    isFetchingMvuTree.value = false;
  }
}

function handleTreeToggleSelect(payload: { path: string; node: MvuTreeNode; select: boolean }) {
  const { path, node, select } = payload;
  if (select) {
    const leavesToAdd: { path: string; alias: string }[] = [];
    const collectLeaves = (n: MvuTreeNode) => {
      if (n.isLeaf) {
        leavesToAdd.push({ path: n.path, alias: n.key });
      } else if (n.children) {
        n.children.forEach(collectLeaves);
      }
    };
    collectLeaves(node);

    const currentPaths = new Set(charMvuSettings.value.rules.map(r => r.path));
    for (const item of leavesToAdd) {
      if (!currentPaths.has(item.path)) {
        charMvuSettings.value.rules.push({
          path: item.path,
          alias: item.alias,
          enabled: true,
        });
      }
    }
  } else {
    charMvuSettings.value.rules = charMvuSettings.value.rules.filter(
      r => r.path !== path && !r.path.startsWith(`${path}/`),
    );
  }
}

function handleTreeToggleCollapse(path: string) {
  const nextSet = new Set(collapsedPaths.value);
  if (nextSet.has(path)) {
    nextSet.delete(path);
  } else {
    nextSet.add(path);
  }
  collapsedPaths.value = nextSet;
}

function expandAllMvuTree() {
  collapsedPaths.value = new Set();
}

function collapseAllMvuTree() {
  const allPaths = new Set<string>();
  const collect = (nodes: MvuTreeNode[]) => {
    for (const n of nodes) {
      if (!n.isLeaf) {
        allPaths.add(n.path);
        if (n.children) collect(n.children);
      }
    }
  };
  collect(mvuTree.value);
  collapsedPaths.value = allPaths;
}

function clearAllMvuSelections() {
  charMvuSettings.value.rules = [];
}

const filteredMvuTree = computed(() => {
  const query = mvuSearchQuery.value.trim().toLowerCase();
  if (!query) return mvuTree.value;

  const filterNode = (node: MvuTreeNode): MvuTreeNode | null => {
    const matchKey = node.key.toLowerCase().includes(query);
    const matchPath = node.path.toLowerCase().includes(query);
    const matchVal = (node.valueText || '').toLowerCase().includes(query);

    if (node.isLeaf) {
      return matchKey || matchPath || matchVal ? node : null;
    }

    const filteredChildren = (node.children || []).map(filterNode).filter((n): n is MvuTreeNode => n !== null);

    if (matchKey || matchPath || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }
    return null;
  };

  return mvuTree.value.map(filterNode).filter((n): n is MvuTreeNode => n !== null);
});

const mvuPreviewJson = computed(() =>
  JSON.stringify(extractSelectedMvuState(previewState.value, charMvuSettings.value) ?? {}, null, 2),
);

// 切换聊天时清空旧树与规则上下文，防止写入另一张卡。
eventOn(tavern_events.CHAT_CHANGED, () => {
  mvuTree.value = [];
  previewState.value = {};
  previewMessageId.value = null;
  collapsedPaths.value = new Set();
  mvuSearchQuery.value = '';
  reloadCharMvuSettings();
  if (isModalOpen.value) fetchCurrentMvuTree();
});

// 弹窗打开焦点约束与重新同步最新已保存设置
watch(isModalOpen, isOpen => {
  if (isOpen) {
    settingsStore.reloadSettings();
    reloadCharMvuSettings();
    fetchCurrentMvuTree();
    plannerBaseUrlInputValue.value = settings.value.planner.baseUrl || '';
    baseUrlInputValue.value = settings.value.provider.baseUrl || '';
    plannerModelSelectValue.value = settings.value.planner.availableModels?.includes(settings.value.planner.model)
      ? settings.value.planner.model
      : '__custom__';
    modelSelectValue.value = settings.value.provider.availableModels?.includes(settings.value.provider.model)
      ? settings.value.provider.model
      : '__custom__';
    plannerFetchStatus.value = null;
    fetchStatus.value = null;

    nextTick(() => {
      if (modalEl.value) {
        const focusable = modalEl.value.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length > 0) {
          focusable[0].focus({ preventScroll: true });
        } else {
          modalEl.value.focus({ preventScroll: true });
        }
      }
    });
  }
});

function handleDoneClick() {
  commitPlannerBaseUrl();
  commitBaseUrl();
  settingsStore.saveNow();
  if (mvuOwner.value === currentMvuOwner()) saveCharacterMvuSettings(charMvuSettings.value);
  if (typeof toastr !== 'undefined' && toastr.success) {
    toastr.success('设置已保存');
  }
  closeModal();
}

function handleModalKeyDown(e: KeyboardEvent) {
  if (e.key === 'Tab' && modalEl.value) {
    const focusables = Array.from(
      modalEl.value.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(el => el.offsetParent !== null);

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey) {
      if (tavernDocument.activeElement === first || !modalEl.value.contains(tavernDocument.activeElement)) {
        e.preventDefault();
        last.focus();
      }
    } else if (tavernDocument.activeElement === last || !modalEl.value.contains(tavernDocument.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }
}

// 浮层打开初始聚焦在首位动作（立即生成）
watch(
  () => popoverState.value.visible,
  visible => {
    if (visible) {
      actionBtnRefs.value = [];
      nextTick(() => {
        if (actionBtnRefs.value.length > 0 && actionBtnRefs.value[0]) {
          actionBtnRefs.value[0].focus();
        } else if (popoverEl.value) {
          popoverEl.value.focus();
        }
      });
    }
  },
);

function handlePopoverKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    // 动作按钮已聚焦，原生回车即可触发其点击事件；若当前聚焦在菜单外层，执行首个动作
    if (tavernDocument.activeElement === popoverEl.value && popoverActions.value.length > 0) {
      triggerPopoverAction(popoverActions.value[0].id);
      e.preventDefault();
    }
  } else if (e.key === 'ArrowDown') {
    const activeEl = tavernDocument.activeElement as HTMLElement;
    const currentIdx = actionBtnRefs.value.findIndex(btn => btn === activeEl);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % actionBtnRefs.value.length : 0;
    actionBtnRefs.value[nextIdx]?.focus();
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    const activeEl = tavernDocument.activeElement as HTMLElement;
    const currentIdx = actionBtnRefs.value.findIndex(btn => btn === activeEl);
    const prevIdx =
      currentIdx >= 0
        ? (currentIdx - 1 + actionBtnRefs.value.length) % actionBtnRefs.value.length
        : actionBtnRefs.value.length - 1;
    actionBtnRefs.value[prevIdx]?.focus();
    e.preventDefault();
  }
}

watch(
  () => settings.value.provider.model,
  newModel => {
    if (settings.value.provider.availableModels?.includes(newModel)) {
      modelSelectValue.value = newModel;
    } else {
      modelSelectValue.value = '__custom__';
    }
  },
);
</script>
