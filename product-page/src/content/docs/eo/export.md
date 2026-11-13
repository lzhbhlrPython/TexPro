---
slug: export
title: Eksporti kaj arXiv
group: 参考
order: 7
summary: PDFoj venas el konstruoj; Eksporti dokumenton igas la nunan dosieron Markdown / Typst / HTML; la arXiv-pakaĵo kolektas fonton kaj rimedojn en alŝuteblan zip-dosieron.
---

## Tri eliroj, ĉiu kun propra celo

TeXPro ne rekompostas vian enhavon kaj sendas neniun dosieron al iu ajn servilo. Kiam vi finas verki, ekzistas tri artefaktoj, kiujn vi povas forporti:

| Artefakto | Venas el | Loko |
| --- | --- | --- |
| PDF | Konstruo (`⌘↩`) | `<project>/.texpro/build/<main file name>.pdf` |
| Markdown / Typst / HTML | Dosiero → Eksporti dokumenton… | La elŝuta dosierujo de la retumilo, aŭ la tondujo |
| arXiv-fonta pakaĵo | Dosiero → Krei arXiv-pakaĵon… | `<project>/.texpro/exports/arxiv-<timestamp>.zip` |

Neniu anstataŭas alian: la PDF estas por legantoj, eksportitaj dokumentoj estas por kunlaborantoj, kiuj ne verke LaTeX, kaj la arXiv-pakaĵo estas por la submetada sistemo.

## PDF: artefakto de konstruado

Intence ne ekzistas menuero Eksporti PDF. latexmk skribas la PDF-on en la konstruan dosierujon dum konstruo; por la plej freŝa versio, unue premu ⌘↩, poste iru al la PDF-panelo.

- La implicita eliga dosierujo estas `.texpro/build`; `directories.build` en `.texpro/project.json` povas montri aliloken
- La dosiernomo venas el la ĉefa dosiero de la projekto, ne el tiu ajn ĉapitro nuntempe malfermita
- La vido-menuo supre dekstre en la PDF-panelo ofertas Malfermi en implicita rigardilo kaj Montri en Finder
- Malsukcesa konstruo produktas neniun novan PDF-on; la panelo eble ankoraŭ tenas la antaŭan dosieron, do ne konfuzu ĝin kun la plej freŝa rezulto

> Protokolo, aux kaj synctex-dosieroj loĝas en la sama konstrua dosierujo. Por purigi, forigu tiun dosierujon; la fonto restas netuŝita.

## Eksporti dokumenton: unu dosiero samtempe

La enirejo estas `Dosiero → Eksporti dokumenton…`. Ĝi legas la nunan bufron de la redaktilo, inkluzive nekonservitajn ŝanĝojn; la eksporto kovras nur tiun unu dosieron kaj neniam disvastigas la tutan projekton laŭ `\input`.

La panelo elektas formaton maldekstre kaj antaŭrigardas ĝin vive dekstre; kopiu ĝin al la tondujo aŭ elŝutu ĝin. La elŝuto konservas la baznomon de la originala dosiero, anstataŭigante `.tex` / `.ltx` per la cela finaĵo.

| LaTeX | Markdown | Typst | HTML |
| --- | --- | --- | --- |
| `\section` / `\subsection` (sama nivelo) | `##` | `==` | `<h2>` |
| `\chapter` / `\part` | `#` | `=` | `<h1>` |
| `itemize` / `enumerate` | `-` / `1.` | `-` / `+` | `<ul>` / `<ol>` |
| `equation`, `align` kaj similaj | `$$ … $$` | `$ … $` | Nur `equation` bildiĝas kiel KaTeX-bloko |
| `verbatim` / `lstlisting` | Barita kodbloko | Barita kodbloko | Laŭvorta teksto, sen kodbloko |
| `figure` + `\includegraphics` | Bilda referenco | `#image(...)` | HTML-elemento `img` |
| `tabular` | Pipeta tabelo | Ne konvertita | Ne konvertita |
| `\textbf`, `\emph`, `\texttt` | Grasa, kursiva, egallarĝa | `*…*`, `_…_`, kummisoj | `<strong>`, `<em>`, `<code>` |
| `\cite`, `\ref`, `\eqref` | `[@key]`, `[key](#key)`, `(key)` | `@key` | `\cite` fariĝas cita markilo; `\ref` / `\eqref` ne estas konvertitaj |

Markdown-eligo ricevas YAML-frontmatter-blokon (`title`, `author`, `date`) kaj H1 ĉe la supro; Typst-eligo uzas `= Title` kaj `#set document(...)`; HTML estas memstara dokumento, kies formulojn KaTeX bildigas en statikan markaĵon dum eksportado.

### Kie konvertado haltas

- Nur la korpo inter `\begin{document}` kaj `\end{document}` estas prenita; la preamblo ludas neniun rolon
- Sekciaj niveloj estas platigitaj: `\section` kaj `\subsection` elvenas kiel la sama titola nivelo, do ĝustigu permane kiam vi bezonas pli delikatan strukturon
- En Markdown- kaj Typst-eligo, tuta linio, kiu komenciĝas per malantaŭa oblikvo kaj havas neniun konvertan regulon, estas forĵetita; `\newcommand`, propraj makrooj kaj kondiĉaĵoj ne estas disvolvitaj
- Medioj kiel `tikz`, `minted` kaj `algorithm` ne estas en la mapa tabelo, do kontrolu la antaŭrigardon antaŭ eksporti
- La HTML-formula stilfolio montras al KaTeX-CSS sur jsDelivr; malferminte eksterrete la strukturo postvivas, sed la stiligado eble mankas
- Tabeloj estas dividitaj laŭ `&` kaj `\\`; `\multicolumn` kaj `\multirow` degeneras al ordinara teksto

> La antaŭrigardo estas la fina rezulto: la teksto montrita en la panelo estas ekzakte tio, kion vi kopias aŭ elŝutas.

## La arXiv-pakaĵo: fonto kaj rimedoj

La enirejo estas `Dosiero → Krei arXiv-pakaĵon…`. Antaŭ krei la pakaĵon, la aplikaĵo konservas ĉiun nekonservitan ŝanĝon, poste skribas zip-dosieron en `<project>/.texpro/exports/`.

Pakado estas la tuta projekto minus tio, kio ne devus esti alŝutita, ne nur la dosieroj partoprenantaj la konstruon:

| Regulo | Enhavo |
| --- | --- |
| Preterlasitaj dosierujoj | `.texpro`, `.git`, `.hg`, `.svn`, `node_modules`, `build`, `out`, `dist` |
| Preterlasitaj dosieroj | Eroj komenciĝantaj per `.`, plus mezaj artefaktoj kiel `aux`, `log`, `toc`, `synctex`, `bcf`, `run.xml`, `blg`, `nav`, `snm`, `vrb` |
| Konservitaj senŝanĝe | `.tex`, `.bib`, bildoj, tiparoj, `sty` / `cls`, la subdosieruja strukturo |

Relativaj vojoj ene de la pakaĵo kongruas kun la projekto; neniu `\input`-vojo estas reskribita nur por platigi aferojn. `README.txt` ĉe la radiko registras la relativan vojon de la ĉefa dosiero, sugestitan latexmk-komandon, la detektitan motoron kaj la krean tempon.

Motora detektado rulas en ĉi tiu ordo: magia komento `% !TEX program` en la fonto → pakaĵoj kiel `ctex` / `fontspec`, kiuj implicas xelatex → `luatexja` / `ltjs`, kiuj implicas lualatex → pdflatex implicite. Ĝi legas nur la ĉefan dosieron, ne la tutan projekton.

### Antaŭ alŝuti

- La panelo montras la dosiernombron, la motoron kaj la zip-grandon, sed ne juĝas la grandajn kaj dosiernombrajn kvotojn de arXiv anstataŭ vi
- Se la ĉefa dosiero sidas en subdosierujo, la strukturo estas konservita; enigu la realan vojon dum submetado, kaj ne atendu, ke ĝi estos movita al la radiko
- Nereferencitaj bildoj, malnovaj malnetoj kaj eksperimentaj datumoj ankaŭ estas pakitaj; purigi la projekton unue estas malpli da laboro ol pritondi la zip-dosieron poste
- Kiam pakado finiĝas, kontrolu la arkivon per Montri aŭ Malfermi zip antaŭ alŝuti

> Efektiviga noto: pakado alvokas la sisteman `/usr/bin/zip`, kaj SVG-al-PNG alvokas `sips`. Ambaŭ venas kun macOS; Windows havas neniun ekvivalenton, kaj tiuj butonoj raportas erarojn tie.

## SVG kaj arXiv

LaTeX ne povas legi SVG-on rekte. Kiam vi enmetas `.svg`-rimedon, TeXPro unue konvertas ĝin per `sips` al PNG 1800 rastrumerojn larĝa, kaŝmemorigas ĝin en `.texpro/svg-cache/`, poste skribas la `\includegraphics`.

SVG-referencojn en ekzistanta projekto eblas trakti en unu paŝo: `Projekto → Konverti SVG-rimedojn…` skanas tekstajn dosierojn en la projekto (plej multe ses nivelojn), reskribas `\includegraphics` / `\includesvg` montrantajn al ekzistanta `.svg` al la kongrua PNG, kaj konservas la nedevigajn argumentojn. `.bib`-dosieroj ne estas skanataj.

- La konvertado vere redaktas `.tex`-dosierojn; komitu al Git aŭ faru projektan momentfoton unue
- Nur `.svg`-referencoj, kiuj solviĝas al reala dosiero, estas traktataj; remotaj bildoj kaj vojoj produktitaj de makro-disvolviĝo restas tiaj, kiaj ili estas
- La PNG-oj surteriĝas en `.texpro/svg-cache/`, kiun pakado preterlasas; antaŭ ol alŝuti projekton kun SVG-figuroj al arXiv, kopiu la PNG-ojn en rimedan dosierujon ene de la projekto kaj ripari la vojojn
- La skano havas profundan limon, do referencoj en profundaj dosierujoj povas esti maltrafitaj; fidu la antaŭrigardon kaj la konstruan rezulton

> Enigi `.svg` rekte en PDF-on bezonas kromajn TeX-pakaĵojn kaj konvertan ĉenon; TeXPro ne instalas nek agordas tiujn komponentojn anstataŭ vi.
