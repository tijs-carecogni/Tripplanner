"""LLM client supporting Azure OpenAI and OpenAI-compatible endpoints."""

from __future__ import annotations

import asyncio
import json
import os
import re

import httpx

# ---------------------------------------------------------------------------
# Configuration from environment
# ---------------------------------------------------------------------------

def _get_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=60.0)


def _env(key: str, default: str = "") -> str:
    """Read env var at call time, not import time."""
    return os.getenv(key, default)


def is_configured() -> bool:
    return bool(_env("LLM_ENDPOINT") and _env("LLM_API_KEY"))


# ---------------------------------------------------------------------------
# Build request
# ---------------------------------------------------------------------------

def _build_azure_url(endpoint: str, deployment: str, api_version: str) -> str:
    base = endpoint.rstrip("/")
    if "/openai/deployments/" in base:
        return f"{base}/chat/completions?api-version={api_version}"
    return f"{base}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"


def _build_request(
    messages: list[dict],
    temperature: float | None = None,
    reasoning_effort: str | None = None,
) -> tuple[str, dict, dict]:
    """Return (url, headers, payload).

    reasoning_effort: "low", "medium", or "high" — controls how much thinking
    the model does. Use "low" for simple classification/extraction tasks.
    """
    provider = _env("LLM_PROVIDER", "openai-compatible")
    endpoint = _env("LLM_ENDPOINT")
    api_key = _env("LLM_API_KEY")
    model = _env("LLM_MODEL")
    deployment = _env("LLM_DEPLOYMENT")
    api_version = _env("LLM_API_VERSION", "2025-01-01-preview")

    if provider == "azure-openai":
        dep = deployment or model
        if not dep:
            raise ValueError("LLM_DEPLOYMENT is required for Azure OpenAI.")
        url = _build_azure_url(endpoint, dep, api_version)
        headers = {"Content-Type": "application/json", "api-key": api_key}
        payload = {"messages": messages}
        if temperature is not None:
            payload["temperature"] = temperature
        if reasoning_effort is not None:
            payload["reasoning_effort"] = reasoning_effort
    else:
        url = endpoint
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        payload = {"model": model, "messages": messages}
        if temperature is not None:
            payload["temperature"] = temperature
        if reasoning_effort is not None:
            payload["reasoning_effort"] = reasoning_effort
    return url, headers, payload


# ---------------------------------------------------------------------------
# JSON extraction
# ---------------------------------------------------------------------------

_JSON_BLOCK_RE = re.compile(r"```(?:json)?\s*([\s\S]*?)```")
_JSON_BRACE_RE = re.compile(r"\{[\s\S]*\}")
_JSON_BRACKET_RE = re.compile(r"\[[\s\S]*\]")


def _extract_json(text: str) -> dict | list:
    """Extract JSON from LLM response, handling markdown fences."""
    # Try fenced block first
    m = _JSON_BLOCK_RE.search(text)
    if m:
        return json.loads(m.group(1).strip())
    # Try raw JSON object
    m = _JSON_BRACE_RE.search(text)
    if m:
        return json.loads(m.group(0))
    # Try raw JSON array
    m = _JSON_BRACKET_RE.search(text)
    if m:
        return json.loads(m.group(0))
    raise ValueError(f"No JSON found in LLM response: {text[:200]}")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def call_llm_json(
    messages: list[dict],
    temperature: float | None = None,
    reasoning_effort: str | None = None,
) -> dict | list:
    """Call the LLM and parse JSON from the response. Retries on 429."""
    url, headers, payload = _build_request(messages, temperature, reasoning_effort)

    for attempt in range(3):
        resp = await _get_client().post(url, headers=headers, json=payload)
        if resp.status_code == 429:
            wait = float(resp.headers.get("retry-after", 2 * (attempt + 1)))
            await asyncio.sleep(wait)
            continue
        resp.raise_for_status()
        break
    else:
        resp.raise_for_status()  # raise after all retries exhausted

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    if isinstance(content, list):
        content = "\n".join(
            part if isinstance(part, str) else part.get("text", "")
            for part in content
        )
    return _extract_json(content)


async def call_llm_text(
    messages: list[dict],
    temperature: float | None = None,
) -> str:
    """Call the LLM and return raw text."""
    url, headers, payload = _build_request(messages, temperature)
    resp = await _client.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    if isinstance(content, list):
        content = "\n".join(
            part if isinstance(part, str) else part.get("text", "")
            for part in content
        )
    return str(content or "")
