const response = $input.item;

console.log("Response type:", typeof response);
console.log("Response keys:", response ? Object.keys(response) : "null/undefined");
if (response && response.data) {
  console.log("Data type:", typeof response.data);
  console.log("Data preview:", typeof response.data === 'string' ? response.data.substring(0, 100) + "..." : JSON.stringify(response.data).substring(0, 100) + "...");
} else {
  console.log("Data is null or undefined");
}

let parsedResponse;
try {
  if (typeof response.data === 'string') {
    parsedResponse = JSON.parse(response.data);
  } else if (typeof response.data === 'object') {
    parsedResponse = response.data;
  } else {
    console.log("Cannot process data, unexpected format");
    parsedResponse = { data: [], meta: { totalElements: 0 } };
  }
} catch (error) {
  console.log("JSON Parse error:", error.message);
  parsedResponse = { data: [], meta: { totalElements: 0 } };
}

let rules = [];
let meta = {};

try {
  rules = parsedResponse.data || [];
  meta = parsedResponse.meta || {};
  console.log("Rules count:", rules.length);
  console.log("Meta info:", Object.keys(meta));
} catch (error) {
  console.log("Error accessing data structure:", error.message);
}

const totalRules = meta.totalElements || 0;
const pageSize = meta.pageSize || 250;

const totalPages = Math.ceil(totalRules / pageSize);

const pagesToFetch = [];
for (let i = 2; i <= totalPages; i++) {
  pagesToFetch.push({ pageNumber: i });
}

const targetDate = "2025-05-01";
const targetDateLabel = "May 1, 2025";

return {
  targetDate: targetDate,
  targetDateLabel: targetDateLabel,
  totalRules: totalRules,
  totalPages: totalPages,
  currentPageRules: rules,
  pagesToFetch: pagesToFetch
};