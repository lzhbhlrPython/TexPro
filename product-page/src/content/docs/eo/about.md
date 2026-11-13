---
slug: about
title: Pri TeXPro
group: 关于
order: 17
summary: Kio estas TeXPro, por kiu ĝi estas konstruita, kaj ĝia dezajnfilosofio, dezajnlingvo, interaga aliro, versioj kaj dokumentara mapo.
---

## Kio estas TeXPro

TeXPro estas surtabla verkila laborejo por LaTeX. Ĝi kunmetas la fontredaktilon, la vidan verkotavolon, PDF-antaŭrigardon, projektadministradon kaj la kompilan ĉenon en unu fenestron, do vi neniam bezonas forlasi la aplikaĵon de la unua linio, kiun vi skribas, ĝis la PDF, kiun vi transdonas.

Ĝi ne anstataŭigas LaTeX, kaj ĝi ne kaŝas LaTeX. Dosieroj ankoraŭ estas `.tex`, kaj kompiladon ankoraŭ faras la loka latexmk kaj TeX-distribuo; kion TeXPro faras, estas igi tiun ĉenon kohera: vi povas vidi la strukturon dum redaktado, kongruigi poziciojn post kompilado, kaj klare kontroli problemojn antaŭ transdono.

La deponejo retenas la nomon `TexStudioPro`; la produkta nomo estas TeXPro. Ĝi ne estas filiigita kun projektoj kiel TeXstudio aŭ Typora.

## Por kiu ĝi estas konstruita

TeXPro celas ĉefe tri grupojn:

- Esploristoj kaj postdiplomantoj verkantaj artikolojn: plur-dosieraj projektoj, bibliografioj, krucreferencoj, ĵurnalaj ŝablonoj
- Studentoj farantaj kurslaborojn aŭ ĉinan kompostadon: formuloj, figuroj kaj fidinda ĉina subteno
- Aŭtoroj prizorgantaj teknikan dokumentaron: longaj tekstoj, kodo, tabeloj kaj multaj revizioj

Kion ili dividas: ili pretas investi lernan penon en kompostan kvaliton, sed ne volas pasigi tempon per ŝaltado inter iloj kaj flikado de formatoj.

## Dezajnfilosofio

La sep punktoj sube ne estas sloganoj; ili estas la ordigaj kriterioj kiam konfliktoj aperas.

- **Verkado devas esti kontinua**: korpa teksto, formuloj, tabeloj, muzikaj partituroj kaj cirkvitaj diagramoj ĉiuj vivas en la sama kursora fluo. Ĉiutaga enigo kaj redaktado ne devus postuli unue malfermi studion, plenigi formularon kaj poste klaki „Finite“.
- **Fonto estas la rikordo**: `.tex` estas la ununura fonto de vero; la vida tavolo estas nur ĝia projekcio. Fontdosieroj devas resti legeblaj, porteblaj kaj eksterrete kompileblaj, kaj ne devas fariĝi aplikaĵa privata dokumentformato.
- **Helpo aperas laŭ bezono**: iloj aperas nur kiam vi elektas enhavon aŭ eksplicite petas ilin. Movi agordajn formularojn en la korpan tekston ne estas kontinua verkado; la studio estas laŭvola akcelilo, ne la implicita vojo.
- **Konservu la pozicion de la aŭtoro**: antaŭrigardaj refreŝigoj, validigo, pakaĵa enmeto kaj fona kompilado ne devas forpreni la nunan dosieron, kursoron, elekton, malfaran historion aŭ rulumpozicion. Dum enigmetodo ankoraŭ kompostas, la interfaco ne devas refluigi antaŭ ĝi.
- **Fermita ciklo**: verkado, projekta strukturo, kompila diagnozo, PDF, citoj kaj versia historio devus renkontiĝi en la sama laborejo kaj kunuzi la saman ĉefan dosieron.
- **Aŭtomatigo devas esti inspektelba**: AI, MCP, propraj konstruoj kaj sekurkopioj devas videbligi kion ili faris, kaj ĝi devas esti malfarebla.
- **Loka unue, fora eksplicita**: projektoj restas sur la disko implicite; retado, nubo kaj kunlaborado estas elektoj kun videblaj limoj.

Kiam konfliktoj aperas, la prioritata ordo, de alta al malalta, estas: kontinua verkado, fidinda fonto, kompleta videbligo, nombro da iloj.

## Dezajnlingvo

La vida celo povas esti resumita kiel „papera korpa teksto, trankvila ŝelo“: la legada areo proksimas al papero, dum la ĉirkaŭa interfaco retiriĝas en la fonon.

| Elemento | Valoro | Celo |
| --- | --- | --- |
| Redakta papero | etosa variablo `--paper` | Papera koloro anstataŭ pura blanko, por redukti ekranan brilon |
| Korpa teksta koloro | `#2b2926` | Pli mola ol pura nigro; pli facile por la okuloj dum longa legado |
| Akcenta koloro | varma terakoto (Studio `#d97757`, Paper `#b4532a`) | Markas nur fokuson, elekton kaj nunan staton |
| Korpa larĝo | `760 px` | Unu kolumno, por regi linian longon |
| Korpa tipargrando | `18 px` | La komforta gamo por ekrana legado |
| Angula radiuso | `10 px` | Mola sed ne troa; ne desegnofilma |

Tiparoj venas en tri aroj: la interfaco uzas SF Pro, PingFang aŭ sisteman senserifan; korpa teksto uzas New York, Charter, Song-stilan serifon aŭ Georgia; kodo uzas SF Mono, JetBrains Mono aŭ alian egalŝtupan tiparon. La tri aroj ĉiu faras sian propran taskon kaj ne miksiĝas.

- Piktogramoj unuforme uzas Lucide-liniajn piktogramojn kun la sama strekpezo; funkciaj enirejoj ne fidas kolorriĉajn emoĝiojn por distingiĝo.
- Movado estas uzata nur por panelaj transiroj kaj statŝanĝoj, kaj respektas la sisteman agordon „Redukti movadon“; ne ekzistas dekoraciaj animacioj.
- Etosoj venas en tri aroj: Studio, Nokto kaj Papero. Ŝanĝi etoson ŝanĝas kolorojn kaj helecon, ne aranĝon, tipan hierarkion aŭ la signifon de la akcenta koloro.

## Interaga aliro

La celo de la interagado estas teni viajn manojn sur la klavaro kaj viajn okulojn sur la teksto.

- **Klavaro unue**: oftaj agoj ĉiuj havas fulmoklavojn aŭ enirejojn en la komanda paletro; la muso estas akcelilo, ne antaŭkondiĉo. Vidu `/docs/shortcuts` por la plena listo.
- **Redaktu en loko**: paragrafoj, formuloj, tabeloj kaj bildoj modifiĝas tie, kie ili estas. Elekti tekston elvokas nur ses agojn — grasa, kursiva, kodo, enlinia formulo, citaĵo, krucreferenco — sen malfermi grandan panelon.
- **Klara eniro kaj eliro**: premu Esc ene de vida bloko por reveni al fonto; fermi la verkadan asistanton restarigas la antaŭan kursoron kaj elekton, sen lasi duonfinan laboron en la dokumento.
- **Pozicia konservado**: aŭtomata konservado, fona kompilado kaj antaŭrigarda refreŝigo ne ŝtelas fokuson nek restarigas la elekton; ili ne interrompas enigon dum enigmetodo kompostas.
- **Videbla aŭtomatigo**: AI-sugestoj listiĝas kiel agokartoj kaj skribiĝas nur post kiam vi aplikas ilin unu post unu; konstruoj uzas la komandon, kiun vi agordis, kaj ŝel-escapo estas malŝaltita implicite. Nenio reverkiĝas silente.
- **Rimedoj dum vi verkas**: treni aŭ alglui bildon konservas ĝin en la rimedan dosierujon de la projekto kaj enmetas figuron kun etikedo; SVG unue konvertiĝas al 1800 px PNG.
- **Retenita reago**: sukceso ricevas mallongan sciigon; eraroj iras al Problemoj kaj la protokolo. Detruaj agoj kiel forigi aŭ anstataŭigi la tutan dokumenton unue petas konfirmon; la reston de la tempo verkado ne interrompiĝas.

La mezuro de bona interagado ne estas ĉu la animacio estas glata, sed ĉu vi devas retrovii la kursoron post fini paragrafon.

## Kion ĝi ne faras

### Ne enreta kunlabora platformo

TeXPro havas LAN-kunlaboradon bazitan sur Yjs, sed ĝi ne estas nuba dokumentservo: ne ekzistas ĉambra gastigado, nek publika kunhavigo, nek konta permesa sistemo. Kiam vi bezonas foran kunlaboradon kun pluraj homoj, daŭre uzu Overleaf aŭ Git; TeXPro nur traktas lokan redaktadon kaj versian transdonon.

### Ne Markdown-redaktilo

Markdown kaj Typst ekzistas nur kiel interagaj formatoj por importo kaj eksporto. La fontdosieroj de TeXPro estas LaTeX; se via celo estas Markdown-verkado, elektu dediĉitan Markdown-ilon anstataŭ fari ĉirkaŭvojon ĉi tie.

### Ne glassmorfismo

La interfaco intence evitas Liquid Glass-stilan travideblecon, fortajn reflektojn kaj tavoligitajn malklarojn. La vida lingvo pli proksimas al papero kaj presaĵo: stabila baza koloro, klara hierarkio kaj malgranda kvanto da akcenta koloro. Ĉi tio ne estas estetika prefero, sed maniero malhelpi, ke longa legado kaj verkado lacigu.

## Teknologia stako

| Tavolo | Elekto | Notoj |
| --- | --- | --- |
| Surtabla rultempo | Electron 44 | Denaskaj menuoj, dosiersistemo kaj infanprocezoj |
| Bildiga tavolo | React 19 + TypeScript 5.9 | Redaktilo, paneloj kaj stato |
| Konstruo | Vite 8 | Evolua servilo kaj produkta konstruo |
| Redaktilo | CodeMirror 6 | Sintaksa reliefigo, kompletigo, faldado kaj kunlaboraj etendaĵoj |
| PDF | PDF.js 6 | Bildigo, teksta tavolo kaj inversa serĉo |
| Formuloj | KaTeX 0.19 | Formula antaŭrigardo en la vida tavolo kaj sur eksportitaj paĝoj |
| Kunlaborado | Yjs 13 | LAN CRDT-sinkronigo |
| Piktogramoj | Lucide | Interfacaj piktogramoj |

La proceza limo estas eksplicita: la bildiga tavolo respondecas nur pri redaktado kaj montrado; dosiera eneligado/eligado, kompilaj procezoj kaj ŝlosila ĉifrado ĉiuj estas traktataj de la ĉefa procezo per tipigitaj IPC elmontritaj de preload. TeX mem ne estas distribuata kun la aplikaĵo; TeX Live aŭ MacTeX devas esti instalitaj loke. Node.js 22+ necesas nur por evoluado.

## Versioj kaj eldonritmo

**v0.1.0 · Tajpilo** (2026-11-12) estas la unua stabila eldono. **Tajpilo**, esperanta vorto por „tajpilo“, nomigas la serion **0.1.x**. Vidu la [liston de stabilaj eldonoj](/releases) por instaliloj, notoj kaj kontrolaj limoj.

Elŝutversioj venas el realaj GitHub Releases kaj la retejaj versiaj paĝoj; la radikaj pakaĵdosieroj administras la aplikaĵan bazversion. La aplikaĵo uzas noktajn konstruojn: GitHub Actions kontrolas ĉiutage je `13:23 UTC` (21:23 Asia/Shanghai) ĉu `main` havas novajn komitojn ekde la laste sukcese publikigita Nightly; se jes, ĝi rulas regresajn testojn, tipkontrolojn kaj la konstruon, kaj publikigas la instalilojn kun datita antaŭelda etikedo `v{baseVersion}-YYYYMMDD-Nightly`.

| Platformo | Artefaktoj |
| --- | --- |
| macOS | Universala DMG kaj ZIP (Apple Silicon / Intel) |
| Windows | x64 NSIS-instalilo, portebla versio kaj ZIP |
| Linux | x64 deb, AppImage kaj rpm |

Kelkaj praktikaj limigoj:

- Neniuj novaj komitoj ekde la lasta sukcesa Nightly signifas neniun novan konstruon
- Nightly-konstruoj estas nesubskribitaj; macOS povas averti, ke la programisto ne povas esti kontrolita, kaj Windows povas ekigi SmartScreen
- Malsukcesinta konstruo ne produktas instalilojn; la plej novaj artefaktoj montritaj sur la elŝuta paĝo estas aŭtoritataj
- Ankoraŭ ne ekzistas fiksa stabila eldonritmo; konservu viajn proprajn sekurkopiojn kaj versian historion por gravaj laboroj

### Ĝisdatigoj kaj kongrueco

`0.1.0` ankoraŭ estas en periodo de rapida ripetado kaj ankoraŭ ne promesas stabilan datumformaton. Nightly-konstruoj povas ŝanĝi kampojn en `.texpro/project.json`, la historian kaj ŝablonan strukturojn, eksportan eligon aŭ fulmoklavojn.

- Sekurkopiu la tutan projektdosierujon antaŭ ĝisdatigo, kaj konservu konatan bonan version de la aplikaĵo
- Malfermu kaj kompilu sur kopio unue; anstataŭigu vian labordosierujon nur post konfirmi ke ĝi funkcias. Ne supozu, ke pli malnova versio povas legi datumojn skribitajn de pli nova

## Projekta historio

La unua komito de TeXPro estis la 21-an de oktobro 2026, kun la mesaĝo „Initial commit: TeXPro visual LaTeX workbench“. Ĝi ne komenciĝis kiel ĉiucela IDE; ĝi volis solvi unu specifan ĝenon: TeXstudio estas tre kapabla pri projektadministrado, sed verki en ĝi sentiĝas kiel komposti en terminalo; la papero de Typora estas trankvila, sed ĝi ne estas LaTeX-ilo.

En la unuaj tagoj, la deponejo rapide akiris esploran laborfluon, noktan pakadon, aprob-porditan MCP kaj kunlaboran redaktadon; poste venis korpaj muzikaj partituroj, kaj dokumento, kiu skribis „kontinuan verkadon“ en la produkta kontrakto. Ĉi tiuj funkcioj ŝajnas disaj, sed ili sekvas la saman linion: ĉiu helpa kapablo devas reveni al la sama kursora pozicio.

La projekto ankaŭ faris subtrahojn. Travidebla Liquid Glass-ŝelo estis iam efektivigita kaj poste tute forigita; krom se ekzistas nova eksplicita decido, ĝi ne revenos. La LaTeX-sintaksa reliefiga biblioteko `codemirror-lang-latex` ankaŭ ne estis adoptita, ĉar ĝi estas AGPL-3.0-or-later, kio malkongruas kun la preferata MIT-permesilo de la deponejo.

Ĝis hodiaŭ ĝi ankoraŭ estas `0.1.0`-projekto: mallonga historio, limoj ankoraŭ konverĝantaj, kaj noktaj konstruoj forlasantaj `main` ĉiutage. Ĝi ne pretendas esti matura, sed ĝi provas skribi ĉiun kompromison, por ke homoj venantaj poste sciu, kial aferoj estas tiaj, kiaj ili estas.

## Kiel kontribui

### Raporti problemojn

Priskribu la simptomon, ripetajn paŝojn kaj atendatan rezulton en GitHub Issues. Utilaj informoj inkluzivas:

- Versia numero kaj konstrua dato (piedlinio aŭ Pri-fenestro)
- Operaciumo kaj TeX-distribuo (versio de TeX Live / MacTeX)
- Minimuman ripetan `.tex`-pecon, aŭ priskribon de la projekta strukturo
- La ŝlosilaj eraraj linioj en la kompila protokolo

Ne algluu API-ŝlosilojn, nepublikigitajn manuskriptojn aŭ aliajn personajn informojn de homoj.

### Kontribui kodon

PR-oj estas bonvenaj, sed tenu ŝanĝojn fokusitaj:

- Malfermu Issue por unue diskuti pli grandajn ŝanĝojn, por ke vi ne malkovru, ke la direkto malĝustas, nur post skribi la kodon
- Respektu la limon inter la bildiga tavolo kaj la ĉefa procezo; ne legu dosierojn nek lanĉu procezojn rekte el la bildiga tavolo
- Inkluzivu testojn por kondutaj ŝanĝoj; almenaŭ rulu la ekzistantajn testojn kaj la tipkontrolon
- Klarigu la kialon antaŭ aldoni dependaĵon, kaj preferu MIT-kongruajn permesilojn

### Plibonigi dokumentaron

La dokumentaro de la produkta paĝo troviĝas en `product-page/src/content/docs/{locale}/`. La dosierujoj `zh/` kaj `en/` estas samnivelaj, kun kongruaj dosiernomoj kaj slug-oj. Ĉiu dosiero enhavas kompletan lokalizitan dokumenton; la front matter determinas ĝian titolon, grupon kaj ordon. Kiam vi skribas:

- Faktoj devas sekvi la fontkodon kaj deponejan dokumentaron; ne dokumentu neefektivigitajn funkciojn
- Organizu enhavon per `##` kaj `###`, kaj skribu tabelojn kaj notojn tiel, kiel la ekzistantaj paĝoj faras
- Lasu spacon inter ĉina kaj latina teksto, kaj skribu internajn vojojn kiel `/docs/xxx`

## Dokumentara mapo

La dokumentaro estas organizita en ses grupoj; legi laŭ la uza vojo estas rekomendata:

| Grupo | Paĝoj |
| --- | --- |
| Komenco | `/docs/start` Instalado kaj via unua projekto |
| Uzado | `/docs/import`, `/docs/compile`, `/docs/synctex`, `/docs/writing` |
| Referenco | `/docs/project`, `/docs/export`, `/docs/ai`, `/docs/shortcuts` |
| Evoluado | `/docs/dev-setup`, `/docs/dev-arch`, `/docs/dev-renderer`, `/docs/dev-testing`, `/docs/dev-release` |
| AI-laborfluo | `/docs/mcp`, `/docs/ai-guide` |
| Pri | `/docs/about`, `/docs/copyright` |

> Unua fojo ĉi tie? Komencu per „Instalado kaj via unua projekto“. Por konekti AI aŭ konstrui vian propran integriĝon, legu „MCP: Transdoni la projekton al AI“ kaj „Dua-disvolva gvidilo por AI“.

Stabilaj eldonoj uzas tri permanajn major/minor/patch-laborfluojn, komitante la pliigitan version nur post kiam testoj kaj ĉiuj platformaj pakaĵoj sukcesas. Vidu [stabilajn eldonojn](/releases) por historio, notoj kaj elŝutoj. Minimumaj nur-koloraj etosoj ankoraŭ bezonas neniun stilfolian kompililon; vidu [etosajn pakaĵojn](/docs/themes).

## Reteja lingvo

Klaku la lingvan piktogramon en la navigado kaj elektu lingvon laŭ ĝia ISO 639-1-kodo kaj denaska nomo: zh · 简体中文 aŭ en · English. La elektita ero markas la nunan lingvon. La sama piktogramo haveblas sur mallarĝaj ekranoj, kaj via elekto memoriĝas. Ĉi tio ŝanĝas la retejan lingvon; surtablaj lingvaj pakaĵoj administriĝas aparte.
