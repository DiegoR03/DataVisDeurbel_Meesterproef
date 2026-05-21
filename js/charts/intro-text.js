// Main function that renders the intro text
export function renderIntroText(data) {
  const totalFishDoorbellUsers = getUniqueSessionCount(data);
  const mostPopularCountry = getMostPopularCountry(data);
  const countryText = formatCountryName(mostPopularCountry);

  updateIntroText(totalFishDoorbellUsers, countryText);
}

// Counts unique users based on session IDs
function getUniqueSessionCount(data) {
  const uniqueSessions = new Set(data.map((item) => item.session_id));

  return uniqueSessions.size;
}

// Finds which country appears the most
function getMostPopularCountry(data) {
  const countryCounts = {};

  data.forEach((item) => {
    const country = item.country;
    // Skip rows without a country
    if (!country) return;
    // Increase count for this country
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });

  let mostPopularCountry = "";
  let highestCount = 0;

  // Loop through all countries
  // and find the highest value
  Object.entries(countryCounts).forEach(([country, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostPopularCountry = country;
    }
  });

  return mostPopularCountry;
}

// Converts country codes into:
// 🇳🇱 Netherlands
// 🇯🇵 Japan
// 🇧🇷 Brazil
function formatCountryName(countryCode) {
  if (!countryCode) return "onbekend";

  // Built-in browser API
  // that converts country codes into names
  const regionNames = new Intl.DisplayNames(["nl"], {
    type: "region",
  });

  const countryName = regionNames.of(countryCode);
  const flagEmoji = getFlagEmoji(countryCode);

  return `${flagEmoji} ${countryName}`;
}

// Generates flag emojis from country codes
function getFlagEmoji(countryCode) {
  return countryCode
    .toUpperCase()
    .replace(/./g, (character) =>
      String.fromCodePoint(127397 + character.charCodeAt()),
    );
}

// Updates the text inside the HTML element
function updateIntroText(totalFishDoorbellUsers, countryText) {
  const introTextElement = document.getElementById("intro-text");

  if (!introTextElement) return;

  introTextElement.textContent = `In 2026 waren er ${totalFishDoorbellUsers.toLocaleString(
    "nl-NL",
  )} Visdeurbellers. Waarvan de meeste uit ${countryText} kwamen.`;
}
