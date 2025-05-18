// Comprehensive webhook data inspection
const inputItem = $input.item;

// Log the entire input structure
console.log("FULL INPUT STRUCTURE:", JSON.stringify(inputItem, null, 2));

// Check all potential properties
console.log("TOP LEVEL PROPERTIES:", Object.keys(inputItem));

// Check each property in detail
Object.keys(inputItem).forEach(key => {
  console.log(`PROPERTY ${key} TYPE:`, typeof inputItem[key]);
  console.log(`PROPERTY ${key} VALUE:`, JSON.stringify(inputItem[key]).substring(0, 500));
  
  // If it's an object, check nested properties
  if (typeof inputItem[key] === 'object' && inputItem[key] !== null) {
    console.log(`PROPERTY ${key} KEYS:`, Object.keys(inputItem[key]));
  }
});

// Check for any property that might contain 'query'
const findQueryInObject = (obj, path = '') => {
  if (!obj || typeof obj !== 'object') return null;
  
  for (const key in obj) {
    const newPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    // Check if the key contains 'query'
    if (key.toLowerCase().includes('query')) {
      console.log(`FOUND POTENTIAL QUERY AT ${newPath}:`, value);
    }
    
    // Check nested objects
    if (value && typeof value === 'object') {
      findQueryInObject(value, newPath);
    }
  }
};

findQueryInObject(inputItem);

// For testing, create a mock query
const query = "environmental regulations";

// Return a proper string query for testing
return { 
  query: query,
  debug: {
    inputKeys: Object.keys(inputItem),
    hasJSON: !!inputItem.json,
    jsonKeys: inputItem.json ? Object.keys(inputItem.json) : [],
    hasBody: !!inputItem.body,
    bodyKeys: inputItem.body ? Object.keys(inputItem.body) : [],
    hasParams: !!inputItem.params,
    paramsKeys: inputItem.params ? Object.keys(inputItem.params) : []
  }
};