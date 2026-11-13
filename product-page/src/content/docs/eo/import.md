---
slug: import
title: Importi, ŝablonoj kaj rimedoj
group: 使用
order: 2
summary: Tri taskoj — transformi Markdown- kaj Typst-malnetojn en LaTeX-on, komenci novan projekton el ŝablono, kaj tiri bildojn en la rimedan dosierujon — ĉiu kun propra enirejo kaj propraj limoj.
---

Importo, ŝablonoj kaj rimedoj solvas tri malsamajn problemojn: ŝanĝi formatojn, komenci novan projekton, kaj aldoni bildojn al ekzistanta. Neniu el ili tuŝas la originalajn dosierojn. La generita `.tex` surteriĝas en la projekto kaj kondutas kiel ordinara fonto de tiam, preta por permanaj redaktoj.

## Transformi Markdown-on en LaTeX-on

Kun projekto malfermita, `Dosiero → Importi Markdown / Typst…` malfermas la importan panelon; vi ankaŭ povas premi `⌘K` kaj serĉi Importi. La fonto sidas maldekstre, kaj `Generita LaTeX` dekstre ĝisdatiĝas dum vi tajpas.

- Elektu Markdown, algluu la malneton en la maldekstran panelon, aŭ uzu Elekti dosieron por preni `.md`, `.markdown`, `.mdown` aŭ `.txt` dosieron.
- Plenigu Titolon, Aŭtoron, Dokumentklason kaj Dosiernomon. La panelo havas neniun apartan datan enigon.
- **Enmeti korpon** enĵetas nur la korpon ĉe la kursoro; **Krei .tex-dosieron** skribas kompletan dokumenton, inkluzive la preamblon, ĉe la projekta radiko.

La konvertaj reguloj estas fiksaj, ne heŭristikaj konjektoj:

| Fonto | Eligo |
| --- | --- |
| `#` ĝis `######` | `\section` ĝis `\paragraph`, plej multe kvar niveloj |
| `-`, `*`, `+` kaj `1.` | itemize, enumerate |
| Komenca `>` | quote |
| Enlinia grasa, kursiva, enlinia kodo | `\textbf`, `\emph`, `\texttt` |
| `$...$` kaj `$$...$$` | Konservitaj kiel matematiko, senŝanĝe |
| Baritaj kodblokoj | verbatim |
| Tabeloj | tabelo kun tabular, ĉiuj kolumnoj maldekstre ĝisrandigitaj |
| `![alt](path)` | figure kun `\includegraphics`, 0.8 `\linewidth` larĝa |
| Horizontala linio `---` | Horizontala linio |
| Kruda HTML | Eskapita kiel teksto, plus averto |

Se la dosiero komenciĝas per frontmatter, ĝia titolo, aŭtoro kaj dato antaŭplenigas la formularon; la korpo ne ripetas tiujn kampojn en la eligo.

## Ĉina teksto kaj la preamblo

Se la korpo enhavas iom ajn da ĉina teksto, la generita dokumento ĉiam uzas `ctexart`, sendepende ĉu article aŭ ctexart estas elektita en la falmenuo. La kodigo estas UTF8, la tipara aro estas fandol, kaj la motoro estas markita kiel xelatex. Nur pura latina teksto ricevas article kaj pdflatex.

```latex
\documentclass[UTF8,fontset=fandol,11pt]{ctexart}
\usepackage{amsmath,amssymb,graphicx}
\usepackage[margin=2.5cm]{geometry}
\usepackage{booktabs,xcolor}
\usepackage[colorlinks=true,linkcolor=blue,urlcolor=blue]{hyperref}
\begin{document}
\maketitle
\section{引言}
...
\end{document}
```

Ambaŭ preambloj portas amsmath, amssymb, graphicx, geometry (2,5 cm marĝenoj), booktabs, xcolor kaj hyperref. Sen Titolo, neniu `\maketitle` estas skribita; malplena dato fariĝas `\date{}`.

## Importi el Typst

Ŝaltu la saman panelon al Typst kaj ĝi rekonas titolon kaj aŭtoron en `#set document(...)`, la nivelojn de `= Heading`, listojn, `*bold*` kaj `_italic_`, `$formula$`, `#link`, `#image` kaj `#figure`. Typst estas funkcia kompostado sen unu-al-unu respondaĵo por ĉio; io ajn, kion ĝi ne povas rekoni, ne estas silente forĵetita — ĝi iras en la averton liston.

## Ŝablonoj

`Dosiero → Ŝablona biblioteko…` listigas 11 enkonstruitajn ŝablonojn en kvar kategorioj:

| Kategorio | Ŝablono | Motoro |
| --- | --- | --- |
| Bazaj | Article, Letter | pdflatex |
| Akademiaj | Report, Ĉina artikolo (ctex), dukolumna artikolo, Tezo | pdflatex aŭ xelatex |
| Instruaj | Beamer-lumbildoj, Problemaro | pdflatex |
| Lingvoj | Japana artikolo | lualatex |
| Lingvoj | Araba kaj rusa artikolo | xelatex |

Post elekti ŝablonon, nomu la projekton kaj elektu gepatran dosierujon; TeXPro kreas `<parent folder>/<project name>`. Nevalidaj signoj en la nomo fariĝas `-`, kaj duoblaĵoj ricevas `-2`, `-3`; `{{title}}`, `{{author}}` kaj `{{projectName}}` en la ŝablono estas plenigitaj el la formularo, kaj la generita `main.tex` malfermiĝas per la motoro, kiun tiu ŝablono uzas.

`Dosiero → Ŝablona ateliero…` kunmetas paĝon, tiparon, strukturon kaj pakaĵojn el malplena baza klaso (article, report, ctexart, beamer); aranĝo, kiun vi ŝatas, povas esti konservita kiel persona ŝablono. Kun ŝablono elektita, la antaŭrigarda panelo konstruas unu paĝon per la motoro de tiu ŝablono kiel unua-paĝa bildeto. Personaj ŝablonoj loĝas en JSON-dosiero en la dosierujo de aplikaĵaj datumoj, kun limo de 2 000 000 signoj por ŝablono.

## Rimedoj

`Projekto → Rimeda biblioteko` skanas la nunan projekton ses nivelojn profunde, ĝis 500 dosieroj, plej novaj unue. Nur `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.pdf` kaj `.eps` validas.

Por enmeti bildon:

- Trenu bildon el Finder en la redaktilon, aŭ alklaku unu en la rimeda biblioteko.
- La bildo unue estas kopiita en la agorditan rimedan dosierujon de la projekto (`assets` implicite); duoblaĵoj ricevas `-2`, `-3`.
- La redaktilo enmetas `figure[htbp]`, `\centering`, `\includegraphics[width=0.8\linewidth]`, `\caption{}` kaj `\label{fig:...}`, lasante la kursoron ene de la bildoteksto.
- Se la preamblo de la ĉefa dosiero mankas `graphicx`, ĝi estas aldonita aŭtomate.

Vojoj estas skribitaj relativaj al la nuna `.tex`-dosiero; la etikedo venas el la dosiernomo, kun `-2` aldonita por duoblaĵoj. SVG estas rasterigita en `.texpro/svg-cache/` antaŭ enmeto, lasante la fontan dosieron netuŝita. Loko sekvas regulojn: bildo neniam surteriĝas ene de alia flosilo, kaj se la kursoro estas ene de figuro, ĝi moviĝas post tiun medion; en la ĉefa dosiero ĝi neniam surteriĝas en la preamblo.

## Oftaj kaptiloj

- Importo ne kopias bildojn: relativaj vojoj el Markdown iras en `\includegraphics` laŭvorte, do bildoj lasitaj ekster la projekto restas mankantaj.
- Remotaj bildoj (`http(s)://`) ne estas elŝutitaj; ili fariĝas `\href` kaj estas nomitaj en averto.
- Kiam kodbloko enhavas `\end{verbatim}`, tiu bloko estas malaltigita al quote, por ke la medio ne finiĝu antaŭtempe.
- Tabeloj prenas sian kolumnan nombron el la plej larĝa vico kaj ĉiam estas maldekstre ĝisrandigitaj; uzu Table Studio aŭ skribu kunfanditajn ĉelojn kaj longajn tabelojn permane.
- Elekti article en la falmenuo povas ankoraŭ doni ctexart: iom ajn da ĉina en la korpo sufiĉas.
- Sen malfermita projekto, Krei .tex-dosieron ne disponeblas, sed Enmeti korpon ankoraŭ funkcias.
- La averta panelo montras maksimume 4 erojn; la ceteraj aperas nur en la kalkulo.

## Rilataj paĝoj

- Kompilado kaj diagnozoj: `/docs/compile`
- Projektoj kaj dosieroj: `/docs/project`
- Verkaj reĝimoj kaj etosoj: `/docs/writing`
- Eksporti kaj arXiv: `/docs/export`
