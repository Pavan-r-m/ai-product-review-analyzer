/**
 * Rule-Based NLP Engine for Product Review Analysis
 * 
 * This module provides deterministic review enrichment without external AI APIs.
 * Designed to be used in n8n Code nodes or as a standalone Node.js module.
 * 
 * @version 1.0.0
 */

/**
 * Topic detection keywords dictionary
 * Maps keywords to topic categories
 */
const TOPIC_KEYWORDS = {
  battery: ['battery', 'charge', 'charging', 'power', 'drain', 'dies', 'life'],
  performance: ['slow', 'fast', 'lag', 'speed', 'performance', 'quick', 'responsive', 'sluggish'],
  durability: ['broke', 'broken', 'sturdy', 'fragile', 'durable', 'quality', 'build', 'cheap', 'flimsy'],
  pricing: ['expensive', 'cheap', 'price', 'value', 'worth', 'cost', 'overpriced', 'affordable'],
  delivery: ['shipping', 'arrived', 'delayed', 'delivery', 'shipment', 'package', 'late', 'damaged box'],
  sound: ['audio', 'noise', 'volume', 'sound', 'bass', 'treble', 'speaker', 'quiet', 'loud'],
  support: ['customer service', 'support', 'help', 'response', 'contacted', 'reply', 'warranty'],
  setup: ['install', 'installation', 'configure', 'setup', 'easy', 'complicated', 'manual', 'instructions'],
  screen: ['display', 'screen', 'brightness', 'resolution', 'pixels', 'colors', 'touch'],
  compatibility: ['compatible', 'compatibility', 'works with', 'connect', 'sync', 'pair', 'pairing'],
  design: ['design', 'looks', 'aesthetic', 'style', 'appearance', 'color', 'size', 'weight'],
  ui: ['interface', 'ui', 'menu', 'navigation', 'controls', 'buttons', 'app']
};

/**
 * Urgency classification keywords
 */
const URGENCY_KEYWORDS = {
  high: [
    'fire', 'smoke', 'overheat', 'overheating', 'hazard', 'exploded', 'explosion',
    'dangerous', 'safety', 'burn', 'burning', 'hot', 'melt', 'melted', 'injury', 'hurt'
  ],
  medium: [
    'broken', 'broke', 'stopped working', 'dead', 'refund', 'return', 'defective',
    'not working', 'doesn\'t work', 'failed', 'unusable', 'malfunction'
  ]
};

/**
 * Sentiment modifier keywords for fine-tuning
 */
const SENTIMENT_MODIFIERS = {
  positive: [
    'amazing', 'excellent', 'perfect', 'love', 'great', 'awesome', 'fantastic',
    'wonderful', 'best', 'impressed', 'highly recommend', 'recommend', 'happy',
    'satisfied', 'exceeded', 'superb', 'outstanding'
  ],
  negative: [
    'terrible', 'horrible', 'worst', 'awful', 'hate', 'disappointed', 'disappointing',
    'poor', 'bad', 'useless', 'waste', 'regret', 'never', 'avoid', 'don\'t buy',
    'garbage', 'junk', 'pathetic'
  ]
};

/**
 * Detect sentiment based on rating and text content
 * 
 * @param {number} rating - Product rating (1-5)
 * @param {string} text - Review text
 * @returns {object} - {sentiment: string, sentiment_score: number}
 */
function detectSentiment(rating, text) {
  const lowerText = text.toLowerCase();
  
  // Base sentiment from rating
  let sentiment;
  let baseScore;
  
  if (rating >= 4) {
    sentiment = 'positive';
    baseScore = rating === 5 ? 0.9 : 0.6;
  } else if (rating <= 2) {
    sentiment = 'negative';
    baseScore = rating === 1 ? -0.9 : -0.6;
  } else {
    sentiment = 'neutral';
    baseScore = 0.0;
  }
  
  // Apply keyword modifiers
  let modifier = 0;
  
  // Check positive keywords
  const positiveMatches = SENTIMENT_MODIFIERS.positive.filter(
    keyword => lowerText.includes(keyword)
  ).length;
  
  // Check negative keywords
  const negativeMatches = SENTIMENT_MODIFIERS.negative.filter(
    keyword => lowerText.includes(keyword)
  ).length;
  
  modifier = (positiveMatches * 0.1) - (negativeMatches * 0.1);
  
  // Calculate final score (clamped between -1.0 and 1.0)
  let sentimentScore = Math.max(-1.0, Math.min(1.0, baseScore + modifier));
  
  // Adjust sentiment label if modifiers changed the polarity significantly
  if (sentimentScore >= 0.3 && sentiment !== 'positive') {
    sentiment = 'positive';
  } else if (sentimentScore <= -0.3 && sentiment !== 'negative') {
    sentiment = 'negative';
  } else if (sentimentScore > -0.3 && sentimentScore < 0.3) {
    sentiment = 'neutral';
  }
  
  // Round to 2 decimal places
  sentimentScore = Math.round(sentimentScore * 100) / 100;
  
  return { sentiment, sentiment_score: sentimentScore };
}

/**
 * Detect topics mentioned in the review
 * 
 * @param {string} text - Review text
 * @returns {string[]} - Array of detected topics (max 6)
 */
function detectTopics(text) {
  const lowerText = text.toLowerCase();
  const detectedTopics = new Set();
  
  // Check each topic category
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        detectedTopics.add(topic);
        break; // Found one keyword for this topic, move to next topic
      }
    }
  }
  
  // If no topics detected, mark as "other"
  if (detectedTopics.size === 0) {
    return ['other'];
  }
  
  // Limit to 6 topics (arbitrary limit for readability)
  return Array.from(detectedTopics).slice(0, 6);
}

/**
 * Classify review urgency
 * 
 * @param {string} text - Review text
 * @param {number} rating - Product rating
 * @returns {string} - 'high', 'med', or 'low'
 */
function classifyUrgency(text, rating) {
  const lowerText = text.toLowerCase();
  
  // Check for high urgency keywords (safety issues)
  for (const keyword of URGENCY_KEYWORDS.high) {
    if (lowerText.includes(keyword)) {
      return 'high';
    }
  }
  
  // Check for medium urgency keywords (defects)
  for (const keyword of URGENCY_KEYWORDS.medium) {
    if (lowerText.includes(keyword)) {
      return 'med';
    }
  }
  
  // If rating is very low (1 star), treat as medium urgency
  if (rating === 1) {
    return 'med';
  }
  
  // Default to low urgency
  return 'low';
}

/**
 * Extract key phrases from review text
 * Simple implementation: extract noun phrases and adjective combinations
 * 
 * @param {string} text - Review text
 * @returns {string[]} - Array of key phrases (max 5)
 */
function extractKeyPhrases(text) {
  const phrases = [];
  const lowerText = text.toLowerCase();
  
  // Extract sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // For each sentence, find important word combinations
  sentences.forEach(sentence => {
    const words = sentence.trim().toLowerCase().split(/\s+/);
    
    // Look for 2-3 word combinations containing keywords
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, Math.min(i + 3, words.length)).join(' ');
      
      // Check if phrase contains topic keywords or sentiment keywords
      const containsImportantWord = [
        ...Object.values(TOPIC_KEYWORDS).flat(),
        ...SENTIMENT_MODIFIERS.positive,
        ...SENTIMENT_MODIFIERS.negative
      ].some(keyword => phrase.includes(keyword));
      
      if (containsImportantWord && phrase.length > 5 && phrase.length < 50) {
        phrases.push(phrase);
      }
    }
  });
  
  // Remove duplicates and limit to 5
  return [...new Set(phrases)].slice(0, 5);
}

/**
 * Generate a concise summary of the review
 * 
 * @param {number} rating - Product rating
 * @param {string[]} topics - Detected topics
 * @param {string} urgency - Urgency level
 * @param {string} sentiment - Sentiment classification
 * @returns {string} - Generated summary
 */
function generateSummary(rating, topics, urgency, sentiment) {
  const topicStr = topics.length > 0 ? topics.slice(0, 3).join(', ') : 'general';
  
  let summaryTemplate = `Rating ${rating}/5. `;
  
  if (sentiment === 'positive') {
    summaryTemplate += 'Positive feedback ';
  } else if (sentiment === 'negative') {
    summaryTemplate += 'Negative feedback ';
  } else {
    summaryTemplate += 'Mixed feedback ';
  }
  
  summaryTemplate += `regarding: ${topicStr}. `;
  
  if (urgency === 'high') {
    summaryTemplate += 'HIGH URGENCY - Safety concern.';
  } else if (urgency === 'med') {
    summaryTemplate += 'Medium urgency - Product issue reported.';
  } else {
    summaryTemplate += 'Low urgency.';
  }
  
  return summaryTemplate;
}

/**
 * Main enrichment function - processes a single review
 * 
 * @param {object} review - Review object with fields: rating, review_text, review_title, product_name
 * @returns {object} - Enriched review with AI fields
 */
function enrichReview(review) {
  const {
    rating = 3,
    review_text = '',
    review_title = '',
    product_name = ''
  } = review;
  
  // Combine title and text for comprehensive analysis
  const fullText = `${review_title} ${review_text}`.trim();
  
  // Handle empty reviews
  if (!fullText || fullText.length < 3) {
    return {
      sentiment: 'neutral',
      sentiment_score: 0.0,
      topics: ['other'],
      urgency: 'low',
      summary: 'Review text too short for analysis.',
      key_phrases: [],
      ai_model: 'rule-based-v1'
    };
  }
  
  // Apply enrichment engines
  const { sentiment, sentiment_score } = detectSentiment(rating, fullText);
  const topics = detectTopics(fullText);
  const urgency = classifyUrgency(fullText, rating);
  const key_phrases = extractKeyPhrases(fullText);
  const summary = generateSummary(rating, topics, urgency, sentiment);
  
  return {
    sentiment,
    sentiment_score,
    topics,
    urgency,
    summary,
    key_phrases,
    ai_model: 'rule-based-v1'
  };
}

/**
 * Batch enrichment function - processes multiple reviews
 * 
 * @param {array} reviews - Array of review objects
 * @returns {array} - Array of enriched reviews
 */
function enrichReviews(reviews) {
  return reviews.map(review => ({
    ...review,
    ...enrichReview(review)
  }));
}

// ============================================
// Export for use in different environments
// ============================================

// Node.js module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    enrichReview,
    enrichReviews,
    detectSentiment,
    detectTopics,
    classifyUrgency,
    extractKeyPhrases,
    generateSummary
  };
}

// ============================================
// n8n Code Node Usage Example
// ============================================
/*

// Copy the entire enrichReview() function and dependencies above, then use:

const items = $input.all();
const enrichedItems = [];

for (const item of items) {
  const review = item.json;
  const enrichment = enrichReview(review);
  
  enrichedItems.push({
    json: {
      ...review,
      ...enrichment
    }
  });
}

return enrichedItems;

*/
