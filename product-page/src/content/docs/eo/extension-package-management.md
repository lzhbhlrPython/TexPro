---
slug: extension-package-management
title: "Administri etendaĵojn per npm aŭ yarn"
group: 参考
order: 69
summary: "Kreu etendaĵan dosierujon, instal, ĝisdatigu kaj forigu pakaĵojn per npm aŭ yarn, poste konfirmu ĉiun ŝanĝon en TeXPro."
---

Administri etendaĵojn postulas du paŝojn: instalu aŭ forigu pakaĵon en via terminalo, poste sinkronigu la ŝanĝon kun TeXPro. **Rulu sinkronigon ĉiam, kiam vi ŝanĝas dependaĵojn. Post instalado, vi decidas ĉu ŝalti la etendaĵon.**

Ĉi tiu lernilo uzas la publikan oficialan ĉinan pakaĵon, `@texpro/extension-translate-zh-cn`. Por administri kromaĵon aŭ etoson de alia aŭtoro, uzu la samajn paŝojn kun ilia pakaĵa nomo.

> Vi bezonas TeXPro-konstruon kun etendaĵa sinkronigo. La originaj v0.1.0-instaliloj ne havas ĉi tiun funkcion; ĝisdatigi nur qwertysay ne povas aldoni ĝin al pli malnova surtablaĵo.

> **Kontrolu la fonton antaŭ instalado aŭ konstruado.** Registra havebleco, integrecaj haŝoj kaj ŝlosildosieroj ne atestas sekurecon. Malŝaltu instalajn skriptojn. Fonta konstruo tamen rulas kompililojn kaj projektan agordon kun viaj uzantaj permesoj, inkluzive dosieran, retan kaj procesan aliron. Posta ŝalta konfirmo en TeXPro ne povas inversigi agojn faritajn dum konstruo.

## Antaŭ ol vi komencu

- Instalu Node.js 20 aŭ pli novan. Rulu `node --version` en terminalo kaj kontrolu, ke la versio estas almenaŭ v20.
- npm venas kun Node.js; kontrolu ĝin per `npm --version`. Se vi elektas yarn, instal ĝin unue kaj rulu `yarn --version` por vidi ĉu vi havas 1.x aŭ version 2 aŭ pli novan.
- Instalu TeXPro-konstruon kun sinkroniga subteno kaj malfermu ĝin almenaŭ unufoje. Elŝuti pakaĵojn bezonas interretan konekton. Publikaj pakaĵoj ne postulas npm-konton.
- Elektu npm aŭ yarn kaj sekvu nur tiun vojon. Ne miksu ilin en unu dosierujo.

Ĉi tiuj paŝoj administras etendaĵojn, kiujn vi uzas. `@texpro/extension-sdk` kaj `@texpro/qwertysay` estas disvolvaj iloj, ne funkciaj kromaĵoj ŝalteblaj en la aplikaĵo.

## Unua agordo: kreu etendaĵan dosierujon

Malfermu terminalon en la gepatra dosierujo, kie vi volas teni viajn etendaĵojn. Ne uzu LaTeX-projekton, TeXPro-fontan eltiraĵon aŭ kromaĵan fontan dosierujon.

```sh
npx --package @texpro/qwertysay@0.6.0 qwertysay
```

La unua npx-plenumo eble petos elŝuti qwertysay. Konfirmu, poste respondu la gvidilon:

- Elektu English.
- Elektu la agon por krei etendaĵan medion, identigitan per `environment`.
- Enigu `texpro-extensions` por New extension environment directory, aŭ premu Enter por uzi tiun implicitan valoron. La dosierujo ne rajtas jam ekzisti.
- Elektu npm aŭ yarn kiel la Package manager.
- Kontrolu la celon kaj la pakaĵadministrilon, poste enigu `y` ĉe Continue? [y/N].

La gvidilo kreas `texpro-extensions` kun package.json kaj la agordo de la elektita ilo. Neniuj etendaĵoj ankoraŭ elŝutiĝis. **Rulu ĉiujn ceterajn instal-, sinkronig-, ĝisdatig- kaj forig-komandojn ene de ĉi tiu dosierujo:**

```sh
cd texpro-extensions
```

Se vi enigis alian celon, uzu tiun vojon anstataŭe. Citu la tutan vojon se ĝi enhavas spacojn. En Windows, ĉi tiuj komandoj povas ruliĝi en PowerShell.

## Uzi npm

### 1. Instalu la administran ilon kaj vian unuan etendaĵon

Ene de via nova etendaĵa dosierujo, rulu:

```sh
npm install --ignore-scripts
npm install --ignore-scripts --save-exact @texpro/extension-translate-zh-cn@1.0.0
npm run sync:extensions
```

La unua komando instalas la qwertysay-ilon de la dosierujo. La dua elŝutas la ĉinan pakaĵon kaj registras ĝian version. La tria transdonas la ŝanĝojn al TeXPro. La generita `.npmrc` malŝaltas instalajn skriptojn; ĉi tiuj komandoj ankaŭ eksplicite specifas `--ignore-scripts`.

Sinkronigo malfermas Etendaĵojn en TeXPro. Daŭrigu per Fini instaladon en TeXPro sube.

### 2. Ĝisdatigi etendaĵon

En la sama dosierujo, rulu:

```sh
npm install --ignore-scripts --save-exact @texpro/extension-translate-zh-cn@latest
npm run sync:extensions
```

Ĉi tio akiras la lastan publikigitan version de la aŭtoro. Anstataŭigu `latest` per publikigita versinombro por elekti specifan version. Ĉi tiuj ekzemploj konservas ekzaktajn versiojn, do ne atendu, ke `npm update` moviĝu preter la registrita versio. Sinkronigu kaj revizuu post ĝisdatigo.

### 3. Forigi etendaĵon

```sh
npm uninstall --ignore-scripts @texpro/extension-translate-zh-cn
npm run sync:extensions
```

La unua komando nur forigas la dependaĵon el ĉi tiu dosierujo. La dua listigas forigojn administratajn de ĉi tiu dosierujo en TeXPro. Alklaku Malinstali tie por forigi la kopion de la aplikaĵo. Etendaĵaj datumoj implicite konserviĝas.

## Uzi yarn

Unue rulu `yarn --version`. **Uzu la yarn 1-komandojn por 1.x, aŭ la yarn 2+-komandojn por versio 2 aŭ pli nova. Ne miksu iliajn ŝaltilojn.**

### yarn 1: instali, ĝisdatigi kaj forigi

Unua instalado:

```sh
yarn install --ignore-scripts
yarn add --ignore-scripts --exact @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

Ĝisdatigu al la lasta publikigita versio de la aŭtoro:

```sh
yarn add --ignore-scripts --exact @texpro/extension-translate-zh-cn@latest
yarn run sync:extensions
```

Forigi:

```sh
yarn remove --ignore-scripts @texpro/extension-translate-zh-cn
yarn run sync:extensions
```

Post ĉiu sinkronigo, konfirmu la instaladon, ĝisdatigon aŭ forigon en TeXPro. yarn 1 ne legas la skriptoŝaltilon de la pli nova agordo, do tenu `--ignore-scripts` en ĉi tiuj komandoj.

### yarn 2+: instali, ĝisdatigi kaj forigi

La generita `.yarnrc.yml` agordas `nodeLinker: node-modules` kaj `enableScripts: false`. Tenu ambaŭ agordojn. PnP ne subteniĝas ĉi tie. Pli novaj yarn-versioj ne uzas la ŝaltilon `--ignore-scripts` montritan supre.

Unua instalado:

```sh
yarn install
yarn add --exact @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

Ĝisdatigu:

```sh
yarn add --exact @texpro/extension-translate-zh-cn@latest
yarn run sync:extensions
```

Forigi:

```sh
yarn remove @texpro/extension-translate-zh-cn
yarn run sync:extensions
```

Konfirmo en TeXPro funkcias same kiel kun npm. yarn 1 estis testita per reala instalado kaj forigo. Aparte validigu vian specifan yarn 2+-version; kongrua agordo ne signifas, ke ĉiu versio estis testita.

## Fini instaladon en TeXPro

Kiam sinkronigo malfermas Etendaĵojn, trovu Revizii pakaĵadministrajn ŝanĝojn:

- Kontrolu la nomon, version, aŭtoron kaj petitajn kapablojn de ĉiu etendaĵo.
- Alklaku Instalo malŝaltita por ĉiu instalado aŭ ĝisdatigo, kiun vi volas.
- Elektu la instalitan etendaĵon en la maldekstra kolumno, revizuu ĝiajn detalojn, poste alklaku Ŝalti. Plenumebla kodo aŭ propraj stiloj postulas plian fidan konfirmon.
- Post ŝaltado de etosa pakaĵo, alklaku Apliki etoson en la etendaĵaj detaloj. Ŝalti lingvopakaĵon igas ĝin havebla en la lingva regilo.

Instalado kaj ĝisdatigoj neniam ŝaltas etendaĵon aŭtomate. Ĉiam, kiam vi ŝanĝas npm- aŭ yarn-dependaĵojn, rulu `sync:extensions` denove. La aplikaĵo ne observas ĉi tiun dosierujon fone.

### Kial la ĉina pakaĵo eble ne produktas novan instaladon

Simpligita ĉina jam venas kun TeXPro. Se la npm-pakaĵo enhavas la samajn datumojn kiel la enpakita kopio, sinkronigo ne instalos ĝin dufoje. Vi eble vidos La etendaĵa medio estas ĝisdata.; tio estas atendita. Trovu la ĉinan pakaĵon en Etendaĵoj kaj kontrolu, ke ĝi estas ŝaltita.

Vi ankoraŭ povas kontroli, ke la terminalo ja instalis la npm-pakaĵon:

```sh
npm ls @texpro/extension-translate-zh-cn
```

Por yarn, rulu:

```sh
yarn why @texpro/extension-translate-zh-cn
```

Se vi poste instalos ĉinan ĝisdatigon per ĉi tiu dosierujo, forigi la ĝisdatigon restarigos la malŝaltitan enpakitan kopion. Se necese, ŝaltu ĝin denove en Etendaĵoj. Forigi la npm-dependaĵon ne forigas la enpakitajn ĉinajn rimedojn.

## Instali alian kromaĵon aŭ etoson

Akiru la **ekzaktan npm-distribuan pakaĵan nomon kaj version** de la aŭtoro, poste anstataŭigu `@texpro/extension-translate-zh-cn@1.0.0` en la pli fruaj komandoj. Arbitra npm-pakaĵo ne estas TeXPro-etendaĵo. Aŭtoroj povas publikigi fontajn dosierujojn rekte, aŭ daŭre montrigi `texpro.package` al `.tpp`/`.tpt`. Fontaj pakaĵoj bezonas texpro.extension.json kaj LICENSE. `texpro.source` elektas dosierujon; ties manko elektas la npm-pakaĵan radikon. Ordinara npm-modulo ne estas TeXPro-etendaĵo.

Se la aŭtoro nur provizas dosieron `.tpp` aŭ `.tpt`, uzu Etendaĵoj → Instali pakaĵon… en TeXPro. Vi ne bezonas npm-medion por instali dosieron. Aŭtoroj povas trovi npm-distribuajn instrukciojn en la [qwertysay-gvidilo](/docs/qwertysay).

Etendaĵon povas administri unu medio. Ĉi tiu dosierujo ne povas transpreni permanan instaladon. Por migri unu, malinstalu la ekzistantan kopion de la aplikaĵo, poste sinkronigu el via etendaĵa dosierujo. Ekzistantaj etendaĵaj datumoj konserviĝas.

## Kiam npm-fonta pakaĵo bezonas kompiladon

Aŭtoroj povas publikigi fonton sen unue enmeti `.tpp` aŭ `.tpt`:

- **Preta uzi:** memstara rulebla `.cjs`/`.mjs`, staticaj kodpecetoj, lingva JSON, akcentaj ĵetonoj aŭ statika CSS. Instalu, poste sinkronigu. TeXPro kopias validigitajn dosierojn anstataŭ ŝargi ilin surloke el node_modules.
- **Bezonas kompiladon:** pakaĵo enhavanta qwertysay.build.json, inkluzive TypeScript-, CoffeeScript-, PureScript-, ReScript-, ClojureScript-, Elm-, Scala.js- aŭ GopherJS-kromaĵojn, kaj SCSS/Sass/Less/Stylus/CSS-in-JS/Thematic CSS-etosojn. Prepare ĝin eksplicite antaŭ sinkronigado. Arbitraj npm-konstruaj skriptoj ne ruliĝas aŭtomate.

> Rekta fontimporto kaj Prepare installed source postulas SDK 0.4.0, qwertysay 0.5.0 kaj la kongruan surtablan konstruon. Antaŭa qwertysay 0.4.1 nur subtenas enmetitajn etendaĵajn arkivojn. Ĝisdatigi la CLI ne ĝisdatigas la surtablan gastiganton.

Uzu la pli fruajn npm install- aŭ yarn add-komandojn kun la reala pakaĵa nomo kaj fiksita versio de la aŭtoro. Ene de via etendaĵa medio, lanĉu la instalitan asistanton:

```sh
npm exec -- qwertysay
```

Por yarn:

```sh
yarn qwertysay
```

Elektu **Prepare installed source** (`prepare`), tenu la mediodosierujon kiel `.`, kaj enigu la nomon de la instalita pakaĵo. Ekzemple, `@your-author/my-plugin` estas lokokupilo; anstataŭigu ĝin per reala pakaĵo.

Poste elektu la politikon por instalilo de kompililaj dependaĵoj. Tenu **Disable; stop on missing tools (default)** krom se vi reviziis kaj fidas tiujn dependaĵojn. Permesi ilin plenumas triapartan instalilan kodon.

**Antaŭ ol tajpi y, revizuu la aŭtoron, version, fonton kaj sekurecan avizon.** qwertysay kopias fonton al portempa dosierujo, instalas kompililajn dependaĵojn kaj rulas la ilĉenon. Dependaĵaj vivciklaj skriptoj implicite malŝaltiĝas; aparte permesi ilin ankaŭ plenumas kompililajn dependaĵajn instalilojn. Kompilado, CSS-in-JS-generatoroj kaj projekta agordo plenumas kodon kun viaj permesoj; portempa dosierujo ne estas sabla skatolo. Purigado ne povas inversigi eksterajn dosierajn aŭ retajn efikojn.

Post kiam la terminalo presas `Prepared`, sinkronigu:

```sh
npm run sync:extensions
```

Aŭ:

```sh
yarn run sync:extensions
```

Revizuu en TeXPro, elektu **Instalo malŝaltita**, kaj aparte decidu ĉu ŝalti. Neniu paŝo aŭtomate rajtigas la sekvan.

Mankantaj Java, sbt, Go, GopherJS, Elm, PureScript aŭ Thematic CSS-iloj kaŭzas fiaskon. Instalu kongruajn fidatajn ilĉenojn laŭ la instrukcioj de la aŭtoro. Iuj kompililoj postulas instalilajn skriptojn kaj eble ne funkcias kun tiuj malŝaltitaj; revizuu kaj instalu fidatajn ilojn aparte, aŭ eksplicite permesu kompililajn dependaĵajn skriptojn por ĉi tiu portempa konstruo en la asistanto. Ĉi tio ne ŝanĝas la agordojn de via etendaĵa medio. Ne ŝaltu skriptojn por la tuta etendaĵa medio nur por subpremi eraron. Aŭtoroj devas dokumenti kompililajn dependaĵojn kaj fiksadon. Fiksi nur la etendaĵon ne igas ĉiun kompililan dependaĵon ripetebla.

Post ĝisdatigo aŭ redaktado de fonto, prepare ĝin denove antaŭ sinkronigado. Fiaskinta aŭ eksvalidiĝinta konstruo rifuziĝas kaj lasas la instalitan aplikaĵan kopion senŝanĝa.

## Publikigi fonton kiel aŭtoro

Agordu package.json en la aŭtora projekto, ne en la etendaĵa medio de la uzanto. Preta-rula JavaScript-kromaĵo povas uzi:

```json
{
  "name": "@your-author/my-plugin",
  "version": "1.0.0",
  "license": "MIT",
  "files": ["extension/"],
  "texpro": { "source": "extension" },
  "publishConfig": { "access": "public" }
}
```

Metu texpro.extension.json, LICENSE kaj la deklaritajn plenumeblojn/rimedojn en extension/. Enpaku rulotempajn dependaĵojn en memstaran eniron, aŭ provizu relativajn modulojn ene de la pakaĵo. TeXPro ne kopias node_modules nek instalas dependaĵojn ĉe ŝaltado.

Por kompilita fonto, uzu qwertysay-ŝablonon kaj inkluzivu qwertysay.build.json, src, kompililan agordon, LICENSE kaj devDependencies en package.json. Ŝablonoj inkluzivas texpro.source kaj publikigan dosierliston. Antaŭ publikigado, elektu npm-nomon, kiun vi posedas, kongruigu la manifestan version kaj forigu private: true. La minimuma akcenta etoso ankoraŭ bezonas nur manifeston kaj LICENSE; npm-distribuo aldonas metadatumojn sen postuli CSS aŭ konstruon.

Inspektu la realan alŝutan enhavon por sekretoj, privataj dokumentoj kaj mankantaj fontoj:

```sh
npm pack --dry-run --ignore-scripts
npm pack --ignore-scripts
```

Instalu la realan tgz en freŝa etendaĵa medio kaj kontrolu prepare (se necese), sinkronigon, instaladon, ŝalton kaj malinstaladon. Nur kiam la aŭtoro intence publikigas, rulu `npm publish --access public --ignore-scripts`. Ĉi tio publikigas publikan kodon; npm-publikigado ne atestas la sekurecon de TeXPro-etendaĵo. Vidu [qwertysay](/docs/qwertysay) kaj la [SDK](/docs/extension-development).

## Solvado de problemoj

### sync:extensions ne troveblas

Kontrolu, ke la terminalo estas ene de via generita `texpro-extensions`-dosierujo, ne en ĝia gepatra aŭ en TeX-projekto. Ĝia package.json devas enhavi `scripts.sync:extensions`. Se qwertysay ne troveblas, plenumu la unuan instalan komandon por via elektita pakaĵadministrilo.

### Sinkronigo ne malfermas TeXPro

Unue kontrolu, ke la surtabla konstruo subtenas sinkronigon. macOS lanĉas la aplikaĵon laŭ ĝia TeXPro-nomo. Windows provas `Programs/TeXPro/TeXPro.exe` de la nuna uzanto; Linux serĉas la komandon `texpro`.

Por porteblaj konstruoj aŭ aliaj instalaj lokoj, agordu `TEXPRO_APP_PATH` al la reala **TeXPro-plenumeblo**, poste sinkronigu denove. Ekzemple, en Windows PowerShell:

```powershell
$env:TEXPRO_APP_PATH = "C:\Apps\TeXPro\TeXPro.exe"
npm run sync:extensions
```

En macOS/Linux-terminalo:

```sh
export TEXPRO_APP_PATH="/Applications/TeXPro.app/Contents/MacOS/TeXPro"
npm run sync:extensions
```

Anstataŭigu la ekzemplon per via reala vojo. En Linux, montru la plenumeblon `texpro` aŭ AppImage. Por yarn, anstataŭigu la lastan linion per `yarn run sync:extensions`. La CLI ankaŭ presas la lokan revizian planon kaj permanan lanĉkomandon.

### Lockfile, dependaĵo aŭ revizia plano rifuziĝas

npm-dosierujo devas havi nur package-lock.json; yarn-dosierujo devas havi nur yarn.lock. Se vi uzis la malĝustan ilon, decidu kiun agordon kaj ŝlosildosieron konservi, reinstalu dependaĵojn kaj sinkronigu denove. Ŝanĝi dependaĵojn dum revizio malfermita eksvalidigas la malnovan revizion; sinkronigu denove.

Ne forigu node_modules por peti forigon de ĉiu etendaĵo. Uzu malinstali/forigi kiel montrite supre, poste sinkronigu. Ĉiu ŝanĝo konfirmiĝas aparte; sukcesaj konfirmoj restas, se posta operacio fiaskas.

## Konservu la dosierujon kaj kontrolu, kiun vi fidas

Revenu al la sama etendaĵa dosierujo por estonta versiadministrado. Konservu package.json kaj ĝian ŝlosildosieron. Por restarigi ĝiajn dependaĵojn, uzu `npm ci --ignore-scripts`, `yarn install --frozen-lockfile --ignore-scripts` por yarn 1, aŭ `yarn install --immutable` por yarn 2+, poste sinkronigu.

Kun instalaj skriptoj malŝaltitaj, elŝuti pakaĵon ne aŭtomate ŝaltas ĝin. Ŝaltitaj Node-kromaĵoj ankoraŭ povas aliri viajn dosierojn, reton kaj procezojn. Etosoj povas ŝanĝi la interfacon, kaj lingvopakaĵoj povas enhavi misgvidajn instrukciojn. Ŝaltu nur fontojn, kiujn vi fidas. Legu [etendaĵan sekurecon](/docs/extensions); restaŭro haveblas per la fiksa-angla nacia komando Restarigi aspekton kaj malŝalti etendaĵojn aŭ `--safe-mode`.
