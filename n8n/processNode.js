const response = $input.item.json;

// Error handling
if (!response || !response.data || !response.data[0] || !response.data[0].embedding) {
  throw new Error('Failed to generate embedding');
}

return {
  ...$input.item, // Keep all original properties
  embedding: response.data[0].embedding,
};