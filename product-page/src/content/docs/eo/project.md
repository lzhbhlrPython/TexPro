---
slug: project
title: Projektoj kaj dosieroj
group: 参考
order: 6
summary: Projekto estas dosierujo sur la disko. Ĉefa dosiero, subdosieroj, bildoj, bibliografio kaj .texpro-metadatumoj ĉiuj loĝas en ĝi; TeXPro konstruas neniun datumbazon kaj nur legas kaj skribas tiujn dosierojn.
---

Ne ekzistas kaŝita importa paŝo: malfermu dosierujon kaj ĝi estas la projekto. De tiam ĉiu kreado, renomigo, movo kaj forigo okazas ene de tiu dosierujo, kaj io ajn, kio atingus eksteren, estas tuj rifuzata. Kopiu la dosierujon al alia maŝino kaj vi povas daŭre kompili.

## Malfermi kaj krei

- `⌘O` aŭ `Dosiero → Malfermi dosierujon…` elektas dosierujon, kaj ĝi fariĝas la projekto; la bonvena paĝo konservas la lastajn 8.
- `Dosiero → Ŝablona biblioteko…` komencas novan projekton el ŝablono: elektu gepatran dosierujon, nomu la projekton, kaj ĝi kreas `<gepatra dosierujo>/<projekta nomo>`.
- Kontraŭaj strekoj, suprenstrekoj, dupunktoj, steletoj, demandosignoj, citiloj, angulaj krampoj kaj vertikalaj strekoj en la projekta nomo fariĝas `-`, tranĉitaj al 80 signoj; se dosierujo kun tiu nomo jam ekzistas, `-2`, `-3` estas aldonataj anstataŭ anstataŭigi ĝin.
- Malfermi projekton analizas la arbon, la ĉefan dosieron, la rimedojn, la skizon kaj la komentojn; ĝi kopias kaj movas nenion.
- `Esplori la demonstran projekton` sur la bonvena paĝo generas specimenan projekton en la dosierujo de la aplikaĵaj datumoj kaj provas unu konstruon, bona maniero konatiĝi kun la interfaco.

## Kiel la ĉefa dosiero estas trovata

- Unue `rootFile` en `.texpro/project.json` (vojo relativa al la projekta radiko). Se ĝi ekzistas, ĝi estas validigata: ĝi devas esti `.tex` aŭ `.ltx` ene de la projekto, enhavanta nekomentitan `\documentclass`.
- Sen agordo, dosieroj enhavantaj `\documentclass` estas sondataj rekursive, kvin nivelojn profunde, preterlasante punktodosierujojn kaj ignoratajn dosierujojn kiel `.git`, `node_modules`, `.texpro`, `build`, `out` kaj `dist`.
- Ekzakte unu fariĝas la ĉefa dosiero; pluraj donas "Pluraj ĉefaj dosieroj troviĝis. Elektu la ĉefan dosieron de la projekto." kaj vi devas elekti en Projekta strukturo; neniu donas "Neniu ĉefa dosiero enhavanta \documentclass troviĝis.".
- Agordita dosiero, kiu rompiĝas, donas "La agordo de la projekta ĉefa dosiero ne validas: ...", sen silenta reveno al sondado.

La ĉefa dosiero decidas la konstruan enirpunkton kaj la PDF-nomon, ne la redaktan fokuson: malfermu iun ajn dosieron, premu `⌘↩`, kaj la ĉefa dosiero ankoraŭ estas tio, kio konstruiĝas. Erarmesaĝoj mencias komenton `% !TeX root`, sed la trovo de la ĉefa dosiero ne legas ĝin; tiu komento estas reskribata nur kiam vi renomigas aŭ movas dosierojn.

## Dosierujoj kaj metadatumoj

| Vojo | Enhavo |
| --- | --- |
| `.texpro/project.json` | Ĉefa dosiero, moduloj, rimedoj, konstrua dosierujo, enhavtabelo kaj modullisto |
| `.texpro/build/` | Konstruaj artefaktoj, la implicita konstrua dosierujo |
| `.texpro/trash/` | Provizora loko por forigitaj dosieroj, nomata laŭ tempindiko |
| `.texpro/comments.json` | Komentoj, ankritaj al dosiero, linio kaj tekstopeco |
| `.texpro/svg-cache/` | Kaŝmemoro de rasterigitaj SVG; fontdosieroj netuŝitaj |
| `.texpro/history/` | Internaj momentfotoj, enhav-adresitaj |

Ĉio el tio povas esti forigita. Forigi `project.json` forgesigas la elekton de la ĉefa dosiero kaj la dosierujan agordon, kaj la sekva malfermo sondas denove. Sekurkopioj preterlasas ĉiun punktodosierujon sed aldonas `project.json` kaj `comments.json` aparte en la zipon.

## Dosieraj operacioj kaj referencoj

Kreado, renomigo, movo kaj forigo ĉiuj okazas en la dosiera arbo, kaj la efiko estas unue kalkulata:

- Renomigo aŭ movo reskribas vojojn en `\input`, `\include`, `\includegraphics`, `\bibliography`, `\addbibresource`, `\lstinputlisting`, `\includepdf` kaj `% !TeX root`.
- Reskribado preterlasas komentojn, kaj ĉion ene de verbatim, lstlisting, minted kaj `\verb`.
- Etendaĵoj estas aldonataj aŭ forigataj laŭ la referenca tipo: bildoj rekonas `.pdf`, `.png`, `.jpg`, `.jpeg` kaj `.svg`, bibliografioj `.bib`, fontoj `.tex` kaj `.ltx`.
- Ĉiu ŝanĝo estas kalkulata antaŭ la renomigo; se reskribado malsukcesas, enhavoj kaj vojoj estas restarigitaj inverse, lasante nenion duone ŝanĝitan.
- Ekzistanta celo raportas "Dosiero aŭ dosierujo kun ĉi tiu nomo jam ekzistas."; eliro el la limoj raportas "La vojo estas ekster la projekto"; simbolaj ligiloj estas rifuzataj.
- Nova dosiero sen etendaĵo ricevas `.tex`; renomigo sen etendaĵo konservas la originalan etendaĵon; nomoj ne povas enhavi suprenstrekojn aŭ kontraŭajn strekojn.

## Forigi kaj reakiri

Forigi ne vere forigas: la dosiero aŭ dosierujo moviĝas al `.texpro/trash/<tempindiko>-<originala nomo>`, kie la tempindiko estas ISO-tempo sen dupunktoj kaj punktoj. La konfirmo unue listigas la koncernatajn subdosierojn, rimedojn kaj referencajn nombrojn.

La interfaco ne havas butonon Restarigi. Por rehavi ion, malfermu `.texpro/trash` en Finder, ordigu laŭ tempo kaj trenu ĝin reen tien, kie ĝi estis; referencoj ne estas restarigataj aŭtomate, do ripetu la vojojn permane se necese.

## Momentfotoj kaj versioj

Dum la projekto sidas ekster Git-deponejo, eksplicita konservo per `⌘S` lasas internan momentfoton de la ŝanĝitaj dosieroj; `Projekto → Versia revizio…` povas krei momentfotojn permane, montri liniajn diferencojn, restarigi unu dosieron aŭ forigi momentfoton.

Post kiam la projekto loĝas ene de Git-deponejo, internaj momentfotoj aŭtomate ĉesas kaj la panelo direktas vin al Git anstataŭe. La Git-panelo montras la branĉon, antaŭe / malantaŭe kaj la lastajn 8 kommitojn; la implicita kommita mesaĝo estas "Ĝisdatigo el TeXPro", kaj tiradoj ĉiam ruliĝas nur kun `--ff-only`.

Momentfotoj estas enhav-adresitaj: dispecigitaj je 4096 signoj, nomataj laŭ sha256 kaj brotli-kunpremitaj, kun duobla enhavo konservata unufoje. Ili taŭgas por tiu alineo, kiun vi ĵus akcidente forigis, ne por longtempa versionkontrolo.

## Serĉo, skizo kaj projekta kontrolo

- Serĉo: minimumo de du signoj, 320-milisekunda prokrasto, kvin nivelojn profunde, 2 MB por dosiero, maksimume 120 trafoj, baskuligebla uskleco.
- La skizo centriĝas je la aktiva dosiero: ĝi ne kunfandiĝas trans dosierojn, kaj en longa projekto legi ĝin laŭ ĉiu `\input`-branĉo estas pli preciza.
- Projekta kuracisto kontrolas la ilĉenon, orfajn `.tex`-dosierojn, mankantajn pakaĵojn, rompitajn ligilojn, mankantajn bildojn, nedifinitajn referencojn, mankantajn bib-ŝlosilojn, duoblajn etikedojn kaj tiparan enkonstruadon, kaj povas purigi la konstruan dosierujon.
- Estas unu aktiva dokumento samtempe, sen plena plurklapa redaktado; kodigoj estas traktataj kiel UTF-8.

## Komentoj

Komentoj el `Projekto → Komentoj…` loĝas en `.texpro/comments.json`, ankritaj al dosiero, linio kaj tekstopeco de la originala teksto, sen enmeti markilojn en la `.tex`. Se lininombroj drivis kiam la projekto malfermiĝas, ili estas reankritaj laŭ tekstopeco; se ankaŭ la tekstopeco ŝanĝiĝis, la komento restas en la listo sed ne plu estas ankrita.

## Oftaj kaptiloj

- Malĝusta projekta radiko: gepatra dosierujo englutas ne rilatajn projektojn, subdosierujo trovas neniun ĉefan dosieron; remalfermu la ĝustan dosierujon.
- Dosieroj movitaj en Finder sen remalfermi la projekton: la arbo kaj referencoj estas kadukaj; nur movoj ene de la aplikaĵo reskribas referencojn.
- Vi forigis ion kaj ne povas trovi ĝin: ordigu `.texpro/trash` laŭ tempindiko, kie la prefikso de ĉiu nomo estas ISO-tempo.
- Kommiti per ekstera Git kaj poste malfermi Version Review: internaj momentfotoj ĉesis, do vi vidas malnovajn.
- Forigi la tutan `.texpro`: komentoj, rubujo kaj momentfotoj malaperas kune; la fonto restas netuŝita.
- Sekurkopiaj zipoj ekskludas la implicitan konstruan dosierujon kaj la reston de `.texpro`; la unua konstruo post restarigo rekreas la konstruan dosierujon.

## Rilataj paĝoj

- Kompilado kaj diagnozoj: `/docs/compile`
- Dudirekta navigado inter PDF kaj fonto: `/docs/synctex`
- Importi, ŝablonoj kaj rimedoj: `/docs/import`
- Eksporti kaj arXiv: `/docs/export`
