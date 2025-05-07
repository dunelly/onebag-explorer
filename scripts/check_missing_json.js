import fs from 'fs';
import path from 'path';

// Load backpack names
const backpackNames = JSON.parse(fs.readFileSync('backpack_names.json', 'utf8'));

// List all files in reddit_data
const redditDataDir = path.join('src', 'data', 'reddit_data');
const files = fs.readdirSync(redditDataDir);

// Helper: Normalize name to filename (same as in scrape script)
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[åäáàâã]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

const missing = [];
for (const name of backpackNames) {
  const expected = normalizeName(name) + '.json';
  if (!files.includes(expected)) {
    missing.push(name);
  }
}

console.log(`Missing JSON files for ${missing.length} backpacks:`);
missing.forEach(name => console.log('- ' + name)); 