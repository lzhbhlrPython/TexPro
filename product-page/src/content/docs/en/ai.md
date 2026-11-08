---
slug: ai
title: AI assistant (optional)
group: 参考
order: 8
summary: AI is off by default. Once an OpenAI-compatible endpoint and key are filled in, context leaves your machine only when you press Run, and results are written only after you confirm.
---

## Off by default

TeXPro bundles no model, and does no autocomplete-style rewriting on your behalf. AI is an optional feature you wire up yourself: unconfigured, the app makes no request to any AI service.

Configuration lives in `Settings → Optional AI`:

- Turn on the Enable AI assistant switch
- Enter the service URL, `https://api.openai.com/v1` by default, without `/chat/completions` on the end
- Enter the model name, `gpt-4o-mini` by default
- Enter the API key

The key never goes into ordinary settings, nor into `localStorage`. The main process encrypts it with the system secure store and saves it as `secrets.json` in the app data directory, with `0600` permissions. Where the system offers no encryption, saving fails with a message rather than falling back to plain text.

## Opening the panel

`Project → AI Assistant…`, or search for `AI assistant` in the command palette.

Unconfigured, the panel shows no tasks, only a settings card; every button is disabled, and there is no try-it-out entry.

## Six tasks

| Task | Context sent | Output |
| --- | --- | --- |
| Explain compile error | The current compile error and diagnostic line | An explanation and the smallest fix |
| Rewrite clearly | A few lines around the caret | A clearer LaTeX paragraph |
| Translate to Chinese | A few lines around the caret | A Chinese translation that keeps commands and formulas |
| Translate to English | A few lines around the caret | An English translation that keeps commands and formulas |
| LaTeX from description | The natural-language description you type (prefilled with a few lines around the caret, replaceable) | A single math expression, without `$` |
| Agent actions | The current selection (default context when nothing is selected) | Structured edit actions |

Each task carries a fixed system prompt: translation and rewriting must preserve every command, reference, label and formula; `Agent actions` must return JSON only, with no explanatory prose.

## The context is editable

The Context field in the panel is an ordinary text box you can edit before sending. Its default follows the task:

- Explain error: the error lines from the current build result
- Agent actions: the current selection
- Other tasks: roughly five lines either side of the caret's line

With an empty box, a placeholder reading "No context provided." is still sent, rather than the request quietly being cancelled.

> Only the text in this box leaves your machine. The project directory, other files and the PDF are never packed up and uploaded automatically.

## Running and accepting

Press Run and the request streams back, the result appearing as it arrives; Stop aborts the current request.

- Ordinary tasks: the result appears in the text box below; only Insert result puts it at the caret, and the panel closes afterwards
- Agent actions: the result is parsed into action cards, each stating its type and reason; only Apply action runs one, and applied cards are marked Applied

Agent actions recognises three actions only: `insert`, `replace-selection`, `replace-document`. When the model's reply is not valid JSON, or contains no runnable action, the panel reports an error instead of quietly editing files.

> There is no Accept all and no automatic apply. Review bulk edits one by one.

## Request details

- Protocol: OpenAI-compatible Chat Completions, `POST {baseUrl}/chat/completions`
- Auth: `Authorization: Bearer <apiKey>`
- Parameters: `temperature: 0.2`, `stream: true`, with exactly one system and one user message
- Failures show the status code and a response excerpt, for instance `AI request failed (401)`
- No conversation history is kept: every Run is a standalone round carrying only the current task's system prompt and context

Any service speaking that protocol therefore works: a self-hosted gateway, a proxy, a local inference server — as long as it streams `choices[0].delta.content`.

## Privacy and limits

- AI is off by default and never runs on its own; no background warming, no automatic summaries
- The key stays on your machine; requests go from the app straight to the URL you entered, with no TeXPro relay
- The provider sees the text you send; its logging and retention policy is its own business
- A model can produce LaTeX that will not compile, or change the wrong command; build first, then accept
- For project-level reads, writes, builds and search, use MCP instead of pasting the whole project into a dialog

> Switching service or model needs no restart: save the settings and the next Run uses them.

## When something goes wrong

| Symptom | Check first |
| --- | --- |
| The panel shows only the settings card | Whether the switch is on and the key is non-empty |
| `AI request failed (401)` | Whether the key is correct and unexpired |
| `AI request failed (404)` | Whether the URL has an extra or missing `/v1` |
| `AI returned an empty stream` | Whether the service supports streaming; try a proxy that does |
| Agent actions reports no valid actions | Whether the model returned JSON; try a stronger instruction-follower |
