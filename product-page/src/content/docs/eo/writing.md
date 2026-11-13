---
slug: writing
title: Verkaj reĝimoj kaj etosoj
group: 使用
order: 5
summary: Unu .tex-dosiero havas plurajn ekranajn projekciojn. La vida tavolo desegnas ĝian strukturon, fokuso, tajpilo kaj la reĝimo sen interfaco decidas kiom de la ekrano restas, kaj etosoj nur ŝanĝas interfacajn kolorojn.
---

La enhavo ĉiam estas la sama `.tex`. La vida tavolo ŝanĝas kiel ĝi montriĝas, verkaj reĝimoj ŝanĝas kiom montriĝas, etosoj ŝanĝas en kiu koloro ĝi montriĝas. Ĉiuj tri agas nur sur la interfacon: neniu tuŝas la fonton, kaj neniu partoprenas en konstruo.

## Vida reĝimo

Implicite ŝaltita; `⇧⌘M` aŭ `Vido → Baskuligi vidan reĝimon` ŝaltas ĝin. Dum ĝi estas ŝaltita, la redaktilo bildigas titolojn, formulojn, tabelojn, bildojn, kodblokojn kaj citajn mediojn kiel preskaŭ kompostitajn komponantojn, kaj la sintaksa bruo malantaŭeniras.

- Alklaku iun ajn bildigitan rezulton kaj la kursoro venas al ĝia fonta pozicio; la objekto malfaldiĝas en fonton, preta por redaktado.
- Bloko, kiun la kursoro aŭ selekto eniras, dummomente revenas al fonto; ĝi rebildiĝas post kiam vi eliras.
- La enkonduko faldiĝas en karton montrantan la dokumentan klason, la nombron de pakaĵoj kaj la nombron de kaŝitaj linioj; alklaku Malkaŝi por malfermi ĝin.
- Ligiloj aperas kiel ordinara teksto en la korpo; tenu `⌘` (`Ctrl` en Windows / Linux) kaj alklaku por malfermi unu en la sistema retumilo.

La vida tavolo estas aro de semantikaj komponantoj, ne komposta motoro: linisaltoj, lokigo de flosantaj objektoj kaj tiparaj metrikoj venas nur el la PDF. Juĝu la finan rezulton laŭ la PDF, ne laŭ la redaktilo.

## Fokuso, tajpilo kaj la reĝimo sen interfaco

| Reĝimo | Konduto | Baskulilo |
| --- | --- | --- |
| Fokusa reĝimo | Ĉio ekster la nuna alineo paliĝas; flankstrio, PDF kaj formatbreto kaŝiĝas, la korpo fariĝas unu kolumno, kaj la maksimuma larĝo estas la pli malgranda el la legada larĝo kaj 720 px | `⇧⌘F` |
| Tajpila ruliĝado | Centrigas la kursoron post kiam la selekto ŝanĝiĝas; la vidkampo ruliĝas dum vi tajpas | `⇧⌘T` |
| Reĝimo sen interfaco | Kaŝas la titolbreton, flankstrion, PDF, statan breton, probleman panelon kaj formatbreton; la korpo estas maksimume 820 px larĝa kaj butono Eliri fokuson restas en la supra dekstra angulo | `⌘⇧0`, `Esc` eliras |

Fokusa reĝimo traktas alineon kiel sinsekvon de ne malplenaj linioj: nur malplena linio inter du el ili faras du alineojn. Tajpila reĝimo ruliĝas la kursoron al la mezo de la vidkampo 20 milisekundojn post kiam la selekto ŝanĝiĝas, kaj faras nenion dum la redaktilo ne havas fokuson.

La tri reĝimoj stakiĝas. Fokuso plus tajpilo taŭgas por longaj verkaj streĉoj; la reĝimo sen interfaco taŭgas por prezenti, por ekrankopio, aŭ simple por ne voli vidi iujn ajn ilarbretojn.

## Etosoj

| Etoso | Sento |
| --- | --- |
| Papero | Implicita. Varma blanka papero, malhela teksto; la ilarbreto faldiĝas en menuon Pli en la supra dekstra angulo |
| Nokto | Malhela interfaco por verki nokte |
| Studio | Malhela flankstrio apud hela redakta areo |

`⇧⌘L` nur ŝaltas inter Papero kaj Nokto: el Studio unu premado revenigas al Papero. Ĉiu etoso havas sian propran komandon en la komanda paletro (Etoso: Papero, Etoso: Nokto, Etoso: Studio), pli rekta ol ciklado.

Etosoj nur ŝanĝas interfacajn CSS-variablojn. Ili ne efikas la fonton, la PDF aŭ eksportojn; ŝalti etosojn neniam rekompostas la dokumenton.

## Tipografiaj agordoj

| Agordo | Intervalo | Implicita |
| --- | --- | --- |
| Tipara grando | 13 ĝis 22 px | 17 px |
| Legada larĝo | 620 ĝis 980 px | 760 px |

La legada larĝo ankaŭ estas la larĝa limo en fokusa reĝimo, kaj la pli malgranda el la du venkas. Ĉi tiuj agordoj loĝas en lokaj preferoj, sendepende de iu ajn projekto, kaj ŝalti projektojn ne restarigas ilin.

## Enigaj helpiloj

Markdown-enigaj klavkombinoj nur ekfunkcias dum vi tajpas en la korpo; la enkonduko, komentoj, matematiko, verbatim kaj komandaj argumentoj konservas sian laŭvortan tekston.

- Linio komenciĝanta per `# ` ĝis `###### ` fariĝas `\section` ĝis `\subparagraph`.
- Ĉefa `-`, `+` aŭ `*` fariĝas itemize-skeletono, `1.` fariĝas enumerate, kaj `>` fariĝas citaĵo.
- Fina `**grasa**`, `*kursiva*` aŭ per malantaŭa krampo ĉirkaŭita kodo fariĝas `\textbf`, `\emph`, `\texttt`.
- Malfari restarigas la sintakson, kiun vi efektive tajpis, anstataŭ malfari la konvertiĝon signon post signo.

Saĝa algluo inspektas, kion ĝi algluas: se la tondujo jam enhavas TeX-komandojn, ĝi algluas laŭvorte; HTML de retpaĝo fariĝas grasa, kursiva, egallarĝa teksto, ligiloj kaj listoj, revenante al simpla teksto kiam ĝi renkontas kunfanditajn ĉelojn; TSV kun konsekvencaj kolumnaj nombroj fariĝas tabular; Markdown fariĝas titoloj, listoj, citaĵoj, kodblokoj kaj tabeloj. `⌘⇧V` ĉiam algluas kiel simplan tekston.

Literumkontrolo nur rigardas vortojn en latina skribo, kun komandoj, matematiko, verbatim, URL-oj kaj retadresoj antaŭe kaŝitaj; ĝi ne juĝas ĉinan vortigon. `Montri liniajn numerojn` regas la marĝenon de liniaj numeroj.

La mezo de la stata breto montras tri aferojn: Ln/Col, la nombron de elektitaj signoj, kaj `n vortoj`. Vortoj estas kalkulataj post kiam komentoj, mediaj markiloj kaj komandoj estas forigitaj; latina teksto disiĝas laŭ spacoj, la ĉina kalkuliĝas laŭ signo, do plurlingva malneto montras sufiĉe grandan nombron.

## Interfaca lingvo kaj la komanda paletro

Agordoj ŝaltas la interfacon inter la ĉina kaj la angla, kaj menuoj, komanda paletro kaj konsiletoj sekvas. Serĉi etosojn, reĝimojn aŭ panelajn nomojn en `⌘K` rulas ilin rekte, kio superas memorigon de klavkombinoj; la paletro duobliĝas kiel malkovra surfaco, ĉar multaj studiaj paneloj aperas nur tie.

## Oftaj kaptiloj

- Fokusa reĝimo disigas laŭ sinsekvoj de ne malplenaj linioj: sen malplena linio inter alineoj, ili kalkuliĝas kiel unu.
- La reĝimo sen interfaco ne estas plenekrano: ĝi nur kaŝas interfacajn elementojn, la PDF kaj la konstruoj daŭre ruliĝas, kaj `Esc` aŭ la supra dekstra butono eliras.
- Tajpila reĝimo dependas de la redaktila fokuso kaj ne ruliĝas kiam vi alklakas en la flankstrion.
- Tajpi `*` ene de matematiko ne konvertiĝas al emph, intence; konvertiĝo rekomenciĝas post kiam vi eliras la matematikon.
- Malŝalti la vidan reĝimon ankaŭ forprenas klakon-al-fonto sur bildigitaj objektoj.
- Studio ne estas la implicita etoso; freŝa instalo aŭ restarigo de agordoj donas al vi Paperon.
- Fokusa reĝimo faldas la PDF-panelon; por kontroli la aranĝon dum verkado, unue eliru fokuson kaj malfermu la PDF aparte per `⌘⌥P`.
- La vortnombrado ne estas preta por submetado: la ĉina kalkuliĝas laŭ signo, la titolo kaj aŭtoro en la enkonduko estas inkluditaj, kaj nur la tendenco estas signifa.

## Rilataj paĝoj

- Dudirekta navigado inter PDF kaj fonto: `/docs/synctex`
- Kompilado kaj diagnozoj: `/docs/compile`
- Klavkombinoj: `/docs/shortcuts`
- Projektoj kaj dosieroj: `/docs/project`
