const analyzeSentiment = async (comment) => {
  if (!comment || typeof comment !== 'string') {
    throw new Error('Invalid comment: Comment must be a non-empty string');
  }
  
  console.log(`Analyzing sentiment for comment (${comment.length} characters)`);
  

  const delay = Math.floor(Math.random() * 500) + 300;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  try {
    const result = simulateComprehendAnalysis(comment);
    
    console.log('Sentiment analysis completed successfully');
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      comment_length: comment.length,
      analysis: result
    };
    
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new Error(`Sentiment analysis failed: ${error.message}`);
  }
};

const simulateComprehendAnalysis = (text) => {
  const positiveTerms = [
    'support', 'approve', 'beneficial', 'agree', 'good', 'excellent', 
    'positive', 'improve', 'improvement', 'benefit', 'helps', 'appreciate',
    'protect', 'protection', 'safety', 'effective', 'efficient'
  ];
  
  const negativeTerms = [
    'oppose', 'against', 'reject', 'disagree', 'bad', 'terrible', 'harmful',
    'negative', 'costly', 'expensive', 'burden', 'burdensome', 'insufficient',
    'inadequate', 'weak', 'ineffective', 'flawed', 'concern', 'concerned'
  ];
  
  const neutralTerms = [
    'consider', 'review', 'suggest', 'recommendation', 'analyze', 'assessment',
    'evaluation', 'examine', 'study', 'research', 'data', 'information'
  ];
  
  const mixedTerms = [
    'however', 'but', 'although', 'while', 'nevertheless', 'nonetheless',
    'on one hand', 'on the other hand', 'conversely', 'yet', 'in contrast'
  ];
  
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let mixedCount = 0;
  
  positiveTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  neutralTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) neutralCount += matches.length;
  });
  
  mixedTerms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    const matches = lowerText.match(regex);
    if (matches) mixedCount += matches.length;
  });
  
  const totalTerms = positiveCount + negativeCount + neutralCount;
  
  let sentiment = 'NEUTRAL';
  let confidenceScores = {
    Positive: 0.1,
    Negative: 0.1,
    Neutral: 0.7,
    Mixed: 0.1
  };
  
  if (totalTerms > 0) {
    const positiveRatio = positiveCount / totalTerms;
    const negativeRatio = negativeCount / totalTerms;
    const neutralRatio = neutralCount / totalTerms;
    
    const randomVariance = () => (Math.random() * 0.2) - 0.1; 
    
    let positiveConfidence = Math.min(0.95, Math.max(0.01, positiveRatio + randomVariance()));
    let negativeConfidence = Math.min(0.95, Math.max(0.01, negativeRatio + randomVariance()));
    let neutralConfidence = Math.min(0.95, Math.max(0.01, neutralRatio + randomVariance()));
    
    let mixedConfidence = Math.min(0.95, Math.max(0.01, (mixedCount / 5) + randomVariance()));
    
    const totalConfidence = positiveConfidence + negativeConfidence + neutralConfidence + mixedConfidence;
    positiveConfidence = positiveConfidence / totalConfidence;
    negativeConfidence = negativeConfidence / totalConfidence;
    neutralConfidence = neutralConfidence / totalConfidence;
    mixedConfidence = mixedConfidence / totalConfidence;
    confidenceScores = {
      Positive: parseFloat(positiveConfidence.toFixed(4)),
      Negative: parseFloat(negativeConfidence.toFixed(4)),
      Neutral: parseFloat(neutralConfidence.toFixed(4)),
      Mixed: parseFloat(mixedConfidence.toFixed(4))
    };
    
    if (mixedConfidence > 0.4) {
      sentiment = 'MIXED';
    } else if (positiveConfidence > negativeConfidence && positiveConfidence > neutralConfidence) {
      sentiment = 'POSITIVE';
    } else if (negativeConfidence > positiveConfidence && negativeConfidence > neutralConfidence) {
      sentiment = 'NEGATIVE';
    } else {
      sentiment = 'NEUTRAL';
    }
  }
  
  return {
    Sentiment: sentiment,
    SentimentScore: confidenceScores,
    language: "en",
    key_phrases: extractKeyPhrases(text, sentiment),
    regulatory_relevance: calculateRegulatoryRelevance(text)
  };
};

const extractKeyPhrases = (text, sentiment) => {
  
  const phrases = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (let i = 0; i < Math.min(sentences.length, 5); i++) {
    const sentence = sentences[i].trim();
    
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 20) {
      phrases.push({
        text: sentence,
        score: parseFloat((0.5 + (Math.random() * 0.49)).toFixed(4))
      });
    }
  }
  
  if (phrases.length < 3 && sentences.length > 0) {
    for (const sentence of sentences) {
      const parts = sentence.split(',');
      for (const part of parts) {
        if (part.trim().length > 15 && part.trim().split(/\s+/).length >= 3) {
          phrases.push({
            text: part.trim(),
            score: parseFloat((0.5 + (Math.random() * 0.3)).toFixed(4))
          });
          if (phrases.length >= 3) break;
        }
      }
      if (phrases.length >= 3) break;
    }
  }
  
  return phrases.sort((a, b) => b.score - a.score);
};

const calculateRegulatoryRelevance = (text) => {
  const regulatoryTerms = [
    'regulation', 'policy', 'compliance', 'statute', 'requirement', 'mandate',
    'rule', 'provision', 'section', 'paragraph', 'amendment', 'proposal',
    'impact', 'effect', 'consequence', 'implementation', 'enforcement',
    'CFR', 'Federal Register', 'agency', 'authority', 'jurisdiction'
  ];
  
  const lowerText = text.toLowerCase();
  
  let termCount = 0;
  regulatoryTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) termCount += matches.length;
  });
  
  const textLength = text.length;
  let relevanceScore = Math.min(0.9, Math.max(0.1, 0.2 + (termCount / 10)));
  
  if (textLength > 500 && termCount > 5) {
    relevanceScore = Math.min(0.95, relevanceScore + 0.1);
  }
  
  relevanceScore = Math.min(0.98, Math.max(0.05, 
    relevanceScore + ((Math.random() * 0.1) - 0.05)
  ));
  
  return {
    score: parseFloat(relevanceScore.toFixed(4)),
    confidence: parseFloat((0.5 + (Math.random() * 0.4)).toFixed(4))
  };
};

module.exports = { analyzeSentiment };