# 艾莲主题界面设计参数

本文档记录 DeepSeek Harness Web 客户端在 `accent: ellen` 下的代码级视觉参数，作为界面验收、回归和后续调整的内部参考。参数来源于 `packages/client/ui-theme/src/styles/ellen.css`、`design-platform.css`、各客户端组件的 CSS Module，以及对应的 React 组件常量。

## 主题定位

艾莲主题保留黑、白、灰的 DeepSeek 工作台结构，只替换品牌色阶和空状态 Hero 光晕：主品牌色为珊瑚红，辅助光为冰蓝；中性背景、文字、边框、成功色、错误色和警告色继续使用设计平台 token。

主题由 `body[data-ds-ellen-theme]` 属性激活。`preference` 决定浅色、深色或跟随系统，`accent` 的 `ellen` 值决定是否挂载艾莲色阶和艾莲宠物精灵图。

## 全局参数

| 参数 | 代码值 |
| --- | --- |
| 主字体 | `-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Helvetica Neue, Helvetica, Arial, sans-serif` |
| 等宽字体 | `SF Mono, JetBrains Mono, Fira Code, Consolas, Liberation Mono, Menlo, Courier, PingFang SC, Microsoft YaHei` |
| 标准缓动 | `cubic-bezier(0.4, 0, 0.2, 1)` |
| 快速过渡 | `100ms` |
| 标准过渡 | `200ms` |
| 慢速过渡 | `300ms` |
| 阴影 lv1 | `0 2px 4px 0 rgba(0,0,0,.05)` |
| 阴影 lv2 | `0 4px 12px 0 rgba(0,0,0,.02), 0 2px 8px 0 rgba(0,0,0,.04)` |
| 阴影 lv3 | `0 0 1px 0 rgba(0,0,0,.2), 0 0 4px 0 rgba(0,0,0,.02), 0 12px 32px 0 rgba(0,0,0,.08)` |
| 遮罩模糊 | `blur(2px)` |

## 艾莲色阶

艾莲样式将 `--dsw-static-deepseek-*` 和品牌主色别名替换为以下颜色。色阶同时用于浅色和深色模式；模式差异由语义别名决定。

| Token | RGB | HEX | 主要用途 |
| --- | --- | --- | --- |
| `deepseek-50` | `253, 241, 242` | `#FDF1F2` | 浅色用户气泡 |
| `deepseek-100` | `251, 226, 229` | `#FBE2E5` | 业务三级背景、侧栏激活强调 |
| `deepseek-200` | `248, 204, 211` | `#F8CCD3` | 气泡高亮、状态动画高光 |
| `deepseek-300` | `243, 173, 183` | `#F3ADB7` | 艾莲浅色过渡色 |
| `deepseek-400` | `234, 128, 142` | `#EA808E` | 深色主按钮和业务主状态 |
| `deepseek-450` | `226, 100, 118` | `#E26476` | 深色品牌主色别名 |
| `deepseek-500` | `217, 79, 99` | `#D94F63` | 浅色主按钮、引用、激活线 |
| `deepseek-600` | `183, 56, 76` | `#B7384C` | 深色阶过渡 |
| `deepseek-700-delete` | `143, 46, 61` | `#8F2E3D` | 删除语义预留色阶 |
| `deepseek-800` | `96, 42, 50` | `#602A32` | 深色业务三级背景 |
| `deepseek-900` | `62, 33, 38` | `#3E2126` | 深色最深业务背景 |
| `brand-primary-new-colorprimary-new-color` | `217, 79, 99` | `#D94F63` | 艾莲品牌主色硬覆盖 |

## 中性和语义颜色

### 浅色模式

| 角色 | 代码 token | 最终颜色 |
| --- | --- | --- |
| 页面、内容层、浮层底色 | `bg-base`, `bg-layer-*`, `neutral-bluish-00` | `#FFFFFF` |
| 侧栏底色 | `specific-sidebar-fill` | `#F9FAFB` |
| 选择器底色 | `specific-selector` | `#F5F6F7` |
| 侧栏激活底色 | `specific-sidebar-nav-item-active` | `#EBEEF2` |
| 悬停实体底色 | `interactive-bg-hover-solid` | `#F1F3F5` |
| 主文字 | `label-primary` | `#0F1115` |
| 次级文字 | `label-secondary` | `#61666B` |
| 三级文字 | `label-tertiary` | `#81858C` |
| 说明、占位文字 | `label-caption` | `#ADB2B8` |
| 禁用、弱化文字 | `label-dimmed` | `#E1E5EE` |
| 一级边框 | `border-l1` | `rgba(0,0,0,.04)` |
| 二级边框 | `border-l2` | `rgba(0,0,0,.10)` |
| 三级边框 | `border-l3` | `rgba(0,0,0,.12)` |
| 四级边框 | `border-l4` | `rgba(0,0,0,.16)` |
| 业务主色 | `state-business-primary` | `#D94F63` |
| 业务三级背景 | `state-business-tertiary` | `#FBE2E5` |
| 错误主色 | `state-error-primary` | `#EC1313` |
| 警告主色 | `state-warn-primary` | `#F59E0B` |
| 警告标签色 | `state-warn-label` | `#DD8629` |
| 成功主色 | `state-success-primary` | `#22C55E` |

### 深色模式

| 角色 | 代码 token | 最终颜色 |
| --- | --- | --- |
| 页面底色 | `bg-base` | `#151517` |
| 内容层 | `bg-layer-1` | `#232324` |
| 浮层、输入卡、菜单层 | `bg-layer-2` / `bg-layer-3` | `#2C2C2E` / `#353638` |
| 侧栏底色 | `specific-sidebar-fill` | `#1B1B1C`（`neutral-bluish-900`） |
| 选择器底色 | `specific-selector` | `#353638` |
| 侧栏激活底色 | `specific-sidebar-nav-item-active` | `#43454A` |
| 主文字 | `label-primary` | `#F9FAFB` |
| 次级文字 | `label-secondary` | `#CFD3D6` |
| 三级文字 | `label-tertiary` | `#ADB2B8` |
| 说明、占位文字 | `label-caption` | `#81858C` |
| 禁用、弱化文字 | `label-dimmed` | `#43454A` |
| 一级边框 | `border-l1` | `rgba(255,255,255,.06)` |
| 二级边框 | `border-l2` | `rgba(255,255,255,.12)` |
| 三级边框 | `border-l3` | `rgba(255,255,255,.16)` |
| 四级边框 | `border-l4` | `rgba(255,255,255,.20)` |
| 输入卡细边框 | `border-l2-darkmode-thin` | `rgba(255,255,255,.06)` |
| 业务主色 | `state-business-primary` | `#EA808E` |
| 业务三级背景 | `state-business-tertiary` | `#602A32` |
| 错误主色 | `state-error-primary` | `#F25A5A` |
| 警告三级背景 | `state-warn-tertiary` | `#27241F` |

错误、成功、警告色不随艾莲色阶变为粉色，只有业务状态和品牌相关 token 使用艾莲红色。

## 页面布局和尺寸

| 控件或区域 | 参数 |
| --- | --- |
| 应用根背景 | `--dsw-alias-bg-base`；浅色 `#FFFFFF`，深色 `#151517` |
| 左侧栏 | `--dsw-specific-sidebar-fill`；右侧 `1px border-l1` |
| 详情栏 | 左侧 `1px border-l2`；折叠时不绘制边线 |
| 会话内容宽度 | `--dsh-chat-content-width: 748px` |
| Composer 最大宽度 | `748px + 32px = 780px` |
| Composer 两侧留白 | `--dsh-composer-side-clearance: 16px` |
| 上下文卡内缩 | `--dsh-composer-dock-inset: 8px` |
| 聊天滚动区内边距 | 上下 `16px`，水平为 `16px + composer 留白` |
| 聊天消息间距 | `16px` |
| 详情栏内容内边距 | 上下 `12px`，水平 `16px` |

## 左侧导航栏

| 控件 | 尺寸和布局 | 浅色配色 | 深色配色 |
| --- | --- | --- | --- |
| 侧栏根 | `padding: 6px 12px`，字体 `14px` | 背景 `#F9FAFB`，文字 `#0F1115` | 背景 `#1B1B1C`，文字 `#F9FAFB` |
| Logo 行 | 高 `60px`，内边距左 `4px`、其余 `8px` | 品牌图形和名称 `label-primary` | 同语义 token |
| 品牌名称 | `18px/24px`，字重 `600`，字距 `0.04em` | `#0F1115` | `#F9FAFB` |
| 折叠按钮 | `28×28px` 圆形；收起栏为 `36×36px` | 图标 `label-secondary`；悬停 `rgba(38,49,72,.06)` | 图标 `label-secondary`；悬停 `rgba(255,255,255,.08)` |
| 新建会话 | 高 `38px`，圆角 `12px`，边距 `0 2px 8px`，水平内边距 `16px` | 背景 `#FFFFFF`，边框 `rgba(0,0,0,.10)`，文字 `#0F1115` | 背景 `#43454A`，边框 `rgba(255,255,255,.12)`，文字 `#F9FAFB` |
| 新建会话悬停 | 同尺寸 | `#F1F3F5` | `#353638` |
| 工作区项目行 | 高 `34px`，圆角 `8px`，水平内边距 `8px` | 默认透明；悬停 `#F1F3F5` | 默认透明；悬停 `#353638` |
| 会话行 | 高 `32px`，圆角 `8px` | 选中和悬停 `rgba(38,49,72,.06)`；状态点按语义色 | 选中和悬停 `rgba(255,255,255,.08)` |
| 工作区激活文件夹 | `folderActive` | `#D94F63` | `#EA808E` |
| 搜索按钮 | `28×28px` 圆形；展开后输入框高 `30px`、圆角 `10px` | 图标 `#61666B`，边框 `rgba(0,0,0,.10)` | 图标 `#CFD3D6`，边框 `rgba(255,255,255,.12)` |
| 设置入口 | 高 `42px`，圆角 `12px`；收起栏 `36×36px` 圆形 | 默认透明；悬停 `#F1F3F5` | 默认透明；悬停 `#353638` |
| 拖放插入线 | 高 `2px` 主线，左右箭头纹理 | `#D94F63` | `#EA808E` |

## 会话头部和空状态 Hero

| 控件 | 参数 | 配色 |
| --- | --- | --- |
| 会话头部 | `padding: 12px 28px 0 20px`；底部 `1px border-l2` | 文字使用主、三级、说明三档灰度 |
| 面包屑 | `14px/20px`，段间距 `4px`，单段最大宽 `220px`，圆角 `12px` | 当前项 `label-primary`；非当前项 `label-tertiary`；分隔符 `label-caption` |
| Tab 容器 | 左内边距 `8px`，Tab 间距 `36px` | 未选 `label-tertiary`；选中 `state-business-primary` |
| Tab 激活线 | 高 `2px`，圆角 `2px` | 浅色 `#D94F63`；深色 `#EA808E` |
| Hero 标题 | `26px/32px`，字重 `500`；鱼形图标与文字间距 `10px` | 主文字：浅色 `#0F1115`，深色 `#F9FAFB` |
| 预览版标签 | `12px/18px` 等宽字体，水平内边距 `7px`，圆角 `24px`，上偏移 `2px` | 背景浅色 `#FBE2E5`、深色 `#602A32`；文字 `label-primary-bluish`；边框交互悬停色 |
| 工作区选择器 | 高 `28px`，圆角 `16px`，水平内边距 `8px`，图标与文字间距 `4px` | 静态透明；文字和文件夹 `label-primary`；箭头 `label-caption`；悬停 `interactive-bg-hover` |
| Hero 外层 | 输入卡轴心居中；底部内边距 `32px`；栈内间距 `8px` | 不额外填充背景 |
| Hero 珊瑚光晕 | SVG 椭圆 `1051×468`，外椭圆 `opacity .10`，高斯模糊由 SVG 资源提供 | `#E14B5C` |
| Hero 冰蓝光晕 | SVG 内椭圆 `rx=260, ry=88`，`opacity .10` | `#6EC6E8` |

## Composer 输入区

| 控件 | 尺寸和布局 | 浅色配色 | 深色配色 |
| --- | --- | --- | --- |
| Composer 卡片 | 最大宽 `780px`，圆角 `22px`，顶部内边距 `10px`，阴影 lv2 | 背景 `#FFFFFF`；边框 `rgba(0,0,0,.10)` | 背景 `#2C2C2E`；边框 `rgba(255,255,255,.06)` |
| 无工作区卡片 | 外框透明；伪元素绘制 `2px` 虚线、虚线节距 `4 4` | 默认 `border-l4`；悬停 `#D94F63` | 默认 `border-l4`；悬停 `#EA808E` |
| 文本区 | 字体 `16px/24px`；左内边距 `16px`、右 `12px`、顶部 `4px`；最大高度 `336px` | 正常 `#0F1115`；占位 `#ADB2B8`；光标 `#D94F63` | 正常 `#F9FAFB`；占位 `#81858C`；光标 `#EA808E` |
| 附件/命令 `+` | `28×28px` 圆形 | 背景 `#F5F6F7`；图标 `#0F1115`；悬停 `#F1F3F5` | 背景 `#353638`；图标 `#F9FAFB`；悬停 `#43454A` |
| 模式选择器 | 高 `28px`，圆角 `24px`，左内边距 `8px`，右 `4px`；字体 `13px/20px`，字重 `500` | 背景透明；文字 `#61666B`；箭头固定 `#81858C`；悬停 `rgba(38,49,72,.06)` | 文字 `#CFD3D6`；箭头 `#81858C`；悬停 `rgba(255,255,255,.08)` |
| 权限/只读选择器 | 与模式选择器相同 | 同上 | 同上 |
| 模型选择器 | 与模式选择器相同；最大宽 `min(360px,45cqw)` | 文字 `label-secondary`；努力等级和箭头 `label-caption` | 同上 |
| 选择菜单 | 最小宽 `240px`，最大宽 `420px`，最大高 `360px`，圆角 `12px`，内边距 `4px`，阴影 lv3 | 背景 `#FFFFFF`；行悬停 `#F1F3F5` | 背景 `#353638`；行悬停 `#43454A` |
| 菜单行 | 最小高 `38px`，内边距 `6px 8px`，圆角 `10px` | 主文字 `label-primary`；说明 `label-tertiary`；选中仅显示勾选，不改变底色 | 同语义 token |
| 上下文计量按钮 | `28×28px` 圆形；环轨 `2px` | 轨道 `border-l3`；填充 `label-tertiary`；文字 `label-secondary` | 同语义 token |
| 上下文详情面板 | 宽 `264px`，内边距 `12px`，圆角 `12px`，阴影 lv3 | 菜单背景 `#FFFFFF`；数字 `#0F1115`；说明 `#61666B` | 菜单背景 `#353638`；数字 `#F9FAFB`；说明 `#CFD3D6` |
| 发送/停止按钮 | `34×34px` 圆形；图标 `16px`；发送按钮向上偏移 `2px` | 发送底色 `#D94F63`；悬停 `#EA808E`；图标白色；禁用透明度 `.4` | 发送底色 `#EA808E`；悬停 `#D94F63`；图标白色；禁用透明度 `.4` |
| 业务引用、技能、路径 chip | 不增加外层胶囊；沿文本行高绘制 | 文字 `#D94F63` | 文字 `#EA808E` |
| 无效引用 | 删除线，透明度 `.7` | 错误主色 `#EC1313` | 错误主色 `#F25A5A` |

## 聊天内容

| 控件 | 参数 | 配色 |
| --- | --- | --- |
| 用户消息气泡 | 最大宽 `min(525px,82%)`；圆角 `22px`；内边距 `10px 16px`；字体 `16px/24px`；右对齐 | 浅色背景 `#FDF1F2`，文字 `#0F1115` | 深色背景 `#2C2C2E`，文字 `#F9FAFB` |
| 用户消息引用 chip | 图标 `16px`，文字字重 `500` | 浅色 `#D94F63` | 深色 `#EA808E` |
| 助手 Markdown | 默认 `16px/28px`；段落和块间距 `16px` | 主文字 `#0F1115`；链接、文件引用 `#D94F63` | 主文字 `#F9FAFB`；链接、文件引用 `#EA808E` |
| Markdown 标题 | H1 `24px/34px`、H2 `22px/32px`、H3 `20px/30px`、H4 `16px/28px` | 主文字色 |
| 行内代码 | `14px` 等宽，圆角 `6px`，水平内边距 `5px` | 背景 `#EBEEF2`；文字主色 | 背景 `#353638`；文字主色 |
| 代码块 | 圆角 `12px`；内容内边距 `16px`；代码 `13px/22px` | 背景 `#F9FAFB`（`neutral-bluish-50`）；标题带 `#F9FAFB` | 背景 `#1B1B1C`（`neutral-bluish-900`）；标题带 `#2C2C2E` |
| 推理行 | 标题 `14px/24px`；摘要三级文字；运行时有背景擦光动画 | 擦光混合页面白色；标题和摘要按灰度 token | 擦光混合页面深色；标题和摘要按灰度 token |
| `Deep diving...` 状态 | 高 `26px`；业务色阶文字渐变；运行时 `1.8s` shimmer | `#D94F63` 与 `#F8CCD3` | `#EA808E` 与 `#F8CCD3` |
| 运行时钟 | `13px/20px`，超过 `15s` 才显示 | `label-caption` | `label-caption` |
| 错误行 | `13px/20px`；错误点使用 StateDot | 标题 `#EC1313`，正文 `#61666B` | 标题 `#F25A5A`，正文 `#CFD3D6` |
| 最大 token 提示 | 与错误行同布局 | 标题 `#F59E0B`，正文次级灰 | 同语义 token |
| 重试折叠行 | `13px/20px`；展开详情 `12px/18px`；箭头由边框绘制 | 默认三级灰；聚焦环 `#D94F63` | 默认三级灰；聚焦环 `#EA808E` |
| 底部回到底部按钮 | `34×34px`，圆形，阴影 lv2，边框 l2 | 白色浮层；悬停 `#F1F3F5` | `#43454A`；悬停 `#353638` |
| 状态点 | 外圈当前色透明度 `.1`，内核缩放到 `20%` | 完成 `#22C55E`，警告 `#F59E0B`，错误 `#EC1313`，进行中 `#E26476` | 完成、警告、错误同语义；进行中 `#EA808E` |

## Composer 上下文卡和接管面板

Todo、Goal、Queue、审批和计划复核卡共享输入区轴线，卡片宽度由 `780px` 输入卡减去四个 `8px` dock inset 计算。

| 控件 | 参数 | 配色 |
| --- | --- | --- |
| Todo 卡 | 圆角 `12px`，边框 l1，行高 `36px`，内边距 `6px 12px`，列表最大高 `180px` | 背景 `specific-tip`：浅色 `#F5F6F7`，深色 `#353638`；标题主文字；完成图标 `#22C55E`；进行中 `#D94F63/#EA808E` |
| Goal 卡 | 高 `36px`，圆角 `12px`，内边距左 `12px`、右 `5px` | 背景同 Todo；目标文字 `label-primary-dimmed`；编辑聚焦边框业务主色；错误文字错误主色 |
| Queue 卡 | 顶部圆角 `12px`、底部与输入卡连接；行高 `36px`；行间 l1 内阴影 | 背景同 Todo；标题主文字；编辑框背景页面底色；聚焦边框业务主色 |
| 审批接管卡 | 最大宽 `748px`，圆角 `20px`，边框警告 secondary，阴影 lv2 | 浅色输入背景白色；顶部警告带 `#FEF5E7`，文字和点 `#F59E0B`；深色输入背景 `#2C2C2E`，警告带 `#27241F` |
| 计划复核卡 | 最大宽 `748px`，圆角 `20px`，警告边框，正文最大高 `520px` | 与审批接管卡相同；讨论按钮使用次级文字，决策按钮使用通用 Button primary/outline |
| 用户问题卡 | 最大高 `min(60vh,520px)`；选项行最小高 `40px`，圆角 `12px` | 选中/悬停 `interactive-bg-hover`；编号底色 `bg-overlay`；自定义输入聚焦边框业务主色；错误反馈错误主色 |

## 设置面板

| 控件 | 参数 | 配色 |
| --- | --- | --- |
| 设置遮罩 | 固定全屏，背景 `bg-mask-1`，`backdrop-filter: blur(2px)` | 浅色 `rgba(0,0,0,.24)`；深色 `rgba(0,0,0,.50)` |
| 设置主面板 | 宽 `800px`，高 `min(800px,100vh-48px)`，最大宽 `100vw-48px`，圆角 `24px`，阴影 lv3 | 浅色背景 `#FFFFFF`；深色背景 `#2C2C2E` |
| 设置导航栏 | 宽 `188px`，顶部 `22px`，水平内边距 `12px`，分组间距 `18px` | 与面板背景一致 |
| 设置导航项 | `164×40px`，圆角 `12px`，内边距 `9px 16px 9px 12px` | 默认透明；悬停浅色 `#F9FAFB`、深色 `#353638`；激活浅色 `#EBEEF2`、深色 `#43454A` |
| 设置标题 | `16px/24px`，字重 `500` | 主文字 |
| 设置关闭按钮 | `28×28px` 圆形 | 图标主文字；悬停交互背景 |
| 外观选择卡 | 弹性宽度基准 `180px`，内边距 `20px 32px`，圆角 `16px`，边框 l2 | 默认透明；悬停交互背景；选中浅色 `#F5F6F7`、深色 `#353638`，边框固定 `#ADB2B8` |
| 语言选择器 | 高 `36px`，圆角 `18px`，水平内边距 `14px`，图标/文字间距 `12px` | 背景浅色 `#F5F6F7`、深色 `#353638`；文字主色；悬停交互背景 |
| Enter 行选择器 | 与语言选择器相同 | 同上 |
| 通用设置行 | 上下内边距 `16px`，底部 l2 分隔线 | 标题主文字，说明三级文字 |

## 下拉菜单、弹窗和通知

| 控件 | 参数 | 配色 |
| --- | --- | --- |
| 通用菜单 | 圆角 `12px`，内边距 `4px`，边框 inverted，阴影 lv3 | 浅色白底；深色 `#353638` |
| 通用菜单项 | 最小高 `40px`，圆角 `10px`，内边距 `8px 10px`，字体 `14px/22px` | 默认主文字；悬停交互背景；危险项错误主色和危险悬停底色 |
| 紧凑菜单 | 最小宽 `164px`，圆角 `7px`；菜单项高 `26px`、字体 `12px/18px` | 同通用菜单 |
| Tooltip | 最大宽 `50vw`，内边距 `3px 7px`，圆角 `8px`，字体 `13px/20px` | 固定深色背景 `tooltip-bg`：浅色 `#2C2C2E`、深色 `#43454A`；文字白色 |
| Toast | 顶部 `120px`，最大宽 `560px`，内边距 `12px 16px`，圆角 `14px`，阴影 lv3 | 背景 `button-contrast-fill`：浅色 `#61666B`、深色 `#F9FAFB`；文字反转色；警告图标 `#DD8629` |
| 通用 Dialog | 最大宽 `380px`，圆角 `24px`，底部内边距 `24px`，阴影 lv3 | 浅色白底、深色 `#2C2C2E`；取消按钮 outline；确认按钮沿 Button primary |

## 通用基础控件

这些控件由 `ui-primitives` 提供，主题只替换其设计平台 token；艾莲主题下业务主按钮使用 `#D94F63`（深色模式为 `#EA808E`）。

| 控件 | 尺寸与布局 | 浅色配色 | 深色配色 |
| --- | --- | --- | --- |
| Button 默认 | 高 `36px`，水平内边距 `14px`，圆角 `18px`，字号 `14px/22px` | 透明底、主文字 `#0F1115` | 透明底、主文字 `#F9FAFB` |
| Button small | 高 `28px`，水平内边距 `10px`，圆角 `14px`，字号 `12px/18px` | 同上 | 同上 |
| Button primary | 圆角继承，背景使用 `button-primary-fill`，文字使用前景白色 | 艾莲红 `#D94F63`；悬停 `#EA808E` | 艾莲浅红 `#EA808E`；悬停 `#D94F63` |
| Button secondary/tool | 高度按内容，背景使用交互悬停或工具栏填充 token | 悬停 `#F1F3F5`，工具栏填充 `#F5F6F7` | 悬停 `#353638`，工具栏填充 `#353638` |
| 原生 Input | 高 `32px`，内边距 `0 8px`，圆角 `8px`，字号 `14px/22px` | 背景 `#FFFFFF`，边框 `border-l2`，聚焦边框艾莲红 `#D94F63` | 背景 `#232324`，边框 `border-l2`，聚焦边框 `#EA808E` |
| Disclosure 行 | 行高 `24px`；展开按钮 `16×16px` | 箭头 `#81858C`，文本 `#61666B` | 箭头 `#ADB2B8`，文本 `#CFD3D6` |
| 连接错误横幅 | 内边距 `4px 12px`，行高 `18px` | 背景错误色 `#EC1313`，前景白色 | 背景错误色 `#F25A5A`，前景白色 |
| HoverCard | 宽 `244px`，内边距 `12px 16px`，圆角 `12px`，正文行高 `20px` | 深色浮层 `#2C2C2E`，文字白色 | 浮层 `#43454A`，文字白色 |
| 设置文档错误提示 | 最大宽 `180px`，字号 `12px/18px`，超出省略 | 错误主色 `#EC1313` | 错误主色 `#F25A5A` |

## 艾莲宠物

| 参数 | 代码值 |
| --- | --- |
| 精灵图 | 艾莲主题 `/Sprite_ailian.png`；原生主题 `/Sprite_deepseek.png` |
| 精灵表 | `8×4` 网格，单帧 `128×128px`，背景尺寸 `1024×512px` |
| 初始位置 | 距右、下边缘 `24px` |
| 拖拽最小可见边距 | `8px`；保持可见区域 `56px` |
| 点击判定 | 指针总移动超过 `4px` 后视为拖拽 |
| 关闭按钮 | `20×20px` 圆形，右上偏移 `-10px`；默认透明度 `0`，悬停或聚焦显示 |
| 恢复按钮 | 右下 `16px`；胶囊圆角；内边距 `4px 12px`；字体 `12px/18px` |
| 对话气泡 | 最大宽 `260px`，底部距宠物 `12px`，内边距 `8px 14px`，圆角 `12px`，阴影 lv2 |
| 气泡颜色 | 背景使用 elevated fill；文字主色；三角与背景同色；浅色白色，深色 `#43454A` |
| idle 动画 | 第 0 行，8 帧，`6fps` |
| walk 动画 | 第 1 行，8 帧，`10fps` |
| happy 动画 | 第 2 行，8 帧，`10fps`，播放后回到 idle |
| sleep 动画 | 第 3 行，8 帧，`1fps` |
| 无操作休眠 | `30s` |
| 长按休眠 | `500ms` |
| 台词气泡 | 点击后显示 `3500ms`，退出动画 `150ms` |

艾莲精灵图的垂直校正为整体 `-10px`；happy 和 sleep 行额外 `-15px`，sleep 帧根据精灵图绘制偏移执行水平校正。

## 交互状态规则

悬停状态优先使用实体中性底色，避免半透明背景与内容叠加；菜单、输入卡、详情卡和设置面板统一使用圆角、细边框和 lv2/lv3 阴影；业务动作使用艾莲红色，危险动作仍使用独立错误红色。

键盘聚焦环通常使用 `2px` 的三级边框或业务主色；禁用控件保留布局和可访问名称，通过透明度 `.4` 或 `.5`、弱化文字和 `cursor: default/not-allowed` 表达不可用。

`prefers-reduced-motion: reduce` 时关闭侧栏折叠动画、Hero 鱼形动画、状态 shimmer、宠物帧动画和工具行擦光，仅保留必要的透明度或状态变化。

## 代码索引

- 主题色阶和全局 token：`packages/client/ui-theme/src/styles/ellen.css`、`design-platform.css`、`gradient-shadow-text.css`。
- 页面布局：`packages/client/ui-layout/src/client/AppFrame.module.css`、`ui-conversation/src/client/skeleton/ConversationRoot.module.css`。
- 侧栏：`packages/client/ui-sidebar/src/client/SidebarRoot.module.css`、`ui-workspace/src/client/WorkspaceBrowser.module.css`、`ui-workspace/src/client/rows/Rows.module.css`。
- Hero 和输入区：`packages/client/ui-conversation/src/client/skeleton/HeroShell.module.css`、`InputBar.module.css`、`PermissionSelect.module.css`、`ContextMeter.module.css`。
- 聊天内容：`packages/client/ui-conversation/src/client/chat/ChatView.module.css`、`MessageItem.module.css`、`AssistantMarkdown.module.css`、`ReasoningRow.module.css`、`StatsLine.module.css`。
- 菜单、弹窗和反馈：`packages/client/ui-primitives/src/Menu.module.css`、`Modal.module.css`、`Tooltip.module.css`、`Toast.module.css`。
- 设置和主题选择：`packages/client/ui-settings-general/src/client/SettingsRoot.module.css`、`ui-theme/src/client/AppearanceRow.module.css`、`locale/src/client/LanguageRow.module.css`。
- 艾莲宠物：`packages/client/ui-pet/src/client/Pet.tsx`、`Pet.module.css`。
