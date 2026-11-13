---
slug: compile
title: Kompilado kaj diagnozoj
group: 使用
order: 3
summary: "Kompilado estas maldika ŝelo: lokalizu la ĉefan dosieron, elektu motoron, rulu latexmk, konvertu la protokolon en saltelajn diagnozojn. Komprenu tiujn kvar paŝojn kaj la plej multaj demandoj pri mankanta PDF respondas sin mem."
---

TeXPro ne efektivigas TeX; ĝi stiras la lokan latexmk. Konstruo vere faras nur kvar aferojn: skribas la ŝanĝojn al la disko, decidas kion konstrui, decidas kiun motoron uzi, kaj tradukas la protokolon en signalojn sur la ekrano. Konu tiujn kvar paŝojn kaj eraroj ĉesas esti nigra skatolo.

## La kvar etapoj de konstruo

- Konservi: ĉiu malpura bufro estas skribata al la disko antaŭ kompilado, kaj la ĉefa dosiero estas legata denove, do latexmk vidas la plej freŝan version sur la disko.
- Lokalizi: la ĉefa dosiero venas el `rootFile` en `.texpro/project.json`, aŭ se tio mankas, el la sola dosiero en la projekto, kiu enhavas `\documentclass`.
- Elekti motoron: magiaj komentoj kaj pakaĵaj signaloj en la ĉefa dosiero venas unue, poste la implicita motoro en agordoj.
- Ruli kaj analizi: alvoku latexmk, legu la `.log`, disigu erarojn, avertojn kaj troplenajn skatolojn en diagnozojn, kaj finfine konfirmu, ke PDF vere produktiĝis.

## Kiel la motoro estas elektata

Laŭ malkreskanta prioritato:

- Magia komento en la ĉefa dosiero, kiel `% !TeX program = xelatex`.
- Dokumentaj signaloj: `ltjs` kaj `luatexja` signifas lualatex; `ctex`, `xeCJK`, `fontspec`, `polyglossia` kaj `\setCJKmainfont` signifas xelatex.
- La implicita motoro en agordoj.
- pdflatex kiel la rezervaĵo.

| Motoro | latexmk-ŝaltilo | Uzu kiam |
| --- | --- | --- |
| pdfLaTeX | `-pdf` | Nur-latina teksto, klasikaj Type1-tiparoj |
| XeLaTeX | `-xelatex` | ctex, fontspec, sistemaj tiparoj |
| LuaLaTeX | `-lualatex` | luatexja, pakaĵoj bezonantaj Lua |

La sama logiko stiras TikZ- kaj figurajn antaŭrigardojn, do ĝusta magia komento en la ĉefa dosiero tenas antaŭrigardojn kaj realajn konstruojn sur la sama motoro.

## Konstrua dosierujo kaj artefaktoj

La konstrua dosierujo implicite estas `.texpro/build`; `directories.build` povas esti ŝanĝata en `Projekto → Projekta strukturo…`, sed ĝi devas resti ene de la projekto, alie vi ricevas "La konstrua dosierujo devas resti ene de la projekto". PDF kaj protokolo ambaŭ nomiĝas laŭ la baznomo de la ĉefa dosiero.

```bash
latexmk -pdf -synctex=1 -interaction=nonstopmode -file-line-error \
  -outdir=.texpro/build main.tex
```

Kiam la projekto estas sub Git, memoru aldoni la konstruan dosierujon al `.gitignore`; ĝi estas reskribata ĉe ĉiu konstruo.

## Konstrua strategio

| Strategio | Konduto |
| --- | --- |
| Post senaktiveco (implicita) | Kompilas 2.2 sekundojn post kiam tajpado ĉesas; neniam reeniras dum konstruo ruliĝas |
| Nur kiam PDF estas malfermita | Konstruas aŭtomate nur dum la PDF-panelo estas malfermita |
| Nur permane | Nur `⌘↩` kaj Kompili en la menuo |

Aŭtomata konservado estas aparta ŝaltilo; malŝalti aŭtomatajn konstruojn ne efikas konservadon. `⌘↩` konstruas permane en iu ajn momento, je la kosto konservi ĉiujn ŝanĝojn unue.

Dum konstruado, la butono fariĝas Nuligi, kaj la menuo portas Nuligi kompilon. Nuligado sendas SIGTERM al la tuta proceza grupo, poste SIGKILL 2.5 sekundojn pli malfrue. Unu konstruo eksvalidiĝas post 180 sekundoj implicite, raportante "La kompilado eksvalidiĝis post 180 s".

## Legi diagnozojn

| Fonto | Traktado |
| --- | --- |
| `main.tex:42: Undefined control sequence` | Dosiero kaj linio donitaj rekte |
| `! LaTeX Error: ...` plus `l.42` | Linia numero rekuperita el la erarbloko |
| `LaTeX Warning:`, `Package ... Warning:` | Registrita kiel averto |
| Troplena / subtropla `\hbox` | Komposta superfluo, klasifikita kiel informo |
| `File 'x' not found` | Traktata kiel eraro |

Diagnozoj estas limigitaj al 250 kaj ordigitaj laŭ linio. Alklaku unu por salti al ĝia linio, kiun ankaŭ la redaktila marĝeno markas; `n problemoj` dekstre de la stata breto kalkulas erarojn plus avertojn, kaj malfermas la probleman panelon.

Kompila teatro en la komanda paletro (`⌘K`) disigas konstruon en kvar etapojn — Motoro kaj radika dosiero, LaTeX-kompilado, Diagnozoj, PDF-transdono — kun fluanta protokolo. Uzu ĝin kiam vi bezonas la krudan eligon de latexmk; ĝi havas multe pli da pacienco ol la stata breto.

## Kontroloj de la ilĉeno

`Projekto → Projekta kuracisto…` kontrolas latexmk, pdflatex, xelatex, lualatex, biber, bibtex, synctex, kpsewhich kaj dvisvgm. Nur latexmk kaj pdflatex estas malmolaj postuloj; io ajn alia mankanta nur efikas sian propran funkcion — xelatex-ŝablonojn, biber-bibliografiojn, SyncTeX-saltojn, SVG-konvertiĝon.

Kuracisto ankaŭ listigas orfajn `.tex`-dosierojn, mankantajn pakaĵojn, rompitajn ligilojn, mankantajn bildojn, nedifinitajn referencojn, mankantajn bib-ŝlosilojn kaj duoblajn etikedojn, kaj povas purigi la konstruan dosierujon.

## Oftaj kaptiloj

- Neniu ĉefa dosiero: vi ricevas "Neniu LaTeX-radika dosiero troviĝis. Aldonu dosieron enhavantan \documentclass aŭ komenton % !TeX root.". Tenu ekzakte unu `.tex` enhavantan `\documentclass`, aŭ montru la ĉefan dosieron en Projekta strukturo.
- Agordita ĉefa dosiero, kiu rompiĝas: ne estas silenta rezervaĵo, nur "La agordo de la projekta ĉefa dosiero ne validas: ...". Riparu la dosieron aŭ elektu la ĉefan dosieron denove.
- Pluraj kandidatoj: "Pluraj ĉefaj dosieroj troviĝis. Elektu la ĉefan dosieron de la projekto." Vi devas elekti unu eksplicite.
- Eligo 0 sed neniu PDF: "latexmk finiĝis sed neniu PDF estis produktita." Kutime la dokumento haltas antaŭ `\end{document}`, aŭ la konstrua dosierujo estis purigita de ekstere.
- Mankantaj tiparoj: ctex kun xelatex malsukcesas sur maŝinoj sen ĉinaj tiparoj; la tipara kovrado de Kuracisto montras ĝin anticipe.
- Pakaĵoj kiel minted, kiuj bezonas shell-escape: la ĉefa konstruo ne pasas `-shell-escape`, do tiu enhavo devas esti konstruata ekstere aŭ reprojektata.
- Ŝalti aŭ fermi la projekton meze de konstruo: la ruliĝanta konstruo estas unue nuligita, kaj ĝiaj rezultoj estas forĵetitaj.

## Rilataj paĝoj

- Dudirekta navigado inter PDF kaj fonto: `/docs/synctex`
- Projektoj kaj dosieroj: `/docs/project`
- Importi, ŝablonoj kaj rimedoj: `/docs/import`
- Klavkombinoj: `/docs/shortcuts`
- Internaĵoj de kompilado: `/docs/dev-arch`

## Viva antaŭrigardo de alineo

Kongruaj LuaLaTeX-projektoj ricevas vivajn ĝisdatigojn ene de la ekzistanta PDF-antaŭrigardo, sekvante la agordojn de aŭtomata kompilado sen aparta reĝimo. PDF-inspektado preparas la formalan eligon kiam necese. Vidu [Viva TeX-antaŭrigardo](/docs/realtime-tex) por postuloj, enigado kaj limigoj.
