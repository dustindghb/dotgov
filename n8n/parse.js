let vectorStore;

try {
  console.log("Input data type:", typeof $input.item);
  
  if ($input.item.binary) {
    const binaryPropertyName = Object.keys($input.item.binary)[0]; 
    
    if (binaryPropertyName && $input.item.binary[binaryPropertyName]) {
      const binaryData = $input.item.binary[binaryPropertyName];
      

      if (Buffer.isBuffer(binaryData)) {
        const content = binaryData.toString('utf-8');
        vectorStore = JSON.parse(content);
      } 
      else if (typeof binaryData === 'string') {
        vectorStore = JSON.parse(binaryData);
      }
      else if (binaryData.data) {
        const content = Buffer.from(binaryData.data, 'base64').toString('utf-8');
        vectorStore = JSON.parse(content);
      }
    }
  }
  else if ($input.item.json) {
    if (typeof $input.item.json === 'string') {
      vectorStore = JSON.parse($input.item.json);
    } else {
      vectorStore = $input.item.json;
    }
  }
  
  if (!vectorStore && typeof $input.item === 'object') {
    vectorStore = $input.item;
  }
  
  if (Array.isArray(vectorStore)) {
    vectorStore = { vectors: vectorStore };
  }
  else if (vectorStore && !vectorStore.vectors) {
    const possibleArrayProps = ['data', 'items', 'results', 'documents'];
    for (const prop of possibleArrayProps) {
      if (Array.isArray(vectorStore[prop])) {
        vectorStore = { vectors: vectorStore[prop] };
        break;
      }
    }
  }
  
  if (!vectorStore || !vectorStore.vectors || !Array.isArray(vectorStore.vectors)) {
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