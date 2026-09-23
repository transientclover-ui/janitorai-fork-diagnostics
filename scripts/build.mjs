import { readFileSync, writeFileSync } from 'node:fs';
const header = `// ==UserScript==
// @name         JanitorAI Fork Diagnostics
// @namespace    https://github.com/transientclover-ui/janitorai-fork-diagnostics
// @version      0.1.0
// @description  Private local fork history and conservative diagnostics
// @match        https://janitorai.com/*
// @match        https://www.janitorai.com/*
// @run-at       document-end
// @grant        none
// @license      MIT
// ==/UserScript==\n`;
writeFileSync('dist/janitorai-fork-diagnostics.user.js', header + readFileSync('src/core.js', 'utf8') + '\n' + readFileSync('src/app.js', 'utf8'));
