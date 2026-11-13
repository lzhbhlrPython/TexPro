---
slug: copyright
title: Kopirajto kaj permesilo
group: 关于
order: 18
summary: La MIT-permesilo de TeXPro, la enhavo de ĉi tiu retejo, triapartaj dependaĵoj kaj tiparaj permesiloj, plus varmarkaj kaj privatecaj notoj.
---

## La trisenta versio

- La aplikaĵo mem estas MIT-permesila: vi povas uzi ĝin komerce, modifi ĝin kaj redistribui ĝin, kondiĉe ke vi konservu la kopirajtajn kaj permesilajn avizojn.
- Viaj artikoloj, bildoj kaj eksportitaj PDF-oj apartenas al vi; TeXPro ne postulas rajtojn pri ili.
- La aplikaĵo havas neniujn kontojn kaj neniun telemetrion; reta aliro okazas nur en agoj, kiujn vi eksplicite ekigas.

La plena klarigo sekvas. Ĝi ne estas jura konsilo; se komerca uzo aŭ redistribuo estas implikita, legu ankaŭ la originalan `LICENSE` ĉe la radiko de la deponejo.

## La aplikaĵo: MIT-permesilo

TeXPro estas eldonita sub la MIT-permesilo, kun la kopirajta avizo:

```text
Copyright (c) 2026 TeXPro contributors
```

MIT estas permesema permesilo: ĝi permesas al vi uzi TeXPro ie ajn, ŝanĝi ĝin laŭplaĉe kaj enkorpigi ĝin en fermitfontajn produktojn.

### Vi rajtas

- Uzi ĝin en personaj, edukaj aŭ komercaj medioj, sen pagi kaj sen permesila ŝlosilo
- Legi kaj modifi la fontkodon, aldonante aŭ forigante funkciojn laŭ via bezono
- Redistribui la originalan aŭ modifitan version, inkluzive paki ĝin en vian propran distribuon
- Enkorpigi la kodon en aliajn projektojn, inkluzive projektojn, kiuj ne publikigas sian fonton
- Uzi alian nomon kaj piktogramon por modifitaj versioj (vi mem portas la varmarkan riskon)

### Vi devas

- Konservi la kopirajtan avizon kaj la plenan MIT-permesilan tekston en kopioj aŭ derivitaj verkoj
- Inkluzivi `LICENSE` kiam vi distribuas, kutime en la instala dosierujo aŭ sur la Pri-paĝo

MIT ne postulas, ke vi publikigu modifitan fontkodon, nek ke vi eldonu derivitajn verkojn sub la sama permesilo. Ĝi ankaŭ liveras neniun garantion de iu ajn speco, kiun la sekva sekcio klarigas pli detale.

### Kiam vi distribuas modifitajn versiojn

Se la versio, kiun vi publikigas, rimarkeble diferencas de la oficiala konstruo, etikedu ĝin „neoficiala konstruo“ en la nomo aŭ priskribo, por ke uzantoj ne atribuu problemojn al la supraflua projekto. Uzi la nomon kaj piktogramon TeXPro estas varmarka afero ekster la amplekso de la MIT-permeso; vidu „TeX, LaTeX kaj rilataj nomoj“ sube.

## La programaro liveriĝas „tiel, kiel ĝi estas“

La malgarantio en la MIT-permesilo aplikiĝas al la tuta aplikaĵo:

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

Per ĉiutaga lingvaĵo:

- Neniu garantio, ke kompilaj rezultoj estas ĝustaj, aŭ ke la kompostado plenumas ĵurnalajn postulojn
- Neniu garantio, ke la aplikaĵo estas sen difektoj, aŭ ke ĝi funkcios sur via sistemo seninterrompe
- Neniu garantio, ke datumoj ne perdiĝos pro eraroj, diskaj fiaskoj aŭ triapartaj iloj
- La aŭtoroj kaj kontribuantoj ne respondecas pri damaĝoj rezultantaj el la uzo aŭ nekapablo uzi ĉi tiun programaron

Do konservu historion por gravaj artikoloj per Git, sekurkopioj aŭ projektaj momentfotoj, kaj kompilu ankoraŭ unufoje per la cela ŝablono antaŭ ol sendi al ĵurnalo. La aplikaĵo ofertas momentfotojn, versian historion kaj sekurkopiajn enirejojn, sed ili ne povas anstataŭigi vian propran sekurkopian strategion.

## La enhavo de ĉi tiu retejo

La produkta paĝo kaj la aplikaĵo loĝas en la sama deponejo, kaj la reteja fonto ankaŭ estas provizita sub la MIT-permesilo. La teksto, strukturo, stiloj kaj ekzemploj sur ĉi tiuj paĝoj povas esti reuzitaj, reverkitaj kaj uzitaj en komercaj projektoj.

Kion oni ankoraŭ devas konservi, estas nur la kopirajta kaj permesila avizo. La jenaj ne estas kovritaj de la MIT-permeso:

- La nomo „TeXPro“, la aplikaĵa piktogramo kaj la vida identeco de oficialaj konstruoj
- Triapartaj interfacoj, tiparoj kaj rimedoj aperantaj en paĝaj ekranfotoj (ili apartenas al siaj respektivaj posedantoj)

Paĝaj ekranfotoj venas el realaj kurantaj fenestroj uzantaj la projekton `demo/` en la deponejo; neniu interfaco estis kunmetita aŭ falsita. Kiam vi citas ekranfotojn, agnosku la fonton kaj evitu sugesti, ke via produkto estas la oficiala versio.

## Triapartaj dependaĵoj

TeXPro staras sur granda nombro da malfermfontaj projektoj. La suba tabelo listigas la ĉefajn dependaĵojn kaj iliajn realajn permesilojn; versioj estas la ĉefaj versioj en la tempo de verkado, kaj precizaj versioj estas difinitaj de `package.json` kaj `package-lock.json`.

| Komponento | Versio | Permesilo | Celo |
| --- | --- | --- | --- |
| rtex-ts / realtime-tex Lua/TeX | 0.1.11 / 0.0.7 | MIT | Pliboniga paragrafa kompostado kaj kunteksta kaptado |
| fontkit | 2.0.4 | MIT | TeX-glifaj konturoj |
| Electron | 44.x | MIT | Surtabla rultempo kaj denaskaj menuoj |
| React / React DOM | 19.x | MIT | Bildiga tavola interfaco |
| CodeMirror | 6.x | MIT | Fontredaktilo kaj etendaĵoj |
| KaTeX | 0.19.x | MIT | Formula antaŭrigardo |
| PDF.js (pdfjs-dist) | 6.x | Apache-2.0 | PDF-bildigo kaj teksta tavolo |
| Yjs | 13.x | MIT | CRDT por LAN-kunlaborado |
| y-codemirror.next / y-protocols | 0.3.x / 0.1.x | MIT | Kunlaborado kaj redaktila alligado |
| Lucide (lucide-react) | 0.544.x | ISC | Interfacaj piktogramoj |
| Ant Design | 6.x | MIT | La komponenta biblioteko de ĉi tiu retejo |
| Vite | 8.x (app) / 7.x (site) | MIT | Konstruo kaj evolua servilo |
| TypeScript | 5.9.x | Apache-2.0 | Tipkontrolo kaj kompilado |
| ws | 8.x | MIT | Loka kunlabora WebSocket |
| perfect-freehand | 1.2.x | MIT | Libermana inko |
| react-router-dom | 7.x | MIT | La enkursigado de ĉi tiu retejo |
| dayjs | 1.11.x | MIT | Dato-formatado |

Kelkaj notoj:

- MIT kaj ISC ambaŭ postulas konservi la kopirajtan kaj permesilan avizon; Apache-2.0 plie postulas konservi la NOTICE-dosieron (kiam provizita kun la pakaĵo) kaj deklari ŝanĝojn kiam vi modifas dosierojn. TeXPro uzas ĉi tiujn bibliotekojn tiaj, kiaj ili estas, sen fliki ilin.
- La tabelo ne estas kompleta listo. Nerektaj kaj evolufazaj dependaĵoj (kiel electron-builder, Vite-kromaĵoj kaj tipdifinoj) sekvas siajn proprajn permesilojn; la plenaj tekstoj estas en `node_modules/<package>/LICENSE`.
- Triaparta kodo en konstruaj artefaktoj restas ligita de sia origina permesilo. Kiam vi redistribuas instalilojn, konservu ankaŭ `LICENSE` kaj la dependaĵajn avizojn; la permesila informo de Electron estas en `LICENSES.chromium.html`.
- Se vi aldonas dependaĵon, elektu MIT-kongruan permesilon kaj klarigu ĝin en la PR; AGPL-specaj dependaĵoj bezonas apartan taksadon, kaj la deponejo intence ne uzas `codemirror-lang-latex` (AGPL-3.0-or-later) nuntempe.

## Deveno kaj permesiloj de realtempa antaŭrigardo

Realtempa antaŭrigardo kunigas la sendependan MIT-pakaĵon [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts). Ĝia TypeScript-gastiganto proksime adaptas [realtime-tex](https://github.com/HenryXiaoYang/realtime-tex) de Henry Yang kaj la kontribuantoj de realtime-tex. Lua/TeX-subteno estas konservita senŝanĝe el versio 0.0.7, revizio `fcff7a5c7f33a288ecf40db886843754c62bbdfd`. Originala atribuo, `Copyright (c) 2026 Henry Yang and the realtime-tex contributors`, kaj la kompleta MIT-teksto estas konservitaj. Reverko ne transdonas posedrajton de tiuj kontribuoj.

Esplora inspiro venas de [Real-Time LuaTeX: Recompiling Large Documents in 1 ms](https://www.tug.org/tug2026/preprints/lode-realtime.pdf) de Clemens Lode, TUG 2026. Cito ne implicas aprobon, kaj supraflua rendimento ne estas mezuro de ĉi tiu aplikaĵo. La gastiganto uzas fontkit (MIT, Devon Govett) por glifaj konturoj. TeX-distribuoj kaj tiparoj estas instalitaj aparte kaj retenas siajn proprajn permesilojn.

Redistribuantoj devas konservi la radikan THIRD_PARTY_NOTICES.md, la rtex-ts LICENSE, la UPSTREAM kaj triapartajn avizojn, kaj la venditan suprafluan permesilon kaj manifeston. Pakita rtex-ts loĝas en `app.asar.unpacked/node_modules/rtex-ts/`. Vidu [realtempan antaŭrigardon kaj enkonstruadon](/docs/realtime-tex).

## Tiparaj permesiloj

La tipara strategio de TeXPro havas du partojn, ĉar la aplikaĵo kaj la produkta paĝo ne estas la samaj.

### Ene de la aplikaĵo

La aplikaĵa instalilo ne liveras tiparajn dosierojn. La interfaco uzas sistemajn tiparojn: SF Pro kaj PingFang sur macOS, retroirante al la sistema senserifa sur Windows / Linux; la redaktilo preferas loke instalitajn New York, Charter kaj Song-stilajn tiparojn, retroirante al Georgia aŭ sistema serifo kiam ili mankas.

Ĉi tio signifas:

- Tipara permesado estas determinita de la operaciumo kaj la tiparoj, kiujn vi instalas; TeXPro ne permesas ilin aparte
- Glifoj povas diferenci sur alia maŝino; kompostado sekvas la lokajn tiparojn en kompila tempo
- Por fidinde uzi komercan tiparon en PDF, vi devas aĉeti kaj instali ĝin mem

### Ĉi tiu retejo kaj la dokumentaraj paĝoj

La korpa teksto sur ĉi tiu retejo uzas Source Han Serif / Noto Serif SC, sub la SIL Open Font License 1.1. La tiparo estas ŝargita en subaroj per `@fontsource/noto-serif-sc` sur jsDelivr; ĉinaj subaroj estas elŝutitaj laŭ bezono, kaj neniu tipara binaraĵo estas distribuata kun la reteja deponejo.

SIL OFL 1.1 permesas:

- Liberan uzon, inkluzive sur komercaj retejoj kaj en presaĵo
- Enkonstruadon en dokumentojn kaj PDF-ojn
- Modifi glifojn kaj redistribui ilin
- Kunpaki kun alia programaro, kondiĉe ke la tiparo ne estas vendata aparte

Vi devas plenumi:

- Konservi la OFL-permesilon kaj kopirajtan avizon kiam vi redistribuas tiparajn dosierojn
- Modifitaj versioj ne devas uzi la Reserved Font Name de la origina tiparo; la `OFL.txt` liverita kun la tiparo estas aŭtoritata
- Vi ne rajtas vendi la tiparon mem kiel la ĉefan produkton

### Tiparoj en PDF-oj

Eksportitaj PDF-oj estas kompostitaj de la loka TeX-distribuo; kiuj tiparoj estas enkonstruitaj estas determinita de la dokumento, la pakaĵoj kaj la sistemaj tiparoj. TeXPro ne anstataŭigas nek kunigas tiparojn. Kiam vi uzas eldonfiksitan aŭ komercan tiparon, certiĝu, ke vi posedas la respondan permesilon; antaŭ publike distribui PDF-on, kontrolu precipe la devenon de bildoj, figuroj kaj tiparoj.

La muzikpartitura funkcio dependas de la lokaj MusiXTeX / musixtnt, kiuj venas kun la TeX-distribuo kaj ne estas distribuataj kun la TeXPro-instalilo; iliaj permesiloj sekvas la propran dokumentaron de la distribuo.

## TeX, LaTeX kaj rilataj nomoj

- TeX estas varmarko de la American Mathematical Society
- LaTeX estas prizorgata de la LaTeX Project; ĝia nomo kaj kolibra emblemo rilatas al tiu projekto kaj ĝia programaro. La emblemo ne estas kovrita de la LPPL-permeso; legu la oficialan dokumentaron antaŭ uzi ĝin
- TeXPro ne estas filiigita kun TeX aŭ LaTeX kaj ne estas aprobita de ili
- Ĉi tiuj nomoj estas menciitaj en la dokumentaro nur por priskribi kongruecon kun dosierformatoj kaj la kompilan ĉenon
- La nomo kaj piktogramo TeXPro apartenas al ĉi tiu projekto; la MIT-permesilo ne inkluzivas varmarkajn rajtojn
- La nomoj Typora, TeXstudio, Overleaf kaj aliaj apartenas al siaj respektivaj posedantoj; ili estas menciitaj nur por komparo aŭ por priskribi interagadon

Se vi priskribas vian propran produkton kiel „LaTeX-kongrua“, certiĝu, ke la aserto estas preciza kaj evitu implici oficialan atestadon.

## Via enhavo apartenas al vi

Ĉio, kion vi kreas aŭ redaktas en TeXPro, estas kopirajta de vi (aŭ de la originala rajtposedanto):

- `.tex`, `.bib`, bildoj, figuroj kaj aliaj projektaj dosieroj
- PDF-oj produktitaj per kompilado; eksportitaj Markdown / Typst / HTML
- Teksto, komentoj kaj prinotoj, kiujn vi skribas

TeXPro postulas neniun permesilon aŭ posedrajton pri ĉi tiu enhavo. La aplikaĵo legas kaj skribas dosierojn nur en via projekta dosierujo, la aplikaĵa datumdosierujo, kaj la eksportaj kaj sekurkopiaj lokoj, kiujn vi eksplicite elektas; ĝi ne alŝutas dokumentojn al siaj propraj serviloj.

Limoj konsciendaj:

- Eksportitaj dosieroj povas enhavi triapartajn bildojn, tiparojn aŭ tabelojn, kiujn vi citis; klarigu la rajtojn mem antaŭ publikigo
- Ĉu AI-generita enhavo estas protektita de kopirajto, kaj kiu posedas ĝin, dependas de la kondiĉoj de la modela servo, kiun vi uzas, kaj de loka leĝo; kontrolu antaŭ publikigo
- En kunlaboraj scenaroj, posedrajto de la dokumento estas interkonsentita inter la partoprenantoj; la aplikaĵo ne intervenas
- La projekto `demo/` en la deponejo estas provizita sub MIT kun la deponejo, nur por demonstrado krom se alie deklarite en la dosieroj

## Privateco

TeXPro estas loka aplikaĵo: ne ekzistas konta sistemo kaj neniun nuban sinkronigan servon.

- Neniu registriĝo, ensaluto aŭ telefonnombro postulata
- Neniu telemetrio, analitiko, kraŝa raportado aŭ reklamaj SDK-oj
- La produkta paĝo estas statika retejo, sen analitikaj skriptoj kaj sen kuketa standardo

Reta aliro okazas nur en agoj, kiujn vi eksplicite ekigas:

| Ago | Konektiĝas al | Sendas |
| --- | --- | --- |
| AI-asistanto | La modela finpunkto, kiun vi agordis (OpenAI implicite) | Teksto en la kunteksta skatolo |
| DOI / arXiv-metadateno | Crossref, arXiv API | La DOI aŭ arXiv-ID, kiun vi enigas |
| Git / Overleaf | La fora, kiun vi agordis | Deponeja enhavo kaj komitaj mesaĝoj |
| Sekurkopio | La iCloud Drive, WebDAV aŭ SSH-gastiganto, kiun vi elektas | Projektaj dosieroj |
| Zotero-literaturo | Loka `127.0.0.1:23119` | Lokaj petoj; nenio forlasas la maŝinon |
| LAN-kunlaborado | La loke lanĉita WebSocket-servo | Dokumentaj ĝisdatigoj; neniu tria parto implikita |
| Eksteraj ligiloj | Via retumilo | Traktata de la celloka retejo |

AI-API-ŝlosiloj estas ĉifritaj de la ĉefa procezo per la sistema ŝlosilĉeno (Electron `safeStorage`) kaj konservitaj en `secrets.json` en la aplikaĵa datumdosierujo, kun dosieraj permesoj legeblaj nur de la nuna uzanto; ŝlosiloj neniam skribiĝas al retumila localStorage, kaj neniam eniras projektajn dosierojn aŭ la Git-deponejon. La teksto en la kunteksta skatolo estas sendita al via agordita finpunkto nur kiam vi klakas Ruli; la aplikaĵo neniam vokas la modelon aŭtomate.

La produkta paĝo estas gastigata sur GitHub Pages, kaj tiparoj estas ŝargitaj el jsDelivr. Ĉi tiuj du servoj konservas alirajn protokolojn (kiel IP kaj User-Agent) laŭ siaj propraj politikoj; TeXPro plie ne kolektas aŭ analizas ĉi tiujn datumojn.

## Kiel raporti kopirajtajn problemojn

Se vi opinias, ke kodo, dokumentaro, ekranfotoj aŭ demonstraj rimedoj en la deponejo malrespektas viajn rajtojn, levu ĝin en GitHub Issues:

- Deponejo: `https://github.com/lzhbhlrPython/TexPro`
- Indiku la koncernajn dosierojn, paĝojn aŭ versiojn
- Provizu pruvon de rajtoj aŭ ligilon al la originala fonto
- Indiku, kiel vi volas, ke ĝi estu traktata: atribuo, anstataŭigo aŭ forigo

Prizorgantoj kontrolos kaj respondos. Varmarka misuzo aŭ imitado de oficialaj konstruoj ankaŭ raporteblas per la sama kanalo. Ne algluu API-ŝlosilojn, nepublikigitajn manuskriptojn aŭ aliajn personajn informojn de homoj en publikaj Issues.

> Ĉi tiu paĝo ĝisdatiĝas kiam dependaĵoj kaj permesiloj ŝanĝiĝas; eldonitaj versioj restas regataj de la `LICENSE` liverita kun ili. Ĉi tiu paĝo ne konsistigas juran konsilon.

## Etendaĵoj, etosoj kaj inspiro

Etendaĵa vivciklo kaj serva organizado prenas konceptan inspiron de Koishi. TeXPro uzas sian propran API-on kaj pakaĵformaton, ne inkluzivas Koishi-rultempon, konzolan fonton aŭ merkaton, kaj ne kongruas kun Koishi-kromaĵoj. Nova gastiganto, SDK, ekzemploj kaj evolua Skill estas MIT. PostCSS 8.5.32 (Andrey Sitnik) kaj postcss-value-parser 4.2.0 (Bogdan Chadkin) analizas etosajn stilojn kaj retenas siajn MIT-avizojn. Kromaĵaj aŭtoroj, rimedoj, tiparoj kaj triapartaj dependaĵoj retenas siajn proprajn permesilojn; TeXPro MIT ne ŝanĝas iliajn rajtojn. Vidu radikan THIRD_PARTY_NOTICES.md.

La sendependaj pakaĵoj `@texpro/extension-sdk` kaj `@texpro/qwertysay` estas prizorgataj de Baolin Liu (gardenialiu), sub MIT, ĉiu kun LICENSE. Skafalditaj etendaĵoj deklaras siajn proprajn aŭtorojn kaj permesilojn; la SDK-aŭtoro ne aŭtomate estas la etendaĵa aŭtoro.

## Triapartaj permesiloj en kompilitaj kromaĵoj

La SDK/skafaldo retenas la MIT-permesilon de Baolin Liu (gardenialiu) por originala kodo. La LICENSE de la aŭtora projekto ne repermilas enkonstruitajn normajn bibliotekojn. Kodo de Elm, Scala/Scala.js, Go/GopherJS, ClojureScript/Closure kaj PureScript retenas siajn permesilojn kaj avizojn. La konstruilo provizas konatajn rultempajn avizojn kaj kolektas pakaĵajn permesilojn; aŭtoroj devas revizii aldonitajn dependaĵojn/rimedojn kaj kompletigi THIRD_PARTY_NOTICES.md. Koishi inspiras organizadon, sen kopiita rultempa aŭ bazara kodo. Vidu [etendaĵan evoluigon](/docs/extension-development).

## Reteja koda reliefigo

La retejo uzas [Shiki](https://github.com/shikijs/shiki) 4.6.0 (MIT), Copyright (c) 2021 Pine Wu kaj Copyright (c) 2023 Anthony Fu. Ĝi estas aparta de la surtabla rultempo. La reteja konstruo inkluzivas third-party-licenses.txt kun plenaj avizoj por kunigitaj dependaĵoj; konservu ĝin kiam vi redistribuas la retejon. Gramatikaj rimedoj kaj nerektaj dependaĵoj retenas siajn proprajn permesilojn.
