---
slug: themes
title: Etosaj pakaĵoj
group: Usage
order: 63
summary: Antaŭrigardu kaj apliku lokajn etosojn konservante la enkonstruitajn reĝimojn kaj la originajn kolorojn de la formala PDF.
---

## Instali kaj apliki

Instalu kaj ŝaltu etosajn pakaĵojn per [Etendaĵoj](/docs/extensions). Etosoj ne bezonas JavaScript. Pakaĵoj kun CSS postulas eksplicitan akcepton de stilaj riskoj antaŭ ŝaltado. Elektu **Antaŭrigardo** por provi etoson portempe. Fermi Etendaĵojn nuligas la antaŭrigardon kaj restarigas la aplikitan etoson. **Apliki etoson** konservas la elekton post restartoj.

Etosoj heredas paper, studio aŭ night. Studio retenas malhelan ĉirkaŭaĵon kun hela verkada surfaco. Elekti enkonstruitan etoson aŭ ŝalti inter tago/nokto forigas la pakaĵan elekton. Malŝalti, malinstali aŭ perdi la elektitan etoson forigas ĝiajn tokenojn kaj reiras al ĝia baza reĝimo.

## Amplekso

Etosoj povas agordi semantikajn kolorojn por la ĉirkaŭaĵo, papero, sintakso, elektoj, diagnozoj kaj fokuso, kaj ankaŭ tiparojn por interfaco / redaktilo / egallarĝa, redaktilan grandecon kaj larĝon, angulradiusojn kaj interspacon. Mankantaj valoroj heredas la bazan reĝimon. Formalaj PDF-oj, aŭtoraj tiparoj kaj eksplicite kolorigitaj bildoj restas apartaj; ekranaj koloroj ne estas skribataj en fontajn dokumentojn.

Pakaĵa CSS povas ŝanĝi aranĝon, tipografion kaj interagajn statojn kaj referenci enpakajn bildojn/tiparojn. Ĝi ne instalas sistemajn tiparojn, ne ŝargas malproksimajn rimedojn kaj ne plenumas JavaScript. Analizita CSS aplikiĝas al la aktiva etoso; prefero pri reduktita moviĝo malŝaltas pakaĵajn animaciojn/transirojn. Koloroj uzas 6/8-ciferajn deksesumajn valorojn kaj tiparaj tokenoj uzas ordinarajn famililistojn. Redaktila grando estas 12–36px, larĝo 400–1600px, radiuso 0–24px kaj interspaca unuo 2–12px por pakaĵa CSS. Pakaĵa redaktila grando/larĝo havas prioritaton super verkaj agordoj; enkonstruitaj etosoj restarigas tiujn uzantajn agordojn.

Deklaru `stylesheet` kaj la kapablon `theme.styles`. Ordinaraj reguloj estas limigitaj al la aktiva etoso; uzu `:scope` por ĝia radiko. Subtenataj at-reguloj estas media, supports, container, layer, font-face kaj keyframes. URL-oj devas referenci enpakajn PNG/JPEG/WebP/GIF aŭ WOFF/WOFF2/TTF/OTF relative al la CSS-dosiero. Importoj, malproksimaj/data-URL-oj, CSS-eskapoj, trapasado kaj aliaj rimedaj funkcioj estas rifuzataj. CSS-fonto limiĝas al 128 KiB, ĉiu rimedo al 1 MiB, malvolvitaj rimedoj al 2 MiB por etoso kaj kunigitaj generitaj stiloj al 4 MiB por pakaĵo. Vidu la ellaborantajn kontraktojn kaj ekzemplojn. DOM-selektoroj ne estas stabila interversia API; rekontrolu post ĝisdatigoj.

## Sekureco kaj riparo

Etosa libereco povas ankaŭ kaŝi regilojn, obstrukci enhavon, imiti fidindajn invitojn aŭ damaĝi alireblecon. Tiparoj kaj bildoj bezonas fidindajn fontojn. Validigo, limigo al la amplekso kaj la foresto de JavaScript ne atestas sekurecon. Kontrolu aŭtorojn, permesilojn kaj enhavon antaŭ ŝaltado. Plenumeblaj kromaĵoj krome havas uzantnivelan aliron al dosieroj, reto kaj procezoj.

Se la interfaco fariĝas neuzebla, uzu la nacian komandon **View → Reset Appearance and Disable Extensions** aŭ lanĉu per `--safe-mode`. Sekura reĝimo malŝaltas ĉiujn etendaĵojn antaŭ ol ruli kroman kodon kaj restarigas la enkonstruitan paperon. Kontrolu pakaĵojn unu post unu antaŭ reŝaltado. Platformaj komandoj troviĝas en [lokaj etendaĵaj pakaĵoj](/docs/extensions).

## Ellabori etoson

Por nur-kolora agordo, minimuma `.tpt` ankoraŭ bezonas nur `texpro.extension.json` kaj `LICENSE`. CSS, JavaScript, kompililoj kaj `qwertysay.build.json` estas nedevigaj. Forlasitaj tokenoj heredas la bazan etoson. Ekzempla manifiesto:

```json
{
  "id": "example.accent-only",
  "name": { "zh": "只改主题色", "en": "Accent only" },
  "version": "1.0.0",
  "apiVersion": 1,
  "author": "Your name",
  "license": "MIT",
  "capabilities": [],
  "contributes": {
    "themes": [{
      "id": "accent",
      "title": { "zh": "暖色强调", "en": "Warm accent" },
      "base": "paper",
      "tokens": { "accent": "#9c472b" }
    }]
  }
}
```

Aldonu vian propran MIT-permesilon, poste rulu `qwertysay check ./accent-only` kaj `qwertysay pack ./accent-only ./accent-only.tpt`. La eligo ne rajtas jam ekzisti. La deponejo inkluzivas funkciantan ekzemplon `examples/extensions/accent-only`. Nur stilfolioj postulas `theme.styles`; nur-tokenaj pakaĵoj bezonas nek kodon nek stilan fido-raŭtigon. Tamen kontrolu la fonton kaj la legeblecon de koloroj.

`examples/extensions/quiet-paper` estas nur-datuma ekzemplo. Vidu [etendaĵan ellaboradon](/docs/extension-development) por la SDK kaj la Skill. Kontrolu verkadon, menuojn, elektojn, sintakson, diagnozojn, fokuson kaj mallarĝajn fenestrojn, kaj liveru ĝustajn ekrankopiojn el la reala aplikaĵo.
