import fs from 'fs';
import path from 'path';

const analysisDir = path.join('src', 'data', 'analysis');
const outputFile = path.join(analysisDir, 'combined_analysis.json');

// Create analysis directory if it doesn't exist
if (!fs.existsSync(analysisDir)) {
  fs.mkdirSync(analysisDir, { recursive: true });
}

// Get all analysis files
const files = fs.readdirSync(analysisDir)
  .filter(f => f.endsWith('.analysis.json') && f !== 'combined_analysis.json');

const combinedAnalysis = {
  backpacks: []
};

// Process each analysis file
for (const file of files) {
  try {
    const filePath = path.join(analysisDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    combinedAnalysis.backpacks.push({
      name: data.name,
      sentiment: data.sentiment,
      num_mentions: data.num_mentions,
      pros_count: (data.pros || []).length,
      cons_count: (data.cons || []).length
    });
  } catch (error) {
    console.error(`Error processing ${file}:`, error);
  }
}

// Sort by sentiment score (highest first)
combinedAnalysis.backpacks.sort((a, b) => b.sentiment - a.sentiment);

// Add summary statistics
combinedAnalysis.summary = {
  total_backpacks: combinedAnalysis.backpacks.length,
  average_sentiment: combinedAnalysis.backpacks.reduce((sum, b) => sum + b.sentiment, 0) / combinedAnalysis.backpacks.length,
  total_mentions: combinedAnalysis.backpacks.reduce((sum, b) => sum + b.num_mentions, 0),
  highest_sentiment: {
    name: combinedAnalysis.backpacks[0]?.name,
    score: combinedAnalysis.backpacks[0]?.sentiment
  },
  most_discussed: combinedAnalysis.backpacks.reduce((max, b) => 
    b.num_mentions > max.mentions ? { name: b.name, mentions: b.num_mentions } : max, 
    { name: '', mentions: 0 }
  )
};

// Save combined analysis
fs.writeFileSync(outputFile, JSON.stringify(combinedAnalysis, null, 2));
console.log('Combined analysis saved to:', outputFile); 