---
slug: qwertysay
title: "qwertysay: gvidata evoluigo de kromaĵoj kaj etosoj"
group: 开发
order: 66
summary: Startu sen argumentoj por krei, konstrui, kontroli aŭ paki; elektu ilĉenojn, konservu minimumajn etosojn kaj restaŭru sekure.
---

## Startu la gvidilon sen enmemorigi flagojn

**@texpro/qwertysay 0.4.1** estas sendependa Node-ilo de Baolin Liu (gardenialiu), kun originala kodo sub MIT. Ĝi bezonas Node.js 20+, ne Electron aŭ TeX; iuj kompililoj bezonas pli novajn versiojn. La SDK restas 0.3.0 / API 1: vidu la [SDK-gvidilon](/docs/extension-development). Por AI-fluejoj, vidu la [evoluan Skill](/docs/extension-skill).

```sh
npx --package @texpro/qwertysay@0.6.0 qwertysay
```

Alternative, instalu ĝin tutmonde kaj rulu `qwertysay`. npm/npx povas elŝuti ilojn, sed qwertysay create/check/pack neniam instalas dependaĵojn por vi. Windows PowerShell, macOS kaj Linux uzas la samajn numeritajn elektojn kaj Enter; neniu ŝel-specifa sintakso, kolorregado aŭ ekstera menuilo necesas.

Elektu la simpligitan ĉinan aŭ la anglan, poste kreu, konstruu, kontrolu aŭ paku. La menuo ankaŭ proponas npm-elŝutojn, npm-disdonajn envolvaĵojn, npm/yarn-etendaĵajn mediojn kaj dependaĵan sinkronigon. Reviziu vojojn kaj agordon antaŭ plenumo. Nur y, yes aŭ 是 komencas la operacion; Enter nuligas. Ctrl+C aŭ EOF nuligas operacion, kiu ankoraŭ ne komenciĝis. Neinteraga enigo malsukcesas klare anstataŭ atendi invitojn aŭ akcepti defaŭltojn.

## Krei kromaĵon

La gvidilo demandas pri pakaĵa tipo, celloko, pakaĵa ID, aŭtoro, lingvo kaj pakaĵadministrilo (npm/yarn). TypeScript estas la defaŭlto; ekzempla ID estas `author.example`. La aŭtoro estas enskribata en la MIT LICENSE. Uzu realan atribuon kaj reviziu kunigitajn dependaĵojn aparte.

La celloko devas esti nova aŭ malplena. Okupitaj kaj simbolligaj dosierujoj estas malakceptataj. Malvalidaj elektoj, ID-oj kaj koloroj povas esti korektataj. Nenio kreiĝas antaŭ la fina konfirmo. Kreo generas nur fontkodon: neniu npm install, kompililo aŭ etendaĵa plenumado.

| Lingva elekto | Fonto | Antaŭkondiĉoj |
| --- | --- | --- |
| TypeScript | `.cts` | Node.js, TypeScript |
| JavaScript | `.cjs` | Node.js |
| CoffeeScript | `.coffee` | CoffeeScript |
| PureScript | `.purs` | PureScript, Spago; Node ≥22.5 |
| ReScript | `.res` | ReScript |
| ClojureScript | `.cljs` | Java 21+, shadow-cljs |
| Elm | `.elm` | Elm, Platform.worker JSON ports |
| Scala.js | `.scala` | Java, sbt, Scala.js |
| GopherJS | `.go` | GopherJS 1.21, matching Go 1.21.x |

Ĝenerita package.json fiksas ilojn. Eniru la dosierujon kaj eksplicite rulu `npm install` aŭ `yarn install` laŭ via elekto, konservante nur ĝian ŝlosildosieron; yarn uzas node_modules. Preparu ne-npm-ajn antaŭkondiĉojn el la ĝenerita README. Rulu qwertysay denove, elektu konstruon kaj provizu la fontan dosierujon. Ŝargu **dist/package** en TeXPro, ne la fontan radikon de la aŭtoro. Lingvaj pakaĵoj bezonas neniun konstruon; vidu la [lingvapakaĵan lernilon](/docs/language-packs).

## Elekti minimuman aŭ altnivelan etoson

La unua etosa opcio estas **Nur akcento, sen kompilado**. Elektu paper, studio aŭ night kaj ses/ok-ciferan deksesuman akcenton. La rezulto enhavas precize `texpro.extension.json` kaj LICENSE: neniun eniron, CSS, konstruan agordon aŭ node_modules. Aliaj ĵetonoj heredas de la bazo. Kontrolu kaj paku ĝin rekte kiel `.tpt`; neniu konstruo necesas.

Por aranĝo, tipografio, tiparoj kaj rimedoj, elektu stilan ilĉenon:

| Elekto | Fonto | Kompilado |
| --- | --- | --- |
| CSS | `.css` | Validigi/kopii statikajn stilojn |
| SCSS / Sass | `.scss` / `.sass` | Dart Sass; Node ≥20.19 |
| Less | `.less` | Less |
| Stylus | `.styl` | Stylus |
| CSS-in-JS (static) | `.css.ts` | vanilla-extract + esbuild statika eltiro |
| Thematic CSS | `.tcss` | Oficiala tcss-cli, ne Textual CSS |

Instalu TCSS per `cargo install tcss-cli --version 1.0.0 --locked` kaj metu `tcss` en PATH. La nedisponebla npm-pakaĵo `tcss-js` ne estas uzata. CSS-in-JS-takso-skriptoj neniam eniras `.tpt`. Finitaj etosoj enhavas statikan agordon, CSS kaj rimedojn, laŭ la [etosaj sekurecaj reguloj](/docs/themes).

## Konstrui, kontroli kaj paki estas malsamaj

| Operacio | Enigo kaj rezulto | Plenumas evoluigan kodon? |
| --- | --- | --- |
| Krei | Nova/malplena dosierujo → fonto, aŭ rekte pakebla minimuma etoso | Ne |
| Konstrui | Agordita fonto → dist/package | Jes; fidu kompililojn/agordon; dependaĵoj povas elŝutiĝi |
| Kontroli | Fonto, konstruita dosierujo, .tpp aŭ .tpt → validigo kaj resumo | Ne |
| Paki | Fonto aŭ distribuada dosierujo → nova .tpp/.tpt | Ne |

Paki deduktas la sufikson el la manifesto kaj proponas eligon ekster la fonto. Ekzistanta eligo, eligo ene de la fonto kaj neĝustaj sufiksoj estas malakceptataj. La ujo estas limigita ZIP, sed instalado postulas `.tpp`/`.tpt`.

Kontrolo/pakado ĉe la fonta radiko kontrolas la fontan fingrospuron. Ŝanĝitaj fontoj postulas rekonstruon; malsukcesa konstruo malvalidigas malnovan eligon. Kontroli dist/package kontrolas nur tiun momentfoton. Minimumaj ĵetonaj etosoj kaj pli malnovaj memstaraj dosierujoj havas neniun konstruan agordon kaj povas esti kontrolataj/pakataj rekte.

## Malsukcesoj kaj nuligo

Instalu faktajn mankantajn ilojn el la ĝenerita README; neniam elpensu kompilan eligon. GopherJS postulas eksplicitan `go mod tidy` antaŭ konstruado. En Windows, Scala.js povas uzi `TEXPRO_SBT_LAUNCHER` montrantan al sbt-launch.jar kun Java en PATH. Pli malnova Go en pli nova macOS povas bezoni eksteran ligadon kaj lokan subskribon; vidu la deponejan `docs/extension-authoring.md`.

Malsukcesoj de dependaĵ-elŝuto estas konstrumalsukcesoj. Kontrolu prokurilon, kaŝmemorojn kaj ilĉenojn, poste reprovu. La gvidilo ne forigas fonton aŭ nekonatan eligon. Nuligo malhelpas operacion komenciĝi; ĝi ne promesas transakcian retroigon de jam rulanta kompililo, dosiersistema skribo aŭ elŝuto. CLI-kontroloj ne estas denaska akcepto en tri operaciumoj.

## Ekzistantaj komandoj kaj CI

Normala aŭtorado bezonas nur la gvidilon. Ekzistantaj argumentoj restas por skriptoj, CI kaj npm-skriptoj; vidu `--help`. Init/build/check/pack sen siaj vojoj ankaŭ malfermas la respondan gvidilon. CI devas doni kompletajn argumentojn; enpumpita enigo neniam silente akceptas defaŭltojn.

```sh
qwertysay build ./my-plugin
qwertysay check ./my-plugin
qwertysay pack ./my-plugin ./author.example.tpp
```

Konstrumiloj kaj Node-kromaĵoj havas uzantajn permesojn; etosoj povas ŝajnigi la interfacon. Kontroloj kaj sufiksoj ne atestas sekurecon. Reviziu fontojn/licencojn kaj testu faktajn artefaktojn por ŝalti/malŝalti, malfari, IME, eksvalidiĝintaj rezultoj, etosoj kaj restaŭro. Ne ekzistas publika bazaro aŭ aŭtomata publikigo de aŭtoraj kromaĵoj.

## Lingvaj pakaĵoj kaj pakaĵadministraj medioj

Vidu [lingvajn pakaĵojn](/docs/language-packs) por la deklara ŝablono, antaŭinstalita @texpro/extension-translate-zh-cn, lokokupila validigo kaj angla restaŭro. Vidu [npm/yarn-administradon](/docs/extension-package-management) por aŭtorada agordo, disdono-envolvaĵoj kaj reviziita sinkronigo de instalado/ĝisdatigo/forigo. SDK 0.3.0 kaj qwertysay 0.4.1 uzas @texpro; historiaj @gardenialiu-versioj restas disponeblaj aparte.

Post skafoldi funkcian kromaĵon, prizorgu ĝian propran i18n-bibliotekon kaj rimedojn. Uzu la context.language de ĉiu alvoko por elekti ĝian katalogon kaj kunigu rultempajn dependaĵojn/rimedojn en la `.tpp`. Ne kreu gastigan lingvan pakaĵon por komercaj mesaĝoj de kromaĵo. Manifesta lokalizado kaj rultempaj mesaĝoj estas apartaj vojoj; vidu la SDK-gvidilon.

## npm-fonta publikigado kaj konstrua sekureco

Publikigu fonton rekte per texpro.source (defaŭlta pakaĵa radiko); enigita .tpp/.tpt estas laŭvola. SDK 0.4.0, qwertysay 0.5.0 kaj la kongrua gastiganto subtenas ĉi tiun vojon, apud arkivaj envolvaĵoj. Ruleblaj JS/statikaj dosieroj sinkroniĝas post instalado; kompilitaj pakaĵoj postulas Prepare installed source en qwertysay kaj eksplicitan fidon antaŭ sinkronigo kaj TeXPro-revizio. Kompililoj kaj projekta agordo havas uzantajn permesojn; malŝaltitaj instal-skriptoj kaj provizoraj dosierujoj ne estas sablaj skatoloj. Vidu [npm/yarn-etendaĵan administradon](/docs/extension-package-management) por publikigado, instalado/ĝisdatigo/forigo-paŝoj, ilĉenaj limoj kaj riskoj.
