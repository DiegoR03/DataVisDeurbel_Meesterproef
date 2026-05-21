import { loadCsvData } from "./data/data-fetch.js";
import { renderIntroText } from "./charts/intro-text.js";
import { drawRuisvoorn, drawBaars, drawPaling  } from "./charts/wave-chart.js";

const CSV_URL = "/assets/data/website_event-week.csv";

async function init() {
  const data = await loadCsvData(CSV_URL);

  renderIntroText(data);

  if (data && data.length > 0) {
      drawRuisvoorn(data);
      drawBaars(data);
      drawPaling(data);
  }
}

init();
