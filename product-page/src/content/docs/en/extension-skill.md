---
slug: extension-skill
title: "Development Skill: AI-assisted extension work"
group: 开发
order: 67
summary: Install and invoke the repository Skill; provide inputs, classify interactions, verify evidence and hand off safely.
---

## What the Skill provides

`texpro-extension-development`, in `skills/texpro-extension-development/`, guides AI work against TeXPro API 1: reading contracts, choosing tools, implementing and verifying plugins/themes. It is not an npm library, desktop plugin, Koishi plugin or execution engine, and grants no automatic installation, network, enablement or publication permission.

Use the [SDK guide](/docs/extension-development) for contracts and [qwertysay](/docs/qwertysay) for creation/build/pack. The Skill organizes real capabilities; it does not replace source or test evidence.

## Install and inspect

Obtain a trusted repository checkout and copy the entire Skill directory to your AI tool's skill location. Codex defaults to `.codex/skills/texpro-extension-development/` under the user directory; a custom CODEX_HOME uses its skills directory. Compare local customizations before updating.

Keep SKILL.md, agents/openai.yaml and references together; copying only SKILL.md breaks relative references. Reload the session and confirm discovery. Other tools use their own skill mechanism. Do not install these files through TeXPro Extensions.

## Give the AI a concrete task

Provide the goal, source location, package type, API, capabilities, target systems, language/style preference, dependency-install permission and deliverables. Without a real host project, public-package checks cannot establish host interaction acceptance.

```text
Use $texpro-extension-development.
Create an API 1 selection-uppercase plugin in my specified new directory.
Use SDK 0.3.0 and guided qwertysay; do not require me to memorize flags.
Declare document.read/document.write and preserve UTF-16, accepted proposals and one-step undo.
Deliver source, MIT LICENSE, .tpp, SHA256, actual evidence and known limits.
Do not publish npm or enable it in my everyday profile or project.
```

For a minimal theme:

```text
Use $texpro-extension-development to create a paper theme with accent #804020.
Choose qwertysay's accent-only option and deliver .tpt.
Only manifest and LICENSE: no CSS, JavaScript or compiler.
Verify install/enable/disable/recovery in a temporary profile and explain trust requirements.
```

## Establish the contract first

Read the task's AGENTS.md, PRODUCT.md, DESIGN.md, extension contracts and SDK types. Read references/build-and-bridge.md for language/bridge work and references/authoring.md for acceptance. Do not load entire chat histories or treat Skill text as user authorization.

Classify interactions L0–L3. Real-time preview remains L0; ordinary writing uses existing contextual surfaces. Only a complete independent task justifies L3. Desktop UI does not inherit website Ant Design rules; preserve host tokens, focus, undo and native titlebar clearance.

Prefer guided qwertysay for authors. In unattended environments the AI must not fake TTY or silently accept prompts; use compatible complete arguments and record equivalent choices. Automation provides reproducibility, not a memorization requirement. Dependency installation and build must be explicit, never hidden in check/pack.

## Implementation boundaries

- Prefer data contributions when sufficient: completions, snippets, templates or token-only themes need no code/compiler.
- Declare actions and capabilities; return proposals checked for identity, UTF-16 ranges and enablement by the host.
- Separate disk reads from unsaved snapshots. Reject stale results after cancellation, disable or project changes.
- Deliver self-contained entries; do not bypass preload, IPC or editor transactions or require runtime npm installation.
- Keep minimal themes at two files. CSS themes declare theme.styles and reject remote resources, scripts and path escapes.
- Preserve author and third-party licenses; MIT for tools does not make all compiled dependencies MIT.

## Tests and evidence

Validate and pack, then install the actual .tpp/.tpt in a temporary TeXPro profile. Development reload creates a disabled snapshot that must be reviewed again. Verify enable/disable, config, failures, stale results, project switches, undo, IME, three themes and recovery. Preserve everyday projects.

Host changes require full npm run test:regression with zero failures, skips or TODOs, plus types, builds, relevant native paths and MCP tests. Use real language compilers; missing tools fail instead of being skipped or replaced by fabricated output. npm tooling changes require an actual tarball install in isolation, not just source symlinks.

Distinguish format validation, compilation, host invocation, native interaction, packaging, push and publication. Report commands, OS, results and unverified areas; one machine is not cross-platform certification.

## Security, recovery and maintenance

Node plugins and build tools have user privileges; process isolation is not an OS sandbox. Even code-free themes can hide buttons, imitate trusted prompts or harm accessibility. Review trusted sources; recover using the native View menu or --safe-mode.

External MCP format queries and package inspection are read-only and never compile/install/enable. The Skill does not turn manifest mcp actions into external tools or expand permissions. Push, npm publication and remote distribution follow actual user authorization.

When host/tool contracts change, update the Skill, references, SDK, qwertysay and bilingual guides together. Handoff includes contracts, versions, licenses, real evidence and unresolved work. Private plans, chats, credentials and temporary profiles stay out of Git and artifacts.

## Language packs and package-manager environments

See [language packs](/docs/language-packs) for the declarative template, preinstalled @texpro/extension-translate-zh-cn, placeholder validation and English recovery. See [npm/Yarn management](/docs/extension-package-management) for authoring configuration, distribution wrappers and reviewed installation/update/removal synchronization. SDK 0.3.0 and qwertysay 0.4.1 use @texpro; historical @gardenialiu versions remain available separately.

## Download the release Skill

Future stable and Nightly releases attach `texpro-extension-development-v{application-version}.skill`, a ZIP containing the complete skill directory and references. Verify the actual Release and digest, then use your AI tool’s import mechanism. If it only accepts ZIP, rename a local copy before extracting. This is an AI Skill, not a `.tpp` desktop plugin. Older releases without the asset can use the complete source directory.
