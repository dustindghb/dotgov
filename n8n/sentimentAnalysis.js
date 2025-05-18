const analyzeCommentSentiment = async (input) => {
  const { analyzeSentiment } = require('./sentiment-analysis-service');
  const data = input.json || {};
  let comment = "";
  
  if (data.comment) {
    comment = data.comment;
  } else if (data.text) {
    comment = data.text;
  } else if (data.body && typeof data.body === 'string') {
    comment = data.body;
  } else if (data.body && data.body.comment) {
    comment = data.body.comment;
  } else if (data.content) {
    comment = data.content;
  } else if (typeof input.body === 'string') {
    comment = input.body;
  } else {

    return [{
      json: {
        status: 'error',
        message: 'No comment found in input',
        timestamp: new Date().toISOString()
      }
    }];
  }
  
  console.log(`Processing comment with length: ${comment.length} characters`);
  
  try {
    const sentimentResult = await analyzeSentiment(comment);

    const commentId = data.id || data.commentId || `comment-${Date.now()}`;
    const regulationId = data.regulationId || data.regulation_id || data.rule_id || '';
    
    const result = {
      comment_id: commentId,
      regulation_id: regulationId,
      comment_length: comment.length,
      timestamp: new Date().toISOString(),
      sentiment: sentimentResult.analysis.Sentiment,
      sentiment_scores: sentimentResult.analysis.SentimentScore,
      key_phrases: sentimentResult.analysis.key_phrases,
      regulatory_relevance: sentimentResult.analysis.regulatory_relevance,
      comment_snippet: comment.length > 100 ? `${comment.substring(0, 100)}...` : comment
    };
    
    console.log(`Sentiment analysis completed: ${result.sentiment}`);
    
    return [{
      json: result
    }];
    
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return [{
      json: {
        status: 'error',
        message: `Failed to analyze sentiment: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }];
  }
};

return analyzeCommentSentiment($input.item);