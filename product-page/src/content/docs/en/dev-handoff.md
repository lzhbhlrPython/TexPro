---
slug: dev-handoff
title: Session handoff and documentation map
group: 开发
order: 14.2
summary: Resume work through stable references and distinguish requirements, implementation, history and current checks.
---

## Reading order

1. AGENTS.md: collaboration rules, scope and invariants.
2. PRODUCT.md: the writing-first product purpose.
3. DESIGN.md: actual design tokens, paper language and Google references.
4. docs/README.md and docs/development.md: navigation, development and checks.
5. docs/architecture.md and docs/technical-contracts.md: module responsibilities and contracts.

On this site, read [setup](/docs/dev-setup), [architecture](/docs/dev-arch), [renderer](/docs/dev-renderer), [testing](/docs/dev-testing), [release](/docs/dev-release) and [design language](/docs/dev-design).

## Check before working

```sh
git status --short --branch
git log -5 --oneline
```

Preserve existing changes. Determine scope from the current request and verify the current branch and implementation. Do not repeat completed tasks from old conversations. Line counts, test totals and screenshots are historical evidence, not permanent contracts.

## Preserve these decisions

Ordinary TeX is the original document. The main file is distinct from the active tab. Saving confirms a particular snapshot. Asynchronous results must validate identity. Tools must preserve writing flow. Music should use the TeX toolchain where possible; the ISO idea was cancelled and Liquid Glass was rejected.

Saving, compilation, reference maintenance and MCP must share main-file resolution. The website is an independent static project using pnpm; the desktop uses npm. Content updates do not authorize router or layout changes.

## Handoff contents

Record the objective, changes, decisions, verification commands and actual results, uncovered risks, branch and commit state. Distinguish committing, pushing, merging, releasing and deploying. PASS output does not prove process exit; a local build does not prove publication.

Update public documents for lasting rules. Keep private chat, credentials, superpowers records and temporary plans out of Git. Blogs record application development history, not the current task queue.
