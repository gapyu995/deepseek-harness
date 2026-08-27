# Agent Note: Retry DeepSeek gateway requests without unsupported custom tools

Status: implemented

English | [中文](2026-08-27-deepseek-anthropic-custom-tool-fallback.zh.md)

## Problem

Some OpenAI-compatible gateways route the DeepSeek chat-completions request through LiteLLM's Anthropic adapter. The adapter rewrites ordinary function tools as Anthropic `custom` tools, while the deployed model accepts only native `web_search_20250305` or `web_search_20260209`. The gateway rejects the whole request with HTTP 400 before the model can answer.

## Decision

The DeepSeek adapter recognizes this specific 400 response and retries the same request once with the optional function-tool array removed. The existing stream-options retry remains independent, so a gateway may require either or both optional-field omissions. Gateways that accept function tools keep the original request and full tool execution behavior.

## Consequences

Text-only completion remains available through gateways with this translation limitation. A request that takes the fallback path cannot execute Harness function tools for that attempt; callers can retry with a compatible route when tool execution is required. The detection is limited to the explicit `custom`/native-`web_search_*` schema diagnostic and does not hide unrelated HTTP 400 responses.

## Alternatives considered

**Keep surfacing the gateway's HTTP 400.** Rejected because the request is otherwise valid and the gateway's translation limitation prevents even a text response. A single bounded retry preserves usable chat behavior while leaving compatible routes unchanged.

**Rewrite function tools as native `web_search_*` tools.** Rejected because Harness tools have different names, arguments, and execution semantics; pretending they are server-side search tools would produce incorrect calls and results.

**Always omit tools for this deployment.** Rejected because the adapter cannot know a route's gateway translation behavior until it receives the explicit schema error, and compatible gateways must retain normal tool execution.

## Testing

`packages/llm/llm-deepseek/tests/adapter.spec.ts` covers the rejected custom-tool response and asserts that the second request omits `tools` while preserving the normal streamed completion.
