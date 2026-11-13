---
slug: dev-handoff
title: Transdono de sesio kaj dokumenta mapo
group: 开发
order: 14.2
summary: Daŭrigu laboron per stabilaj referencoj kaj distingigu postulojn, efektivigon, historion kaj nunajn kontrolojn.
---

## Legordo

1. AGENTS.md: kunlaboraj reguloj, amplekso kaj invariantoj.
2. PRODUCT.md: la verkade-unua produkta celo.
3. DESIGN.md: realaj dizajnaj tokenoj, papera lingvo kaj Google-referencoj.
4. docs/README.md kaj docs/development.md: navigado, evoluigo kaj kontroloj.
5. docs/architecture.md kaj docs/technical-contracts.md: modulaj respondecoj kaj kontraktoj.

Sur ĉi tiu retejo, legu [agordon](/docs/dev-setup), [arkitekturon](/docs/dev-arch), [bildigan tavolon](/docs/dev-renderer), [testadon](/docs/dev-testing), [eldonadon](/docs/dev-release) kaj [dizajan lingvon](/docs/dev-design).

## Kontroli antaŭ laboro

```sh
git status --short --branch
git log -5 --oneline
```

Konservu ekzistantajn ŝanĝojn. Difinu la amplekson el la nuna peto kaj kontrolu la nunan branĉon kaj efektivigon. Ne ripetu finitajn taskojn el malnovaj interparoloj. Lininombroj, testaj totaloj kaj ekrankopioj estas historia pruvo, ne permanentaj kontraktoj.

## Konservi ĉi tiujn decidojn

Ordinara TeX estas la originala dokumento. La ĉefa dosiero malsamas de la aktiva langeto. Konservado konfirmas apartan momentbildon. Asinkronaj rezultoj devas validigi identecon. Iloj devas konservi la verkadan fluon. Muziko uzu la TeX-ilĉenon kiam eble; la ISO-ideo estis nuligita kaj Liquid Glass estis rifuzita.

Konservado, kompilado, referenca prizorgado kaj MCP devas kunhavi la solvon de la ĉefa dosiero. La retejo estas sendependa statika projekto uzanta pnpm; la tabla aplikaĵo uzas npm. Enhavaj ĝisdatigoj ne rajtigas ŝanĝojn de itinilo aŭ aranĝo.

## Enhavo de transdono

Registru la celon, ŝanĝojn, decidojn, kontrolkomandojn kaj realajn rezultojn, malkovritajn riskojn, branĉan kaj komitan staton. Distingu inter komiti, puŝi, kunfandi, eldoni kaj deploji. PASS-eligro ne pruvas procezan eliron; loka konstruo ne pruvas publikigon.

Ĝisdatigu publikajn dokumentojn por daŭraj reguloj. Tenu privatajn interparolojn, akreditaĵojn, superpowers-rikordojn kaj provizorajn planojn ekster Git. Blogoj registras la historion de aplikaĵa evoluigo, ne la nunan taskovicon.

## Taskaj branĉoj kaj ĝustatempa ĝisdatigo de Git

Reuzu la nunan taskan branĉon por sekvaĵoj, kontroloj kaj dokumentaro. Mesaĝo, sesio aŭ komito ne postulas novan branĉon. Kreu branĉon por aparta tasko. Komitu koherajn, kontrolitajn ŝanĝojn ĝustatempe kaj puŝu la taskan branĉon kiam ĝia malproksima deponejo estas agordita kaj rajtigita. Respektu eksplicitajn petojn resti loke aŭ ne puŝi. Kunfandi main kaj publikigi eldonojn ankoraŭ postulas la koncernan rajtigon. Raportu malproksimajn malsukcesojn sen aserti sinkronigon.

## Transdono de etendaĵoj kaj etosoj

Legu unue la deponejajn docs/extensions.md, docs/extension-development.md kaj packages/extension-sdk/index.d.ts. Komanda katalogo, verkada pordego, provizantoj, etosa apliko kaj laborejoj havas apartajn modulojn. Aldonu realan servan kaj redaktilan transakcian kovradon antaŭ adaptilaj ŝanĝoj, poste rulu la plenan bazlinion sen saltoj, denaskajn vojaĝojn kaj pakaĵajn kontrolojn. Etosoj kaj etendaĵa malkovrado havas apartan posedrajton; kontrolu purigadon de CSS/tiparoj/rimedoj kaj sendependan restaŭron. Altnivelaj provizantoj, DOM-selektiloj kaj paneloj restas eksperimentaj. Ne ekzistas publika merkato nek aŭtomata registrado de ekstera stdio MCP. La SDK kaj qwertysay estas sendependaj npm-evoluigaj pakaĵoj en packages/extension-sdk kaj packages/qwertysay. Konsumu la publikan package-tools-kernon sen kopii validigilojn; kontrolu la precizan publikigan staton kontraŭ npm kaj la aŭtora gvidilo.
