'use strict';
const SDK = '@gardenialiu/texpro-extension-sdk';
const binding = module => `const { defineTextTransform } = require('${SDK}');\nmodule.exports = defineTextTransform(require('${module}').transform);\n`;
const templates = {
  ts: { dependencies: { typescript: '5.9.3' }, files: {
    'src/index.cts': `import { defineTextTransform } from '${SDK}';\nexport const activate = defineTextTransform((text: string) => text.toUpperCase()).activate;\n`,
    'tsconfig.json': JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'Node16', moduleResolution: 'Node16', strict: true, rootDir: 'src', outDir: '.qwertysay/compiled', skipLibCheck: true }, include: ['src/**/*.cts'] }, null, 2) + '\n',
  } },
  js: { files: { 'src/index.cjs': `const { defineTextTransform } = require('${SDK}');\nmodule.exports = defineTextTransform(text => text.toUpperCase());\n` } },
  coffee: { dependencies: { coffeescript: '2.7.1' }, files: { 'src/index.coffee': `# Author logic is CoffeeScript; the SDK is bundled into the final entry.\n{ defineTextTransform } = require '${SDK}'\nmodule.exports = defineTextTransform (text) -> text.toUpperCase()\n` } },
  purs: { dependencies: { purescript: '0.15.16', spago: '1.0.5' }, files: {
    'src/Plugin.purs': 'module Plugin (transform) where\n\nimport Data.String (toUpper)\n\ntransform :: String -> String\ntransform = toUpper\n',
    'src/entry.cjs': binding('../output/Plugin/index.js'),
    'spago.yaml': 'package:\n  name: texpro-plugin\n  dependencies:\n    - strings\nworkspace:\n  packageSet:\n    registry: 77.10.1\n',
  } },
  rescript: { dependencies: { rescript: '12.3.1' }, files: {
    'src/Plugin.res': 'let transform = (text: string): string => text->String.toUpperCase\n',
    'src/entry.cjs': binding('./Plugin.res.js'),
    'rescript.json': JSON.stringify({ name: 'texpro-plugin', sources: ['src'], 'package-specs': [{ module: 'commonjs', 'in-source': true }], suffix: '.res.js' }, null, 2) + '\n',
  } },
  cljs: { dependencies: { 'shadow-cljs': '3.5.13' }, files: {
    'src/author/core.cljs': '(ns author.core)\n\n(defn transform [text]\n  (.toUpperCase text))\n',
    'src/entry.cjs': binding('../.qwertysay/compiled/author.cjs'),
    'shadow-cljs.edn': '{:source-paths ["src"]\n :builds {:plugin {:target :node-library\n                   :output-to ".qwertysay/compiled/author.cjs"\n                   :exports {:transform author.core/transform}}}}\n',
  } },
  scala: { files: {
    'src/main/scala/Plugin.scala': 'import scala.scalajs.js.annotation.JSExportTopLevel\n\nobject Plugin {\n  @JSExportTopLevel("transform")\n  def transform(text: String): String = text.toUpperCase()\n}\n',
    'src/entry.cjs': binding('../target/scala-2.13/texpro-plugin-fastopt/main.js'),
    'build.sbt': 'enablePlugins(ScalaJSPlugin)\nname := "texpro-plugin"\nscalaVersion := "2.13.17"\nscalaJSLinkerConfig ~= (_.withModuleKind(ModuleKind.CommonJSModule))\n',
    'project/plugins.sbt': 'addSbtPlugin("org.scala-js" % "sbt-scalajs" % "1.20.2")\n',
    'project/build.properties': 'sbt.version=1.11.7\n',
  } },
  go: { files: {
    'src/main.go': 'package main\n\nimport (\n  "strings"\n  "github.com/gopherjs/gopherjs/js"\n)\n\nfunc main() {\n  js.Module.Get("exports").Set("transform", func(text string) string { return strings.ToUpper(text) })\n}\n',
    'src/entry.cjs': binding('../.qwertysay/compiled/author.cjs'),
    'go.mod': 'module example.com/texpro-plugin\n\ngo 1.21\n\nrequire github.com/gopherjs/gopherjs v1.21.0\n',
  } },
  elm: { dependencies: { elm: '0.19.3-0' }, files: {
    'elm.json': JSON.stringify({ type: 'application', 'source-directories': ['src'], 'elm-version': '0.19.3', dependencies: { direct: { 'elm/core': '1.0.5', 'elm/json': '1.1.3' }, indirect: {} }, 'test-dependencies': { direct: {}, indirect: {} } }, null, 2) + '\n',
    'src/entry.cjs': `const { defineJsonExtension } = require('${SDK}');\nconst { Elm } = require('../.qwertysay/compiled/author.js');\nmodule.exports = defineJsonExtension({ actions: ['uppercase'], start(receive) {\n  const app = Elm.Plugin.init();\n  app.ports.responses.subscribe(receive);\n  return { send: message => app.ports.requests.send(message), dispose: () => app.ports.responses.unsubscribe(receive) };\n} });\n`,
    'src/Plugin.elm': `port module Plugin exposing (main)

import Json.Decode as D
import Json.Encode as E
import Platform

port requests : (String -> msg) -> Sub msg
port responses : String -> Cmd msg

type Msg = Request String

main : Program () () Msg
main =
    Platform.worker
        { init = \\_ -> ( (), Cmd.none )
        , update = update
        , subscriptions = \\_ -> requests Request
        }

update : Msg -> () -> ( (), Cmd Msg )
update (Request raw) model =
    let
        decoder =
            D.map5 (\\kind id source from to -> { kind = kind, id = id, source = source, from = from, to = to })
                (D.field "type" D.string)
                (D.field "id" D.int)
                (D.at [ "context", "source" ] D.string)
                (D.at [ "context", "selection", "from" ] D.int)
                (D.at [ "context", "selection", "to" ] D.int)
    in
    case D.decodeString decoder raw of
        Ok request ->
            let
                result =
                    E.object
                        [ ( "edits", E.list identity [ E.object [ ( "from", E.int request.from ), ( "to", E.int request.to ), ( "insert", E.string (String.toUpper (String.slice request.from request.to request.source)) ) ] ] ) ]
            in
            ( model, responses (E.encode 0 (E.object [ ( "type", E.string "result" ), ( "id", E.int request.id ), ( "result", result ) ])) )

        _ ->
            ( model, Cmd.none )
`,
  } },
};
module.exports = { templates };
