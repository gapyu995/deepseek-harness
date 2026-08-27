# Agent Note: DeepSeek stream_options 网关兼容性

Status: implemented

[English](2026-08-27-stream-options-gateway-compatibility.md) | 中文

## 问题

部分 OpenAI 兼容网关会因可选的 `stream_options` 请求字段返回 HTTP 400，而接受该字段的 DeepSeek 兼容端点会用它请求 usage 数据。把这种 schema 差异当成永久的无效请求，会阻止这些网关开始模型轮次。

## 决策

`dsh-llm-deepseek` 继续照常发送 `stream_options: { include_usage: true }`。如果响应状态为 HTTP 400，且错误明确指出 `stream_options` 是未知、不识别或不支持的字段，适配器会仅重试一次并移除这个可选字段。其他 400 响应保持原有错误分类；第二次请求仍被拒绝时，错误直接返回调用方。提供方返回 usage 分片时，usage 转换逻辑保持不变。

## Alternatives considered

**所有请求都省略 `stream_options`。** 这能兼容严格网关，但会让支持该字段的端点失去 usage 请求，造成不必要的 token 统计退化。

**增加部署配置开关。** 开关要求每个部署预先声明网关协议差异，并要求用户先知道网关 schema；而提供方返回的明确错误已经提供了安全的检测信号。

**遇到任意无效请求都移除可选字段重试。** 过宽的重试可能掩盖真正的配置错误并重复副作用，因此回退严格限制为指定字段和一次重试。

## 后果

支持完整 OpenAI 兼容字段集的网关保持原有单次请求和 usage 行为。只拒绝 `stream_options` 的网关会额外消耗一次有界请求，然后继续当前轮次，无需手工配置。如果网关因其他原因拒绝该字段，或第二次请求仍被拒绝，原有的 `INVALID_REQUEST` 错误仍会呈现给用户。

## Verification

DeepSeek 适配器和序列化器的聚焦测试覆盖成功重试及原有请求格式：`pnpm exec vitest run packages/llm/llm-deepseek/tests/adapter.spec.ts packages/llm/llm-deepseek/tests/serialize.spec.ts`。
