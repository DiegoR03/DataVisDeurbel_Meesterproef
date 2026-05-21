import { loadCsvData } from "./data/data-fetch.js";
import { renderIntroText } from "./charts/intro-text.js";
import {createGraph} from "./charts/timeline-graph.js";
import { fetchSnapshot } from "./charts/picture-of-month.js";
import { fetchPartial } from "./loader/partial-loader.js";

const CSV_URL = "/assets/data/website_event-week.csv";

async function init() {
  const data = await loadCsvData(CSV_URL);

  fetchPartial('header-placeholder', '/assets/partials/header.html');
  fetchPartial('footer-placeholder', '/assets/partials/footer.html');

  renderIntroText(data);
  createGraph(data);
}

init();
