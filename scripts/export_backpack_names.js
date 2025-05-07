import fs from 'fs/promises';
import path from 'path';

async function exportBackpackNames() {
  try {
    const dataContent = await fs.readFile(path.join('src', 'data.js'), 'utf8');
    const lines = dataContent.split('\n');
    const backpacks = [];
    let currentBackpack = {};
    
    for (const line of lines) {
      if (line.includes('"brand":')) {
        currentBackpack.brand = line.split(':')[1].trim().replace(/[",]/g, '');
      }
      if (line.includes('"model":')) {
        currentBackpack.model = line.split(':')[1].trim().replace(/[",]/g, '');
        if (currentBackpack.brand && currentBackpack.model) {
          backpacks.push(`${currentBackpack.brand} ${currentBackpack.model}`);
          currentBackpack = {};
        }
      }
    }
    
    // Write to a temporary file
    await fs.writeFile('backpack_names.json', JSON.stringify(backpacks, null, 2));
    console.log(`Exported ${backpacks.length} backpack names to backpack_names.json`);
  } catch (error) {
    console.error('Error:', error);
  }
}

exportBackpackNames(); 