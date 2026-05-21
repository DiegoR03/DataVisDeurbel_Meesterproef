import { loadCsvData } from "./data/data-fetch.js";
import { renderIntroText } from "./charts/intro-text.js";
import { drawWaveChart } from "./charts/wave-chart.js";

const CSV_URL = "/assets/data/website_event-week.csv";

async function init() {
  const data = await loadCsvData(CSV_URL);

  renderIntroText(data);

  if (data && data.length > 0) {
      drawWaveChart(data);
  }
}

init();
