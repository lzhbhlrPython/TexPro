'use strict';
const { loadProjectWriting } = require('./writing-context-core.mjs');
const { readWritingSource } = require('./writing-source.cjs');

function projectFiles(tree) {
  return tree.flatMap(node => node.type === 'file' ? [node.path] : projectFiles(node.children || []));
}

/** Disk-only adapter. The renderer supplies its own reader for unsaved buffers. */
async function loadDiskWritingContext(project) {
  if (!project.rootFile) throw new Error(project.rootError || 'Choose a project main file');
  return loadProjectWriting(project.rootFile, projectFiles(project.tree), async file => readWritingSource(project.root, file), project.root);
}
module.exports = { loadDiskWritingContext };
