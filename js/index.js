import { loadCsvData } from "./data/data-fetch.js";
import { renderIntroText } from "./charts/intro-text.js";
import { fetchSnapshot } from "./charts/picture-of-month.js";

const CSV_URL = "/assets/data/website_event-week.csv";

async function init() {
  const data = await loadCsvData(CSV_URL);

  renderIntroText(data);
}

init();
