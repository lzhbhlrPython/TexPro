---
slug: dev-setup
title: Agordo de la evoluo
group: 开发
order: 10
summary: Instalu dependaĵojn, rulu la surtablan aplikaĵon kaj la retejon, kaj elektu kontrolojn por via ŝanĝo.
---

## Postuloj

CI uzas Node.js 22. Kontrolu laborfluojn kaj ŝlosildosierojn por ĝustaj ilversioj. Uzu npm por la surtabla aplikaĵo kaj pnpm por la retejo. Reala TeX-kompilado postulas TeX Live aŭ MacTeX, latexmk, la elektitan motoron kaj synctex. Sen TeX vi povas inspekti fonton kaj konstrui la interfacon, sed ne povas aserti, ke vi kontrolis kompiladon.

## Ruli la surtablan aplikaĵon

El la deponeja radiko:

```sh
npm ci
npm run dev
```

Vite servas la bildigilon; Electron provizas denaskajn servojn. Restartigu la evoluprocezon post ŝanĝo de electron-dosieroj. Konstruu la produktan bildigilon per `npm run build` kaj lanĉu ĝin per `npm start`.

## Ruli la retejon

```sh
cd product-page
pnpm install --frozen-lockfile
pnpm dev
```

La retejo estas sendependa de surtabla pakado. La kromaĵo contentFiles de Vite generas malkovrajn dosierojn. Ne redaktu dist aŭ ĝeneritajn llms- kaj fluajn dosierojn permane.

## Solvi problemojn

| Simptomo | Kontrolo |
| --- | --- |
| Malplena Electron-fenestro | Vite-adreso, terminalaj eraroj kaj dist-eniro; konservu procesan izolon |
| Kompililo ne trovita | Loka TeX-instalaĵo, elektita motoro kaj PATH de la GUI-procezo |
| Ambigua ĉefa dosiero | Agordo de rootFile kaj documentclass-kandidatoj; ne anstataŭigu la aktivan langeton |
| Denaska ŝanĝo havas neniun efikon | Restartigu Electron; varmŝarĝo de la bildigilo ne reŝargas denaskajn servojn |
| Mankanta modulo en pakaĵo | asarUnpack, eldona rimedolisto kaj eksteraj Node-dependaĵoj |

## Daŭrigi la evoluon

Legu unue AGENTS.md, PRODUCT.md, DESIGN.md kaj docs/README.md. Vidu [arkitekturon](/docs/dev-arch), [testadon](/docs/dev-testing) kaj [transdonon de sesio](/docs/dev-handoff).

La bildigilo uzas TypeScript kaj ES-modulojn. Denaskaj servoj ĉefe uzas cjs; la MCP-eniro kaj kompartaj puraj moduloj ankaŭ uzas mjs. Ne traktu la tutan electron- aŭ mcp-dosierujon kiel CommonJS. Prizorgu interfacan tekstaron en ambaŭ lingvoj.
