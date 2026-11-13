---
slug: synctex
title: Dudirekta navigado inter PDF kaj fonto
group: 使用
order: 4
summary: SyncTeX mapas PDF-koordinatojn reen al fontaj linioj. Ĉiu TeXPro-konstruo pasas -synctex=1; kaj antaŭa sekvado kaj inversa klakado baziĝas sur tiu mapado.
---

Ĉiu konstruo pasas `-synctex=1`, do ne estas plia ŝaltilo por trovi. Antaŭa peto demandas, kie donita fonta linio sidas en la PDF; inversa peto demandas, el kiu linio PDF-koordinato venis. Ambaŭ estas respondataj de la loka `synctex`-programo, kun la precizeco, per kiu TeX mem linisaltas.

## La plena vojo de unu serĉo

- Post sukcesa konstruo, la konstrua dosierujo gajnas `.synctex.gz` nomatan laŭ la ĉefa dosiero.
- Antaŭa peto legas ĝin, konvertante dosieron, linion kaj kolumnon en paĝon kaj rektangulon; la PDF-panelo reliefigas kaj ruliĝas de tie.
- Inversa peto legas la saman dosieron, konvertante paĝon, x kaj y en fontan dosieron kaj linion; la redaktilo elektas ĝin.
- La mapado estas anstataŭigata tuta post ĉiu sukcesa konstruo — neniam akumuligata, neniam flikata paŝon post paŝo.

Por kontroli permane, alvoku la komandlinion rekte; la argumentoj kongruas kun tio, kion TeXPro uzas interne:

```bash
synctex view -i 128:1:main.tex -o .texpro/build/main.pdf
synctex edit -o 3:210:420:.texpro/build/main.pdf
```

`view` presas Paĝon, x, y, h, v, W, H; `edit` presas Enigon, Linion, Kolumnon. TeXPro krome kontrolas, ke la reala vojo redonita de `edit` kuŝas ene de la projekto, kaj rifuzas salti alie.

## Fonto → PDF

- Kursoro ripozas ie, la PDF-panelo malfermita, kaj PDF sekvas la kursoron ŝaltita en agordoj: ĝi lokalizas aŭtomate post 650-milisekunda paŭzo.
- Por lokalizi tuj: `⇧⌘J`, aŭ `Konstrui → Antaŭa serĉo`.
- Sen malfermita PDF, permana lokalizado malfermas la panelon; kun ankoraŭ nenio konstruita vi ricevas "Unue kompili por ebligi SyncTeX".
- Ĉe trafo la PDF ruliĝas tien, kaj afiŝo supre legas `Sinkronigita al paĝo 3 · linio 128`.

Aŭtomata sekvado ekfunkcias nur kiam nenio konstruiĝas, PDF ekzistas kaj estas aktiva dosiero. Ambaŭ ruliĝas nur kiam la celo estas ekster la vidkampo, kaj lokigas ĝin ĉirkaŭ 40% malsupre en la vidkampo; la diferenco estas, ke permana lokalizado ruliĝas glate dum aŭtomata sekvado saltas, do la vido ne drivas kontinue dum vi tajpas.

## PDF → Fonto

Tenu `⌘` (`Ctrl` en Windows / Linux) kaj alklaku en la PDF, kaj la redaktilo saltas al la kongrua linio. Por inversa selekto, tenu `⌘` kaj trenu rektangulon, aŭ unue alklaku Elekti PDF-regionon en la ilarbreto por eniri regionan reĝimon.

- La konsileto ĉe la fundo legas: `Tenu ⌘ / Ctrl kaj alklaku aŭ trenu por lokalizi la fonton`.
- La regiona reĝimo legas: `Tiru por elekti PDF-regionon kaj trovi ĝian fonton. Esc nuligas.`, kaj `Esc` eliras ĝin.
- Regiono specimenas maksimume 7 punktojn, serĉatajn paralele.
- Rezultoj estas grupigitaj laŭ dosiero; la dosiero kovranta la plej multajn liniojn venkas, kaj la intervalo de ĝia plej malalta ĝis plej alta linio estas elektata.
- Kiam la punktoj falas en diversajn dosierojn vi ricevas "La regiono transiras fontdosierojn. Montrata estas la plej granda kongrua intervalo.".
- Kiam nenio estas trovata: "Neniu fonta loko ĉe ĉi tiu punkto".

Post sukcesa inversa serĉo, aŭtomata antaŭa sekvado paŭzas 1800 milisekundojn; alie la sama ago tuj estus anstataŭigata de kursora sekvado.

## La PDF-panelo

| Regilo | Kion ĝi faras |
| --- | --- |
| Antaŭa / sekva paĝo | Paĝumas; la titolo montras la nunan paĝon kaj la tutan nombron |
| Pligrandigo | 35% ĝis 180% en 10%-paŝoj, 90% implicite |
| Adapti al paĝa larĝo | Adaptas unu paĝon al la larĝo de la panelo |
| Miniaturoj | Paĝaj miniaturoj en la flankstrio; alklaku unu por iri tien |
| Serĉo | Minimumo de du signoj, montras n/m trafojn; Enter kaj Shift-Enter saltas |
| Elekti PDF-regionon | Eniras inversan regionan serĉon; Esc eliras |
| Kompari kun antaŭa kompilo | Surmetas la antaŭan PDF je 15% ĝis 90% da opakeco |
| Dupaĝa aranĝo | Du paĝoj flanko ĉe flanko |
| Prezenta reĝimo | La panelo plenekrane |
| Kopii paĝan tekston | Kopias la tekston de la nuna paĝo |
| Malfermi PDF en implicita rigardilo | Transdonas al la sistema legilo |
| Montri PDF en Finder | Lokalizas la artefakton en la dosieradministrilo |

La malplena stato de la panelo diras "Ankoraŭ neniu PDF"; ĝia butono konstruas tuj, kun la konsileto `⌘↩ kompili · ⌘-klaku PDF por resalti`.

## Precizeco kaj limigoj

- La grupeco estas la linio, ne la signo. Pluraj formuloj sur unu linio ĉiuj montras la saman linian numeron; inversaj klakoj ankaŭ falas sur liniojn.
- La mapado venas el la lasta sukcesa konstruo. Redaktu sen rekonstrui kaj la serĉoj drivas, je tiom da linioj, kiom vi ŝanĝis.
- Inversaj serĉoj postulas, ke la reala vojo de la fonto estu ene de la projekto; `\input` atinganta eksteren estas rifuzata kun "La SyncTeX-fonto estas ekster la projekto".
- Nuligita aŭ malsukcesa konstruo ne ĝisdatigas la mapadon; la malnova PDF kaj la malnova mapado restas parigitaj, do la interfaco neniam montras duonon de nova paĝo kun malnovaj lininombroj.
- PDF kopiita de aliloke havas neniun uzeblan mapadon: latexmk skribas ĝin dum konstruo, valida nur por la PDF el tiu sama konstruo.

## Oftaj kaptiloj

- Ĝi nur gravas dum la PDF-panelo estas malfermita; kun la panelo faldita aŭtomata sekvado ĉesas, sed `⇧⌘J` ankoraŭ lokalizas permane.
- Neniu sekvado dum konstruo: se vi tajpas dum ĝi kompilas, atendu, ke la stata breto reiru de Kompostado al PDF preta.
- Kun aŭtomataj konstruoj kaj kursora sekvado kune, salti tuj post konservo povas surteriĝi sur la antaŭan version; paŭzi momenton antaŭ lokalizado estas pli stabila.
- Transdosiera regiona serĉo redonas la intervalon de unu dosiero, ne kunfanditan plurdosieran rezulton.
- Dupaĝa kaj prezenta reĝimoj nur ŝanĝas kiel paĝoj montriĝas, neniam la koordinatan matematikon.
- Pligrandigo ne ŝanĝas la mapadon: klakoj estas konvertataj en paĝaj koordinatoj ĉe iu ajn pligrandiga nivelo.

## Kunklabori kun aŭtomataj konstruoj

Aŭtomataj konstruoj ekfunkcias 2.2 sekundojn post kiam tajpado ĉesas, kaj la PDF kaj la mapado nur ĝisdatiĝas kiam la konstruo finiĝas. Kiam vi verkas longan alineon, kiu malfermas fenestron: la PDF sur la ekrano ankoraŭ estas la antaŭa versio, kaj kursora sekvado ankaŭ kongruas kun malnovaj pozicioj. La Kompostado-rulado maldekstre de la stata breto estas la sola fidinda signalo; legu la PDF post kiam ĝi ĉesas kaj nenio estos maltrafa.

Se vi simple volas verki kviete, ŝaltu la konstruan strategion al Nur permane, aŭ malŝaltu PDF sekvas la kursoron en agordoj kaj lokalizu laŭbezone per `⇧⌘J`.

## Rilataj paĝoj

- Kompilado kaj diagnozoj: `/docs/compile`
- Verkaj reĝimoj kaj etosoj: `/docs/writing`
- Projektoj kaj dosieroj: `/docs/project`
- Klavkombinoj: `/docs/shortcuts`
