# AI 会话交接注意事项

本文件只记录后续 AI 接手 `世界调试模式（NPC版）` 角色卡时容易再次踩坑的操作约束。角色卡设定、世界观、剧情方向应以 `src/世界调试模式（NPC版）/**` 和世界书正文为准，不要把这里写成设定备忘录或开发流水账。

## 最高优先级流程

- 开始实际编辑文件前，必须先确认用户已经明确同意进入实现阶段。
- 用户说“看下怎么优化”“我们来讨论”“你觉得怎么改”等表达时，默认仍处于方案讨论阶段，不要修改源码、世界书、schema、dist 或重新打包。
- 只有当用户明确说“可以改”“按这个方案改”“开始实现”“打包检查”等同意执行的话，才进入改动与验证流程。
- 若误提前改动，应先说明已发生的改动范围，等待用户决定是保留、继续调整，还是回退相关改动；不要自行提交或继续扩大改动。
- 提交或暂存前，必须确认没有误带入这些本地/交接文件：
  - `.cursor/mcp.json`
  - `.codex/`
  - `AI_HANDOFF_NOTES.md`，除非用户明确要求更新交接文档

## 当前仓库事实

- 当前开发分支通常是 `codex/role-card`。
- 远程仓库是 `https://github.com/NicholasKoji/tavern_helper_template.git`。
- 角色卡目录是 `src/世界调试模式（NPC版）`。
- 构建产物目录是 `dist/世界调试模式（NPC版）`。
- 角色卡 jsDelivr/raw 地址应指向 `NicholasKoji/tavern_helper_template`，不要写成旧模板仓库 `StageDog/tavern_helper_template`。

## 发布与缓存坑

- 状态栏入口推荐使用 `raw.githubusercontent.com` 分支文件，并追加 `?t=${Date.now()}`。
- 不要把状态栏主入口改回 jsDelivr 分支地址。jsDelivr 对分支别名缓存不稳定，push 后可能长时间返回旧文件。
- jsDelivr 更适合固定到具体 commit SHA 的不可变资源，不适合承载需要立刻更新的状态栏 HTML。
- 当前推荐状态栏加载形式：

```js
$('body').load(`https://raw.githubusercontent.com/NicholasKoji/tavern_helper_template/codex/role-card/dist/世界调试模式（NPC版）/界面/状态栏/index.html?t=${Date.now()}`)
```

- 若 SillyTavern 中仍显示旧状态栏，先检查角色卡正则里的 `[界面]状态栏` 是否还是旧 jsDelivr 地址。已经导入到 SillyTavern 的旧正则不会随仓库文件自动变化。

## 构建与导出坑

- `webpack.config.ts` 的入口扫描应匹配 `src/**/index.{ts,tsx,js,jsx}`。
- 不要写成 `{src}/**/index...`，那会导致构建看似成功但没有正确生成 `dist`。
- 修改角色卡后通常执行：

```powershell
pnpm build
```

- 构建后应重点确认这些文件存在或更新：
  - `dist/世界调试模式（NPC版）/界面/状态栏/index.html`
  - `dist/世界调试模式（NPC版）/脚本/变量结构/index.js`
  - `dist/世界调试模式（NPC版）/脚本/MVU/index.js`
  - `src/世界调试模式（NPC版）/schema.json`
  - `src/世界调试模式（NPC版）/世界调试模式（NPC版）.png`

## 角色卡 PNG 坑

- `tavern_sync` 中，如果 `头像: null`，角色卡会导出为 JSON，而不是嵌入 PNG。
- 不要出现“文件扩展名是 `.png`，内容却是 JSON”的假 PNG。
- 保持 `src/世界调试模式（NPC版）/头像.png` 存在。
- `src/世界调试模式（NPC版）/index.yaml` 中应保持：

```yaml
头像: 头像
```

- 验证导出 PNG 是否有效时，前 8 字节应为：

```text
89 50 4E 47 0D 0A 1A 0A
```

## MVU 与变量结构坑

- MVU 变量结构以 `src/世界调试模式（NPC版）/schema.ts` 为源头，`schema.json` 是构建生成物。
- 修改变量字段时，至少同步检查：
  - `schema.ts`
  - `世界书/变量/initvar.yaml`
  - `世界书/变量/变量更新规则.yaml`
  - `世界书/变量/变量输出格式.yaml`
  - 状态栏 `App.vue` 是否读取了被删字段
- 对动态对象优先使用 `z.record(...)`，并用 `.transform(data => _(data).entries().takeRight(n).fromPairs().value())` 控制 token 膨胀。
- 可清空对象应使用 `.prefault({})`，避免旧楼层缺字段时状态栏直接挂掉。
- 数值范围优先用 `z.coerce.number().transform(value => _.clamp(value, min, max))`，不要让一次坏更新导致整段变量被丢弃。
- 字段删改前要和用户确认，因为旧存档/旧楼层可能仍含旧字段。

## 状态栏预览坑

- 状态栏真实页面依赖 SillyTavern / Tavern Helper / MVU 全局对象。
- 直接打开 `dist/.../index.html` 可能停在等待数据状态，不能仅凭空白判断坏了。
- 使用 Codex Browser 做状态栏验证时，优先打开本地 `localhost` mock 页面，不要用 `data:` URL；Browser 安全策略可能会拦截 `data:text/html...`，继续绕会浪费时间。
- mock 页面可以由临时本地 HTTP 服务在内存中提供，不必写入仓库文件；验证完成后关闭服务，避免留下后台端口。
- mock 页面推荐读取：
  - `dist/世界调试模式（NPC版）/界面/状态栏/index.html`
  - `src/世界调试模式（NPC版）/世界书/变量/initvar.yaml`
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
const root = document.querySelector('.debug-console');
({
  consoleScrollWidth: root?.scrollWidth,
  consoleClientWidth: root?.clientWidth,
})
```

- 验证时至少检查：
  - 首屏能正常渲染，不停留在等待数据或空白。
  - 浏览器控制台没有 `error` / `warn`。
  - 能切换到 `NPC` 页，并展开至少一个 NPC。
  - 新增字段能在 DOM 中出现。
  - 桌面宽度和约 390px 窄容器下，`.debug-console` 的 `scrollWidth` 不大于 `clientWidth`。

- 旧版曾处理过的 CSS 要点：
  - `.debug-console` 避免在外部 padding 环境里使用会制造横向溢出的 `width: 100%`
  - 全局 `box-sizing: border-box`
  - 移动端布局要避免顶部仪表/标签挤出视口

## 验证建议

常用检查：

```powershell
pnpm build
rg "StageDog/tavern_helper_template|NSFW|未成年|成人边界" "src/世界调试模式（NPC版）"
git status --short --branch
```

如果改了状态栏字段，额外检查旧字段是否残留：

```powershell
rg "旧字段名1|旧字段名2" "src/世界调试模式（NPC版）" "dist/世界调试模式（NPC版）"
```

如果需要确认远程状态栏内容，优先查 raw 地址，而不是 jsDelivr 分支地址：

```powershell
curl.exe -L --max-time 20 "https://raw.githubusercontent.com/NicholasKoji/tavern_helper_template/codex/role-card/dist/%E4%B8%96%E7%95%8C%E8%B0%83%E8%AF%95%E6%A8%A1%E5%BC%8F%EF%BC%88NPC%E7%89%88%EF%BC%89/%E7%95%8C%E9%9D%A2/%E7%8A%B6%E6%80%81%E6%A0%8F/index.html"
```

## 环境注意

- 本地 PowerShell 或浏览器工具偶尔会出现环境问题；先判断是不是工具/预览环境故障，不要立刻改业务代码。
- 当前会话的权限策略不允许请求提权；不要照搬旧记录里的 `sandbox_permissions: require_escalated`。
- Windows 终端中中文路径在某些 Node 脚本里可能变成 `????`。如果遇到 `ENOENT`，优先用递归搜索定位目标文件，不要硬编码损坏后的中文路径。

## Git 注意

- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。
- 工作区可能本来就有用户或历史留下的未提交文件；不要回退不属于当前任务的改动。
- 角色卡相关改动通常只应包含：
  - `src/世界调试模式（NPC版）/**`
  - `dist/世界调试模式（NPC版）/**`
  - `tavern_sync.yaml`
  - `webpack.config.ts`
  - `.github/workflows/purge-jsdelivr.yaml`
  - `PRODUCT.md`
- 是否提交、暂存、推送都应等用户明确要求。
