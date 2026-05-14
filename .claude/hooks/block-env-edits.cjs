#!/usr/bin/env node
let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  try {
    const evt = JSON.parse(raw || '{}');
    const fp = (evt.tool_input && (evt.tool_input.file_path || evt.tool_input.path)) || '';
    const name = fp.replace(/\\/g, '/').split('/').pop() || '';
    if (/^\.env(\..+)?(\.bak)?$/i.test(name) || /\.env\b/i.test(name)) {
      console.error(`Refusing to write ${fp}: .env* files may contain secrets. Edit manually if intended.`);
      process.exit(2);
    }
  } catch (e) {}
  process.exit(0);
});
