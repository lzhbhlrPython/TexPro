---
slug: extensions
title: Lokaj etendaĵaj pakaĵoj
group: Usage
order: 62
summary: Instalu, fidu, agordu kaj permane ĝisdatigu lokajn etendaĵojn konservante seninterrompan verkadon.
---

## Instali kaj ŝalti

Malfermu **Etendaĵoj** el la komanda paletro kaj elektu **Instali pakaĵon…**. Elektu kunhavigitan `.tpp`-kromaĵan pakaĵon aŭ `.tpt`-etosan pakaĵon, inspektu ĝian aŭtoron, version, permesilon, kapablojn kaj haĉresumon, poste elektu **Instalo malŝaltita**. Pakaĵoj postulas API 1-manifeston kaj LICENSE.

Datumaj pakaĵoj povas kontribui kompletigojn, kodpecetojn, ŝablonojn kaj etosojn. Plenumeblaj pakaĵoj postulas eksplicitan fidon antaŭ ŝaltado. Ili ruligas Node-kodon kun viaj uzantaj permesoj; la aparta procezo izolas paneojn kaj ne estas sekureca sabla skatolo. Ŝaltu nur fidata kodon. Ne ekzistas publika merkato nek aŭtomata elŝuta aŭ ĝisdatiga servo.

## Uzi kontribuaĵojn

Ŝaltitaj komandoj aliĝas al la ekzistanta paletro kaj ila menuo. Staticaj kaj dinamikaj kompletigoj funkcias en la redaktilo. Kontroliloj povas plenigi la panelon pri problemoj. Transformoj montras proponitajn redaktojn; akcepto aplikas unu transakcion, kiun eblas malfari unufoje. Rezultoj rifuziĝas, kiam ilia dokumenta, projekta aŭ etendaĵa kunteksto eksvalidiĝas.

Etendaĵoj povas provizi laŭpostulajn ilojn, dediĉitajn laborejojn, projektajn ŝablonojn, platajn tekstajn antaŭrigardojn, proponojn pri projektimporto kaj tekstajn rezultojn por eksporto, bibliografio kaj rimedoj. Progresintaj provizantoj restas eksperimentaj. MCP-datumprovizantoj ne aŭtomate elmontriĝas al eksteraj MCP-klientoj. Vidu [etendaĵan disvolvon](/docs/extension-development) por adaptila kovrado.

## Ĝisdatigi kaj restaŭri

Instalu pakaĵon kun la sama identigilo por permane ĝisdatigi. Ĝisdatigoj restas malŝaltitaj ĝis ili estas reviziitaj kaj ŝaltitaj. Uzu **Restarigi antaŭan pakaĵon** por retroiri. Malinstalo konservas la kromaĵan konservejon kaj lasas la originan distribuan dosieron kaj la aŭtorajn dokumentojn netuŝitaj.

Aktivigaj eraroj, paneoj kaj tempolimoj montriĝas kaj malŝaltas plenumeblajn etendaĵojn. Malŝaltitaj kontribuaĵoj ne plu provizas komandojn, kompletigojn, diagnozojn aŭ etosojn. Reŝaltu por reprovi. Nekongruaj API-oj, ŝanĝita enhavo kaj koruptitaj arkivoj rifuziĝas dum instalado.

## Disvolva reĝimo kaj etosoj

**Ŝargi disvolvan dosierujon…** instalas validigitan momentfoton. Post redaktado elektu **Reŝargi el dosierujo**, revizuu kaj ŝaltu denove. Ŝanĝoj ne estas plenumataj rekte el nekontrolita dosierujo. La gastiganto ne rulas instalajn skriptojn, ne instalas npm-dependaĵojn kaj ne ŝargas denaskajn binaraĵojn.

Vidu [etosajn pakaĵojn](/docs/themes) por antaŭrigardo, nuligo, aplikado kaj enkonstruita restaŭro. Ekranfotoj de etendaĵoj, proponoj kaj desegnaĵoj venas el la rulanta aplikaĵo; detaloj pri efektivigo kaj validigo estas registritaj en la ellaboranta dokumentaro kaj la ĉina disvolva blogo.

## Sekureco kaj sendependa restaŭro

Plenumeblaj kromaĵoj povas legi dosierojn, uzi retojn, lanĉi procezojn kaj atingi akreditaĵojn alireblajn al via uzanto. Kapablaj deklaroj kaj proceza izolado ne metas malican kodon en sablan skatolon. Eĉ etosoj sen kodo povas kaŝi butonojn, imiti fidata interfacon aŭ malutili al legebleco. Revizuu la pakaĵan enhavon kaj fidu la aŭtoron; SHA-256 ne estas aŭtora subskribo.

Se etoso rompas la interfacon, uzu la nacian komandon **View → Restarigi aspekton kaj malŝalti etendaĵojn**. Aŭ lanĉu per `--safe-mode` por malŝalti ĉiun etendaĵon antaŭ ol plenumi kromaĵan kodon kaj restarigi Paperon. macOS: `open -a TeXPro --args --safe-mode`; Windows: `TeXPro.exe --safe-mode`; Linux: aldonu la ŝaltilon al la plenumeblo aŭ AppImage. La malŝaltita stato daŭras; poste revizuu kaj ŝaltu pakaĵojn unuope.

Pakaĵoj uzas `.tpp` por kromaĵoj kaj `.tpt` por etosoj (ambaŭ estas ZIP-ujoj). `.tpt` enhavas nur etosan agordon, CSS kaj rimedojn, sen plenumeble eniro, agoj aŭ aliaj kromaĵaj kontribuaĵoj. Renomigo de koda pakaĵo al `.tpt` rifuziĝas; dosieraj sufiksoj ne estas sekureca atesto.

## Etosaj fontoj kaj instaleblaj artefaktoj

Aŭtoraj fontoj povas uzi CSS, SCSS, Sass, Less, Stylus, konstruotempan CSS-in-JS aŭ Thematic CSS (`.tcss`). Elektu la aŭtoran stilon en la gvidata qwertysay 0.4.1; vidu [qwertysay](/docs/qwertysay). Ĉiu etosa artefakto estas `.tpt` enhavanta statikan CSS kaj rimedojn; kromaĵoj uzas `.tpp`. Fontaj sufiksoj kaj `.zip` ne estas instaleblaj sufiksoj. Etoso povas kaŝi regilojn aŭ imiti la interfacon sen JavaScript; fido restas necesa.

## Lingvopakaĵoj kaj pakaĵadministraj medioj

Vidu [lingvopakaĵojn](/docs/language-packs) por la deklara ŝablono, la antaŭinstalita @texpro/extension-translate-zh-cn, lokokupila validigo kaj angla restaŭro. Vidu [npm/yarn-administradon](/docs/extension-package-management) por aŭtora agordo, distribuaĵaj envolviloj kaj reviziita sinkronigo de instalado, ĝisdatigo kaj forigo. SDK 0.3.0 kaj qwertysay 0.4.1 uzas @texpro; historiaj @gardenialiu-versioj restas haveblaj aparte.

## npm-fonta publikigado kaj konstrua sekureco

Publikigu fonton rekte per texpro.source (implicita pakaĵa radiko); enmetita .tpp/.tpt estas nedeviga. SDK 0.4.0, qwertysay 0.5.0 kaj la kongrua gastiganto subtenas ĉi tiun vojon, apud arkivaj envolviloj. Ruleblaj JS/staticaj dosieroj sinkroniĝas post instalado; kompilitaj pakaĵoj postulas **Prepare installed source** en qwertysay kaj eksplicitan fidon antaŭ sinkronigo kaj TeXPro-revizio. Kompililoj kaj projekta agordo havas uzantajn permesojn; malŝaltitaj instalaj skriptoj kaj portempaj dosierujoj ne estas sablaj skatoloj. Vidu [npm/yarn-etendaĵan administradon](/docs/extension-package-management) por publikigado, instal-, ĝisdatig- kaj forig-paŝoj, ilĉenaj limoj kaj riskoj.
