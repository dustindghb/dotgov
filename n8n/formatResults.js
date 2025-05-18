const summary = $input.item.summary || "No summary available";
const results = $input.item.results || [];
const query = $input.item.query;
const usingFallback = $input.item.usingFallback || false;

return {
  query,
  summary,
  usingFallback,
  results: results.map(item => ({
    id: item.id,
    title: item.title,
    abstract: item.abstract.substring(0, 200) + "...",
    agencies: item.agencies,
    publication_date: item.publication_date,
    relevance: (item.similarity * 100).toFixed(1) + "%",
    url: item.html_url
  }))
};
return response;