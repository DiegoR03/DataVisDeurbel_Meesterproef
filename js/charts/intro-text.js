const COUNTRY_NAMES = {
  NL: "🇳🇱 Nederland",
  US: "de 🇺🇸 Verenigde Staten",
  BE: "🇧🇪 België",
  DE: "🇩🇪 Duitsland",
  FR: "🇫🇷 Frankrijk",
};

export function renderIntroText(data) {
  const totalFishDoorbellUsers = getUniqueSessionCount(data);
  const mostPopularCountry = getMostPopularCountry(data);
  const countryText = formatCountryName(mostPopularCountry);

  updateIntroText(totalFishDoorbellUsers, countryText);
}

function getUniqueSessionCount(data) {
  const uniqueSessions = new Set(data.map((item) => item.session_id));

  return uniqueSessions.size;
}

function getMostPopularCountry(data) {
  const countryCounts = {};

  data.forEach((item) => {
    const country = item.country;

    if (!country) return;

    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });

  let mostPopularCountry = "";
  let highestCount = 0;

  Object.entries(countryCounts).forEach(([country, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostPopularCountry = country;
    }
  });

  return mostPopularCountry;
}

function formatCountryName(countryCode) {
  return COUNTRY_NAMES[countryCode] || countryCode || "unknown";
}

function updateIntroText(totalFishDoorbellUsers, countryText) {
  const introTextElement = document.getElementById("intro-text");

  if (!introTextElement) return;

  introTextElement.textContent = `In 2026 waren er ${totalFishDoorbellUsers.toLocaleString(
    "nl-NL",
  )} Visdeurbellers Waarvan de meeste uit ${countryText} kwamen`;
}
