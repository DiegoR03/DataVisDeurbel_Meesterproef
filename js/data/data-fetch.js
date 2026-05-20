import * as d3 from "d3";

// Value used in the CSV to represent empty data
const NULL_VALUE = "\\N";

// Main function to load and format the CSV data
export async function loadCsvData(csvUrl) {
  try {
    // Load CSV using D3
    const rawData = await d3.csv(csvUrl);

    // Format every row into cleaner usable objects
    return rawData.map(formatDataObject);
  } catch (error) {
    console.error("Could not load CSV data:", error);
    return [];
  }
}

// Formats a single row from the CSV
function formatDataObject(dataObject) {
  const formattedObject = {};

  // Loop through every key/value pair
  // and clean the values
  Object.entries(dataObject).forEach(([key, value]) => {
    formattedObject[key] = cleanValue(value);
  });

  // Convert created_at into a real Date object
  // so we can use it in timelines/charts later
  formattedObject.created_at = formatDate(formattedObject.created_at);

  // Extract fish-related data from URL queries
  addFishData(formattedObject);

  return formattedObject;
}

// Cleans empty values and trims whitespace
function cleanValue(value) {
  if (!value || value === NULL_VALUE) {
    return null;
  }

  return value.trim();
}

// Converts date strings into JavaScript Date objects
function formatDate(value) {
  if (!value) return null;

  return new Date(value);
}

// Extracts fish data from the query string
function addFishData(dataObject) {
  // Some events store fish data in either:
  // - url_query
  // - referrer_query
  const queryString = dataObject.url_query || dataObject.referrer_query;

  // If no query exists,
  // create fallback values
  if (!queryString) {
    dataObject.fish_name = "Unknown";
    dataObject.snapshot_url = null;

    return;
  }

  // Convert query string into usable parameters
  const params = new URLSearchParams(queryString);

  // Extract fish name
  dataObject.fish_name = params.get("fish") || "Unknown";

  // Extract fish snapshot image URL
  const rawImageUrl = params.get("snapshotFishImageUrl");

  // Decode URL if it exists
  dataObject.snapshot_url = rawImageUrl
    ? decodeURIComponent(rawImageUrl)
    : null;
}
