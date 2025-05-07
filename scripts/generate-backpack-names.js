import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import backpacksData from '../src/data.js';

// Determine __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map to full backpack names (brand + model) only
const backpackNames = backpacksData.map(({ brand, model }) => `${brand} ${model}`);

// Write to JSON file in src/data
const outputDir = path.join(__dirname, '..', 'src', 'data');
const outputPath = path.join(outputDir, 'backpack_names.json');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(backpackNames, null, 2));
console.log(`Generated ${backpackNames.length} backpack names to ${outputPath}`); 