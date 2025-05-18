// Robust function to handle various data formats
let vectorStore;

try {
  // First, let's check what we actually received and log it for debugging
  console.log("Input data type:", typeof $input.item);
  
  // Check if binary data exists and properly access it
  if ($input.item.binary) {
    // Find the correct property name in binary data
    const binaryPropertyName = Object.keys($input.item.binary)[0]; // Usually 'data'
    
    if (binaryPropertyName && $input.item.binary[binaryPropertyName]) {
      // Get the actual data correctly based on format
      const binaryData = $input.item.binary[binaryPropertyName];
      
      // Check if the data is a Buffer, string, or base64 string
      if (Buffer.isBuffer(binaryData)) {
        const content = binaryData.toString('utf-8');
        vectorStore = JSON.parse(content);
      } 
      else if (typeof binaryData === 'string') {
        vectorStore = JSON.parse(binaryData);
      }
      else if (binaryData.data) {
        // If it's an object with data property (common in n8n)
        const content = Buffer.from(binaryData.data, 'base64').toString('utf-8');
        vectorStore = JSON.parse(content);
      }
    }
  }
  // Handle case where it's already in JSON
  else if ($input.item.json) {
    if (typeof $input.item.json === 'string') {
      vectorStore = JSON.parse($input.item.json);
    } else {
      vectorStore = $input.item.json;
    }
  }
  
  // If we still don't have data, check if the item itself is the data
  if (!vectorStore && typeof $input.item === 'object') {
    vectorStore = $input.item;
  }
  
  // Format the data structure properly
  if (Array.isArray(vectorStore)) {
    // If it's just an array, wrap it
    vectorStore = { vectors: vectorStore };
  }
  else if (vectorStore && !vectorStore.vectors) {
    // Try to find appropriate array property
    const possibleArrayProps = ['data', 'items', 'results', 'documents'];
    for (const prop of possibleArrayProps) {
      if (Array.isArray(vectorStore[prop])) {
        vectorStore = { vectors: vectorStore[prop] };
        break;
      }
    }
  }
  
  // Final validation
  if (!vectorStore || !vectorStore.vectors || !Array.isArray(vectorStore.vectors)) {
    // If we still don't have the right structure, provide detailed error
    console.log("Final data structure:", JSON.stringify($input.item).substring(0, 200));
    throw new Error("Could not find or create vectors array in data");
  }
  
} catch (error) {
  console.log("Error details:", error.message);
  throw new Error(`Failed to process vector store: ${error.message}`);
}

return {
  vectorStore,
  query: $node["Process Query"].json.query,
  embedding: $node["Output Processing Node"].json.embedding
};