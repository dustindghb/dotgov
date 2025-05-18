const response = $input.item.json;
let embedding = [];

if (response && response.data && Array.isArray(response.data) && 
    response.data[0] && Array.isArray(response.data[0].embedding)) {
  
  embedding = response.data[0].embedding;
  console.log("EMBEDDING EXTRACTED - Length:", embedding.length);
} else {
  console.log("INVALID EMBEDDING RESPONSE:", JSON.stringify(response).substring(0, 500));
}

const query = $node["Process Query"].json.query || "environmental regulations";

return {
  query: query,
  embedding: embedding,
  model: response?.model || "text-embedding-3-small"
};