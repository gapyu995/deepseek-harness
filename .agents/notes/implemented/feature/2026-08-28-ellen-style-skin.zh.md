# Agent Note: 艾莲强调皮肤 — 样式表属性之上的持久化强调

Status: implemented

[English](2026-08-28-ellen-style-skin.md) | 中文

## 问题

Web 客户端只有一种视觉身份：`--dsw-*` 别名 token 提供中性调色板与深蓝色业务强调色，而用户可见的主题控制只有浅色／深色／跟随系统这一配色偏好。除非第三方插件注册主题（进程内、不持久化的扩展）或手动编辑 token 样式表，否则无法给界面换上不同的外观。用户提出的「改成艾莲（绝区零 艾莲）风格」需要一个内置、可持久化的强调，以及一个在它与原生调色板之间切换的设置项。

## 决策

把强调建模为第二个持久化主题偏好——`ui-theme.accent: 'native' | 'ellen'`——与 `ui-theme.preference`（浅色／深色／跟随系统）正交，并通过 `body[data-ds-ellen-theme]` 属性叠加在专用的 `ellen.css` 样式表之上。

- `theme-settings.ts` 为 `ui-theme` 段新增 `accent`（schema 默认 `native`）。默认值意味着已有文档静默迁移：主机在值越过线路之前就解析出 `accent`，因此无需提升磁盘格式版本。
- `src/styles/ellen.css` 把 `--dsw-static-deepseek-*` 色阶替换为艾莲的珊瑚红（按 `ellen-ui-design.md`：浅色 `#D94F63`／深色 `#EA808E`，50–900 逐步降深至 `#3E2126`），并按模式把品牌主色映射到 deepseek-500/400。因为每个语义别名都经 `var()` 解析 deepseek 色阶，业务状态、气泡与信息按钮会自动换色；该样式表必须排在 `design-platform.css` 之后，因为两者都在同等优先级属性选择器下重定义该色阶，靠后声明的来源赢得并列。
- `ThemeRuntime` 新增 `setAccent`，在快照上发布 `accent`，且绝不把强调折叠进 `active.tokens`——它是样式表属性，不是覆盖层。`setTheme`／`setAccent` 经 settings scope 写入；`adopt` 把两者一并读回。
- `AppearanceRow` 在现有「外观」行下渲染第二行「风格」，含两个方块（原生／艾莲）；settings store 同时镜像 `preference` 与 `accent`。
- 呈现器依据 `snapshot.accent` 切换 `body[data-ds-ellen-theme]`，主机引导代码在插件树挂载前就切换它，使强调选择绝不会闪现原生调色板。

## 测试

`theme.client.spec.ts` 覆盖 `setAccent`、强调绝不进入 `active.tokens`、采纳，以及覆盖层独立组合；`boot-theme.client.spec.ts` 覆盖插件前的 `data-ds-ellen-theme` 切换；`appearance-row.client.spec.tsx` 覆盖第二行的选中状态与写入路由；`settings-store`、`apply`、`host` 与 `client-styles` 规格覆盖拓宽后的镜像、schema 与新增的 `ellen.css` 样式表。`packages/client/ui-layout/tests/theme-presenter.client.spec.ts` 覆盖呈现器对 `data-ds-ellen-theme` 的投影与收回。

## 备选方案

- **把强调折叠为内联 token 层（首版实现）**——一张 `ThemeTokenOverrides` 形状的调色板，以内联 CSS 变量应用到 `body`。它可用，但重复了别名层，且重新实现了现有 `body[data-ds-dark-theme]` 属性机制已经做到的事；在 `ellen.css` 里一次性覆盖静态色阶，部件更少，也让强调作为样式表源码更可检视。
- **通过 `ThemeRuntime.register` 把 `ellen` 注册为第三方式主题**——一个主题只有单一 `colorScheme`（浅色或深色），其 id 是进程内且不持久化的，因此要么强制只做深色皮肤，要么注册两个 id，且都没有持久化偏好。强调路径让浅色／深色／跟随系统在底层保持完整，并通过 schema 持久化。
- **把 `state-error`／`state-warn` 挪用于艾莲的红色**——红瞳／红缎带极具标志性，但借用错误或警告语义来承载装饰性红色会让真正的错误与警告变得不可读。品牌强调色（`--dsw-alias-brand-primary`）承载了红色，状态 token 保持不变。

## 后果

一个 `accent` 字段挂在现有 `ui-theme` 命名空间上（schema 默认值，因此无需迁移），强调是一个样式表属性而非注册主题——调整它只需改 `ellen.css` 并配套快照。外观行现在拥有两个镜像同一 store 的子行，呈现器与主机引导代码都会切换该属性，因此插件前与激活后的绘制一致。被接受的代价：强调会重染整个 deepseek 色阶（任何消费该色阶的组件都会变珊瑚红，这正是目的所在），且 `ThemeSnapshot` 的消费者（ui-layout、外观 store）多携带一个字段。
