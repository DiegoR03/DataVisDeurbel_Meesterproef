// Main function that renders the intro text
function renderIntroText(data) {
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
  const countrySessions = {};

  data.forEach((item) => {
    const country = item.country;
    const sessionId = item.session_id;

    if (!country || !sessionId) return;

    if (!countrySessions[country]) {
      countrySessions[country] = new Set();
    }

    countrySessions[country].add(sessionId);
  });

  let mostPopularCountry = "";
  let highestCount = 0;

  Object.entries(countrySessions).forEach(([country, sessions]) => {
    if (sessions.size > highestCount) {
      highestCount = sessions.size;
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

const data = window.SERVER_VIS_DATA || [];

if (document.getElementById("intro-text")) {
  renderIntroText(data);
}
