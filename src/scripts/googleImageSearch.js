// Use Vite's environment variables
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = import.meta.env.VITE_SEARCH_ENGINE_ID;

async function searchFarpoint40Images() {
  try {
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
      console.error('Google API credentials not found:', {
        hasApiKey: !!GOOGLE_API_KEY,
        hasSearchEngineId: !!SEARCH_ENGINE_ID
      });
      return [];
    }

    console.log('Starting Google image search...');
    const query = 'site:reddit.com Osprey Farpoint 40 backpack';
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=10&imgSize=large`;

    console.log('Fetching from Google API...');
    const response = await fetch(url);
    const data = await response.json();

    if (response.status !== 200) {
      console.error('Google API error:', data);
      return [];
    }

    if (!data.items) {
      console.error('No images found in response:', data);
      return [];
    }

    console.log('Processing search results...');
    // Extract image URLs and filter for high-quality images
    const imageUrls = data.items
      .map(item => ({
        url: item.link,
        width: parseInt(item.image.width),
        height: parseInt(item.image.height)
      }))
      .filter(img => {
        const isValid = !img.url.includes('thumbnail') && 
               img.width >= 600 && 
               img.height >= 400 &&
               (img.url.includes('i.redd.it') || img.url.includes('imgur.com'));
        if (!isValid) {
          console.log('Filtered out image:', img);
        }
        return isValid;
      })
      .map(img => img.url);

    console.log('Found valid images:', imageUrls);
    return imageUrls;
  } catch (error) {
    console.error('Error in searchFarpoint40Images:', error);
    return [];
  }
}

// Function to update data.js with new images
async function updateBackpackData() {
  console.log('Starting updateBackpackData...');
  const images = await searchFarpoint40Images();
  
  if (images.length === 0) {
    console.error('No suitable images found');
    return;
  }

  console.log('Found images:', images);
  return images;
}

export { searchFarpoint40Images, updateBackpackData }; 