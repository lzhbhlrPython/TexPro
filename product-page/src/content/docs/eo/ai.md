---
slug: ai
title: AI-asistanto (laŭvola)
group: 参考
order: 8
summary: AI estas defaŭlte malŝaltita. Post kiam OpenAI-kongrua finpunkto kaj ŝlosilo estas entajpitaj, la kunteksto forlasas vian maŝinon nur kiam vi alklakas Ruli, kaj rezultoj estas skribataj nur post via konfirmo.
---

## Malŝaltita defaŭlte

TeXPro enhavas neniun modelon kaj faras neniun aŭtomatkompletan reskribadon anstataŭ vi. AI estas laŭvola funkcio, kiun vi mem agordas: se ne agordita, la aplikaĵo sendas neniun peton al iu ajn AI-servo.

Agordo troviĝas en `Agordoj → Laŭvola AI`:

- Ŝaltu la ŝaltilon Ŝalti AI-asistanton
- Entajpu la servan URL-on, defaŭlte `https://api.openai.com/v1`, sen `/chat/completions` ĉe la fino
- Entajpu la modelan nomon, defaŭlte `gpt-4o-mini`
- Entajpu la API-ŝlosilon

La ŝlosilo neniam iras en ordinarajn agordojn, nek en `localStorage`. La ĉefprocezo ĉifras ĝin per la sistema sekura konservejo kaj konservas ĝin kiel `secrets.json` en la dosierujo de aplikaĵaj datumoj, kun permesoj `0600`. Kie la sistemo ne ofertas ĉifradon, konservado malsukcesas kun mesaĝo anstataŭ reiri al simpla teksto.

## Malfermi la panelon

`Projekto → AI-asistanto…`, aŭ serĉu `AI assistant` en la komanda paletro.

Se ne agordita, la panelo montras neniujn taskojn, nur agordan karton; ĉiu butono estas malŝaltita, kaj ne ekzistas provo-enirejo.

## Ses taskoj

| Tasko | Sendita kunteksto | Eligo |
| --- | --- | --- |
| Klarigi kompilan eraron | La nuna kompila eraro kaj diagnoza linio | Klarigo kaj la plej malgranda ripeto |
| Reskribi klare | Kelkaj linioj ĉirkaŭ la kursoro | Pli klara LaTeX-paragrafo |
| Traduki al la ĉina | Kelkaj linioj ĉirkaŭ la kursoro | Ĉina traduko, kiu konservas komandojn kaj formulojn |
| Traduki al la angla | Kelkaj linioj ĉirkaŭ la kursoro | Angla traduko, kiu konservas komandojn kaj formulojn |
| LaTeX el priskribo | La naturlingva priskribo, kiun vi tajpas (antaŭplenigita per kelkaj linioj ĉirkaŭ la kursoro, anstataŭigebla) | Unu matematika esprimo, sen `$` |
| Agadoj de agento | La nuna elekto (defaŭlta kunteksto kiam nenio estas elektita) | Strukturaj redaktaj agoj |

Ĉiu tasko portas fiksan sisteman instrukciaron: tradukado kaj reskribado devas konservi ĉiun komandon, referencon, etikedon kaj formulon; `Agent actions` devas redoni nur JSON, sen klariga prozo.

## La kunteksto estas redaktebla

La kampo Kunteksto en la panelo estas ordinara tekstujo, kiun vi povas redakti antaŭ sendo. Ĝia defaŭlto sekvas la taskon:

- Klarigi eraron: la eraraj linioj el la nuna konstrua rezulto
- Agadoj de agento: la nuna elekto
- Aliaj taskoj: proksimume kvin linioj ambaŭflanke de la kursora linio

Kun malplena tekstujo, lokokupila teksto «Neniu kunteksto provizita.» estas tamen sendata, anstataŭ ke la peto silente nuligu.

> Nur la teksto en ĉi tiu tekstujo forlasas vian maŝinon. La projekta dosierujo, aliaj dosieroj kaj la PDF neniam estas aŭtomate pakitaj kaj alŝutitaj.

## Ruli kaj akcepti

Premu Ruli kaj la peto fluas reen, la rezulto aperante dum ĝi alvenas; Haltigi nuligas la nunan peton.

- Ordinaraj taskoj: la rezulto aperas en la tekstujo sube; nur Enmeti rezulton metas ĝin ĉe la kursoro, kaj la panelo poste fermiĝas
- Agadoj de agento: la rezulto estas analizata en agajn kartojn, ĉiu indikante sian tipon kaj kialon; nur Apliki agon rulas unu, kaj aplikitaj kartoj estas markitaj kiel Aplikita

Agadoj de agento rekonas nur tri agojn: `insert`, `replace-selection`, `replace-document`. Kiam la respondo de la modelo ne estas valida JSON, aŭ enhavas neniun ruleblan agon, la panelo raportas eraron anstataŭ silente redakti dosierojn.

> Ne ekzistas Akcepti ĉion kaj neniu aŭtomata aplikado. Revizuu pograndajn redaktojn unu post unu.

## Detaloj de la peto

- Protokolo: OpenAI-kongrua Chat Completions, `POST {baseUrl}/chat/completions`
- Aŭtentigo: `Authorization: Bearer <apiKey>`
- Parametroj: `temperature: 0.2`, `stream: true`, kun ekzakte unu sistema kaj unu uzanta mesaĝo
- Fiaskoj montras la statkodon kaj respondon-elĉerpaĵon, ekzemple `AI request failed (401)`
- Neniu konversacia historio konserviĝas: ĉiu Ruli estas memstara raŭndo portanta nur la sisteman instrukciaron kaj kuntekston de la nuna tasko

Iu ajn servo parolanta tiun protokolon do funkcias: memgastigata pordego, prokura servilo, loka inferenca servilo — kondiĉe ke ĝi fluigas `choices[0].delta.content`.

## Privateco kaj limoj

- AI estas defaŭlte malŝaltita kaj neniam funkcias memstare; neniu fona antaŭvarmigo, neniu aŭtomata resumo
- La ŝlosilo restas sur via maŝino; petoj iras de la aplikaĵo rekte al la URL, kiun vi entajpis, sen TeXPro-ripetilo
- La provizanto vidas la tekston, kiun vi sendas; ĝia protokolada kaj konservada politiko estas ĝia propra afero
- Modelo povas produkti LaTeX, kiu ne kompiliĝos, aŭ ŝanĝi la malĝustan komandon; konstruu unue, poste akceptu
- Por projektnivelaj legado, skribado, konstruoj kaj serĉo, uzu MCP anstataŭ alglui la tutan projekton en dialogon

> Ŝanĝi servon aŭ modelon ne bezonas restartigon: konservu la agordojn kaj la sekva Ruli uzas ilin.

## Kiam io malsukcesas

| Simptomo | Kontrolu unue |
| --- | --- |
| La panelo montras nur la agordan karton | Ĉu la ŝaltilo estas ŝaltita kaj la ŝlosilo ne malplena |
| `AI request failed (401)` | Ĉu la ŝlosilo estas ĝusta kaj neeksvalidiĝinta |
| `AI request failed (404)` | Ĉu la URL havas plian aŭ mankantan `/v1` |
| `AI returned an empty stream` | Ĉu la servo subtenas fluigan sendadon; provu prokuran servilon, kiu subtenas |
| Agadoj de agento raportas neniujn validajn agojn | Ĉu la modelo redonis JSON; provu pli fortan instrukciosekvanton |
