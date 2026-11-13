---
slug: dev-arch
title: Arkitekturo kaj fidlimoj
group: 开发
order: 11
summary: Komprenu dosierojn, kompiladon kaj pakadon per la ĉefprocezo, preload, bildiga tavolo kaj ekstera MCP-servilo.
---

## Limoj de procezoj

| Tavolo | Fonto | Respondeco |
| --- | --- | --- |
| Ĉefprocezo | electron/main.cjs, electron/services/ | Dosieroj, kompilado, fenestroj, sistema aliro kaj validigo |
| Ponto | electron/preload.cjs | Eksplicitaj IPC-ĉirkaŭaĵoj kaj nuligo de abonoj |
| Bildiga tavolo | src/App.tsx, src/editor/, src/components/ | Verkada stato, projekcioj, interago kaj reago |
| Tipoj | src/api.ts, src/types.ts | API-kontraktoj kaj kunhavataj datumoj |
| Ekstera MCP | mcp/server.mjs | Ordinara Node-stdio-servilo kun aliro al disko |

Lasu contextIsolation ŝaltita kaj nodeIntegration malŝaltita. La bildiga tavolo ne rajtas voki Node rekte. La nuna agordo de Electron sandbox ne estas kompleta garantio de sabla skatolo; validigu vojojn, enigojn, sendantojn, protokolojn kaj komandojn aparte.

## Projektoj kaj dosieroj

project-root.cjs solvas la ĉefan dosieron: unue eksplicita rootFile, alie unika nekomentita documentclass-kandidato. Nevalida agordo kaj malklareco ne silentas per aŭtomata retrorirado. La aktiva langeto ne ŝanĝas la kompilan eniron.

project-files.cjs difinas dosierajn limojn. project-operations.cjs kunordigas redaktojn de vojreferencoj kaj malfaron post malsukceso. src/app/fileOperations.ts ĝisdatigas malfermitajn bufrojn por ke postaj konservoj ne restarigu malnovajn vojojn. Ĉi tio ne garantias restaŭron post elektra interrompo.

## Aldoni kapablon

Ĝisdatigu samtempe la ĉefan trattilon, la preload-ĉirkaŭaĵon, src/api.ts kaj src/types.ts. Validigu realajn vojojn, enigon, sendanton kaj asinkronajn skribojn post fermo. Egalaj nombroj de trattiloj ne pruvas kongruajn interfacojn.

Por servoj ŝargataj de ekstera Node, kontrolu asarUnpack en package.json, scripts/verify-release.cjs kaj realan lanĉon ekster ASAR. MCP-stdout portas nur protokolajn mesaĝojn; uzu stderr por protokoloj. Nekonservita redaktila enhavo ne aŭtomate videblas al ekstera MCP.

## Fermi kaj eliri

window-close.cjs intertraktas konservadon kun la bildiga tavolo; malsukcesoj lasas la fenestron malfermita. Eliro sekvas sukcesan konservadon kaj purigadon. En macOS, quit-watchdog.cjs aktiviĝas nur post neŝanĝebla eliro por trakti halton de la denaska elŝaltado. Ĝi ne anstataŭas konservadon nek rulas ĉe ordinara fermo de fenestro.

## Reto kaj permesoj

AI, savkopioj, kunlaboro en loka reto, MCP-klientoj kaj la loka nurlega API havas apartajn fidlimojn. Nedeviga retuzo ne implicas aŭtomatan alŝuton de projektoj; loke-unua ne signifas, ke ĉiu kapablo estas senreta. Kontrolu la realan CSP, protokolojn kaj permesitajn vojojn en main.cjs anstataŭ kopii malnovan politiktekston.

## Kontroli

```sh
npm run typecheck
npm run test:regression
npm run build
npm run verify:release
```

Aldonu `npm run test:mcp` por MCP-ŝanĝoj kaj koncernajn denaskajn regresojn por ŝanĝoj pri konservado kaj fermo. Vidu docs/technical-contracts.md en la deponejo kaj [eldonan gvidadon](/docs/dev-release).
