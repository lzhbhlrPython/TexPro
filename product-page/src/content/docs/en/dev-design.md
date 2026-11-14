---
slug: dev-design
title: Design language and interface guidance
group: 开发
order: 14.1
summary: Record the paper identity in Google DESIGN.md format and apply Material Design roles and accessibility guidance.
---

## Canonical reference

The root DESIGN.md is the design-language reference. It contains YAML tokens and eight sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, and Do's and Don'ts. Its structure follows the [Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md).

It records TeXPro's existing paper identity. It does not require a Material component-library migration or a switch to Roboto. Separate design requirements from verified compliance of existing interfaces.

## Choose interaction scope by task

Interface complexity should match task complexity rather than feature count. Before implementation, state the task, level, suitability of existing spaces, justification for a new page and risk of duplicate entry points.

| Level | Surface |
| --- | --- |
| L0 invisible enhancement | Internal automatic work with no new interface; realtime TeX belongs here |
| L1 in-place enhancement | Editor, preview, completion, diagnostics or existing contextual actions |
| L2 on-demand tool | Existing dialog, sidebar, Studio or tool view |
| L3 independent workspace | A page or workbench for a complete independent workflow |

Choose the lowest level that fully supports the task, preserving clarity, efficiency and usability. Independent workflows, large canvases, persistent multi-stage state, different focused contexts or an overcrowded existing surface can justify a page with a clear responsibility. Importance or implementation complexity alone cannot.

Simple status, extra button options, capabilities naturally belonging to saving or preview, and duplicate tools stay in existing spaces. Reveal complexity when needed, restore writing context on exit, and keep necessary errors visible. Do not require a new page for an already fluent operation.

Reuse visual language, routes, focus management, state and undo. Realtime preview uses the existing PDF toolbar, accelerates automatically and prepares formal results for inspection without asking authors to understand rendering modes. The full page decision and validation policy is in AGENTS.md.

## Principles

Writing remains central and tools recede. Math, tables, music, circuits and structural formulas share one writing flow. Source remains accessible and visualization assists. Ordinary edits must not depend on studios, modals or completion buttons. Assistance preserves the file, caret, selection, scroll, IME and undo.

## Color and type

Use [Material Design color roles](https://m3.material.io/styles/color/the-color-system) to reason about surfaces, text, emphasis and states. Desktop tokens live in src/styles/app.css; paper has later overrides, so do not copy only the first declaration. Studio uses dark chrome and light paper, night uses dark paper, and paper is light. The website has separate Ant Design tokens and site variables.

Writing uses serif type, controls use the system UI stack, and source and logs use monospace. Display, headline, title, body and label describe roles rather than instructing a global font replacement. Screen themes must not alter author colors or final PDF ink.

## Accessibility and states

For new or changed components, check actual color combinations against project targets of 4.5:1 for ordinary text and 3:1 for large text and essential non-text controls. Use Google's 48dp touch-target guidance as a reference; evaluate web hit areas and compact desktop controls separately rather than equating dp and CSS px.

Interactive elements need names, visible keyboard focus and an exit path. Do not communicate state through color alone. Check long English copy, Chinese punctuation, zoom, all desktop themes and reduced motion. These are acceptance targets, not certification of every legacy component.

## Motion and components

Reuse the website's existing duration, ease-out, rise and Reveal rhythm. Reduced motion must keep all content visible. Writing and navigation must not wait for decorative animations. Keep Lucide on desktop and Ant Design on the website; completions, menus and placeholders use their existing surface language.

## Before and after changes

Read PRODUCT.md, DESIGN.md and relevant source styles and components. Content cleanup does not authorize a layout redesign. Run layout checks before and after website content work, and maintain both languages. Updating a design specification does not mean the interface has been redesigned.

## Website-specific reference

The root DESIGN.md also documents the website: light and dark surface roles, serif fallbacks, control sizes and radii, responsive navigation, motion and print styles. Website tokens come from product-page/src/App.tsx, src/config/design.ts and src/styles/global.css. Theme state and temporary overrides live in src/lib/theme.tsx; the existing easter-egg page temporarily forces dark mode and restores the previous choice on exit.

The website uses its own light/dark palette, not the desktop paper/studio/night modes. Preserve the existing paper sections, specification rows, linked references and real screenshots. Check narrow layouts, long translations, keyboard operation and printing separately. Content work does not change the layout lock.

## Example: why update checks use L2

Checking application updates is an explicit maintenance task. Preferences already accommodates Include Nightly builds, check status, versions and downloads, so it uses L2 without a new update center. Engineering difficulty and importance alone do not justify a page. Conversely, multi-stage workflows, large canvases, persistent state or substantial crowding can justify an L3 space with a clear responsibility.

Levels are not a ranking of value. Realtime preview uses L0, editor completion uses L1, on-demand tools use L2 and complete independent workflows may use L3. Record the task, suitability of existing spaces, problem solved by a new page and duplicate entry points. Validate focus restoration, scrolling, undo, IME, stale asynchronous results and failure recovery. Page count is not an acceptance target.

See [Installation and your first project](/docs/start) for update steps and [Versions and releases](/docs/dev-release) for service and failure boundaries.
