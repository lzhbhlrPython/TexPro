---
slug: faq
title: Oftaj demandoj
group: 参考
order: 10
summary: Instalaj malsukcesoj, konstruaj malsukcesoj, mankantaj tiparoj, alŝutaj zorgoj — la dekdu aferoj, kiuj plej ofte misgvidas homojn ĉe unua uzo, responditaj en unu loko.
---

## Ĉu ĝi bezonas retkonekton?

Ne. TeXPro estas tabula aplikaĵo; malfermi projekton, redakti, kompili kaj legi la PDF-on ĉio okazas loke. La sola reta trafiko estas tio, kion vi mem lanĉas: Git-remoto, Overleaf, arXiv-alŝuto, la nedeviga AI-asistanto, kaj la GitHub Releases-serĉo kiam paĝo montras versian numeron.

## Ĉu mi devas instali TeX-on mem?

Jes. TeXPro enigas neniun TeX-distribuon; ĝi stiras la `latexmk` kaj motorojn jam sur via maŝino. Instalu MacTeX aŭ BasicTeX en macOS, TeX Live en Windows kaj Linux; por ĉinaj projektoj, certigu, ke `ctex` estas inkluzivita.

## Kiuj platformoj estas subtenataj?

macOS 13 kaj pli novaj (Universal, Apple silicon kaj Intel), Windows 10 kaj pli novaj x64, Linux x64 (AppImage, plus deb / rpm). Interfacaj regresaj testoj nuntempe okazas plejparte en macOS; konstruoj por la aliaj du platformoj venas el la sama Nightly-fluo.

## Ĝi diras, ke pdflatex mankas

Du oftaj kaŭzoj:

- La distribuo ne estas instalita, aŭ ĝi estas instalita sed ne en `PATH`;
- aplikaĵo lanĉita el la grafika interfaco ne heredas la medivariablojn de la ensaluta ŝelo (precipe ofta en macOS).

Rulu `which latexmk` en terminalo por konfirmi la vojon, poste montru la konstruajn agordojn de TeXPro al la plenumeblo; aŭ lanĉu la aplikaĵon el terminalo, por ke ĝi heredu la plenan medion.

## La ĉina elvenas fuŝe, aŭ tiparo estas raportita mankanta

Ŝaltu la motoron al XeLaTeX aŭ LuaLaTeX, kaj uzu la pakaĵon `ctex` en la preamblo. La tipara kovrada panelo montras, ĉu la tiparoj estas efektive trovitaj; kiam tiparo mankas, la konstrua protokolo nomas ĝin.

## Ĉu `.texpro/` komitendu al la deponejo?

Via decido. Ĝi tenas la projektan agordon, enhavajn momentfotojn kaj la rubujon, kio estas loka laborstato; plej multaj homoj traktas ĝin per `.gitignore`, kaj kiam teamo kunhavas projekton, plej bone estas ignori ĝin, por ke ĉiu konservu sian propran historion.

## Ĉu ĝi povas anstataŭi Overleaf?

Ili celas malsamajn aferojn. TeXPro estas konstruita por unu persono finanta unu artikolon, kun projektaj dosieroj sur via propra disko; Overleaf estas interreta kunlaboro kaj nubaj konstruoj. La du povas rondiri tra Git: Overleaf klonas el Git, kaj TeXPro ankaŭ havas Git-panelon.

## Kiel funkcias kunlaboro?

Provizoraj ĉambroj en la loka reto: unu persono komencas sesion, aliaj en la sama reto aliĝas per ĉambra kodo, kaj redaktoj sinkroniĝas per loka WebSocket. Ĝi ne estas nuba sinkronigado, havas neniujn kontojn, kaj tenas neniun longdaŭran arkivon.

## Ĉu la AI alŝutos mian malneton?

Ne implicite. La AI-asistanto estas nedeviga: nur post kiam vi agordas servon kaj ŝlosilon kaj aktive sendas peton kun elektita teksto, tiu teksto forlasas. Lasu ĝin neagordita kaj ĝi neniam tuŝos la reton; nenio alia estas tuŝita.

## Konstruoj estas malrapidaj. Kion mi povas fari?

Unue kontrolu, ĉu ĉiu konstruo estas plena konstruo: rigardu la daŭron en la stata breto ĉe la fundo. La kutimaj rapidigoj estas inkrementaj konstruoj per `latexmk`, konverti bildojn al PDF aŭ malaltigi ilian distingivon, kaj dividi longan dokumenton en subdosierojn — ĉapitro enportita per `\include` povas esti konstruata memstare.

## Ĉu malinstalo forigos mian malneton?

Ne. Via malneto loĝas en la projekta dosierujo, kiun vi elektis, kaj malinstalo de la aplikaĵo ne tuŝas ĝin. La propra agordo, historio kaj ŝablonoj de la aplikaĵo sidas en la uzula datumdosierujo; forigu ilin permane por pura forigo.

## Kie loĝas datumoj kaj agordoj?

- Projekt-rilataj: la projekta dosierujo plus la `.texpro/` ene de ĝi;
- Aplikaĵ-rilataj: la dosierujo TeXPro en la sistema uzula datumdosierujo (agordoj, lastaj malfermoj, uzulaj ŝablonoj, MCP-agordo).

La AI-ŝlosilo estas konservita aparte kiel `secrets.json` en tiu dosierujo, ĉifrita de la sistema sekura konservejo kun permesoj `0600`; kie la sistemo ofertas neniun ĉifradon, konservado malsukcesas tute anstataŭ fali reen al ordinara teksto.

## Ĉu klavkombinoj povas esti ŝanĝitaj?

Menuaj klavkombinoj nuntempe estas fiksaj; la paĝo Klavkombinoj havas la plenan referencon. Ene de la redaktilo ekzistas aparta aro de CodeMirror-klavligoj, kiuj sekvas redaktilajn konvenciojn. La komanda paletro ofertas enirejon, kiu bezonas neniun klavkombinon.
