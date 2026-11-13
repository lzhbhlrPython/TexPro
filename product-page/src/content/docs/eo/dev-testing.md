---
slug: dev-testing
title: Testado kaj fulmkontroloj
group: 开发
order: 13
summary: Elektu kontrolojn por tipoj, fontaj regresoj, reala kompilado, denaska interagado kaj pakado; raportu faktajn rezultojn.
---

## Elekti kontrolojn laŭ amplekso

| Amplekso | Komando |
| --- | --- |
| Surtablaj tipoj kaj konstruo | npm run typecheck, npm run build |
| Fontaj kaj servaj regresoj | npm run test:regression |
| Reala TeX-kompilado | npm run test:compile |
| Verkinteragado | npm run test:flow:ui, test:continuity:ui, test:writing:ui |
| Lokokupiloj kaj reviziaj notoj | npm run test:aids:ui |
| Muziko | npm run test:music, test:music:ui |
| Rimedoj kaj importo | npm run test:assets:ui, test:import |
| Ekstera MCP | npm run test:mcp |
| Eldonaj rimedoj | npm run verify:release kaj fakta pakaĵa inspektado |
| Retejo | pnpm check:layout, pnpm typecheck, pnpm build |

Surtablaj skriptoj kun preterlasita prefikso ankaŭ uzas `npm run`. Kontrolu la radikajn kaj retejajn package.json-dosierojn por aktualaj skriptoj. Tabela longo ne estas testa kovrado.

## Fontaj regresoj

Testoj uzas node:test kaj node:assert. Elektu respondajn kazojn por ĉefa-dosiera solvado, PDF-koordinatoj, konserva ordo, muziko, verkhelpaj iloj aŭ Nightly-sinkronigo. Inspektu la dosierujon tests anstataŭ fidi fiksan dosieron aŭ kazonombron.

Testoj ne postulas Electron-interfacon, sed iuj bezonas TeX, Git, infanprocezojn aŭ provizorajn dosierujojn. Raportu mankantajn dependaĵojn kaj preterlasitajn kazojn. Ne priskribu ĉiun teston kiel sendependan purfunkcian teston.

## Denaska interagado

Konstruu antaŭ ruli respondajn interfacajn skriptojn. Uzu provizorajn projektojn kaj uzantdosierujojn, ne ĉiutagajn dokumentojn. Kontrolu focusecon, IME, malfaron, ŝovadon, projektoŝaltadon, konservadon kaj faktan procesan eliron. Tempolimoj kaj kraŝoj estas malsukcesoj.

## Reteja enhavo

Aranĝaj kontroloj devas kongrui antaŭ kaj post nur-enhava laboro. Ne uzu layout:update por kaŝi diferencojn. Konstruoj regeneras maŝinlegeblajn dokumentojn kaj fluojn. Kontrolu dulingvajn slug-ojn, ligilojn kaj la bazan vojon de Pages. Ŝelaj ŝanĝoj aldone bezonas kontrolojn de mallarĝa ekrano, etoso, klavaro kaj reduktita moviĝo.

## Raporti rezultojn

Listigu komandojn, sukcesojn, malsukcesojn, preterlasajn kaŭzojn, faktajn motorojn kaj platformojn. Statika analizo, denaska interagado, instalitaj-pakaĵaj kontroloj kaj malproksimaj Actions provizas malsamajn pruvojn. Dokumentara purigado ne postulas reruli ĉiun neŝanĝitan surtablan interagon.
