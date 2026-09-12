# Agent Note：对不支持 custom 工具的 DeepSeek 网关重试

Status: implemented

[English](2026-08-27-deepseek-anthropic-custom-tool-fallback.md) | 中文

## 问题

部分 OpenAI 兼容网关会把 DeepSeek chat-completions 请求转发到 LiteLLM 的 Anthropic 适配器。该适配器把普通函数工具改写成 Anthropic `custom` 工具，但部署中的模型只接受原生 `web_search_20250305` 或 `web_search_20260209`，因此模型开始处理前请求就会返回 HTTP 400。

## 决策

DeepSeek 适配器识别这一特定的 400 响应，并仅重试一次，同时移除可选的函数工具数组。原有的 stream-options 重试保持独立，因此同一网关可以要求省略其中一个或两个可选字段。接受函数工具的网关仍使用原始请求并保留完整工具执行能力。

## 影响

通过此类网关仍可完成纯文本请求。走降级路径的请求无法在该次尝试中执行 Harness 函数工具；需要工具时可改用支持该格式的路由。检测范围限制在明确的 `custom`/原生 `web_search_*` schema 错误，不会隐藏其他 HTTP 400。

## 测试

`packages/llm/llm-deepseek/tests/adapter.spec.ts` 覆盖了 custom 工具错误，并断言第二次请求省略 `tools` 且仍能完成正常流式响应。
## Alternatives considered

**继续直接暴露网关 HTTP 400。** 否决：请求本身有效，只是网关的转换限制阻止了文本响应。一次有界重试可以保留可用的聊天行为，同时不改变兼容网关的路径。

**把函数工具改写为原生 `web_search_*` 工具。** 否决：Harness 工具拥有不同名称、参数和执行语义，伪装成服务端搜索工具会产生错误调用和结果。

**针对该部署始终省略工具。** 否决：适配器只有在收到明确的 schema 错误后才能判断网关的转换行为；兼容网关必须保留正常工具执行能力。
