---
slug: extension-development
title: "Kromaĵa SDK: API 1-disvolvo"
group: 开发
order: 65
summary: "Instalu la SDK kaj komprenu manifestojn, traktilojn, servojn, vivciklon, JSON-pontojn, permesojn kaj akceptadon."
---

## Elektu la ĝustan gvidilon

Ĉi tiu gvidilo kovras **@texpro/extension-sdk 0.3.0 / API 1**, de Baolin Liu (gardenialiu), kun MIT-origina kodo. Ĝi provizas publikajn tipojn, helpilojn, JSON-ponton kaj komunan validigon sen Electron, React aŭ TeX. Uzu [gvidatan qwertysay](/docs/qwertysay) por krei projektojn kaj elekti ilĉenojn; uzu la [disvolvan Skill](/docs/extension-skill) por AI-subtenata laboro.

```sh
npm install --save-dev @texpro/extension-sdk@0.5.0
```

Instali la SDK ne instalas kromaĵon en TeXPro. La gastiganto konsumas finitajn, memstarajn enirojn kaj rimedojn; ĝi ne instalas npm-dependaĵojn nek kompilas aŭtorajn fontojn. Enigu rulotempajn SDK-helpilojn en la eniron. Rekta eksporto `activate(ctx)` bezonas neniun rulotempan SDK-importon.

## Manifesto, eniro kaj distribua formato

Ĉiu pakaĵa radiko inkluzivas `texpro.extension.json` kaj LICENSE. Deklaru minusklan nomspacan ID, dulingvajn nomojn, aŭtoron, version, permesilon, API-version kaj minimumajn kapablojn, kongruajn kun la realaj agoj.

```json
{
  "id": "author.uppercase",
  "name": { "zh": "选区大写", "en": "Uppercase selection" },
  "version": "1.0.0",
  "apiVersion": 1,
  "author": "Your name",
  "license": "MIT",
  "entry": "index.cjs",
  "capabilities": ["document.read", "document.write"],
  "contributes": {
    "actions": [{ "id": "uppercase", "title": { "zh": "转换为大写", "en": "Uppercase" }, "kind": "transform", "level": "L2" }]
  }
}
```

Kromaĵaj rulotempaj eniroj estas memstaraj `.cjs` aŭ `.mjs`. TypeScript, CoffeeScript, PureScript, ReScript, ClojureScript, Elm, Scala.js kaj GopherJS devas esti kompilitaj unue. Distribuu **`.tpp`**-kromaĵojn aŭ **`.tpt`**-etosojn. Etosoj ne povas havi plenumeble enirojn aŭ kromaĵajn agojn. Fontaj, rulotempaj kaj instalilaj sufiksoj estas apartaj; renomigi ZIP-on aŭ kaŝi kodon kiel `.tpt` ne preterpasas kontrolojn.

## Proponu unu malfareblan redakton

```js
exports.activate = ctx => {
  ctx.handle('uppercase', context => {
    if (context.signal.aborted) return {};
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

Deklaru la traktilan ID en la manifesto. Fonto kaj elekto apartenas al unu alvoka momentfoto. Ofsetoj uzas JavaScript-**UTF-16-kodunuojn**, ne bajtojn aŭ kodpunktojn. Permesita momentfoto povas enhavi nekonservitan tekston; diskaj servoj ne povas.

Redaktoj estas proponoj. Ĉe eksplicita akcepto, la gastiganto kontrolas projekton, dosieron, dokumentan identecon, gamojn, kapablojn kaj etendaĵan staton, poste aplikas unu CodeMirror-transakcion. Redaktado kaj malfaro reen al identa teksto tamen eksvalidigas malnovan identecon. Neniam mutacu la DOM-on, uzu internajn redaktilajn objektojn aŭ anstataŭigu fontdosierojn por preterpasi proponojn.

## Kapabloj, servoj kaj rezultoj

| Kapablo | Signifo kaj limo |
| --- | --- |
| `document.read` | Permesita fonta momentfoto; ne arbitra dosiersistema rajtigo |
| `document.write` | Proponi redaktojn; akcepto kaj freŝa identeco ankoraŭ necesas |
| `project.read` | Kontrolita konservita projekta teksto kaj diskaj simboloj |
| `build.request` | Peti kompiladon tra konservado kaj reala radika solvo |
| `storage` | Ĝis 1 MiB da JSON por kromaĵo; ne akreditaĵa konservejo |
| `network` | Deklaru retan intencon honeste; ĉi tio ne sandboxas Node |
| `theme.styles` | Kontrolita pakaĵa CSS; nenecesa por etosoj bazitaj nur sur ĵetonoj |

`context.services.call` subtenas `storage.get({key})`, `storage.set({key,value})`, `project.readFile({path})` kaj `project.symbols()`. Projektaj servoj legas la diskon kaj devigas projektajn vojojn. `ctx.config` elmontras deklaritajn signoĉenajn, buleajn kaj nombrajn agordojn, ne sekurajn akreditaĵojn.

`ExtensionResult` povas enhavi redaktojn, diagnozojn, kompletigojn, platajn tekstajn enhavojn, tekstan eligon, proponon pri projektkreado aŭ `action: 'compile'`. Tekstaj antaŭrigardoj ne interpretas HTML. Eksporto, importo kaj kompilado retenas eksplicitajn gastigantajn fluojn. Arbitra React/HTML-enigo, propraj denaskaj TeX-procezoj kaj binarnaj rimedaj rezultoj ne disponeblas.

## Vivciklo kaj nuligo

Registru traktilojn per `ctx.handle()` kaj eventojn per `ctx.on('projectChanged' | 'buildFinished', listener)`. Konservu purigajn revokojn, uzu `ctx.onDispose()`, aŭ resendu forigilon el activate por liberigi tempigilojn, konektojn kaj eksteran staton. Ŝargado limiĝas al kvin sekundoj kaj alvokoj al dek; paneoj, kraŝoj kaj tempolimoj malŝaltas la etendaĵon.

Observu `context.signal` dum nesinkrona laboro. Nuligo, projektŝanĝoj, reŝargo kaj malŝalto ne rajtas skribi eksvalidiĝintajn rezultojn. Nuligo ne povas promesi inversigi kromefikojn jam senditajn al la sistemo aŭ reto. Evitu rektajn dosierŝanĝojn antaŭ ol resendi proponojn.

## Translingva JSON-ponto

Uzu `defineTextTransform()` por kompilita signoĉena transformo; uzu `defineJsonExtension({actions,start})` por plenaj mesaĝoj kaj kontrolitaj servoj. Gastigantaj mesaĝoj estas init, invoke, cancel, event, service-result kaj dispose; kromaĵaj mesaĝoj estas result, service kaj log. Elm uzas DOM-liberajn Platform.worker-pordojn.

Limoj: kvar samtempaj alvokoj, 4 MiB por mesaĝo, 9.5-sekunda tempolimo, dek ses pritraktataj servoj kaj sesdek kvar servpetoj por alvoko. API 1-permesoj, UTF-16-ofsetoj kaj eksvalidiĝaj kontroloj restas aŭtoritataj. Vidu `index.d.ts` por tipoj kaj la deponejan `docs/extension-authoring.md` por konstruaj kontraktoj.

## Validigo, fido kaj transdono

La publika eksporto `package-tools` kunhavas validigon, arkivojn kaj nurlegan inspektadon inter gastiganto, MCP kaj CLI. Arkivoj limiĝas al 16 MiB kaj 300 dosieroj; trapaso, simbolligoj, duoblaj vojoj kaj denaskaj binaraĵoj rifuziĝas. Validigo kaj haĉresumoj establas formaton kaj identecon, ne sekurecon.

**Node-kromaĵoj havas dosierajn, retajn kaj procesajn permesojn de la nuna uzanto. Proceza izolado ne estas operaciuma sabla skatolo. Etosoj povas kaŝi regilojn, imiti fidata interfacon aŭ malutili al alirebleco.** Ŝaltu nur fidatajn fontojn. Restaŭru per la nacia View → Restarigi aspekton kaj malŝalti etendaĵojn, aŭ `--safe-mode`. Vidu [etosojn](/docs/themes) por stilaj kontraktoj.

Instalu la realan artefakton en portempa profilo; kontrolu ŝalton, malŝalton, reŝargon, agordon, erarojn, eksvalidiĝintajn rezultojn, IME, malfaron, etosojn kaj restaŭron. Gastigantaj ŝanĝoj postulas la plenan regresan bazlinion kun nul fiaskoj, preterlasoj kaj TODO-oj. Konservu la LICENSE de la aŭtoro kaj triapartajn avizojn; SDK MIT ne anstataŭigas enpakitajn rulotempajn permesilojn.

Transdono inkluzivas fonton, API- kaj pakaĵajn versiojn, kapablojn, artefakton, haĉresumon, testajn pruvojn kaj limojn. Progresintaj provizantoj kaj interfacaj kontribuaĵoj restas eksperimentaj. Manifestaj `mcp`-agoj ne aŭtomate registriĝas ekstere. `texpro_extension_capabilities` kaj `texpro_inspect_extension` estas nurlegaj kaj neniam konstruas, plenumas, instalas aŭ ŝaltas kromaĵojn.

## Lingvopakaĵoj kaj pakaĵadministraj medioj

Vidu [lingvopakaĵojn](/docs/language-packs) por la deklara ŝablono, la antaŭinstalita @texpro/extension-translate-zh-cn, lokokupila validigo kaj angla restaŭro. Vidu [npm/yarn-administradon](/docs/extension-package-management) por aŭtora agordo, distribuaĵaj envolviloj kaj reviziita sinkronigo de instalado, ĝisdatigo kaj forigo. SDK 0.3.0 kaj qwertysay 0.4.1 uzas @texpro; historiaj @gardenialiu-versioj restas haveblaj aparte.

## Sendependa i18n por funkciaj kromaĵoj

Ĉiu funkcia kromaĵo posedas sian propran i18n-bibliotekon kaj tradukajn rimedojn. Gastigantaj lingvopakaĵoj tradukas TeXPro-n, ne kromaĵajn negocajn mesaĝojn. Manifestaj etikedoj uzas Localized-objektojn kun angla rezervaĵo. Rulotempaj mesaĝoj, diagnozoj kaj antaŭrigardoj elektas la kromaĵan katalogon el `context.language` de ĉiu alvoko; JSON-pontoj ricevas invoke.context.language. Kongruigu la ekzaktan lingvokodon, bazan lingvon kaj la anglan katalogon de la kromaĵo, poste rezervu po mankanta mesaĝo. Ne kaŝmemorigu la lingvon dum activate.

Por sendependa `i18n/messages.json` kun en- kaj fr-katalogoj, elektu `messages[context.language] || messages[context.language.split('-')[0]] || messages.en`, poste uzu `table[key] || messages.en[key]` por mankantaj mesaĝoj. Tenu kromaĵajn ŝlosilojn kaj lokokupilojn ekster la gastiganta katalogo. `contributes.locales` rezerviĝas por deklaraciaj gastigantaj tradukoj kaj ne mikseblas kun funkciaj eniroj.

Uzu npm/yarn por instali la i18n-bibliotekon de via elektita lingvo. Enpaku ĝian rulotempon kaj inkluzivu ĉiun referencitan JSON-rimedon en la finan memstaran `.tpp`; ne dependu de gastigantaj node_modules, privataj vortaroj aŭ rulotempaj elŝutoj. Testu celajn lingvokodojn, regionan kaj mank-mesaĝan rezervaĵojn, kaj lingvoŝanĝojn inter du alvokoj en la sama kromaĵa procezo. Traktu tradukojn kiel tekston, neniam kiel plenuman kodon aŭ HTML.

## npm-fonta publikigado kaj konstrua sekureco

Publikigu fonton rekte per texpro.source (implicita pakaĵa radiko); enmetita .tpp/.tpt estas nedeviga. SDK 0.4.0, qwertysay 0.5.0 kaj la kongrua gastiganto subtenas ĉi tiun vojon, apud arkivaj envolviloj. Ruleblaj JS/staticaj dosieroj sinkroniĝas post instalado; kompilitaj pakaĵoj postulas **Prepare installed source** en qwertysay kaj eksplicitan fidon antaŭ sinkronigo kaj TeXPro-revizio. Kompililoj kaj projekta agordo havas uzantajn permesojn; malŝaltitaj instalaj skriptoj kaj portempaj dosierujoj ne estas sablaj skatoloj. Vidu [npm/yarn-etendaĵan administradon](/docs/extension-package-management) por publikigado, instal-, ĝisdatig- kaj forig-paŝoj, ilĉenaj limoj kaj riskoj.
