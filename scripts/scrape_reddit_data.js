import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import axios from 'axios';
import dotenv from 'dotenv';
import allBackpacksData from '../src/data.js'; // Import the main data

dotenv.config();

const customsearch = google.customsearch('v1');

// You'll need to provide these:
const API_KEY = 'AIzaSyBXwI3DAFtYVfjXApNulbw95LdUsS0OSUo';
const SEARCH_ENGINE_ID = '57b233d24008b4236';

// Helper: Retry logic for async functions
async function withRetries(fn, args = [], maxRetries = 3, delayMs = 2000, context = '') {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(`[Retry] Attempt ${attempt + 1} failed for ${context}:`, err.message);
      if (attempt === maxRetries - 1) throw err;
      await new Promise(res => setTimeout(res, delayMs));
      attempt++;
    }
  }
}

async function getRedditThreadContent(threadUrl) {
  try {
    const apiUrl = threadUrl.replace('www.reddit.com', 'api.reddit.com').replace(/\/$/, '') + '.json';
    let response;
    let attempts = 0;
    while (attempts < 5) {
      response = await fetch(apiUrl);
      if (response.status === 429) {
        console.warn(`[RATE LIMIT] 429 Too Many Requests from Reddit API for ${apiUrl}. Pausing for 1 minute before retrying...`);
        await new Promise(res => setTimeout(res, 60000));
        attempts++;
        continue;
      }
      break;
    }
    if (!response.ok) {
      // (3) Handle non-200 responses
      console.error(`[API Error] Non-200 response for ${apiUrl}:`, response.status, response.statusText);
      return { title: 'Title unavailable', selftext: '', author: 'Unknown', score: 0, numComments: 0, created: 0, comments: [], images: [] };
    }
    let data;
    try {
      // Check Content-Type header and response text for HTML
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      if (!contentType || !contentType.includes('application/json') || text.trim().startsWith('<')) {
        console.warn(`[HTML Error] Non-JSON response for ${apiUrl}. Skipping. Content-Type: ${contentType}`);
        return { title: 'Title unavailable', selftext: '', author: 'Unknown', score: 0, numComments: 0, created: 0, comments: [], images: [] };
      }
      data = JSON.parse(text);
    } catch (jsonErr) {
      // (2) Handle invalid JSON
      console.error(`[JSON Error] Invalid JSON for ${apiUrl}:`, jsonErr.message);
      return { title: 'Title unavailable', selftext: '', author: 'Unknown', score: 0, numComments: 0, created: 0, comments: [], images: [] };
    }
    // (1) Validate response structure
    if (!Array.isArray(data) || !data[0]?.data?.children?.[0]?.data) {
      console.error(`[Structure Error] Unexpected API response for ${apiUrl}:`, JSON.stringify(data).slice(0, 500));
      return { title: 'Title unavailable', selftext: '', author: 'Unknown', score: 0, numComments: 0, created: 0, comments: [], images: [] };
    }
    const threadData = data[0].data.children[0].data;
    
    // Function to normalize image URLs
    const normalizeImageUrl = (url) => {
      if (!url) return null;
      // Remove query parameters and fragments
      url = url.split('?')[0].split('#')[0];
      // Remove common size indicators
      url = url.replace(/(_|\-)(\d+x\d+)(\.(jpg|png|jpeg|gif|webp))$/, '$3');
      // Normalize domain
      url = url.replace('preview.redd.it', 'i.redd.it');
      return url;
    };

    // Only allow preview.redd.it links or standard image extensions, and never add reddit.com/gallery URLs
    const isDirectImageUrl = (url) => {
      if (!url) return false;
      if (url.includes('reddit.com/gallery')) return false;
      if (url.includes('preview.redd.it')) return true;
      return url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    };

    let images = new Set();
    let normalizedUrls = new Set();

    const addImageIfUnique = (url) => {
      if (!url) return;
      if (!url.includes('preview.redd.it')) return; // Only allow preview.redd.it
      const normalized = url.split('?')[0].split('#')[0];
      if (normalizedUrls.has(normalized)) return;
      normalizedUrls.add(normalized);
      images.add(url);
    };

    // Check for direct image uploads
    if (threadData.url && isDirectImageUrl(threadData.url)) {
      addImageIfUnique(threadData.url);
    }
    // Check for Reddit gallery
    if (threadData.gallery_data && threadData.media_metadata) {
      Object.values(threadData.media_metadata)
        .filter(item => item.status === 'valid')
        .forEach(item => {
          if (item.s && item.s.u) {
            addImageIfUnique(item.s.u.replace(/&amp;/g, '&'));
          }
        });
    }
    // Use the largest preview image
    if (threadData.preview && threadData.preview.images) {
      threadData.preview.images.forEach(img => {
        if (img.resolutions && img.resolutions.length > 0) {
          // Pick the largest size (last index)
          const idx = img.resolutions.length - 1;
          addImageIfUnique(img.resolutions[idx].url.replace(/&amp;/g, '&'));
        } else if (img.source && img.source.url) {
          addImageIfUnique(img.source.url.replace(/&amp;/g, '&'));
        }
      });
    }

    const comments = data[1].data.children
      .filter(child => child.kind === 't1')
      .map(child => child.data)
      .filter(comment => !comment.stickied)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(comment => ({
        author: comment.author,
        body: comment.body,
        score: comment.score,
        created: comment.created_utc,
        replies: comment.replies ? 
          comment.replies.data.children
            .filter(reply => reply.kind === 't1')
            .map(reply => reply.data)
            .filter(reply => !reply.stickied)
            .sort((a, b) => b.score - a.score)
            .slice(0, 2)
            .map(reply => ({
              author: reply.author,
              body: reply.body,
              score: reply.score,
              created: reply.created_utc
            }))
          : []
      }));
    
    return {
      title: threadData.title,
      selftext: threadData.selftext,
      author: threadData.author,
      score: threadData.score,
      numComments: threadData.num_comments,
      created: threadData.created_utc,
      comments: comments,
      images: Array.from(images)
    };
  } catch (error) {
    // (4) Log problematic URLs and errors
    console.error(`[Fetch Error] Error fetching thread content for ${threadUrl}:`, error.message);
    return {
      title: 'Title unavailable',
      selftext: '',
      author: 'Unknown',
      score: 0,
      numComments: 0,
      created: 0,
      comments: [],
      images: []
    };
  }
}

async function searchRedditPosts(backpackName) {
  try {
    const allImages = [];
    
    // Make multiple paginated calls to get up to 50 results
    for (let start = 1; start <= 41; start += 10) {
      // (5) Use retry logic for Google API
      let response;
      let attempts = 0;
      while (attempts < 5) {
        try {
          response = await withRetries(() => customsearch.cse.list({
            auth: API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: `site:reddit.com ${backpackName}`,
            num: 10,
            start,
            searchType: 'image',
            safe: 'active'
          }), [], 3, 2000, `Google CSE for ${backpackName} (start=${start})`);
          if (response.status === 429) {
            console.warn(`[RATE LIMIT] 429 Too Many Requests from Google API for ${backpackName} (start=${start}). Pausing for 1 minute before retrying...`);
            await new Promise(res => setTimeout(res, 60000));
            attempts++;
            continue;
          }
          break;
        } catch (err) {
          console.error(`[Google API Error] Failed after retries for ${backpackName} (start=${start}):`, err.message);
          break;
        }
      }
      if (!response || response.status === 429) continue;
      
      if (response.data.items) {
        allImages.push(...response.data.items);
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Found ${allImages.length} total images`);

    // Group images by thread URL
    const threadMap = new Map();
    
    // Process each image and fetch thread data
    for (const item of allImages) {
      const threadUrl = item.image.contextLink;
      
      if (!threadUrl.includes('reddit.com')) {
        continue;
      }

      // Initialize thread data if not exists
      if (!threadMap.has(threadUrl)) {
        // (5) Use retry logic for Reddit thread fetch
        let threadData;
        try {
          threadData = await withRetries(getRedditThreadContent, [threadUrl], 3, 2000, threadUrl);
        } catch (err) {
          console.error(`[Thread Fetch Error] Failed after retries for ${threadUrl}:`, err.message);
          continue;
        }
        
        threadMap.set(threadUrl, {
          title: threadData.title,
          url: threadUrl,
          selftext: threadData.selftext,
          author: threadData.author,
          score: threadData.score,
          numComments: threadData.numComments,
          created: threadData.created,
          comments: threadData.comments,
          images: threadData.images // Store all images from the thread
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Convert to array and sort by number of images (most images first)
    const threads = Array.from(threadMap.values())
      .sort((a, b) => b.images.length - a.images.length);

    console.log(`Found ${threads.length} unique Reddit threads`);
    threads.forEach(thread => {
      console.log(`- ${thread.title}: ${thread.images.length} images`);
    });

    // Create imageThreads array with all images from all threads
    const imageThreads = [];
    threads.forEach(thread => {
      imageThreads.push({
        thread: {
          title: thread.title,
          url: thread.url,
          selftext: thread.selftext,
          author: thread.author,
          score: thread.score,
          numComments: thread.numComments,
          created: thread.created,
          comments: thread.comments
        },
        images: thread.images
      });
    });

    console.log(`Organized ${imageThreads.length} total images:`);
    console.log(`- ${threads.length} unique threads`);
    console.log(`- ${imageThreads.length} total images`);

    return imageThreads;
  } catch (error) {
    console.error('Error searching images:', error.message);
    return [];
  }
}

async function jsonFileExists(backpackName) {
  // Handle special characters
  const normalizedName = backpackName
    .toLowerCase()
    .replace(/[åäáàâã]/g, 'a')  // Replace Nordic/accented 'a' with 'a'
    .replace(/[éèêë]/g, 'e')    // Replace accented 'e' with 'e'
    .replace(/[íìîï]/g, 'i')    // Replace accented 'i' with 'i'
    .replace(/[óòôõö]/g, 'o')   // Replace accented 'o' with 'o'
    .replace(/[úùûü]/g, 'u')    // Replace accented 'u' with 'u'
    .replace(/[^a-z0-9]/g, '_') // Replace all other non-alphanumeric chars with underscore
    .replace(/_+/g, '_')        // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, '');     // Remove leading/trailing underscores

  const filename = `${normalizedName}.json`;
  const filePath = path.join('src', 'data', 'reddit_data', filename);
  console.log(`Checking if file exists: ${filePath}`);
  try {
    await fs.access(filePath);
    console.log(`File exists: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`File does not exist: ${filePath}`);
    return false;
  }
}

// Helper function to sanitize brand/model for filename
const sanitizeForFilename = (str) => {
  if (!str) return '';
  return str.toLowerCase()
            .replace(/\s+/g, '_')    // Replace spaces with underscores
            .replace(/[.'']/g, '')   // Remove periods, apostrophes, etc.
            .replace(/[/\?%*:|\"<>]/g, ''); // Remove other invalid chars
};

async function scrapeBackpackData(backpackName, backpackId) {
  try {
    // Find the backpack data entry to get brand and model
    const backpack = allBackpacksData.find(b => b.id === backpackId);
    if (!backpack) {
      console.error(`Error: Backpack with ID '${backpackId}' not found in data.js. Skipping.`);
      return; // Skip if not found
    }

    const imageThreads = await searchRedditPosts(backpackName);

    const uniqueThreads = new Map(); // Map<threadUrl, { title, selftext, author, score, numComments, created, comments, images: Set<string> }>

    for (const thread of imageThreads) {
      const threadUrl = thread.thread.url;
      if (!threadUrl.includes('reddit.com')) {
        continue;
      }

      // Initialize thread data if not exists
      if (!uniqueThreads.has(threadUrl)) {
        // (5) Use retry logic for Reddit thread fetch
        let threadData;
        try {
          threadData = await withRetries(getRedditThreadContent, [threadUrl], 3, 2000, threadUrl);
        } catch (err) {
          console.error(`[Thread Fetch Error] Failed after retries for ${threadUrl}:`, err.message);
          continue;
        }
        
        uniqueThreads.set(threadUrl, {
          title: threadData.title,
          url: threadUrl,
          selftext: threadData.selftext,
          author: threadData.author,
          score: threadData.score,
          numComments: threadData.numComments,
          created: threadData.created,
          comments: threadData.comments,
          images: new Set(threadData.images)
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Add images to existing thread
        threadData.images.forEach(image => uniqueThreads.get(threadUrl).images.add(image));
      }
    }

    // Modified structure (like Freerain):
    const outputData = {
      name: backpackName,
      imageThreads: []
    };

    // Populate imageThreads in the old format (one entry per image)
    for (const [url, thread] of uniqueThreads.entries()) {
      // Skip if no images
      if (thread.images.size === 0) continue;
      
      // Create a thread info object that's common for all images
      const threadInfo = {
        title: thread.title,
        url: url,
        selftext: thread.selftext,
        author: thread.author,
        score: thread.score,
        numComments: thread.numComments,
        created: thread.created,
        comments: thread.comments
      };
      
      // For each image, create a separate entry in imageThreads
      Array.from(thread.images).forEach(image => {
        outputData.imageThreads.push({
          image: image,
          thread: threadInfo
        });
      });
    }

    console.log(`Organized ${outputData.imageThreads.length} total images:`);
    console.log(`- ${uniqueThreads.size} unique threads`);
    console.log(`- ${outputData.imageThreads.length} total images`);

    // --- FILENAME GENERATION CHANGE ---
    const sanitizedBrand = sanitizeForFilename(backpack.brand);
    const sanitizedModel = sanitizeForFilename(backpack.model);
    const filename = `${sanitizedBrand}_${sanitizedModel}.json`;
    // --- END FILENAME CHANGE ---

    const outputDir = path.join(process.cwd(), 'src', 'data', 'reddit_data');
    await fs.mkdir(outputDir, { recursive: true }); // Ensure directory exists
    const filePath = path.join(outputDir, filename);

    await fs.writeFile(filePath, JSON.stringify(outputData, null, 2));
    console.log(`Successfully scraped and saved data to ${filePath}`);
  } catch (error) {
    console.error(`Error scraping data for ${backpackName}:`, error);
  }
}

// Add this function to get a random delay between 5-10 seconds
function getRandomDelay() {
  return Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
}

// Corrected main function
async function main() {
  try {
    const specificBackpackId = process.argv[2]; // Get the third argument (index 2)

    if (specificBackpackId) {
      // --- Processing a SINGLE backpack ID --- 
      console.log(`Processing specific backpack ID: ${specificBackpackId}`);
      // Find the full backpack name from the imported data
      const backpackInfo = allBackpacksData.find(b => b.id === specificBackpackId);

      if (backpackInfo) {
        const fullName = `${backpackInfo.brand} ${backpackInfo.model || backpackInfo.name}`; // Use brand + model/name
        console.log(`Found backpack: ${fullName}`);
        // Optional: Check if file exists first?
        // if (await jsonFileExists(specificBackpackId)) { // Assuming jsonFileExists should check by ID
        //   console.log(`Skipping ${fullName} - JSON file ${specificBackpackId}.json already exists`);
        // } else {
             await scrapeBackpackData(fullName, specificBackpackId); // Pass ID separately
        // }
      } else {
        console.error(`Error: Backpack ID "${specificBackpackId}" not found in src/data.js`);
      }
      console.log(`Finished processing specific backpack ID: ${specificBackpackId}`);

    } else {
      // --- Processing ALL backpacks from data.js (Original logic, modified) ---
      console.warn("No specific backpack ID provided. Processing all backpacks from src/data.js.");
      console.warn("This may take a very long time!");
      
      console.log(`Found ${allBackpacksData.length} backpacks in src/data.js`);
      
      for (const backpackInfo of allBackpacksData) {
          if (!backpackInfo.id || !backpackInfo.brand || !(backpackInfo.model || backpackInfo.name)) {
              console.warn(`Skipping backpack due to missing id/brand/model: ${JSON.stringify(backpackInfo)}`);
              continue;
          }

          const backpackId = backpackInfo.id;
          const fullName = `${backpackInfo.brand} ${backpackInfo.model || backpackInfo.name}`;
          
          // Check if JSON file already exists using the ID
          const outputDir = path.join(process.cwd(), 'src', 'data', 'reddit_data');
          const fileName = `${backpackId}.json`;
          const outputPath = path.join(outputDir, fileName);
          
          try {
              await fs.access(outputPath);
              console.log(`Skipping ${fullName} (ID: ${backpackId}) - JSON file already exists at ${outputPath}`);
              continue; // Skip if file exists
          } catch (error) {
              // File doesn't exist, proceed with scraping
              console.log(`\nStarting Reddit data scraping for ${fullName} (ID: ${backpackId})...`);
              await scrapeBackpackData(fullName, backpackId);
              
              // Add random delay between 5-10 seconds
              const delay = getRandomDelay();
              console.log(`Waiting ${delay/1000} seconds before next backpack...`);
              await new Promise(resolve => setTimeout(resolve, delay));
          }
      }
      console.log('Finished processing all backpacks!');
    }

  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main().catch(console.error); 