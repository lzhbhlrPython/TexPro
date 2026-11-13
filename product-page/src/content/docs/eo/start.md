---
slug: start
title: Instalo kaj via unua projekto
group: 开始
order: 1
summary: "TeXPro estas tabula aplikaĵo, kiu ne dependas de servilo. Ĉi tiu sekcio traktas nur kvar aferojn: instali ĝin, malfermi ĝin, kompili kaj rigardi la rezulton."
---

## Kio estas TeXPro

Loke-unua LaTeX-laborejo: verku maldekstre, kompostu dekstre, sen ŝalti tien kaj reen intere. La fonto ĉiam estas reala fonto, kompilado ĉiam iras tra `latexmk` sur via maŝino, kaj viaj dosieroj ĉiam restas sur via propra disko.

Ĝi ne estas Markdown-redaktilo, nek interreta kunlabora platformo. Antaŭ ol vi malfermas ĝin, vi ne bezonas registri konton aŭ alŝuti vian manuskripton al iu ajn servilo.

## Trovi la ĝustan gvidilon

La [Uzanta gvidilo](/docs) komenciĝas per ĉi tiu ĉapitro kaj kovras instaladon, verkadon, kompiladon kaj liveradon. Por kromaĵoj, etosoj, MCP-integriĝo aŭ kontribuoj al la aplikaĵo, komencu per la ĉapitro pri ellabora agordo en [Dokumentaro por ellaborantoj](/developers). Serĉo kovras ambaŭ sekciojn; artikola navigado kaj antaŭaj/postaj ligiloj restas en la nuna sekcio. Ekzistantaj artikolaj ligiloj restas validaj.

## Preparado de la medio

### La aplikaĵo

| Platformo | Instalilo | Notoj |
| --- | --- | --- |
| macOS 13+ | `.dmg` | Apartaj versioj por Apple silicon (arm64) kaj Intel (x64) |
| Windows 10+ | `.exe` | NSIS-instalilo, instala vojo elektebla |
| Linux | `.AppImage` | Faru ĝin plenumebla kaj rulu ĝin rekte; ankaŭ deb / rpm disponeblas |

Instaliloj gastiĝas sur GitHub Releases. Nightly kontrolas ĉiutage je 21:23 Asia/Shanghai ĉu ekzistas kommitoj ekde la lasta sukcese publikigita Nightly, poste testas, pakaĵas kaj publikigas kiam novaj kommitoj ekzistas; alie ĝi saltas. Nightly-versioj portas daton. Atendovicoj de Actions povas prokrasti la planitan kontrolon.

### TeX-distribuo

TeXPro ne enhavas TeX; kompleta distribuo devas jam esti instalita loke:

- macOS: MacTeX (aŭ BasicTeX plus la pakaĵoj, kiujn vi bezonas)
- Windows: TeX Live
- Linux: TeX Live (kutime pakaĵigita kiel `texlive-full` en deponejoj de la distribuaĵo, aŭ instalita laŭbezone)

Iu ajn el `pdflatex`, `xelatex` aŭ `lualatex` sufiĉas; ĉe lanĉo la aplikaĵo sondas la distribuon kaj la plenumeblojn, kaj se ĝi ne trovas ilin, ĝi diras al vi, kio mankas, antaŭ kompilado. Por ĉina kompostado, XeLaTeX aŭ LuaLaTeX estas rekomendataj.

## Unua malfermo

La unua lanĉo donas al vi demonstran projekton (`demo/`) enhavantan `main.tex`, kiu kovras formulojn, tabelojn, TikZ, partiturojn, citaĵojn kaj aliajn oftajn elementojn. Vi ne devas unue prepari vian propran manuskripton — kompili ĝin unufoje estas la plej rapida maniero konfirmi, ke la medio estas kompleta.

Post kiam vi premas kompili, la stata breto ĉe la fundo montras "Kompostado" kaj poste "PDF preta · daŭro". Se ĉi tiu paŝo funkcias, la TeX-medio estas en ordo kaj vi povas malfermi vian propran projekton.

## Malfermi vian propran projekton

Uzu "Dosiero → Malfermi dosierujon" (⌘O / Ctrl+O) por elekti dosierujon. TeXPro skanas ĝin por `.tex`, `.bib`, bildoj kaj subdosierujoj, kaj deduktas la ĉefan dosieron el ili.

La ĉefa dosiero determiniĝas en ĉi tiu ordo:

| Stato | Signifo |
| --- | --- |
| `configured` | Ĉefa dosiero estas fiksita en la projekta agordo kaj havas prioritaton |
| `detected` | Nur unu kredinda kandidato ekzistas en la dosierujo; elektita aŭtomate |
| `ambiguous` | Pluraj kandidatoj ekzistas; vi devas specifi unu |
| `missing` | Ne ekzistas `.tex`-dosiero en la dosierujo |
| `invalid` | La dosiero, kiun la agordo montras, ne ekzistas |

Se ĝi ne povas esti deduktita, specifu ĝin unufoje per la falmenuo "Ĉefa dosiero" maldekstre; la elekto estas skribata en la projektan agordon kaj uzata de tiam.

> La dosierujo `.texpro/` sub la projekta radiko konservas la projektan agordon kaj enhavajn momentfotojn. Ĉu ĝi eniru versionkontrolon estas via decido, sed por komunaj projektoj kutime pli facile estas trakti ĝin kune kun `.gitignore`.

## Unua kompilado

Premu ⌘↩ (Ctrl+Enter en Windows / Linux) por kompili.

```text
main.tex  →  latexmk（-synctex=1）  →  main.pdf
```

- La motoro implicite sekvas la projektan agordon (`pdflatex` / `xelatex` / `lualatex`)
- Plirapidajn konstruojn traktas `latexmk`; la dua kompilado kutime pli rapidas ol la unua
- La protokolo ankaŭ skribiĝas en la konstruan dosierujon apud la PDF, kaj la diagnoza panelo legas la saman dosieron
- Kiam io malsukcesas, la nombro de problemoj aperas dekstre; alklaku ĝin por malfermi la diagnozan panelon, kaj alklaku eron por salti al la koncerna linio

Kompilado ruliĝas en la fono kaj ne blokas tajpadon: vi povas daŭre verki, kaj kiam la rezultoj revenas, nur la antaŭrigardo kaj la diagnozoj ĝisdatiĝas.

## Mapo de la interfaco

| Loko | Celo |
| --- | --- |
| Maldekstra flankstrio | Dosiera arbo, rimeda biblioteko, simboloj kaj plenteksta serĉo (⌘\ por faldi) |
| Centro | La redaktilo. Fonto kaj vida tavolo estas du vizaĝoj de la sama enhavo (⌘⌥M por ŝalti) |
| Dekstro | PDF-antaŭrigardo, faldebla kiel tuto (⌘⌥P) |
| Fundo | Stata breto, kompila tempo kaj diagnoza panelo |

## Kvar oftaj klavkombinoj

| Klavkombino | Ago |
| --- | --- |
| ⌘K | Komanda paletro; ĉiuj 30+ paneloj kaj agoj estas serĉeblaj |
| ⌘⌥F | Fokusa reĝimo: konservi nur la nunan alineon |
| ⌘⌥T | Tajpila reĝimo: teni la kursoron fiksa meze de la vido |
| ⌘⌥L | Baskuligi helan / malhelan |

Vidu [Klavkombinoj](/docs/shortcuts) por la plena listo.

## Oftaj problemoj ĉe unua uzo

**La kompilo raportas, ke latexmk ne troveblas**: TeX ne estas instalita, aŭ la terminalo / aplikaĵo ne estis restartigita post ĝia instalado. La instalilo ŝanĝis PATH, kaj la malnova procezo ne povas vidi ĝin.

**La PDF estas blanka**: plej verŝajne la malĝusta ĉefa dosiero estis elektita, do stumpo sen korpa teksto estis kompilita. Kontrolu la falmenuon "Ĉefa dosiero" maldekstre.

**La ĉina transformiĝas en kvadratojn**: la motoro estas pdfLaTeX. Ŝaltu al XeLaTeX, aŭ ŝarĝu la pakaĵon `ctex`.

**La PDF-antaŭrigardo ne sekvas la kursoron**: kompilu unufoje, por ke la SyncTeX-datumoj generiĝu; `-synctex=1` estas implicita argumento, sed ĝi eble estis anstataŭigita en malnova projekta agordo.

**Malfermi projekton estas malrapide**: grandaj dosierujoj kiel `node_modules` / `build` estas preterlasataj, sed se via projekto enhavas ekstreme grandan bildan dosierujon, la unua skano ankoraŭ legas metadatumojn.

## Sekvaj paŝoj

- Kompilado kaj diagnozoj: [Kompili kaj diagnozi](/docs/compile)
- Dudirekta navigado: [Dudirekta navigado inter PDF kaj fonto](/docs/synctex)
- Verkada sperto: [Verkaj reĝimoj kaj etosoj](/docs/writing)
- Movi manuskripton el alia ilo: [Importi, ŝablonoj kaj rimedoj](/docs/import)
