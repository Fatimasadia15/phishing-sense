---
kind: external_dependency
name: OpenAI-Compatible Chat Completions Endpoint for Multilingual Analysis
slug: openai-compatible-llm-api
category: external_dependency
category_hints:
    - sdk_real_api
    - client_constraint
scope:
    - '**'
---

The backend calls an OpenAI-compatible chat completions endpoint configured via `LLM_API_URL` (default `https://api.openai.com/v1/chat/completions`), `LLM_API_KEY`, and `LLM_MODEL` (default `gpt-4o-mini`). The provider can be disabled entirely by setting `LLM_PROVIDER=none`, in which case the rule engine runs alone. Requests use Bearer token auth, send a system prompt instructing English/Urdu/Roman Urdu output, enforce `response_format: json_object`, and include a 15-second abort timeout. Output is validated against a strict schema before being returned to the frontend; invalid or empty responses fall back to rules-only analysis.