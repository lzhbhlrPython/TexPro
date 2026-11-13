---
slug: dev-renderer
title: Bildiga tavolo kaj kontinua verkado
group: 开发
order: 12
summary: Komprenu redaktan staton, fontajn projekciojn, asinkronan identecon kaj nedevigajn ilojn.
---

## Respondecoj

| Enirejo | Respondeco |
| --- | --- |
| src/App.tsx, src/app/ | Projekto, bufroj, konservado, kompilado kaj ferma kunordigado |
| src/editor/EditorPane.tsx | CodeMirror-ekzempleroj, por-dosieraj sesioj kaj eniga propagado |
| src/editor/visual.ts | Fontaj projekcioj por matematiko, tabeloj, titoloj kaj figuroj |
| src/editor/writingTargets.ts | Fontintervala mapado kaj malvalidigo por helpo |
| src/editor/writingSession.ts | Redakta stato kaj pozicia restarigo |
| src/components/PdfPane.tsx | PDF.js-legado kaj dudirekta navigado |
| src/app/lazyTools.tsx | Prokrastitaj nedevigaj iloj kaj erara izolado |
| src/styles/, src/i18n.ts | Etosoj, surfacaj stiloj kaj dulingva teksto |

App.tsx ankoraŭ kunordigas grandan parton de la stato. Eltiru laŭ ekzistantaj limoj anstataŭ anstataŭigi la statan arkitekturon samtempe. Stiloj estas dividitaj inter verkado, PDF, grafikaĵoj, muziko kaj aliaj surfacoj; ne aldonu ĉion al app.css.

## Fonto kaj projekcioj

CodeMirror-transakcioj redaktas la fonton kaj eniras historion; dekoracioj montras vidajn rezultojn. Intervalaj skaniloj devas trakti ekvilibrajn krampojn, nestadon, komentojn kaj verbatim-enhavon. Konservu fontan rezervon por kompleksa enigo. Antaŭrigardaj ĝisdatigoj ne devas rekonstrui la tutan dokumenton nek interrompi IME-kunmetadon.

Simplaj tabeloj subtenas rektan ĉelredakton; kompleksaj tabeloj restas redaktebla TeX. Muziko, cirkvitoj kaj strukturaj formuloj apartenas al la sama verkada fluo. Ilaj paneloj estas nedevigaj helpiloj, ne antaŭkondiĉoj por ordinara kunmetado.

## Konservado kaj asinkronaj skriboj

saveQueue.ts ordigas skribojn; enigo farita dum konservado restas malpura ĝis konservita. Kompilado konservas koncernajn bufrojn antaŭ ol solvi la projektan ĉefan dosieron denove.

Validigu projekton, dosieron, petan identecon kaj fontintervalojn antaŭ apliki rezultojn. writingTargets mapas ĉirkaŭajn redaktojn sed rifuzas rezultojn post kiam la celteksto ŝanĝiĝas. Nuligo ne anstataŭas validigon ĉe la ricevanto. Konservu aktivajn projekciojn dum IME-kunmetado.

## Antaŭrigardo kaj etosoj

KaTeX traktas subtenatan matematikon. Plena TeX, figuroj kaj muziko uzas lokan kompiladon kaj PDF.js-bildigajn vojojn. Ĉefa kompilado kaj helpaj antaŭrigardoj havas apartajn nuligon, kaŝmemorigon kaj rezultidencajn identecojn. Publikigu antaŭrigardajn kaŝmemorojn nur post sukcesa kompilado.

Studio kombinas malhelan ĉirkaŭaĵon kun hela papero; night ankaŭ malheligas la verkadan surfacon; paper estas hela. Unukoloraj antaŭrigardoj povas adaptiĝi al la etoso dum aŭtoraj koloroj kaj finaj PDF-oj retenas sian signifon. Vidu [dizajan lingvon](/docs/dev-design).

## Kontroli

```sh
npm run typecheck
npm run test:regression
npm run build
```

Aldonu koncernajn denaskajn UI-regresojn por enigo, elekto, fokuso, rulumado kaj malfaro. Kontrolu projektan ŝaltadon, fermon, IME, asinkronajn malsukcesojn kaj ilan nuligon. Ordinara ekrankopio sola ne kontrolas kontinuan verkadon.

## Reguloj de frontenda efektivigo

La deponeja docs/frontend.md estas la efektiviga kontrakto; DESIGN.md estas ĝia vida referenco. Ambaŭ validas.

- Tenu projektan kunordigadon, redaktilajn transakciojn, nedevigajn ilojn kaj puran logikon en iliaj ekzistantaj moduloj. Denaska aliro iras tra tipigitaj preload-API-oj.
- Reuzu la etosajn tokenojn, tipografion, statojn kaj ikonojn de ĉiu surfaco. Kontrolu tablajn paper/studio/night aparte de la hela/malhela retejo.
- Konservu fonton, elekton, IME, malfaron kaj rulumon. Rutinaj enhavaj redaktoj ne devas postuli studion aŭ kompletigan dialogon.
- Validigu projekton, dosieron, peton kaj fontan identecon antaŭ apliki asinkronajn rezultojn. Nuligo sola ne sufiĉas.
- Tablaj dialogoj uzas la kunhavatan fokusan hokon; retejaj dialogoj uzas la fokusadministradon de Ant Design. Kontrolu klavarajn nomojn, Tab, Escape kaj fokusan revenon.
- Esprimu ŝarĝajn, malplenajn, erarajn kaj aplikeblajn elekto-statojn. Malsukceso devas konservi la fonton kaj doni utilan sekvan paŝon.
- Reuzu prokrastitan ŝarĝadon kaj kaŝmemorojn; evitu senliman laboron ĉe enigo. Subtenu reduktitan moviĝon kaj longan dulingvan tekston.
- Prizorgu ambaŭ lingvojn kaj la dizajnan dokumentaron kun kodaj ŝanĝoj. Elektu denaskajn interagajn kontrolojn por eniga konduto; konstruoj solaj ne kontrolas ĝin.

Daŭrigu sur la sama taska branĉo, komitu kontrolitajn ŝanĝojn ĝustatempe kaj puŝu kiam rajtigite. Kunfandi main kaj publikigi eldonojn restas apartaj agoj.
