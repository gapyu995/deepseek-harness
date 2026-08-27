# Agent Note: DeepSeek stream_options gateway compatibility

Status: implemented

English | [中文](2026-08-27-stream-options-gateway-compatibility.zh.md)

## Problem

Some OpenAI-compatible gateways reject the optional `stream_options` request field with HTTP 400, while DeepSeek-compatible endpoints that accept it use the field to request usage data. Treating the schema difference as a permanent invalid request prevents a model turn from starting on those gateways.

## Decision

`dsh-llm-deepseek` sends `stream_options: { include_usage: true }` as before. When a response is HTTP 400 and explicitly identifies `stream_options` as an unknown, unrecognized, or unsupported field, the adapter retries that request once with the optional field removed. Other 400 responses keep their existing error classification, and a second rejection is surfaced to the caller. Usage translation remains unchanged when the provider returns usage chunks.

## Alternatives considered

**Omit `stream_options` from every request.** This would work with strict gateways but would remove the usage request from endpoints that support it, weakening token accounting unnecessarily.

**Add a deployment configuration switch.** A switch would make each deployment declare a protocol quirk, but it would require users to know the gateway schema before the adapter can recover. The explicit provider error already supplies a safe detection signal.

**Retry every invalid request without optional fields.** Broad retries could hide genuine configuration errors and duplicate side effects. The fallback is limited to the named field and one retry.

## Consequences

Gateways with the full OpenAI-compatible field set keep the original one-request behavior and usage reporting. Gateways that reject only `stream_options` spend one bounded extra request and can continue the turn without manual configuration. If the gateway rejects the field for a different reason or rejects the second request, the original `INVALID_REQUEST` failure remains visible.

## Verification

The focused DeepSeek adapter and serializer suites cover the successful retry and the unchanged wire shape: `pnpm exec vitest run packages/llm/llm-deepseek/tests/adapter.spec.ts packages/llm/llm-deepseek/tests/serialize.spec.ts`.
