const fs = require('fs');

const content = fs.readFileSync('type-check-full.txt', 'utf8');
const lines = content.split('\n');
const errors = lines.filter(l => l.includes('error TS'));

console.log('Total TypeScript errors:', errors.length);

const byFile = {};
errors.forEach(line => {
  const match = line.match(/^([^(]+)\(/);
  if (match) {
    const file = match[1];
    byFile[file] = (byFile[file] || 0) + 1;
  }
});

const sorted = Object.entries(byFile).sort((a,b) => b[1] - a[1]);
console.log('\nTop 15 files by error count:');
sorted.slice(0, 15).forEach(([file, count]) => {
  console.log(`  ${count.toString().padStart(3)} - ${file}`);
});
