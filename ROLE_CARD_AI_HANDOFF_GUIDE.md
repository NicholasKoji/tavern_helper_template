# MVU 角色卡 AI 接手与交付规范

本文档用于约束后续 AI 接手任意 MVU 角色卡时的工作方式。它只记录通用开发、验证、发布与交接规范，不记录具体角色卡设定、世界观、剧情方向或某次开发流水账。

使用前请先替换以下占位信息：

- `{{角色卡目录}}`：例如 `src/角色卡名称`
- `{{构建产物目录}}`：例如 `dist/角色卡名称`
- `{{角色卡导出文件}}`：例如 `src/角色卡名称/角色卡名称.png`
- `{{仓库}}`：例如 `用户名/仓库名`
- `{{分支}}`：例如 `main`、`codex/role-card`
- `{{状态栏根元素选择器}}`：例如 `.debug-console`
- `{{状态栏核心交互}}`：例如“切换到角色页并展开一个角色”

## 最高优先级流程

- 开始实际编辑文件前，先判断用户是否已经明确同意进入实现阶段。
- 用户说“看下怎么优化”“我们来讨论”“你觉得怎么改”等表达时，默认仍处于方案讨论阶段；不要修改源码、世界书、schema、dist，也不要重新打包。
- 只有当用户明确说“可以改”“按这个方案改”“开始实现”“打包检查”等同意执行的话，才进入改动与验证流程。
- 若误提前改动，应先说明已发生的改动范围，等待用户决定保留、继续调整或回退相关改动；不要自行提交或继续扩大改动。
- 提交或暂存前，确认没有误带入本地环境文件、交接草稿或工具缓存，例如 `.codex/`、`.cursor/mcp.json`、临时 mock 文件等。
- 是否暂存、提交、推送、创建 PR，都应等待用户明确要求。

## 项目事实记录

每张角色卡开工前，都应在交接文档或任务记录中明确以下事实，避免把旧项目路径、仓库或分支带入新卡：

- 当前开发分支：`{{分支}}`
- 远程仓库：`{{仓库}}`
- 角色卡目录：`{{角色卡目录}}`
- 构建产物目录：`{{构建产物目录}}`
- 角色卡导出文件：`{{角色卡导出文件}}`
- 状态栏入口使用的 raw/jsDelivr 地址应指向当前仓库，不要沿用模板仓库或旧卡仓库。

## 发布与缓存

- 状态栏主入口若需要快速反映分支最新内容，优先使用 `raw.githubusercontent.com` 分支文件，并追加 `?t=${Date.now()}`。
- 不要把需要立即更新的状态栏主入口放在 jsDelivr 分支地址上；jsDelivr 对分支别名缓存不稳定，push 后可能长时间返回旧文件。
- jsDelivr 更适合固定到具体 commit SHA 的不可变资源。
- 推荐状态栏加载形式：

```js
$('body').load(`https://raw.githubusercontent.com/{{仓库}}/{{分支}}/{{构建产物目录}}/界面/状态栏/index.html?t=${Date.now()}`)
```

- 如果 SillyTavern 中仍显示旧状态栏，先检查角色卡正则或导入配置中的 `[界面]状态栏` 是否仍是旧地址。已经导入到 SillyTavern 的旧正则不会随仓库文件自动变化。

## 构建与导出

- `webpack.config.ts` 的入口扫描应匹配 `src/**/index.{ts,tsx,js,jsx}`。
- 不要写成 `{src}/**/index...`，否则可能出现构建看似成功但没有正确生成 `dist` 的情况。
- 修改角色卡后通常执行：

```powershell
pnpm build
```

- 构建后至少确认这些文件存在或更新：
  - `{{构建产物目录}}/界面/状态栏/index.html`
  - `{{构建产物目录}}/脚本/变量结构/index.js`
  - `{{构建产物目录}}/脚本/MVU/index.js`
  - `{{角色卡目录}}/schema.json`
  - `{{角色卡导出文件}}`

## 角色卡 PNG 导出

- `tavern_sync` 中，如果 `头像: null`，角色卡可能导出为 JSON，而不是嵌入 PNG。
- 不要出现“文件扩展名是 `.png`，内容却是 JSON”的假 PNG。
- 保持 `{{角色卡目录}}/头像.png` 存在。
- `{{角色卡目录}}/index.yaml` 中应保持：

```yaml
头像: 头像
```

- 验证导出 PNG 是否有效时，前 8 字节应为：

```text
89 50 4E 47 0D 0A 1A 0A
```

## MVU 与变量结构

- MVU 变量结构以 `{{角色卡目录}}/schema.ts` 为源头，`schema.json` 是构建生成物。
- 修改变量字段时，至少同步检查：
  - `schema.ts`
  - `世界书/变量/initvar.yaml`
  - `世界书/变量/变量更新规则.yaml`
  - `世界书/变量/变量输出格式.yaml`
  - 状态栏或其他界面是否读取了被新增、改名或删除的字段
- 对动态对象优先使用 `z.record(...)`，并可用 `.transform(data => _(data).entries().takeRight(n).fromPairs().value())` 控制 token 膨胀。
- 可清空对象应使用 `.prefault({})`，避免旧楼层缺字段时状态栏直接挂掉。
- 数值范围优先用 `z.coerce.number().transform(value => _.clamp(value, min, max))`，不要让一次坏更新导致整段变量被丢弃。
- 字段删改前要和用户确认，因为旧存档、旧楼层或旧世界书规则可能仍含旧字段。

## 状态栏预览

- 状态栏真实页面依赖 SillyTavern / Tavern Helper / MVU 全局对象。
- 直接打开 `{{构建产物目录}}/界面/状态栏/index.html` 可能停在等待数据状态，不能仅凭空白判断坏了。
- 使用浏览器工具验证状态栏时，优先打开本地 `localhost` mock 页面，不要用 `data:` URL；浏览器安全策略可能拦截 `data:text/html...`。
- mock 页面可以由临时本地 HTTP 服务在内存中提供，不必写入仓库文件；验证完成后关闭服务，避免留下后台端口。
- mock 页面推荐读取：
  - `{{构建产物目录}}/界面/状态栏/index.html`
  - `{{角色卡目录}}/世界书/变量/initvar.yaml`
- mock 页面应先加载 Vue、jQuery、lodash、zod，再嵌入构建后的状态栏 HTML；至少注入：

```js
window.z = zod;
window.createApp = window.Vue.createApp;
window.getCurrentMessageId = () => 0;
window.waitGlobalInitialized = async () => true;
window.__mockVariables = { stat_data };
window.getVariables = () => window.__mockVariables;
window.updateVariablesWith = updater => {
  updater(window.__mockVariables);
};
window.errorCatched = fn => (...args) => {
  try {
    return fn(...args);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
```

- 预览时应构造 mock 页面，至少提供：
  - `window.Vue`
  - `window.createApp`
  - `window.createPinia`
  - `window.defineStore`
  - `window.z`
  - `window._`
  - `window.$`
  - `window.getCurrentMessageId`
  - `window.waitGlobalInitialized`
  - `window.getVariables`
  - `window.updateVariablesWith`
  - `window.errorCatched`
- 横向溢出不要只凭截图裁切判断，应检查：

```js
({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bodyScrollWidth: document.body.scrollWidth,
  bodyClientWidth: document.body.clientWidth,
})
```

- 更精确的状态栏自身溢出检查应额外读取：

```js
const root = document.querySelector('{{状态栏根元素选择器}}');
({
  rootScrollWidth: root?.scrollWidth,
  rootClientWidth: root?.clientWidth,
})
```

- 验证时至少检查：
  - 首屏能正常渲染，不停留在等待数据或空白。
  - 浏览器控制台没有 `error` / `warn`。
  - `{{状态栏核心交互}}` 能正常完成。
  - 新增字段能在 DOM 中出现。
  - 桌面宽度和约 390px 窄容器下，`{{状态栏根元素选择器}}` 的 `scrollWidth` 不大于 `clientWidth`。
- 常见 CSS 风险：
  - 根容器避免在外部 padding 环境里使用会制造横向溢出的 `width: 100%`。
  - 全局或根范围内设置 `box-sizing: border-box`。
  - 移动端布局要避免顶部仪表、标签、按钮组挤出视口。

## 验证建议

常用检查：

```powershell
pnpm build
git status --short --branch
```

如果改了仓库地址、发布入口或状态栏加载方式，检查是否残留旧仓库、旧分支或旧 CDN 地址：

```powershell
rg "旧仓库名|旧分支名|旧CDN地址" "{{角色卡目录}}" "{{构建产物目录}}"
```

如果改了状态栏字段，额外检查旧字段是否残留：

```powershell
rg "旧字段名1|旧字段名2" "{{角色卡目录}}" "{{构建产物目录}}"
```

如果需要确认远程状态栏内容，优先查 raw 地址，而不是 jsDelivr 分支地址：

```powershell
curl.exe -L --max-time 20 "https://raw.githubusercontent.com/{{仓库}}/{{分支}}/{{构建产物目录}}/界面/状态栏/index.html"
```

## 环境注意

- 本地 PowerShell、Node 脚本或浏览器工具偶尔会出现环境问题；先判断是不是工具或预览环境故障，不要立刻改业务代码。
- 不要照搬旧记录里的提权参数或机器专属配置；以当前会话权限和工具说明为准。
- Windows 终端中中文路径在某些 Node 脚本里可能变成 `????`。如果遇到 `ENOENT`，优先用递归搜索定位目标文件，不要硬编码损坏后的中文路径。

## Git 注意

- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。
- 工作区可能本来就有用户或历史留下的未提交文件；不要回退不属于当前任务的改动。
- 角色卡相关改动通常只应包含：
  - `{{角色卡目录}}/**`
  - `{{构建产物目录}}/**`
  - `tavern_sync.yaml`
  - `webpack.config.ts`
  - 相关发布工作流或项目说明文档
- 暂存前再次检查是否误带入本地工具目录、临时 mock 文件、交接草稿或其他无关文件。
