---
slug: dev-design
title: Dizaina lingvo kaj interfaca gvidado
group: 开发
order: 14.1
summary: Registru la paperan identecon en la formato Google DESIGN.md kaj apliku rolojn de Material Design kaj alireblecajn gvidliniojn.
---

## Kanona referenco

La radika DESIGN.md estas la referenco pri la dizaina lingvo. Ĝi enhavas YAML-tokenojn kaj ok sekciojn: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, kaj Do's and Don'ts. Ĝia strukturo sekvas la [formaton Google Labs DESIGN.md](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md).

Ĝi registras la ekzistantan paperan identecon de TeXPro. Ĝi ne postulas migradon al komponenta biblioteko de Material nek ŝanĝon al Roboto. Apartigu dizajnajn postulojn de la kontrolita plenumo de ekzistantaj interfacoj.

## Elekti interagskopon laŭ tasko

Interfaca komplekseco devus kongrui kun taska komplekseco, ne kun nombro de funkcioj. Antaŭ efektivigo, deklaru la taskon, nivelon, taŭgecon de ekzistantaj spacoj, pravigon por nova paĝo kaj riskon de duoblaj enirejoj.

| Nivelo | Surfaco |
| --- | --- |
| L0 nerimarkebla plibonigo | Interna aŭtomata laboro sen nova interfaco; realtime TeX apartenas ĉi tien |
| L1 surloka plibonigo | Redaktilo, antaŭrigardo, kompletigo, diagnozo aŭ ekzistantaj kuntekstaj agoj |
| L2 laŭbezona ilo | Ekzistanta dialogo, flanka panelo, Studio aŭ ila vido |
| L3 sendependa laborejo | Paĝo aŭ labortablo por kompleta sendependa laborfluo |

Elektu la plej malaltan nivelon, kiu plene subtenas la taskon, konservante klarecon, efikecon kaj uzeblon. Sendependaj laborfluoj, grandaj kanvasoj, daŭra plurŝtupa stato, malsamaj fokusitaj kuntekstoj aŭ troloĝata ekzistanta surfaco povas pravigi paĝon kun klara respondeco. Graveco aŭ efektiviga komplekseco sola ne povas.

Simpla stato, pliaj butonaj opcioj, kapabloj nature apartenantaj al konservado aŭ antaŭrigardo, kaj duoblaj iloj restas en ekzistantaj spacoj. Malkaŝu kompleksecon laŭbezone, restarigu la verkadan kuntekston ĉe eliro kaj tenu necesajn erarojn videblaj. Ne postulu novan paĝon por jam fluida operacio.

Reuzu vidan lingvon, itinerojn, fokusadministradon, staton kaj malfaron. Realtime-antaŭrigardo uzas la ekzistantan PDF-ilbreton, akcelas aŭtomate kaj preparas formalajn rezultojn por inspektado sen postuli, ke aŭtoroj komprenu bildigajn reĝimojn. La kompleta politiko pri paĝaj decidoj kaj validigo estas en AGENTS.md.

## Principoj

Verkado restas centra kaj iloj retiriĝas. Matematiko, tabeloj, muziko, cirkvitoj kaj strukturaj formuloj kunhavas unu verkadan fluon. La fonto restas alirebla kaj bildigo helpas. Ordinaraj redaktoj ne devas dependi de studioj, modalaj fenestroj aŭ kompletigaj butonoj. Helpo konservas la dosieron, kursoron, elekton, rulumon, IME kaj malfaron.

## Koloro kaj tipografio

Uzu [kolorrolojn de Material Design](https://m3.material.io/styles/color/the-color-system) por pripensi surfacojn, tekston, emfazon kaj statojn. Tablaj tokenoj troviĝas en src/styles/app.css; paper havas postajn anstataŭigojn, do ne kopiu nur la unuan deklaron. Studio uzas malhelan ĉirkaŭaĵon kaj helan paperon, night uzas malhelan paperon, kaj paper estas hela. La retejo havas apartajn Ant Design-tokenojn kaj retejajn variablojn.

Verkado uzas serifan tiparon, regiloj uzas la sisteman UI-stakon, kaj fonto kaj protokoloj uzas egallarĝan tiparon. Display, headline, title, body kaj label priskribas rolojn, ne ordonas tutmondan tiparan anstataŭigon. Ekranaj etosoj ne rajtas ŝanĝi aŭtorajn kolorojn aŭ la inkon de la fina PDF.

## Alirebleco kaj statoj

Por novaj aŭ ŝanĝitaj komponantoj, kontrolu realajn kolkombinaĵojn kontraŭ projektaj celoj de 4.5:1 por ordinara teksto kaj 3:1 por granda teksto kaj esencaj ne-tekstaj regiloj. Uzu la gvidadon de Google pri 48dp tuŝoceloj kiel referencon; taksu retejajn klakareojn kaj kompaktajn tablajn regilojn aparte, anstataŭ egali dp kaj CSS-px.

Interagaj elementoj bezonas nomojn, videblan klavaran fokuson kaj elirvojon. Ne komunikigu staton nur per koloro. Kontrolu longan anglan tekston, ĉinan interpunkcion, zomon, ĉiujn tablajn etosojn kaj reduktitan moviĝon. Ĉi tiuj estas akceptceloj, ne atestado de ĉiu hereda komponanto.

## Moviĝo kaj komponantoj

Reuzu la ekzistantajn daŭron, ease-out, rise kaj Reveal-ritmon de la retejo. Reduktita moviĝo devas teni ĉiun enhavon videbla. Verkado kaj navigado ne devas atendi ornamajn animaciojn. Tenu Lucide sur la tablo kaj Ant Design sur la retejo; kompletigoj, menuoj kaj lokokupiloj uzas sian ekzistantan surfacan lingvon.

## Antaŭ kaj post ŝanĝoj

Legu PRODUCT.md, DESIGN.md kaj koncernajn fontajn stilojn kaj komponantojn. Enhavpurigado ne rajtigas ŝanĝi la aranĝon. Rulu aranĝajn kontrolojn antaŭ kaj post reteja enhava laboro kaj prizorgu ambaŭ lingvojn. Ĝisdatigi dizajnan specifon ne signifas, ke la interfaco estis redesignita.

## Retejspecifa referenco

La radika DESIGN.md ankaŭ dokumentas la retejon: helajn kaj malhelajn surfacajn rolojn, serifajn rezervojn, regilajn grandecojn kaj radiusojn, adaptiĝeman navigadon, moviĝon kaj printstilojn. Retejaj tokenoj venas de product-page/src/App.tsx, src/config/design.ts kaj src/styles/global.css. Etosa stato kaj provizoraj anstataŭigoj troviĝas en src/lib/theme.tsx; la ekzistanta paskaĵa paĝo provizore devigas malhelan reĝimon kaj restarigas la antaŭan elekton ĉe eliro.

La retejo uzas sian propran helan/malhelan paletron, ne la tablajn reĝimojn paper/studio/night. Konservu la ekzistantajn paperajn sekciojn, specifajn vicojn, ligitajn referencojn kaj realajn ekrankopiojn. Kontrolu aparte mallarĝajn aranĝojn, longajn tradukojn, klavaran operacion kaj printadon. Enhava laboro ne ŝanĝas la aranĝan ŝloson.
