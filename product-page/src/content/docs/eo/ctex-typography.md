---
slug: ctex-typography
title: CTeX ĉina tipografio
group: 使用
order: 6.5
summary: Legado de la ĉina sur papero kaj la reala PDF estas traktataj aparte, konservante la tiparojn, dokumentklason kaj radikan dosieron de la aŭtoro.
---

## Kiel la redaktilo kaj la PDF dividas la laboron

Vida reĝimo rekonas la CTeX-agordon de la radika dosiero kaj, ĉe la komenco de ordinara ĉina alineo, montras du-signan deŝovon, linian interspacon taŭgan por legado kaj la ĉinajn linisaltajn regulojn. Formuloj, kodo, tabeloj kaj titoloj konservas sian propran prezentadon. La surskrena antaŭrigardo helpas kontinuan verkadon; finaj linisaltoj, paĝigo kaj glifoj venas el la PDF konstruita de la loka TeX.

Etosoj ŝanĝas nur la surskrenajn kolorojn, neniam la PDF-on. Lokokupiloj prenas la korpan koloron de la nuna etoso Papero, Studio aŭ Nokto, do neniu interfaca malhelo estas skribita en la dokumenton.

## Apliki ĉinan verkadan tipografion

Serĉu en la komanda paletro "Apliki CTeX-verkadan tipografion", aŭ premu `⌘⌥⇧C` en la redaktilo (`Ctrl+Alt+Shift+C` aliloke). La ago funkcias sur la reala radika dosiero, konservas vian lokon en la subdosiero, kiun vi verkas, kaj povas esti malfarita.

La agordo kovras du-signan unualinean deŝovon, plenlarĝan interpunkcion, interspacon ĉirkaŭ ĉina teksto, alinean interspacon kaj 1,3× bazlinian interspacon. Ekzistanta CTeX-klaso aŭ pakaĵo estas reuzata anstataŭ ŝarĝiĝi dufoje; ordinara dokumento ricevas CTeX aldonita. Nur la tipografia bloko, kiun TeXPro mem markas, estas anstataŭigita; la originaj tiparaj kaj titolaj agordoj de la aŭtoro restas netuŝitaj.

```tex
% TeXPro Chinese typography begin
\ctexset{autoindent=2, punct=quanjiao, space=auto}
\setlength{\parskip}{0pt plus 1pt}
\linespread{1.3}
% TeXPro Chinese typography end
```

Ĉi tio estas ago laŭ postulo: malfermi malnovan projekton neniam reskribas ĝian tipografion aŭtomate. Kiam lerneja, ĵurnala aŭ eldonista ŝablono jam havas proprajn regulojn, sekvu la ŝablonon kaj preterlasu ĉi tiun ĝeneralan agordon.

## Tiparoj kaj motoroj

Novaj ĉinaj artikoloj kaj ĉinaj importoj uzas `ctexart` kun `fontset=fandol`, implicite XeLaTeX, kio reduktas interplatformajn malsukcesojn kaŭzitajn de fido al sistemaj Song-tiparaj nomoj. Ekzistanta `fontset`, `fontspec` aŭ ĉina tipara komando ne estas anstataŭigita de ĉi tiu ago. Se propra tiparo mankas, vi ankoraŭ devas instali ĝin aŭ elekti anstataŭanton mem.

La ŝablona dezajnilo kaj paĝa aranĝo konservas la linian interspacon, kiun vi agordis, kaj ne stakigas la ĝeneralan interspacon supre. Ĉina klaso konservas sian Unikodan motoron eĉ kiam la ĉina lingvo ne estas elektita denove. Ŝanĝi aranĝon ne plu traktas `ctexart` kiel ordinaran `article` kaj ŝarĝas `ctex` duan fojon.

## MCP

`texpro_ctex_typography` legas la realan radikan dosieron kaj redonas antaŭrigardon de la kompostota fonto; `saved: false` signifas, ke ĝi ankoraŭ ne estis skribita al la disko. Kontrolu ĝin unue, poste apliku ĝin per eksplicita dosiera skribo. Ekstera kliento devus konservi la ekzistantan LuaLaTeX-agordon de la projekto kaj ne devas trakti la redonitan XeLaTeX-sugeston kiel motora agordo, kiun oni devos anstataŭigi.
