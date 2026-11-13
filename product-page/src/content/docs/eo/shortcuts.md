---
slug: shortcuts
title: Klavkombinoj
group: 参考
order: 9
summary: La klavkombinoj efektive ligitaj en menuoj kaj la redaktilo. macOS uzas ⌘; en Windows / Linux ⌘ fariĝas Ctrl kaj ⌥ fariĝas Alt.
---

## Kiel legi ĉi tion

La tabeloj listigas nur realajn ligojn, grupigitajn laŭ amplekso. Ago sen klavkombino atingeblas nur el la menuo aŭ la komanda paletro.

- macOS: ⌘ Command, ⌥ Option, ⇧ Shift, ↩ Return, Esc
- Windows / Linux: ⌘ fariĝas Ctrl, ⌥ fariĝas Alt, ĉio alia senŝanĝa
- Nuna dosiero signifas la konduton dum la redaktilo havas fokuson; kun fokuso en la PDF aŭ en teksta kampo, iuj kombinaĵoj surteriĝas aliloke

## Dosieroj kaj projektoj

| Klavkombino | Ago |
| --- | --- |
| ⌘O | Malfermi dosierujon kiel la projekton |
| ⌘S | Konservi la nunan dosieron |
| ⇧⌘W | Fermi la projekton kaj reveni al la bonvena paĝo |
| ⌘K | Malfermi la komandan paletron |

La komanda paletro trovas ĉiun menuagon, inkluzive tiujn sen klavkombinoj; ĝi ankaŭ estas la plej rapida maniero konfirmi, ke funkcio ekzistas.

## Konstrui, PDF kaj navigado

| Klavkombino | Ago |
| --- | --- |
| ⌘↩ | Konstrui la projekton |
| ⇧⌘J | Antaŭena serĉo: salti de fonto al la kongrua loko en la PDF |
| ⌘-alklako | Tenu ⌘ kaj alklaku la tekstotavolon de la PDF por retrovi la fontan linion |
| ⌥⌘P | Faldi / malfaldi la PDF-antaŭrigardon |
| ⌘F | Trovi ene de la nuna dosiero |
| Enter / ⇧Enter | Salti al la sekva / antaŭa kongruo en la trova breto |
| Esc | Fermi la trovan breton aŭ flosan tavolon |

Nuligi konstruon havas neniun implicitan klavkombinon; ĝi loĝas nur sub `Konstrui → Nuligi kompilon`. Ĝi finigas la tutan konstruan procezan grupon, ne nur latexmk mem.

> Inversa navigado ne postulas antaŭan serĉon unue: ordinara ⌘-alklako en la PDF jam estas retrovo.

## Interfaco kaj vidoj

| Klavkombino | Ago |
| --- | --- |
| ⌘\\ | Faldi / malfaldi la maldekstran flankstrion |
| ⇧⌘M | Baskuligi vidan reĝimon |
| ⇧⌘F | Baskuligi fokusan reĝimon |
| ⇧⌘T | Baskuligi tajpilan reĝimon |
| ⇧⌘L | Baskuligi la etoson Papero / Nokto |
| ⇧⌘0 | Eniri seninterfacan reĝimon |
| Esc | Eliri seninterfacan reĝimon |
| ⌘0 | Restarigi interfacan zomon |

Seninterfaca reĝimo kaŝas plej multajn interfacajn elementojn, lasante la korpon kaj unu eliran butonon. Ĝi ne estas plenekrano; premu Esc aŭ alklaku la butonon por reveni.

## Verkaj reĝimoj

| Klavkombino | Ago |
| --- | --- |
| ⌘⌥← | Reiri al la antaŭa verka pozicio |
| Esc | Forlasi la nunan vidan blokon kaj reveni al la fonta pozicio |
| ⌥↩ | Same kiel supre, por kiam Esc estas okupita aliloke |
| ⌘⌥P | Baskuligi la PDF-antaŭrigardon (funkcias ankaŭ dum verkado) |

Reiri al la antaŭa verka pozicio uzas po-sesion pozician stakon: konturaj saltoj, serĉoj, SyncTeX kaj vidblokaj saltoj ĉiuj puŝas sur ĝin, kaj unu premo revenas al la dosiero, kursoro kaj ruluma pozicio de antaŭ la salto. La stako tenas maksimume 80 poziciojn.

> En vida reĝimo, formuloj, tabeloj kaj bildoj ĉiuj estas redakteblaj blokoj; Esc forlasas nur tiun unu blokon kaj neniam malŝaltas vidan reĝimon.

## Redaktilo

| Klavkombino | Ago |
| --- | --- |
| ⌘B | Ĉirkaŭi la elekton aŭ kursoron per `\textbf{}` |
| ⌘I | Ĉirkaŭi la elekton aŭ kursoron per `\textit{}` |
| F2 | Renomi etikedon kaj ĝisdatigi referencojn tra la projekto |
| ⌥F12 | Antaŭrigardi la fonton de la referenco / etikedo ĉe la kursoro |
| Tab | Akcepti la sugeston kiam kompletigo estas malfermita, alie deŝovi du spacojn |
| ⌘⇧V | Alglui kiel ordinaran tekston |
| ⌘Z | Malfari; kiam la lasta paŝo estis trans-dosiera etikeda renomado, la tuta renomado estas rulfalita |
| ⇧⌘Z | Refari |
| ⌘Y | Refari (Windows-kutimo) |
| ⌥⇧↑ / ⌥⇧↓ | Movi la nunan blokon supren / malsupren |

La fenestro por alglui kiel ordinaran tekston estas mallonga: la sekva algluo ene de 1,5 sekundoj post premado de ⌘⇧V estas traktata kiel ordinara teksto kaj ne ekigos riĉtekstan aŭ bildan algluadon. Por ripete alglui ordinarajn tekstojn, premu ĝin denove ĉiufoje.

> Malfaro en la redaktilo unue traktas trans-dosierajn operaciojn kiel etikedajn renomadojn; sen renomado por rulfali, ĝi falas traen al la propra malfara stako de la redaktilo.

## Enmeti kaj iloj

| Klavkombino | Ago |
| --- | --- |
| ⇧⌘E | Malfermi la formulredaktilon |

Aliaj enmetiloj (tabeloj, bildoj, TikZ, cirkvitoj, partituroj kaj tiel plu) havas neniun tutmondan klavkombinon; atingi ilin eblas el la menuo `Enmeti` aŭ la komanda paletro. En vida reĝimo la ilaro pli rapidas.

## La manpleno, kiun vi plej uzos

- ⌘K: forgesis, kie funkcio loĝas? Malfermu unue la komandan paletron
- ⌘↩: konstruu, poste legu la rezulton en la PDF-panelo
- ⇧⌘J: finis alineon? Saltu kaj kontrolu la kompostadon
- ⌘-alklako: vidu problemon en la PDF kaj reiru al ĝia fonto
- ⇧⌘0: forigu la distraĵojn, kiam vi bezonas verki seninterrompe

## Konfliktoj kaj esceptoj

- ⌘0 restarigas zomon, ⇧⌘0 estas seninterfaca reĝimo; ili ne konfliktas, sed facile konfuzeblas
- ⌘Z en teksta kampo dependas de la sistemo; nur la redaktilo sekvas la projektan historion
- ⌘F efikas nur la nunan redaktilon; serĉado en la PDF uzas la propran serĉoskatolon de la PDF-panelo
- En Windows / Linux la Ctrl anstataŭanta ⌘ povas kolizii kun sistemaj aŭ enigmetodaj klavkombinoj; kiam tio okazas, fidu la kombinaĵon montritan en la menuoj de la aplikaĵo
- En iuj klavararanĝoj `⌘\\` dependas de la fizika malantaŭoblikva klavo; se ĝi ne ekfunkcias, serĉu Baskuligi flankstrion en la komanda paletro

> Klavkombinoj ne ŝanĝiĝas per propraj agordoj. La plej fidinda loko por konfirmi ligon estas la konsileto dekstre de la menuero.

## Lokokupiloj kaj reviziaj notetoj

| Ago | macOS | Windows / Linux |
| --- | --- | --- |
| Enmeti lokokupilon de korpo | `⌘⇧H` | `Ctrl+Shift+H` |
| Sekva / antaŭa lokokupilo en la nuna dosiero | `F4` / `⇧F4` | `F4` / `Shift+F4` |
| Lasi revizian noteton | `⌘⇧N` | `Ctrl+Shift+N` |
| Malfermi la liston de reviziaj notetoj | `⌘⇧U` | `Ctrl+Shift+U` |
| Apliki CTeX-verkadan tipografion al la ĉefa dosiero | `⌘⌥⇧C` | `Ctrl+Alt+Shift+C` |

Ĉiuj ĉi ankaŭ estas en la komanda paletro. Vidu [Lokokupiloj kaj reviziaj notetoj](/docs/writing-aids) kaj [CTeX ĉina tipografio](/docs/ctex-typography).
