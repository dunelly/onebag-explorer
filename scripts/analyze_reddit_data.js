import fs from 'fs/promises';
import path from 'path';
import natural from 'natural';
import { GoogleGenerativeAI } from "@google/generative-ai"; // Import Gemini AI SDK
import dotenv from 'dotenv';
import backpackData from '../src/data.js'; // Import main backpack data

dotenv.config();

const tokenizer = new natural.WordTokenizer();
const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

const redditDataDir = path.join(process.cwd(), 'src', 'data', 'reddit_data');
const analysisDir = path.join(process.cwd(), 'src', 'data', 'analysis');

// --- Helper Function to Sanitize Filenames ---
function sanitizeFilename(name) {
  if (!name) return '';
  // Convert to lowercase, replace accented characters, replace spaces and slashes with underscores, remove invalid chars
  const cleaned = name
    .toLowerCase()
    .normalize("NFD") // Separate accents from letters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[\s\\/]+/g, '_')     // Replace spaces and slashes with underscores
    .replace(/[^\w-]+/g, '');       // Remove remaining non-word characters (except hyphen)
  return cleaned.replace(/_+/g, '_'); // Collapse multiple underscores
}

// --- Initialize Gemini ---
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("GEMINI_API_KEY not found in .env file. Pros and Cons generation will be skipped.");
}
// Using 1.5 Flash as it's faster and cheaper for this kind of batch task
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

// --- Function to calculate Sentiment ---
async function getSentiment(text) {
  if (!text) return 0;
  const tokens = tokenizer.tokenize(text.toLowerCase());
  // Sentiment analysis returns a score indicating positivity/negativity
  return analyzer.getSentiment(tokens);
}

// --- Function to get Pros and Cons from Gemini ---
async function getProsConsFromGemini(brand, backpackModel) {
  if (!geminiModel) {
    console.log(`Skipping Gemini lookup for ${brand} ${backpackModel} (API key missing)`);
    return { pros: [], cons: [] }; // Return empty arrays if skipping
  }
  try {
    const prompt = `List the main pros and cons for the ${brand} ${backpackModel} backpack. Provide the response as a valid JSON object with two keys: "pros" (an array of strings) and "cons" (an array of strings). Example: { "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1", "Con 2"] }`;

    console.log(`Asking Gemini about: ${brand} ${backpackModel}...`);
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response text to extract JSON block if necessary
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```|({[\s\S]*})/);
    if (jsonMatch) {
      text = jsonMatch[1] || jsonMatch[2];
    }

    // Attempt to parse the cleaned text as JSON
    try {
      const parsedJson = JSON.parse(text);
      // Basic validation
      if (Array.isArray(parsedJson.pros) && Array.isArray(parsedJson.cons)) {
         console.log(` -> Received Pros/Cons for ${brand} ${backpackModel}`);
        return parsedJson;
      } else {
        console.error(` -> Error: Gemini response for ${brand} ${backpackModel} is not in the expected JSON format (missing pros/cons arrays). Response Text: ${text}`);
        return { pros: ["Error parsing response"], cons: ["Error parsing response"] };
      }
    } catch (parseError) {
      console.error(` -> Error parsing Gemini JSON response for ${brand} ${backpackModel}: ${parseError}\nRaw Response: ${text}`);
      return { pros: ["Error parsing response"], cons: ["Error parsing response"] };
    }
  } catch (error) {
    console.error(` -> Error fetching pros/cons from Gemini for ${brand} ${backpackModel}: ${error}`);
    return { pros: ["Error fetching data"], cons: ["Error fetching data"] };
  }
}

// --- Main Analysis function for a single backpack ---
async function analyzeBackpackData(backpack) {
  const brand = backpack.brand;
  const modelName = backpack.model;
  const backpackId = backpack.id;
  const backpackDisplayName = `${brand} ${modelName}`;

  if (!brand || !modelName || !backpackId) {
      console.warn(`Skipping backpack due to missing brand, model, or id. Data: ${JSON.stringify(backpack)}`);
      return; // Skip if essential data is missing
  }

  const baseFilename = sanitizeFilename(`${brand}_${modelName}`);
  const redditFilePath = path.join(redditDataDir, `${baseFilename}.json`);
  const analysisFilePath = path.join(analysisDir, `${baseFilename}.analysis.json`);

  let existingAnalysis = {}; // To hold data from existing analysis file
  let sentimentScore = 0;
  let numMentions = 0;
  let allRedditText = '';

  try {
    // 1. Read Existing Analysis File (if it exists)
    try {
        const existingContent = await fs.readFile(analysisFilePath, 'utf8');
        existingAnalysis = JSON.parse(existingContent);
        console.log(` -> Found existing analysis for ${backpackDisplayName}`);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(` -> Warning reading existing analysis file ${analysisFilePath}: ${error.message}`);
        }
        // File doesn't exist or is invalid, start fresh but log
        existingAnalysis = {};
    }

    // 2. Read Reddit Data (if exists) and calculate sentiment/mentions
    try {
      const fileContent = await fs.readFile(redditFilePath, 'utf8');
      const redditData = JSON.parse(fileContent);
      numMentions = redditData.discussions ? redditData.discussions.length : 0;

      if(redditData.discussions) {
          redditData.discussions.forEach(thread => {
            allRedditText += (thread.title || '') + ' ' + (thread.selftext || '') + ' ';
            (thread.comments || []).forEach(comment => {
              allRedditText += (comment.body || '') + ' ';
            });
          });
          sentimentScore = await getSentiment(allRedditText);
          console.log(` -> Calculated sentiment (${sentimentScore.toFixed(3)}) and mentions (${numMentions}) for ${backpackDisplayName}`);
      }

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(` -> Reddit data file not found at ${redditFilePath}. Sentiment/Mentions will be 0.`);
        } else {
            console.warn(` -> Warning reading reddit data file ${redditFilePath}: ${error.message}. Sentiment/Mentions will be 0.`);
        }
        sentimentScore = existingAnalysis.sentimentScore || 0; // Keep old score if read failed
        numMentions = existingAnalysis.numMentions || 0;
    }

    // 3. Get NEW Pros and Cons from Gemini
    const { pros, cons } = await getProsConsFromGemini(brand, modelName);

    // 4. Combine results and save (Overwrite Pros/Cons)
    const analysisResult = {
      backpack_name: existingAnalysis.backpack_name || backpackDisplayName, // Use existing name if available
      id: backpackId,
      pros: pros, // Use NEW pros from Gemini
      cons: cons, // Use NEW cons from Gemini
      sentimentScore: parseFloat(sentimentScore.toFixed(3)),
      numMentions: numMentions,
      last_analyzed: new Date().toISOString(),
    };

    await fs.mkdir(analysisDir, { recursive: true });
    await fs.writeFile(analysisFilePath, JSON.stringify(analysisResult, null, 2));
    console.log(` -> Analysis SAVED for ${backpackDisplayName} to ${analysisFilePath}`);

  } catch (error) {
    console.error(` ->>> CRITICAL Error processing ${backpackDisplayName} (ID: ${backpackId}): ${error}`);
  }
}

// --- Main Execution Function ---
async function main() {
  console.log("Starting API Key Test...");
  console.warn("Ensure GEMINI_API_KEY is set in .env.");
  console.log("This will process ONLY the first backpack in data.js to test the connection.");

  // Ensure analysis directory exists
  await fs.mkdir(analysisDir, { recursive: true });

  // --- API Key Test Logic ---
  if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set in the .env file. Test cannot proceed.");
    process.exit(1); // Exit with error code
  }

  if (backpackData.length === 0) {
    console.error("Error: backpackData (from src/data.js) is empty. Cannot run test.");
    process.exit(1);
  }

  const testBackpack = backpackData[0]; // Get the first backpack for testing
  console.log(`Attempting to analyze the first backpack: ${testBackpack.brand} ${testBackpack.model} (ID: ${testBackpack.id})...`);

  try {
      await analyzeBackpackData(testBackpack); // Call analysis for only the first backpack
      console.log("\nTest analyze function completed for the first backpack.");
      console.log("Check the logs above. If pros/cons were fetched without Gemini errors, the API key is likely working.");
      console.log("NOTE: This did NOT process all backpacks.");
  } catch(error) {
      console.error(`\nCRITICAL Error during test run: ${error}`);
      process.exit(1);
  }
  // --- End API Key Test Logic ---

  console.log("\nAPI Key test script finished.");
  process.exit(0); // Exit cleanly after the test

  /* --- Original Loop (Commented Out) ---
  // Iterate through backpacks defined in data.js
  console.log(`Processing ${backpackData.length} backpacks from src/data.js...`);
  for (const backpack of backpackData) {
        await analyzeBackpackData(backpack); // Call analysis for each
        // Optional: Add a small delay between API calls to avoid rate limiting
        // await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  }

  console.log("\nAnalysis process finished.");
  */
}

main(); 