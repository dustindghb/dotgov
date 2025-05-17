const item = $input.item;

if (item && item.json && item.json.results) {
  // Map the results to extract and transform the data we need
  const processedItems = item.json.results.map(result => {
    return {
      id: result.document_number,
      title: result.title,
      type: result.type,
      abstract: result.abstract || "",
      agencies: result.agencies || [],
      publication_date: result.publication_date,
      html_url: result.html_url,
      pdf_url: result.pdf_url
    };
  });
  
  return {
    json: {
      processedItems,
      count: processedItems.length
    }
  };
} else {
  return {
    json: {
      error: "Expected data structure not found",
      dataType: typeof item.json,
      availableProps: item.json ? Object.keys(item.json) : "None",
      fullItem: item.json
    }
  };
}