---
slug: mcp
title: "MCP: transdoni la projekton al AI"
group: AI 协作
order: 15
summary: TeXPro liveras MCP-servilon, kiu ebligas al eksteraj AI-klientoj legi la projekton, serĉi simbolojn, ruli kompilojn kaj lokalizi poziciojn en la PDF. Ĉi tiu paĝo klarigas kiel konekti ĝin, kion ĝi povas fari post konekto kaj kie ĝi estas limigita.
---

## Du direktoj, ne konfuzu ilin

**TeXPro → aliaj MCP-serviloj**: la ena MCP-panelo povas munti eksterajn servilojn (dosiersistemo, datumbazo, serĉo…), alportante iliajn kapablojn en TeXPro-on. La agordo troviĝas en `mcp-servers.json` en la uzantadata dosierujo.

**Aliaj AI-klientoj → TeXPro**: `mcp/server.mjs` estas sendependa stdio-servilo, kiu elmontras projekciajn kapablojn kiel kompilado, serĉado kaj lokalizado. Claude Desktop, Cursor, Codex kaj iu ajn MCP-kapabla kliento povas konektiĝi.

Ĉi tiu paĝo temas ĉefe pri la dua direkto.

## Kio ĝi estas

`mcp/server.mjs` estas ordinara Node-skripto: ĝi ne dependas de Electron-fenestro kaj ne bezonas, ke la aplikaĵo ruliĝu. La protokolo estas la stdio-transporto de MCP — unu JSON-RPC-mesaĝo por linio, kun protokoloj skribataj al stderr tiel, ke ili neniam poluas la protokolan fluon.

Lanĉaj argumentoj:

```bash
node /path/to/mcp/server.mjs --project /path/to/your-paper
```

Vi ankaŭ povas agordi la komencan projekton per la medivariablo `TEXPRO_PROJECT_ROOT`. Sen ĝi la servilo tamen startas, sed la unua alvoko devas esti `texpro_open_project`.

## Konekti klienton

Por Claude Desktop, aldonu unu eniron al la agorda dosiero:

```json
{
  "mcpServers": {
    "texpro": {
      "command": "node",
      "args": [
        "/Applications/TeXPro.app/Contents/Resources/app.asar.unpacked/mcp/server.mjs",
        "--project",
        "/Users/you/papers/paper-1"
      ]
    }
  }
}
```

Estas du kazoj por la vojo:

| Scenaro | Vojo de server.mjs |
| --- | --- |
| Evolua deponejo | `<repository>/mcp/server.mjs` |
| Instalita aplikaĵo | `<app>/Contents/Resources/app.asar.unpacked/mcp/server.mjs` (en Linux / Windows ĝi estas `resources/app.asar.unpacked/mcp/`) |

`--project` montras al via projekta dosierujo, ne al unuopa `.tex`-dosiero. Restartigu la klienton post redakto de la agordo, kaj la ilaro devus montri la familion `texpro_*`.

## Kion ĝi povas fari

### Legi la projekton

| Ilo | Celo |
| --- | --- |
| `texpro_open_project` | Malfermi / ŝanĝi la projekton radikon |
| `texpro_project_info` | Ĉefa dosiero, kompila radiko, motoro, moduloj kaj dosieruja strukturo |
| `texpro_list_files` | Listigi dosierujon (rekurse, profunda limo 8) |
| `texpro_read_file` | Legi tekstan dosieron |
| `texpro_search` | Tutprojekta teksta serĉo (uskleco laŭvola, limo 200 rezultoj) |
| `texpro_project_symbols` | Simbola indekso por sekcioj, etikedoj, citaĵoj, komandoj ktp |
| `texpro_bib_lookup` | Serĉi bib-enirojn laŭ ŝlosilo aŭ malklara termino |

### Skribi al la projekto

`texpro_write_file` vere skribas al la disko, kun limo de 2 MB por alvoko kaj nur tekstaj dosieroj. Antaŭ skribado, legu unue per `texpro_read_file`, por ke la modelo vidu la aktualan enhavon antaŭ ŝanĝi ĝin kaj evitu tutan anstataŭigon.

### Kompilado kaj diagnozoj

`texpro_compile` prenas dosieron, motoron (`pdflatex` / `xelatex` / `lualatex`) kaj konstruan dosierujon, kaj redonas la plenan eligon kun daŭro, paĝonombro, avertoj kaj eraroj. `texpro_diagnose` rulas statikajn kontrolojn (mankantaj grafikaĵoj, mankantaj pakaĵoj, nedifinitaj referencoj ktp). `texpro_cancel_compile` interrompas malrapidan kompilon.

### Lokalizi kaj desegni

`texpro_synctex_forward(file, line, column)` transformas fontlinion en paĝnumeron kaj koordinatojn; `texpro_synctex_inverse(page, x, y)` iras de PDF-koordinatoj reen al dosiero kaj linio. `texpro_render_tikz` bildigas TikZ-peceton en bildon, kaj `texpro_template_preview` bildigas ŝablonan antaŭrigardon.

## Rimedoj kaj invitoj

Krom iloj, la servilo provizas du pliajn specojn de MCP-kapablo:

- **resources**: elmontri tekstajn dosierojn en la projekto (`.tex` `.ltx` `.bib` `.md` `.txt` `.sty` `.cls`) kiel `texpro://project/<relative path>`, por ke klientoj povu munti ilin kiel kuntekston
- **prompts**: `fix-latex-error` (ripari eraron el la protokolo), `summarize-project` (verki resumon laŭ la strukturo), `write-section` (verki unu sekcion el skizo)

## Tipa uzo

### Lasu la AI ripari kompilan eraron

```text
1. texpro_compile               → get the error log
2. read prompts/fix-latex-error → locate it following the prompt
3. texpro_read_file             → look at the context
4. texpro_write_file            → change the smallest span
5. texpro_compile               → verify again
```

Paŝo 5 estas la ŝlosila: post ŝanĝo ĝi devas rekompili, alie la modelo nur divenas.

### Lasu la AI aldoni sekcion el skizo

Unue alvoku `texpro_project_symbols` por ricevi la ekzistantan strukturon kaj numeradon, poste `texpro_read_file` por legi kiel najbaraj sekcioj estas verkitaj (persono, tempo, matematika komposta kutimo), kaj poste verku. Poste rulu `texpro_diagnose` por kontroli, ke referencoj estas fermitaj.

### Lasu la AI trovi, kiu fonto produktis Figuron 3

`texpro_synctex_inverse(3, x, y)` donas la dosieron kaj linnumeron rekte, multe pli fidinde ol igi la modelon serĉi la tutan dokumenton.

## Sekurecaj limoj

- **Vojpordego**: ĉiu parametro, kiu portas vojon, trapasas `path.resolve` kaj poste prefiksan komparon, kaj devas resti ene de la aktuala projekta radiko. Eliri eksteren raportas `Path is outside the project: …`
- **Simbolligoj**: la reala radiko estas aldone komparata per `realpath`, malhelpante al simbolligo eskapi la projekton, raportante `Path escapes the project through a symlink: …`
- **Ignorataj dosierujoj**: `.git`, `.texpro`, `node_modules`, `dist`, `build`, `out` partoprenas nek serĉon nek listigon
- **Neniu reto**: la servilo nur legas kaj skribas lokajn dosierojn kaj alvokas la lokan TeX; ĝi faras neniujn retajn petojn
- **Neniu fenestro**: ĝi ne bezonas, ke la aplikaĵo ruliĝu, kaj ne estas tuŝata de interfaca stato

## Solvado de problemoj

| Simptomo | Kaŭzo |
| --- | --- |
| Ila listo estas malplena | La kliento ne estas konektita: kontrolu, ke `node` estas en PATH, aŭ skribu absolutan vojon |
| `No project is open` | `--project` ne estis donita kaj `texpro_open_project` ankoraŭ ne estis alvokita |
| Kompilo raportas latexmk ne trovita | La medio rulanta la servilon havas neniun TeX-distribuon; la MCP-servilo ne kunigas TeX kun la aplikaĵo |
| Skribo malakceptita | La vojo estas ekster la projekto, la dosiero ne estas teksto, aŭ ĝi superas 2 MB |
| Fuŝsignoj en la ĉina | La dosiero ne estas UTF-8; la servilo legas kaj skribas UTF-8 |

> Dum sencimigado, simple rulu `node mcp/server.mjs --project .` kaj tajpu JSON-RPC-linion en la terminalon — pli rapide ol diveni ene de kliento.

## Kiel ĝi diferencas de la enkonstruita AI-asistanto

TeXPro ankaŭ havas laŭvolan AI-asistanton (ŝaltatan nur post enigo de ŝlosilo en agordoj), kaj ĝi kaj MCP estas du malsamaj vojoj:

| | Enkonstruita AI-asistanto | MCP-servilo |
| --- | --- | --- |
| Kiu alvokas ĝin | La aplikaĵo mem, en panelo dum verkado | Ekstera kliento (Claude Desktop, Cursor, Codex…) |
| Kunteksto | La teksto, kiun vi elektis, plus resumo de la aktuala projekto | Decidata de la kliento, kiu povas legi la tutan projekton |
| Ŝlosilo | Konservata en la sistema ŝlosilujo, nur por la modelo, kiun vi agordis | Ne ligita al TeXPro; la propra modelo de la kliento estas uzata |
| Ĉu ĝi povas ŝanĝi dosierojn | Enmetas en la dokumenton nur post via konfirmo | Jes, rekte al la disko per `texpro_write_file` |

Ambaŭ povas esti ŝaltitaj samtempe; se vi ne volas eksteran klienton, simple ne agordu MCP-on, kaj nenio alia estas tuŝata.

## Tajpi peton permane

Por sencimigi „la kliento ne konektiĝas“, la plej rapida vojo estas ruli ĝin mem en terminalo:

```bash
node mcp/server.mjs --project /path/to/paper
```

Poste tajpu JSON unu linion samtempe, laŭ la protokolo. Unue manpremo, poste listigo de iloj, poste alvoko:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"texpro_project_info","arguments":{}}}
```

Protokoloj iras al stderr kaj neniam miksiĝas en respondojn. La kampo `content` de respondo enhavas tekstajn blokojn, kaj `isError` markas malsukcesan alvokon — en CLI tiuj du kampoj sufiĉas.

## Samtempeco kaj rendimento

- **Sennaciaj sesioj**: ĉiu alvoko re-solvas vojojn kaj kaŝmemorigas neniun dosieran enhavon; legi la saman dosieron ripete frapas la diskon ripete
- **Kompilado estas peza**: unu `texpro_compile` startas `latexmk`, kaj plena konstruo povas daŭri pli ol dek sekundojn; por amasaj redaktoj, ŝanĝu ĉion kaj kompilu unufoje anstataŭ kompili post ĉiu linio
- **Nuligo**: `texpro_cancel_compile` nuligas nur la nunan ruladon por la aktuala projekto
- **Grandaj projektoj**: `texpro_search` kaj `texpro_list_files` trairas dosierujojn kun profunda limo 8; serĉrezultoj estas limigitaj al 200, kaj io ajn pli bezonas pli mallarĝan mendon

## Versioj kaj kongruo

Servilo kaj kliento interkonsentas pri MCP-protokola versio; malmoderna kliento malsukcesas la manpremon, kio montriĝas kiel malplena ila listo aŭ tuja malkonekto. Ĝisdatigi la klienton kutime solvas ĝin.

La parametraj nomoj de iloj `texpro_*` estas stabila interfaco — renomi parametron rompas kongruon; aldoni ilon aŭ novan laŭvolan parametron estas sekura.

## Verkhelpaj iloj

Novalditaj: `texpro_writing_aids`, `texpro_edit_writing_aid` kaj `texpro_ctex_typography`, uzataj respektive por listigi lokokupilojn kaj reviziajn notojn, por protekti redaktojn per haketo, kaj por antaŭrigardi la ĉinan kompostadon de la ĉefa dosiero. Por plena uzo vidu [Lokokupiloj kaj reviziaj notoj](/docs/writing-aids) kaj [CTeX ĉina kompostado](/docs/ctex-typography). Tiuj iloj funkcias sur konservitaj dosieroj kaj neniam legas nekonservitan redaktilan bufron.

## Nurlega inspektado de etendaĵa aŭtorado

`texpro_extension_capabilities` raportas kromaĵajn lingvojn, etosajn stilojn, ilĉenojn kaj `.tpp`/`.tpt` artefaktajn sufiksojn sen malfermita projekto. `texpro_inspect_extension` akceptas konstruan dosierujon aŭ artefakton ene de la aktuala projekto, ekz. `{"path":"extensions/example/dist/package"}`. Ĝi redonas la manifeston, resumon, grandecon kaj riskajn avizojn, malakceptante eksterajn vojojn kaj simbolligajn eskapojn. Ĝi neniam konstruas, importas eniron, instalas, fidas, ŝaltas aŭ alvokas kromaĵon.

Eksperimentaj `mcp`-agoj en la manifesto ankoraŭ ne fariĝas eksteraj iloj aŭtomate. Kontrolita alvoko povas esti plue evoluigata kun eksplicita ŝaltado kaj permeslistoj de iloj. La sendependa servo legas la diskon, ne nekonservitajn bufrojn. Aŭtoradaj konstruoj uzas SDK `0.2.0` kaj qwertysay `0.3.0`, malsamaj de la origina `0.1.0`; vidu la gvidilojn pri [SDK](/docs/extension-development) kaj [qwertysay](/docs/qwertysay).
