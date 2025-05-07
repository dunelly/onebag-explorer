import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your Excel file
const excelFile = path.join(__dirname, 'packlist.xlsx');
// Path to output JS file
const outputFile = path.join(__dirname, 'src', 'data.js');

// Read existing data.js if it exists
let existingData = [];
if (fs.existsSync(outputFile)) {
  try {
    const fileContent = fs.readFileSync(outputFile, 'utf8');
    // Extract the array from the "export default" statement
    const arrayContent = fileContent.replace('export default ', '').replace(/;?\s*$/, '');
    existingData = JSON.parse(arrayContent);
    console.log(`Found ${existingData.length} existing backpacks in data.js`);
  } catch (error) {
    console.error('Error reading existing data.js:', error);
  }
}

// Read the Excel file
const workbook = XLSX.readFile(excelFile);
const sheetName = workbook.SheetNames[0];
const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Convert Excel data to our format
const newBackpacks = excelData.map((item) => ({
  id: item["Model"]?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '',
  name: item["Model"] || '',
  brand: item["Brand"] || '',
  model: item["Model"] || '',
  volume: item["Volume (L)"] || null,
  weight: item["Weight (kg)"] || null,
  dimensions: item["Dimensions (cm)"] || '',
  price: item["Price (USD)"] || null,
  carryOnLegal: item["Carry-on Legal"] || '',
  laptopCompartment: item["Laptop Compartment"] || '',
  waterBottleCompartment: item["Water Bottle Compartment"] || '',
  source: item["Source"] || '',
  openingStyle: item["Opening Style"] || '',
}));

// Combine existing and new data
const combinedData = [...existingData, ...newBackpacks];

// Remove duplicates based on ID
const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values());

// Sort by brand and then model
uniqueData.sort((a, b) => {
  const brandCompare = a.brand.localeCompare(b.brand);
  if (brandCompare !== 0) return brandCompare;
  return a.model.localeCompare(b.model);
});

// Write to data.js
const jsContent = `export default ${JSON.stringify(uniqueData, null, 2)};\n`;
fs.writeFileSync(outputFile, jsContent);

console.log(`Merged ${newBackpacks.length} new backpacks with ${existingData.length} existing backpacks.`);
console.log(`Final data.js contains ${uniqueData.length} unique backpacks.`);