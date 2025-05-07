import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Determine __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assuming data.js is in src and exports the array as default or named 'backpacksData'
// Node.js can often interoperate with CommonJS default exports like module.exports = ...
import backpacksData from '../src/data.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const reviewsDir = path.join(__dirname, '..', 'src', 'data', 'external_reviews');

function generateSearchQueries(brand, model) {
  const searchTerm = `${brand} ${model} review`;
  console.log(`\n--- Suggested Search Links for ${brand} ${model} ---`);
  console.log(`Google: https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`);
  console.log(`YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`);
  console.log(`Pack Hacker: https://packhacker.com/search/${encodeURIComponent(brand + ' ' + model)}/`);
  console.log(`OutdoorGearLab: (Search directly on site)`);
  console.log(`Carryology: (Search directly on site)`);
  console.log(`--------------------------------------------------\n`);
}

async function getReviewDetails(index) {
  return new Promise((resolve) => {
    console.log(`\n--- Enter details for Review #${index + 1} ---`);
    rl.question('Source (e.g., Pack Hacker, YouTube): ', (source) => {
      rl.question('Title of the review: ', (title) => {
        rl.question('Full URL: ', (url) => {
          if (source && title && url) {
            resolve({ source, title, url });
          } else {
            console.log('Skipping this review due to missing information.');
            resolve(null);
          }
        });
      });
    });
  });
}

async function collectReviews() {
  const collectedReviews = [];
  for (let i = 0; i < 5; i++) { // Aim for up to 5 reviews
    const review = await getReviewDetails(i);
    if (review) {
      collectedReviews.push(review);
    }
    if (i < 4) { // Don't ask after the 5th potential review
      await new Promise(resolveLoop => {
        rl.question('Add another review for this backpack? (y/n): ', (answer) => {
          if (answer.toLowerCase() !== 'y') {
            resolveLoop();
            i = 5;
          } else {
            resolveLoop();
          }
        });
      });
    }
  }
  return collectedReviews;
}

function saveReviewsToFile(backpackId, reviewsArray) {
  if (!fs.existsSync(reviewsDir)) {
    fs.mkdirSync(reviewsDir, { recursive: true });
  }
  const filePath = path.join(reviewsDir, `${backpackId}.reviews.json`);
  const jsonData = JSON.stringify({ reviews: reviewsArray }, null, 2); // Pretty print JSON
  fs.writeFileSync(filePath, jsonData);
  console.log(`\nSuccessfully saved reviews for ${backpackId} to ${filePath}`);
}

async function main() {
  if (!Array.isArray(backpacksData) || backpacksData.length === 0) {
    console.error('Error: backpacksData could not be loaded, is not an array, or is empty. Check src/data.js');
    rl.close();
    return;
  }

  console.log(`Found ${backpacksData.length} backpacks to process.`);

  for (const backpack of backpacksData) {
    if (!backpack || !backpack.id || !backpack.brand || !(backpack.name || backpack.model)) {
      console.warn('Skipping an invalid backpack entry in data.js:', backpack);
      continue;
    }
    const continueProcessing = await processBackpack(backpack);
    if (!continueProcessing) {
      console.log('User chose to stop processing backpacks.');
      break; // Exit the loop if user chooses to stop
    }
    // Optional: Add a small delay or a prompt to continue to the next backpack
    // await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\nAll backpacks processed.');
  rl.close();
}

async function processBackpack(backpack) {
  console.log(`\n--------------------------------------------------`);
  console.log(`Processing: ${backpack.brand} ${backpack.model || backpack.name} (ID: ${backpack.id})`);
  console.log(`--------------------------------------------------`);
  const reviewFilePath = path.join(reviewsDir, `${backpack.id}.reviews.json`);
  let overwrite = true; // Default to overwrite or proceed if file doesn't exist

  if (fs.existsSync(reviewFilePath)) {
    overwrite = await new Promise(resolveOverwrite => {
      rl.question(`Review file for ${backpack.id} already exists. Overwrite? (y/n, or 's' to stop all): `, (answer) => {
        if (answer.toLowerCase() === 's') {
          resolveOverwrite('stop');
        } else {
          resolveOverwrite(answer.toLowerCase() === 'y');
        }
      });
    });
  }

  if (overwrite === 'stop') {
    return false; // Signal to stop processing all backpacks
  }

  if (!overwrite) {
    console.log('Skipping this backpack as per user choice.');
    return true; // Continue to the next backpack
  }

  generateSearchQueries(backpack.brand, backpack.model || backpack.name);
  const newReviews = await collectReviews();
  
  if (newReviews.length > 0) {
    saveReviewsToFile(backpack.id, newReviews);
  } else {
    console.log('\nNo reviews were added for this backpack.');
  }
  return true; // Continue to the next backpack
}

main(); 