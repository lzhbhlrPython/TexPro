---
slug: extension-skill
title: "Disvolva Skill: AI-subtenata etendaĵa laboro"
group: AI 协作
order: 67
summary: "Instalu kaj alvoku la deponejan Skill; provizu enigojn, klasifiku interagojn, kontrolu pruvojn kaj transdonu sekure."
---

## Kion provizas la Skill

`texpro-extension-development`, en `skills/texpro-extension-development/`, gvidas AI-laboron laŭ TeXPro API 1: legi kontraktojn, elekti ilojn, efektivigi kaj kontroli kromaĵojn kaj etosojn. Ĝi ne estas npm-biblioteko, surtabla kromaĵo, Koishi-kromaĵo aŭ plenumiga motoro, kaj donas neniun permeson por aŭtomata instalado, reto, ŝaltado aŭ publikigado.

Uzu la [SDK-gvidilon](/docs/extension-development) por kontraktoj kaj [qwertysay](/docs/qwertysay) por kreo, konstruo kaj pakado. La Skill organizas realajn kapablojn; ĝi ne anstataŭigas fonton aŭ testajn pruvojn.

## Instali kaj inspekti

Akiru fidata deponejan eltiraĵon kaj kopiu la tutan Skill-dosierujon al la skill-loko de via AI-ilo. Codex implicite uzas `.codex/skills/texpro-extension-development/` sub la uzanta dosierujo; propra CODEX_HOME uzas sian skills-dosierujon. Komparu lokajn agordojn antaŭ ĝisdatigo.

Tenu SKILL.md, agents/openai.yaml kaj references kune; kopii nur SKILL.md rompas relativajn referencojn. Reŝargu la seancon kaj konfirmu malkovron. Aliaj iloj uzas siajn proprajn skill-mekanismojn. Ne instaligu ĉi tiujn dosierojn per TeXPro Etendaĵoj.

## Donu al la AI konkretan taskon

Provizu la celon, fontan lokon, pakaĵan tipon, API-on, kapablojn, celajn sistemojn, lingvan aŭ stilan preferon, permeson por dependaĵa instalado kaj liverendaĵojn. Sen reala gastiganta projekto, publikpakaĵaj kontroloj ne povas pruvi akcepton de gastiganta interago.

```text
Use $texpro-extension-development.
Create an API 1 selection-uppercase plugin in my specified new directory.
Use SDK 0.3.0 and guided qwertysay; do not require me to memorize flags.
Declare document.read/document.write and preserve UTF-16, accepted proposals and one-step undo.
Deliver source, MIT LICENSE, .tpp, SHA256, actual evidence and known limits.
Do not publish npm or enable it in my everyday profile or project.
```

Por minimuma etoso:

```text
Use $texpro-extension-development to create a paper theme with accent #804020.
Choose qwertysay's accent-only option and deliver .tpt.
Only manifest and LICENSE: no CSS, JavaScript or compiler.
Verify install/enable/disable/recovery in a temporary profile and explain trust requirements.
```

## Unue starigu la kontrakton

Legu la AGENTS.md, PRODUCT.md, DESIGN.md, etendaĵajn kontraktojn kaj SDK-tipojn de la tasko. Legu references/build-and-bridge.md por lingva aŭ ponta laboro kaj references/authoring.md por akceptado. Ne ŝargu tutajn babilhistoriojn nek traktu Skill-tekston kiel uzantan rajtigon.

Klasifiku interagojn L0–L3. Realtempa antaŭrigardo restas L0; ordinara verkado uzas ekzistantajn kuntekstajn surfacojn. Nur kompleta sendependa tasko pravigas L3. Surtabla interfaco ne heredas la retejajn Ant Design-regulojn; konservu gastigantajn ĵetonojn, fokuson, malfaron kaj denaskan titolbreton-spacon.

Preferu gvidatan qwertysay por aŭtoroj. En nesuperrigardataj medioj la AI ne rajtas ŝajnigi TTY aŭ silente akcepti demandojn; uzu kongruajn plenajn argumentojn kaj registru ekvivalentajn elektojn. Aŭtomatigo provizas ripeteblecon, ne postulon parkeri. Dependaĵa instalado kaj konstruo devas esti eksplicitaj, neniam kaŝitaj en check/pack.

## Efektivigaj limoj

- Preferu datumajn kontribuaĵojn kiam ili sufiĉas: kompletigoj, kodpecetoj, ŝablonoj aŭ nur-ĵetonaj etosoj bezonas neniun kodon aŭ kompililon.
- Deklaru agojn kaj kapablojn; resendu proponojn kontrolotajn de la gastiganto laŭ identeco, UTF-16-gamoj kaj ŝaltiteco.
- Apartigu diskajn legojn de nekonservitaj momentfotoj. Rifuzu eksvalidiĝintajn rezultojn post nuligo, malŝalto aŭ projektŝanĝoj.
- Liveru memstarajn enirojn; ne preterpasu preload, IPC aŭ redaktilajn transakciojn nek postulu rulotempan npm-instaladon.
- Tenu minimumajn etosojn je du dosieroj. CSS-etosoj deklaras theme.styles kaj rifuzas malproksimajn rimedojn, skriptojn kaj vojajn eskapojn.
- Konservu aŭtorajn kaj triapartajn permesilojn; MIT por iloj ne igas ĉiujn kompilitajn dependaĵojn MIT.

## Testoj kaj pruvoj

Validigu kaj paku, poste instalu la realan .tpp/.tpt en portempa TeXPro-profio. Disvolva reŝargo kreas malŝaltitan momentfoton, kiun oni devas revizui denove. Kontrolu ŝalton kaj malŝalton, agordon, paneojn, eksvalidiĝintajn rezultojn, projektŝanĝojn, malfaron, IME, tri etosojn kaj restaŭron. Konservu ĉiutagajn projektojn.

Gastigantaj ŝanĝoj postulas plenan npm run test:regression kun nul fiaskoj, preterlasoj aŭ TODO-oj, plus tipoj, konstruoj, koncernaj denaskaj vojoj kaj MCP-testoj. Uzu realajn lingvajn kompililojn; mankantaj iloj fiaskas anstataŭ esti preterlasitaj aŭ anstataŭigitaj per fabrikita eligo. ŝanĝoj al npm-iloj postulas realan tarball-instaladon izolite, ne nur fontajn simbolligojn.

Distingigu formatan validigon, kompiladon, gastigantan alvokon, denaskan interagon, pakadon, puŝon kaj publikigadon. Raportu komandojn, OS, rezultojn kaj nekontrolitajn areojn; unu maŝino ne estas krucplatforma atesto.

## Sekureco, restaŭro kaj prizorgado

Node-kromaĵoj kaj konstruiloj havas uzantajn privilegiojn; proceza izolado ne estas operaciuma sabla skatolo. Eĉ senkodaj etosoj povas kaŝi butonojn, imiti fidatajn demandojn aŭ malutili al alirebleco. Revizuu fidatajn fontojn; restaŭru per la nacia View-menuo aŭ `--safe-mode`.

Eksteraj MCP-formatdemandoj kaj pakaĵinspektado estas nurlegaj kaj neniam kompilas, instalas aŭ ŝaltas. La Skill ne transformas manifestajn mcp-agojn en eksterajn ilojn nek vastigas permesojn. Puŝo, npm-publikigado kaj malproksima distribuo sekvas la realan uzantan rajtigon.

Kiam gastigantaj aŭ ilaj kontraktoj ŝanĝiĝas, ĝisdatigu la Skill, references, SDK, qwertysay kaj dulingvajn gvidilojn kune. Transdono inkluzivas kontraktojn, versiojn, permesilojn, realajn pruvojn kaj nesolvitajn laborojn. Privataj planoj, babiloj, akreditaĵoj kaj portempaj profioj restu ekster Git kaj artefaktoj.

## Lingvopakaĵoj kaj pakaĵadministraj medioj

Vidu [lingvopakaĵojn](/docs/language-packs) por la deklara ŝablono, la antaŭinstalita @texpro/extension-translate-zh-cn, lokokupila validigo kaj angla restaŭro. Vidu [npm/yarn-administradon](/docs/extension-package-management) por aŭtora agordo, distribuaĵaj envolviloj kaj reviziita sinkronigo de instalado, ĝisdatigo kaj forigo. SDK 0.3.0 kaj qwertysay 0.4.1 uzas @texpro; historiaj @gardenialiu-versioj restas haveblaj aparte.

## Elŝuti la eldonan Skill

Estontaj stabilaj kaj Nightly-eldonoj aldonas `texpro-extension-development-v{application-version}.skill`, ZIP enhavantan la kompletan skill-dosierujon kaj references. Kontrolu la realan Release kaj haĉresumon, poste uzu la importmekanismon de via AI-ilo. Se ĝi akceptas nur ZIP, renomigu lokan kopion antaŭ eltiro. Ĉi tio estas AI-Skill, ne `.tpp`-surtabla kromaĵo. Pli malnovaj eldonoj sen la aldonaĵo povas uzi la kompletan fontan dosierujon.

## npm-fonta publikigado kaj konstrua sekureco

Publikigu fonton rekte per texpro.source (implicita pakaĵa radiko); enmetita .tpp/.tpt estas nedeviga. SDK 0.4.0, qwertysay 0.5.0 kaj la kongrua gastiganto subtenas ĉi tiun vojon, apud arkivaj envolviloj. Ruleblaj JS/staticaj dosieroj sinkroniĝas post instalado; kompilitaj pakaĵoj postulas **Prepare installed source** en qwertysay kaj eksplicitan fidon antaŭ sinkronigo kaj TeXPro-revizio. Kompililoj kaj projekta agordo havas uzantajn permesojn; malŝaltitaj instalaj skriptoj kaj portempaj dosierujoj ne estas sablaj skatoloj. Vidu [npm/yarn-etendaĵan administradon](/docs/extension-package-management) por publikigado, instal-, ĝisdatig- kaj forig-paŝoj, ilĉenaj limoj kaj riskoj.
