#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw || '{}');
    const cmd = (evt.tool_input && evt.tool_input.command) || '';
    if (!/\bgit\s+push\b/.test(cmd)) return process.exit(0);
    const marker = path.join('.claude', '.preflight-ok');
    if (!fs.existsSync(marker)) {
      console.error('git push blocked: run /preflight first (type-check + lint + tests).');
      process.exit(2);
    }
    const ageMs = Date.now() - fs.statSync(marker).mtimeMs;
    const maxAge = 30 * 60 * 1000;
    if (ageMs > maxAge) {
      console.error(`git push blocked: preflight is stale (${Math.round(ageMs/60000)} min old). Re-run /preflight.`);
      process.exit(2);
    }
  } catch (e) {}
  process.exit(0);
});
