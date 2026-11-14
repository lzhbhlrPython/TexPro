---
slug: dev-release
title: Konstruado kaj eldonado
group: 开发
order: 14
summary: "Pakado estas agordita tute en la kampo build de package.json: mac produktas universalan DMG kaj zip, Windows produktas NSIS, porteblan exe kaj zip, Linux produktas AppImage, deb kaj rpm. Ĉiutagaj Nightly-konstruoj estas generitaj de GitHub Actions."
---

## Kio estas ĉi tiu tavolo

Eldonado estas kunmetita el du pecoj: la loka `electron-builder`-agordo kaj la aŭtomatigo en `.github/workflows/nightly.yml`. La unua decidas, kio eniros la pakaĵon kaj kiel la artefaktoj nomiĝos; la dua decidas, kiam konstruo ruliĝas kaj kie la rezultoj publikiĝas. Ambaŭ kunuzas la kontrol- kaj versio-skriptojn sub `scripts/`.

Ne ekzistas aparta electron-builder-agorda dosiero; ĉio troviĝas en la kampo `build` de la radika `package.json`.

## Identeco de la pakaĵo

```json
{
  "appId": "dev.texpro.app",
  "productName": "TeXPro",
  "artifactName": "${productName}-${version}-${os}-${arch}.${ext}",
  "directories": { "output": "release", "buildResources": "build" }
}
```

`files` estas permeslisto: nur `dist/**`, `electron/**`, `mcp/**`, `demo/**`, `build/icon.*` kaj `package.json` eniras la pakaĵon; la ekskludoj eksplicite forigas `node_modules/@napi-rs/canvas/**` kaj `.playwright-mcp/**`. Fontkodo, `tests/`, `scripts/` kaj `artifacts/` neniam eniras la pakaĵon.

**9 eroj devas resti ekster la asar**, listigitaj en `asarUnpack`:

| Vojo | Kaŭzo |
| --- | --- |
| `mcp/**` | La MCP-servilo startas per ordinara Node kaj devas ne dependi de la asar-ŝargado de Electron |
| `electron/services/tex.cjs` | Lanĉata aŭ postulata laŭ vojo |
| `electron/services/history.cjs` | Same kiel supre |
| `electron/services/git.cjs` | Same kiel supre |
| `electron/services/project-files.cjs` | Same kiel supre |
| `electron/services/project-root.cjs` | Same kiel supre |
| `electron/services/project-operations.cjs` | Same kiel supre |
| `electron/services/font-report.cjs` | Same kiel supre |
| `electron/services/music.cjs` | Same kiel supre |

Mankanta unu montriĝas kiel „loka evoluo funkcias, sed la instalita pakaĵo raportas mankantan modulon“.

## Platformoj kaj nomoj de artefaktoj

| Skripto | Reala komando | Artefakto |
| --- | --- | --- |
| `npm run package` | `electron-builder --mac --dir` | `release/mac-arm64/TeXPro.app`, sen subskribo, por sencimigado |
| `npm run package:mac` | `electron-builder --mac --universal` | `TeXPro-<version>-mac-universal.dmg` kaj zip samnoma |
| `npm run package:win` | `electron-builder --win nsis portable zip --x64` | `TeXPro-<version>-windows-x64-setup.exe`, `-portable.exe` kaj zip |
| `npm run package:linux` | `electron-builder --linux AppImage deb rpm --x64` | `TeXPro-<version>-linux-x64.AppImage`, `.deb`, `.rpm` |

La du Windows-instaliloj anstataŭigas `artifactName` en `build.nsis` kaj `build.portable`; aliaj platformoj uzas la supran ŝablonon. Ĉiu komando unue rulas `npm run build`, kaj artefaktoj aperas en `release/`.

Transplatforma pakado ne estas rekomendata: NSIS kaj AppImage estas plej fidindaj sur siaj propraj platformoj, transkonstruado bezonas pliajn ilarojn, kaj CI ankaŭ rulas la tri platformojn aparte.

## Nightly kaj stabilaj eldonoj

Nightly kontrolas main ĉiutage je 21:23 Asia/Shanghai (13:23 UTC, cron `23 13 * * *`) kaj subtenas permanajn rulojn. Konstruu kiam ajn ekzistas komitoj post la lasta sukcese publikigita Nightly-etikedo kun elŝuteblaj rimedoj. Malplenaj, kunfanditaj kaj malnovtempaj komitoj nombriĝas; ne ekzistas sam-taga filtrilo. Neniuj novaj komitoj signifas salti. Sen antaŭa Nightly, konstruu la ekzistantan historion. API-, mankanta-etikeda kaj prapaĵaj eraroj malsukcesas eksplicite. Malsukcesintaj konstruoj neniam antaŭenigas la sukcesan bazlinion, do postaj ruloj reprovas.

Nightly kaj stabilaj eldonoj kunuzas `_release-build.yml`: fiksu la fontan SHA kaj version, rulu la plenan regresan bazlinion kun nul saltoj/TODOoj, typecheck kaj konstruon, poste paku macOS universalan DMG/ZIP, Windows x64 NSIS/porteblan/ZIP kaj Linux x64 AppImage/deb/rpm. Konstruiloj uzas `--publish never`, konservante antaŭpakan kaj realan ASAR-kontrolon. Nur post kiam ĉiuj platformoj sukcesas, Nightly alŝutas malneton, ĝisdatigas sian datitan etikedon, publikigas la antaŭeldonon kaj refreŝigas la retejon. Ĉiuj eldonaj laborfluoj kunuzas la atendovicon `texpro-release` sen nuligi aktivan eldonon.

La komuna Ubuntu-testlaboro unue instalas latexmk, pdfLaTeX/XeLaTeX/LuaLaTeX kaj CTeX/Fandol por reala kompilado. Mankantaj motoroj devas igi la bazlinion malsukcesi, ne salti ĝiajn kompilajn testojn.

Ĉina LuaLaTeX ankaŭ bezonas LuaTeX-ja el `texlive-lang-japanese`. La komuna laboro instalas ĝin eksplicite kaj antaŭkontrolas CTeX, LuaTeX-ja kaj Fandol per kpsewhich anstataŭ fidi rekomenditajn pakaĵojn.

## Publikigi stabilan version permane

La unua stabila versio estas **v0.1.0 · Tajpilo** (2026-11-12). **Tajpilo**, esperanta vorto por „tajpilo“, nomigas la serion **0.1.x** en la radika `release-series.json`. Ĝi aperas en eldonaj titoloj; versioj, etikedoj kaj nomoj de rimedaj dosieroj restas senŝanĝaj. La publikigilo uzas dulingvajn notojn `docs/releases/vX.Y.Z.md` kiam haveblaj, alie generitajn notojn.

Nur por la unua stabila eldono de la nuna bazo, ŝaltu `initial_release` en **Release patch**; ĉi tiu eldono konservas 0.1.0. La opcio estas implicite malŝaltita, konservante normalajn patch-pliigojn. Ĝi postulas neniujn aliajn stabilajn etikedojn kaj version kongruan kun la testita fonto. Eldona komito registras rulidentecon eĉ se versiaj dosieroj bezonas neniujn ŝanĝojn, ebligante sekurajn reprovojn de tiu sama Actions-rulo. Ne uzu ĉi tiun opcion post kiam stabila eldono ekzistas.

En Actions elektu **Release major**, **Release minor** aŭ **Release patch**, elektu main kaj rulu. Ili produktas X+1.0.0, X.Y+1.0 aŭ X.Y.Z+1 per `_release-stable.yml`. Ili ne publikigas la npm-SDK.

Nur post kiam testoj kaj ĉiuj platformaj pakaĵoj sukcesas, la laborfluo kontrolas, ke main ankoraŭ kongruas kun la testita fonto, poste atome puŝas la versian komiton de radika `package.json`/`package-lock.json` kaj la etikedon `vX.X.X`. Se main antaŭeniris, komencu novan rulon sur la plej nova fonto; neniam puŝu perforte. Stabilaj etikedoj ne povas esti anstataŭigitaj. Rimedoj alŝutiĝas al malneto, kiu publikiĝas nur kiam kompleta, poste refreŝigas la [paĝon de stabilaj eldonoj](/releases). Reprovu la saman Actions-rulon post alŝuta aŭ retej-refreŝiga malsukceso: ĝi ne pliigas la komitan version denove nek realŝutas publikigitan eldonon. Ne komencu novan versian pliigon por ripari la saman malsukcesintan alŝuton. Branĉa/etikeda protekto aŭ mediaj revizioj ankoraŭ povas postuli deponejan administradon.

## Versiaj numeroj

GitHub povas redoni 404 kiam malneto estas petata laŭ etikedo. La publikigilo retroiras al la aŭtentigita, paĝigita eldonlisto por trovi la ĝustan etikedon kaj kontroli alŝutitajn rimedojn. Ne kreu alian version nek reverku etikedon pro ĉi tiu respondo. Malneto publikiĝas nur post kiam ĝiaj rimedoj estas kompletaj, kaj la sama laborfluo-rulo povas esti reprovata sekure.

`release-version.cjs` komputas stabilajn versiojn kaj sinkronigas la radikan pakaĵon kaj ŝlosildosieron. Versioj de SDK/qwertysay restas sendependaj. Postaj Nightly-oj aŭtomate uzas la novan bazon kiel `v{base}-YYYYMMDD-Nightly`; instalitaj pakaĵversioj ellasas v. La Ŝanhaja dato estas kalkulita unufoje por ĉiu platformo. Sam-tagaj Nightly-oj anstataŭigas la etikedon/rimedojn de tiu tago; malsamaj datoj retenas apartajn rikordojn.

```bash
npm run nightly:version
```

`set-nightly-version.mjs` akceptas `NIGHTLY_DATE=YYYYMMDD` kaj `--dry-run`. Nightly markas nur la konstruan checkout, neniam komitante datitajn versiojn nek pliigante la stabilan version. 21:23 estas la planita kontrolo; Actions povas enatendigi ĝin poste.

## Kontrolo de eldono

```bash
npm run verify:release
```

`scripts/verify-release.cjs` estas puraj funkcioj plus CLI, kaj ĝi kontrolas enhavon de artefaktoj anstataŭ nura dosiera ekzisto:

- bezonata listo: `package.json`, `electron/main.cjs`, `electron/preload.cjs`, `electron/quit-watchdog.cjs`, `electron/window-close.cjs`, `mcp/server.mjs`, `dist/index.html` kaj 8 servaj dosieroj
- eltiras la referencitajn `assets/*.js` kaj `*.css` el `dist/index.html`, postulante almenaŭ unu de ĉiu kaj ke ili vere ekzistas
- postulas ke `dist/assets/pdf.worker.*.mjs` ekzistu
- malpermesas ke vojoj `.ai-notes` kaj `superpowers` enŝteliĝu
- donita dosierujo, trairas `dist/`, `electron/` kaj `mcp/`; donita `.asar`, legas la realan pakaĵenhavon per `listPackage` kaj `extractFile` el `@electron/asar`
- plie kontrolas `mcp/server.mjs` kaj la 8 servojn sub `app.asar.unpacked`

Malsukceso presas `[release] <reason>` kaj eliras kun kodo 1. `@electron/asar` estas devDependency, kaj la kontrol-skripto mem neniam eniras la pakaĵon.

## Du pordegoj antaŭ kaj post pakado

`build.beforePack` kaj `build.afterPack` montras al du malgrandaj skriptoj, ĉiu farante nur unu aferon:

```js
// scripts/before-pack.cjs
const result = verifyDirectory(context.packager.projectDir);
// scripts/after-pack.cjs
verifyPackagedApp(path.join(resources, 'app.asar'));
```

La unua kontrolas la realajn dosierujojn tuj antaŭ la pakado — `dist/`, `electron/`, `mcp/` — antaŭ ol paki; la dua legas la realan ASAR por rekontroli rimedojn kaj la eksteran MCP-servon. Ambaŭ kunuzas la saman kontrolmodulon kiel `verify:release`, do unu loka rulo provludas ambaŭ pordegojn.

## Kaptiloj

- Aldoni servan dosieron sen aldoni ĝin al `asarUnpack` kaj al la bezonata listo en `verify-release`: ĝi funkcias loke kaj kraŝas post instalado
- Meti `.ai-notes/` aŭ sencimigajn ekranfotojn en `electron/`: la permeslisto portas ilin en la pakaĵon kaj kontrolo tute rifuzas ĝin
- Redakti la version de `package.json` permane por publikigi nightly: la sekva `nightly:version` prenas ĝin kiel la novan bazon kaj la versia numero drivas
- Relanĉi en la sama tago reuzas la saman etikedon: `release` rulas `git tag --force` kaj anstataŭigas la instalilojn, do pli fruaj artefaktoj ne konserviĝas
- Konstrui mac-pakaĵon sur Windows: la universala kunfando bezonas macOS-ilarojn, kaj CI ankaŭ tenas ilin en apartaj laboroj
- Komiti la konstruan eligon `dist/`: CI rekonstruas ĉiuokaze, kaj komititaj artefaktoj nur kreas konfliktojn

## Kontrolado

```bash
npm run build
npm run verify:release
npm run package -- --publish never
node scripts/verify-release.cjs release/mac-arm64/TeXPro.app/Contents/Resources/app.asar
```

La lasta rulas la pakan kontrolon kontraŭ reala ASAR kaj estas la plej proksima al uzantflanka kontrolo loke disponebla. Subskribado, notarigo kaj ĝisdatiga kanalo ankoraŭ ne estas parto de la deponejo, do publikigita pakaĵo bezonas permanan aprobon ĉe unua lanĉo. CI-pakado ne estas rultempa akcepto; por UI-regreso vidu `/docs/dev-testing`.

## Reteja refreŝigo post eldono

Sukcesa Nightly aŭ stabila eldono eksplicite lanĉas la laborfluon de la Produkta paĝo kun sia ĝusta etikedo. Saltitaj aŭ malsukcesintaj eldonoj ne refreŝigas la retejon. Fiksa eldonpeto devas igi la konstruon malsukcesi anstataŭ deploji malnoviĝintan metadatenon. Ordinaraj retejaj konstruoj povas uzi antaŭan momentfoton kiam eksterrete.

Pages ankaŭ konstruas pro ŝanĝoj en product-page; PR-oj validigas, dum main deplojas. Loka konstruo ne pruvas deplojon. Vidu docs/product-page-deployment.md en la deponejo.

## macOS universala ASAR

Ambaŭ arkitekturoj nuntempe kunuzas identan JavaScript-ASAR-enhavon. `build.mac.mergeASARs: false` evitas, ke supraflua kunfanda paŝo vastigu eksterajn Node-dosierojn en tro grandan globon. Universala DMG/ZIP-servado restas, kun ASAR- kaj eksteraj MCP-kontroloj sur ĉiu arkitekturo kaj la fina pakaĵo. Reala loka dosieruja pakado kaj lipo-kontroloj konfirmas x86_64/arm64. Revalidigu la arkivan aranĝon se arkitekturspecifaj moduloj enkondukiĝas; neniam preterpasi kontrolon.

La retejo grupigas stabilajn eldonojn laŭ major.minor-serio, ekzemple „V0.1 / Tajpilo“. Ĉiu patch-eldono faldiĝas sendepende; nur la plej nova malfermiĝas implicite. Notoj reuzas la ekzistantan Markdown-legilon por titoloj, listoj, kodo, citaĵoj, tabeloj kaj ligiloj; kruda HTML ne estas plenumata.

## Lingvokontribuaĵoj kaj konstrukanaloj

Por aldoni retejan lingvon, sendu lingvajn metadatenojn JSON, mesaĝojn JSON kaj tradukitan Markdown; vidu docs/website-translation.md en la deponejo. Mankantaj mesaĝoj kaj artikoloj anstataŭiĝas eksplicite. La ĉefpaĝo apartigas stabilajn kaj Nightly-eldonojn. Prokrastitaj Nightly-horaroj uzas la plej freŝan 21:23-fenestron laŭ Asia/Shanghai; horecaj riparaj kontroloj saltas fenestrojn, kiuj jam havas publikan konstruon.

## Nightly-versioj de la sekva patch

La radika package kaj lock sur main konservas la publikigitan stabilan version. Nightly celas la sekvan patch: stabila 0.1.1 produktas 0.1.2-YYYYMMDD-Nightly sen antaŭe pliigi main aŭ duoble pliigi la sekvan stabilan eldonon. Sukcesa stabila publikigo eksplicite lanĉas la saman tagon Nightly. Malnova baza versio en tiu dato ne malhelpas la novan konstruon; ekzistantaj eldonoj restas sendifektaj. Planita riparo saltas nur la ĝustan celversion kaj daton. Jam stampita Nightly nur ŝanĝas la daton, evitante ripetajn pliigojn.

La ĉefpaĝo havas ununuran elŝutan sekcion kun elekto por stabila/Nightly. macOS, Windows, Linux kaj la etendaĵa disvolva Skill kunuzas la samajn vicojn, grandecojn, SHA256-kontrolilojn kaj elŝutbutonojn. Skill-grandecoj uzas KB.
