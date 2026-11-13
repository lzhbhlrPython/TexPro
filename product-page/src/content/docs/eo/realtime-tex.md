---
slug: realtime-tex
title: Realttempa TeX-antaŭrigardo
group: 使用
order: 3.5
summary: Antaŭrigardu nekonservitajn paragrafojn per enpakita rtex-ts kaj loka LuaLaTeX, kun rezerva plena aranĝo, formala PDF-eligo kaj eksplicitaj limoj.
---

## Malfermi la ekzistantan PDF-antaŭrigardon

Realttempa TeX-bildigo estas L0-plibonigo ene de la ekzistanta PDF-antaŭrigardo. Ne estas eksperimenta ŝaltilo aŭ antaŭrigarda reĝimo por elekti. Kun aŭtomata kompilado ŝaltita kaj kompila reĝimo alia ol permana, kongruaj LuaLaTeX-projektoj aŭtomate uzas la enpakitan [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts). Malŝalti aŭtomatan kompiladon ankaŭ malŝaltas realttempajn sesiojn. Neniu VS Code, etendaĵo aŭ Rust-plenumeblo estas bezonata. Loka LuaLaTeX, dokumentaj pakaĵoj kaj tiparoj ankoraŭ necesas.

- Konfirmu la ĉefan dosieron de la projekto; se ekzistas pluraj kandidatoj, elektu ĝin eksplicite.
- Konservu la motoran elekton de la aŭtoro. CTeX/fontspec-detekto kutime elektas XeLaTeX. Post kontrolo de ŝablona kongrueco, la aŭtoro povas deklari `% !TeX program = lualatex` en la reala ĉefa dosiero.
- Malfermu la PDF-antaŭrigardon kaj daŭrigu verki. Paĝpreparo, zomo, navigado kaj rulumado uzas la ekzistantan antaŭrigardan surfacon.

TeXPro ne reskribas tiparojn, ŝablonojn aŭ motorajn deklarojn. Nesubtenataj projektoj uzas la ekzistantan kompilan laborfluon. Kiel ordinara kompilado, LuaLaTeX plenumas dokumentan kodon kun viaj permesoj; tio ne estas sabla skatolo. Neniu nuba dokumenta transdono aldoniĝas.

## Verkado kaj aranĝo

Validigita prozo kaj enlinia matematiko povas ĝisdatigi glifojn antaŭ ol fona aranĝo korektas paĝigon kaj referencojn. Titoloj, tabeloj, TikZ, nekonataj makrooj kaj nefidindaj rezultoj atendas la plenan aranĝon. Nesubtenataj tiparoj aŭ desegaj operacioj uzas la kongruan PDF-paĝon sen pliaj rezervaj insignoj aŭ listo de motoraj statoj.

Vivaj ĝisdatigoj akceptas nekonservitajn bufrojn sen devigi konservadon. Aŭtomata konservado konservas sian ekzistantan agordon. Eniga kunmetado prokrastas sinkronigon sen forpreni la redaktilan fokuson aŭ la malfaran historion. Redakti subdosieron konservas la ĉefan dosieron de la projekto. Paragrafaj pozicioj, paĝigo kaj referencoj povas resti provizoraj ĝis la plena aranĝo; la formala PDF-eligo restas la decidiga.

## Unu ilobreto, PDF-preparo kiam necese

Zomo, adapto al larĝo, paĝa navigado, dupaĝaj vidoj kaj prezento kunuzas la ekzistantan ilobreton kaj rulumadan staton. Serĉo, miniaturoj, kopiado, komparo, malfermo aŭ malkaŝo de la PDF kaj regiona navigado preparas formalan PDF kiam necese: koncernaj bufroj estas konservataj kaj kompilataj antaŭ ol la operacio daŭras. Ne necesas permana reĝima ŝaltado. Malsukcesaj konstruoj aŭ fontaj ŝanĝoj dum preparo malhelpas agojn sur eksvalidiĝintaj rezultoj.

Permana kompilado ankaŭ montras la formalan PDF. La sekva fonta redakto aŭtomate rekomencas vivajn ĝisdatigojn. PDF-inspektado povas konservi dosierojn; la vivaj glifaj ĝisdatigoj mem ne. Rulanta realttempa sesio subpremas duoblan aŭtomatan kompiladon. Fermi ĝin aŭ akcela fiasko restarigas la ekzistantan politikon. Bibliografio, indeksoj, eksporto kaj sendo ankoraŭ uzas la plenan konstruĉenon.

Eksplicita navigado de fonto al PDF preparas aktualan formalan rezulton. Teni ⌘ / Ctrl kaj alklaki vivan paĝon unue preparas la formalan PDF kaj ebligas regionan elekton; poste elektu la celan regionon. Provizoraj koordinatoj neniam estas divenitaj kontraŭ alia aranĝo. Aŭtomata kursora sekvado uzas nur formalan rezulton kongruan kun la nunaj bufroj.

## Eraroj kaj riparo

Akcelfiaskoj kaj TeX-diagnozoj uzas la ekzistantan problempanelon, sen aparta motora panelo aŭ daŭraj sukcesaj mesaĝoj. Disponeblaj paĝoj restas ĝis ordinara kompilado anstataŭigas ilin. Instalu mankantajn LuaLaTeX, pakaĵojn aŭ tiparojn, aŭ uzu normalan formalan kompiladon. Fermu kaj remalfermu la PDF-antaŭrigardon post kiam vi riparis la dependaĵojn, por rekrei la sesion.

Fermi la antaŭrigardon, malŝalti aŭtomatan kompiladon aŭ fermi la projekton haltigas la sesion. Kaŝmemoroj loĝas en `.texpro/realtime/`, aparte de formalaj konstruoj. Malmuntado provas forigi sian propran sesian dosierujon; ŝlositaj dosieroj povas resti. Eksteraj redaktilaj ŝanĝoj kaj dependaĵoj anstataŭigitaj ĉe la sama vojo ne estas ĉiufoje observataj; remalfermu la antaŭrigardon aŭ kompilu formale.

## Enigado kaj atribuo

TeXPro gastigas rtex-ts en Node-laboranto per limigita IPC. Fontkit desegnas realajn glifajn konturojn; PDF.js bildigas rezervajn paĝojn. `PdfPane` posedas la komunajn ilojn, zomon kaj rulumadon. Vivaj paĝoj neniam reuzas malnovan PDF-tekstotavolon aŭ SyncTeX-mapon. Pura motora politiko estas kunhava kun kompilado. Laborantoj, dependaĵoj kaj Lua/TeX-subtenaj dosieroj estas malpakataj el ASAR, kaj suprafluraj haketoj estas validigataj.

La TypeScript-implementaĵo proksime referencas [realtime-tex de Henry Yang](https://github.com/HenryXiaoYang/realtime-tex). Lua/TeX-subtenaj dosieroj estas konservataj senŝanĝe. Ambaŭ uzas MIT kun origine konservitaj avizoj. Esplora inspiro venas de la [TUG 2026 papero de Clemens Lode](https://www.tug.org/tug2026/preprints/lode-realtime.pdf). Ĉi tio estas sendependa adapto, ne oficiala porto nek promeso pri API- aŭ agada ekvivalenteco. La proksimuma 1 ms-cifero de la supraflua projekto ne estas mezuro de TeXPro.

Vidu la [enigadan gvidilon de rtex-ts](https://github.com/lzhbhlrPython/rtex-ts/blob/main/docs/embedding.md) por bibliotekaj API-oj, versioj, koordinatoj kaj permesado, kaj la [gastigan kontrakton de TeXPro](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/realtime-tex.md) por integraj limoj. Ĉi tiu denaska validigo de TeXPro ruliĝas sur macOS; la pakaĵa CI ne anstataŭigas realan TeX-aplikaĵan testadon sur Windows kaj Linux. MiKTeX ankoraŭ bezonas apartan validigon.

Rilataj: [Kompilado kaj diagnozoj](/docs/compile), [Dudirekta navigado inter PDF kaj fonto](/docs/synctex), [Kopirajto kaj permesilo](/docs/copyright).
