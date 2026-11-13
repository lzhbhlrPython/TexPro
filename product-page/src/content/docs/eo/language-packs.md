---
slug: language-packs
title: "Lingvaj pakaĵoj: instali, traduki kaj restaŭri"
group: 使用
order: 68
summary: Uzu la antaŭinstalitan simpligitan ĉinan, kreu deklarajn lingvajn kromaĵojn kaj kontrolu rezervon, lokokupilojn kaj restaŭron.
---

## Elekti lingvon kaj restaŭri

La antaŭinstalita kromaĵo `@texpro/extension-translate-zh-cn` provizas la simpligitan ĉinan. Reviziu, malŝaltu aŭ ŝaltu ĝin en **Etendaĵoj**, poste elektu la lingvon en **Preferoj**. La angla ĉiam estas enkonstruita. Malŝalti aŭ forigi aktivan lingvan ĝisdatigon falas reen al la angla. Kunigitaj rimedoj povas esti malŝaltitaj, sed ne forigitaj. La denaska komando **Restarigi aspekton kaj malŝalti etendaĵojn** ĉiam uzas la anglan; `--safe-mode` ankaŭ provizas restaŭron.

Tradukoj povas imiti fidindajn instrukciojn. Nur-datumaj pakaĵoj tamen postulas fidon al la aŭtoro kaj enhavo. Funkciaj kromaĵoj posedas siajn i18n-rimedojn; gastigaj lingvaj pakaĵoj ne anstataŭas la komercan logikon de kromaĵo.

## Krei lingvan pakaĵon de katalogo v2

En deponeja evolu-medio, startu la gvidatan qwertysay-ilon kaj elektu nur-datuman lingvan pakaĵon, lingvokodon, memnomon kaj npm aŭ yarn:

```sh
npm ci
node packages/qwertysay/bin/qwertysay.cjs
```

Trovu semantikajn mesaĝajn ID-ojn en la ĝenerita `reference/en.json`, poste traduku valorojn en `locales/fr.json`. Konservu ID-ojn kaj variablojn kiel `{name}` senŝanĝe.

```json
{
  "app.save": "Enregistrer",
  "app.cancel": "Annuler"
}
```

Ĉiu kontribuo en `contributes.locales` deklaras la katalogan version:

```json
{
  "catalogVersion": 2,
  "id": "fr",
  "title": "Français",
  "messages": "locales/fr.json"
}
```

La etendaĵa `apiVersion` restas 1. Inkluzivu la manifeston, mesaĝan JSON kaj LICENSE, sen eniroj, kapabloj aŭ stiloj. Neniu kompilado necesas. Elektu **Check** kaj **Pack** por krei `.tpp`, reviziu ĝin en **Etendaĵoj**, ŝaltu ĝin kaj elektu la lingvon. Mankantaj mesaĝoj uzas la anglan; nekonataj semantikaj ID-oj estas raportataj. Kovrado estas relativa al la referenca versio de la SDK.

## Rompa migrado kaj longaj dokumentoj

SDK 0.5.0, qwertysay 0.6.0 kaj la ĉina pakaĵo 2.0.0 celas gastiganton kun subteno por katalogo v2. Malnovaj frazŝlosilaj pakaĵoj estas malakceptataj, sen kongrua tavolo. Regeneru la referencon, migru tradukojn al semantikaj ID-oj, plialtigu la pakaĵan version kaj validigu ĝin. Ŝanĝi nur la versionkampon ne sufiĉas. Fonto, npm-publikigo kaj aplikaĵaj Eldonoj estas apartaj statoj; ekzistantaj v0.1.0-instalaĵoj ne aŭtomate ricevas ĉi tiun kontrakton.

Butonoj, menuoj kaj statoj uzas JSON. Paskaj ovoj, dokumentaro, lerniloj kaj longaj klarigoj uzas kompletajn Markdown-dokumentojn por ĉiu lingvo kaj unu komunan bildigilon, anstataŭ apartajn mesaĝŝlosilojn por ĉiu frazo aŭ paragrafo. Surtablaj lingvaj kromaĵoj ne tradukas la retejon.

Fontoj de retejaj dokumentoj troviĝas en `product-page/src/content/docs/{locale}/{slug}.md`. La dosierujoj `zh/` kaj `en/` estas samnivelaj kun kongruaj dosiernomoj kaj slug-oj; la ĉina ne estas konservata ĉe la dokumentara radiko. Novaj lingvoj sekvas la saman strukturon. Movi fontdosierojn ne ŝanĝas publikajn ligilojn `/docs/:slug`.

Daŭrigu per la gvidiloj pri [SDK](/docs/extension-development), [qwertysay](/docs/qwertysay), [AI-evolua Skill](/docs/extension-skill) kaj [npm/yarn-etendaĵa administrado](/docs/extension-package-management).
