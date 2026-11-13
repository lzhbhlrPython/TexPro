---
slug: writing-aids
title: Lokokupiloj kaj reviziaj notetoj
group: 使用
order: 5.5
summary: Daŭrigu verki kiam materialo mankas kaj lasu revizian postsignon en la paragrafo mem; la enhavo restas en la TeX, do ĝi estas trovebla, malfarebla kaj transdonebla.
---

## Lokokupiloj: unue daŭrigu verki

Kiam figuro, tabelo, citaĵo aŭ datumo ankoraŭ ne pretas, premu `⌘⇧H` en la korpo (`Ctrl+Shift+H` en Windows / Linux). La redaktilo enmetas lokokupilon kaj elektas ĝian priskribon, do vi povas tuj tajpi tion, kio ankoraŭ mankas. Poste daŭrigu la korpon; ne necesas malfermi studion.

La listo Lokokupiloj maldekstre proponas kvin tipojn: teksto de la korpo, figuro, tabelo, citaĵo kaj datumo. Alklaki eron elektas la tutan komandon en la fonta dosiero, preta por anstataŭigo per la reala enhavo. `F4` / `Shift+F4` cikle trairas la lokokupilojn de la nuna dosiero. La komanda paletro (`⌘K`) ankaŭ trovas ĉi tiujn agojn.

```tex
\texproplaceholder[figure]{补一张实验装置示意图}
\texproplaceholder[data]{核对最终样本量}
```

Enmeti la komandon metas la bezonatajn kongruecajn makroojn en la realan radikan dosieron de la projekto, dum la korpo restas en la nuna subdosiero; la du redaktoj malfariĝas kiel unu grupo. Se propra makroo kun la sama nomo jam ekzistas, la difino de la aŭtoro estas konservata. Iu ajn ordinara LaTeX-distribuo povas kompili ĝin, sen plia ekstera programo.

## Malnetoj kaj la fina sendo

Figuraj kaj tabelaj lokokupiloj konservas sian skatolon kaj priskribon en la malneta PDF; la aliaj tipoj montras enlinian skatolon. Neniu el ili mem produktas realan bildon, referencon aŭ dataron. La problempanelo de la kompilo raportas, kie troviĝas la restantaj eroj, kaj la fonta eksporto ankaŭ markas ilin. Antaŭ ol konstrui sendopakaĵon por arXiv, solvu ĉiun lokokupilon en la projekto, por ke farenda ero neniam sendiĝu kiel finita laboro.

La lokokupila listo kovras la `.tex` / `.ltx`-dosierojn de la projekto; kaŝitaj dosierujoj, konstruaj dosierujoj kaj simbolaj ligiloj ne estas skanataj. Malnetoj, kiujn la radika dosiero neniam inkluzivas, tamen aperas en la projekta inventaro, do pritraktu ilin aŭ movu ilin el la projekto antaŭ pakaĵigo. Se vi tajpas la komandon permane, vi mem devas konservi la makroodifinon en la radika dosiero; la enmeta ago, kiu aŭtomate instalas la subtenon, estas la rekomendata maniero.

## Reviziaj notetoj: daŭrigu de ĉi tie venontfoje

Premu `⌘⇧N` en la nuna paragrafo por lasi noteton, tajpante la enhavon rekte en komenton de la fonta dosiero; premu `⌘⇧U` por malfermi la liston de reviziaj notetoj. Noteto loĝas en ordinara komento: ĝi neniam atingas la PDF kaj ne dependas de la datumbazo de la aplikaĵo.

```tex
这一段先保留现有论证。
% MEMO: check next time that paragraph 3 agrees with the conclusion of Figure 2
% MEMO-DONE: experimental conditions added
```

Kiam vi remalfermas la dosieron, la redaktilo montras sciigon super ĝi, kiu nomas la lastan nefinitan noteton de la dosiero. Alklaku la sciigon por reveni al la proksima paragrafo; vi povas marki la noteton kompletigita aŭ forigi la sciigon por ĉi tiu fojo. Forigi ĝin ne forigas la komenton, kaj post kiam la noteto finiĝis, vi ankoraŭ povas remalfermi ĝin el la listo. La ekzistantaj komentoj `% TODO:`, `% FIXME:`, `% NOTE:` kaj `% DONE:` plu funkcias.

## Labori per MCP

`texpro_writing_aids` redonas la lokokupilojn kaj notetojn trovitajn en konservitaj dosieroj, kune kun iliaj UTF-16-offsetoj kaj SHA-256. `texpro_edit_writing_aid` enmetas, anstataŭigas, aldonas noteton kaj kompletigas aŭ remalfermas unu. Redakto devas sendi la haketon de la dosiero ĵus legita; enmeti lokokupilon bezonas ankaŭ la haketon de la radika dosiero, do eksteraj ŝanĝoj ne estas anstataŭigataj.

MCP-operacioj legas kaj skribas la diskon rekte kaj ne povas vidi nekonservitan redaktilan bufron. Konservu antaŭ ol transdoni laboron al ekstera kliento, kaj kontrolu eksterajn ŝanĝojn post reveno al la redaktilo. Ne ripetu peton kun eksvalidiĝinta offseto.
