import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tex = require('../electron/services/tex.cjs');
// Exercise the same preview service used by the editor. Every fixture must produce
// a real PDF; no fallback image or mocked compiler can satisfy this check.
const examples = [
  ['tikz', '', String.raw`\begin{tikzpicture}\draw (0,0)--(2,0)--(1,1.5)--cycle;\end{tikzpicture}`],
  ['tkz-euclide', String.raw`\usepackage{tkz-euclide}`, String.raw`\begin{tikzpicture}\tkzDefPoints{0/0/A,2/0/B,1/1.5/C}\tkzDrawPolygon(A,B,C)\tkzLabelPoints(A,B,C)\end{tikzpicture}`],
  ['tikz-3dplot', String.raw`\usepackage{tikz}\usepackage{tikz-3dplot}\tdplotsetmaincoords{65}{110}`, String.raw`\begin{tikzpicture}[tdplot_main_coords]\draw[->](0,0,0)--(2,0,0);\draw (0,0,0)--(0,2,0)--(0,0,2)--cycle;\end{tikzpicture}`],
  ['pict2e', String.raw`\usepackage{pict2e}`, String.raw`\begin{picture}(90,60)\polygon(0,0)(80,0)(30,55)\end{picture}`],
  ['pgfplots', '', String.raw`\begin{axis}[width=6cm,height=4cm]\addplot{x^2};\end{axis}`],
  ['pgfplots-3d', '', String.raw`\begin{axis}[width=6cm,height=5cm]\addplot3[surf,samples=5]{x*y};\end{axis}`],
  ['circuitikz', '', String.raw`\begin{circuitikz}\draw(0,0) to[R=$R$] (2,0);\end{circuitikz}`],
  ['chemfig', '', String.raw`\chemfig{*6(=-=-=-)}`],
  ['forest', '', String.raw`\begin{forest}[A [B] [C]]\end{forest}`],
  ['tikz-cd', '', String.raw`\begin{tikzcd}A \arrow[r] \arrow[d] & B \arrow[d] \\ C \arrow[r] & D\end{tikzcd}`],
  ['quantikz', '', String.raw`\begin{quantikz}\lstick{$0$} & \gate{H} & \ctrl{1} & \qw \\ \lstick{$0$} & \qw & \targ{} & \qw\end{quantikz}`],
  ['xy', '', String.raw`\xymatrix@R=2em{A \ar[r] & B}`],
  ['qcircuit', '', String.raw`\Qcircuit @C=1em @R=.7em {& \gate{H} & \ctrl{1} & \qw \\ & \qw & \targ & \qw}`],
  ['qtree', '', String.raw`\Tree [.S [.NP A ] [.VP B ] ]`],
  ['tikz-qtree', String.raw`\usepackage{tikz-qtree}`, String.raw`\Tree [.S [.NP A ] [.VP B ] ]`],
  ['bussproofs', '', String.raw`\begin{prooftree}\AxiomC{$A$}\UnaryInfC{$B$}\end{prooftree}`],
  ['ebproof', String.raw`\usepackage{ebproof}`, String.raw`\begin{prooftree}\hypo{A}\infer1{B}\end{prooftree}`],
  ['logicproof', '', String.raw`\begin{logicproof}{1}p & premise \\ p & reiteration\end{logicproof}`],
  ['smartdiagram', '', String.raw`\smartdiagram[flow diagram:horizontal]{A,B,C}`],
  ['venndiagram', '', String.raw`\begin{venndiagram2sets}\fillA\end{venndiagram2sets}`],
  ['pgfgantt', '', String.raw`\begin{ganttchart}{1}{3}\ganttbar{Task}{1}{2}\end{ganttchart}`],
  ['pst-eucl', String.raw`\usepackage{pst-eucl}`, String.raw`\begin{pspicture}(-1,-1)(3,3)\pstTriangle(0,0){A}(2,0){B}(1,2){C}\end{pspicture}`],
  ['pst-3dplot', String.raw`\usepackage{pst-3dplot}`, String.raw`\begin{pspicture}(-2,-2)(3,3)\pstThreeDCoor[xMax=2,yMax=2,zMax=2]\end{pspicture}`],
  ['pstricks', '', String.raw`\begin{pspicture}(0,0)(2,2)\psline(0,0)(2,0)(1,2)(0,0)\end{pspicture}`],
  ['lua-graphdrawing', String.raw`% !TEX program = lualatex
\usepackage{tikz}\usetikzlibrary{graphs,graphdrawing}\usegdlibrary{trees}`, String.raw`\begin{tikzpicture}\graph[tree layout]{a -> {b,c}};\end{tikzpicture}`],
  ['tikz-feynman', '', String.raw`\feynmandiagram[horizontal=a to b]{a -- [fermion] b};`],
];
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'texpro-geometry-'));
const failures = [];
try {
  for (const [name, preamble, source] of examples) {
    await fs.writeFile(path.join(root, 'main.tex'), `\\documentclass{article}\n${preamble}\n\\begin{document}\n${source}\n\\end{document}`);
    const result = await tex.renderTikz({ projectRoot: root, source, preferPdf: true });
    if (result.ok && !result.fallback && result.pdfPath && (await fs.stat(result.pdfPath)).size > 500) console.log(`PASS ${name} (${result.engine})`);
    else { failures.push(name); console.error(`FAIL ${name}: ${result.error}\n${result.log?.slice(-1800) || ''}`); }
  }
} finally { await fs.rm(root, { recursive: true, force: true }); }
if (failures.length) { console.error(`Failed: ${failures.join(', ')}`); process.exitCode = 1; }
