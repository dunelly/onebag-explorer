import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';
import fetch from 'node-fetch';

const customsearch = google.customsearch('v1');

// You'll need to provide these:
const API_KEY = 'AIzaSyBXwI3DAFtYVfjXApNulbw95LdUsS0OSUo';
const SEARCH_ENGINE_ID = '57b233d24008b4236';

async function getRedditThreadContent(threadUrl) {
  try {
    const apiUrl = threadUrl.replace('www.reddit.com', 'api.reddit.com').replace(/\/$/, '') + '.json';
    const response = await fetch(apiUrl);
    const data = await response.json();
    
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
    // Use medium preview images
    if (threadData.preview && threadData.preview.images) {
      threadData.preview.images.forEach(img => {
        if (img.resolutions && img.resolutions.length > 0) {
          // Pick the medium size (middle index)
          const midIdx = Math.floor(img.resolutions.length / 2);
          addImageIfUnique(img.resolutions[midIdx].url.replace(/&amp;/g, '&'));
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
    console.error('Error fetching thread content:', error.message);
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
      const response = await customsearch.cse.list({
        auth: API_KEY,
        cx: SEARCH_ENGINE_ID,
        q: `site:reddit.com ${backpackName}`,
        num: 10,
        start,
        searchType: 'image',
        safe: 'active'
      });
      
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
        const threadData = await getRedditThreadContent(threadUrl);
        
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
      thread.images.forEach(image => {
        imageThreads.push({
          image: image,
          thread: {
            title: thread.title,
            url: thread.url,
            selftext: thread.selftext,
            author: thread.author,
            score: thread.score,
            numComments: thread.numComments,
            created: thread.created,
            comments: thread.comments
          }
        });
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

async function scrapeBackpackData(backpackName) {
  try {
    console.log(`\nScraping data for ${backpackName}...`);
    const imageThreads = await searchRedditPosts(backpackName);
    
    // Combine data
    const backpackData = {
      name: backpackName,
      imageThreads: imageThreads
    };
    
    // Save to file
    const outputDir = path.join(process.cwd(), 'src', 'data', 'reddit_data');
    await fs.mkdir(outputDir, { recursive: true });
    
    const fileName = backpackName.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    const outputPath = path.join(outputDir, `${fileName}.json`);
    
    await fs.writeFile(outputPath, JSON.stringify(backpackData, null, 2));
    console.log(`Data saved to ${outputPath}`);
    console.log(`Total images saved: ${imageThreads.length}`);
    
    return backpackData;
  } catch (error) {
    console.error(`Error scraping data for ${backpackName}:`, error);
    return null;
  }
}

// Run for Osprey Farpoint 40
console.log('Starting Reddit data scraping for Osprey Farpoint 40...');
scrapeBackpackData('Osprey Farpoint 40')
  .then(() => console.log('Done!'))
  .catch(error => console.error('Error:', error)); 