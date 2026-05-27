import { loadCsvData } from "./data/data-fetch.js";
import { renderIntroText } from "./charts/intro-text.js";
import { drawRuisvoorn, drawBaars, drawPaling } from "./charts/wave-chart.js";
import { createGraph } from "./charts/timeline-graph.js";
import { fetchSnapshot } from "./charts/picture-of-month.js";
import { fetchPartial } from "./loader/partial-loader.js";
import { renderWorldMap } from "./charts/world-map.js";

const CSV_URL = "/assets/data/website_event-week.csv";

async function init() {
  fetchPartial("header-placeholder", "/assets/partials/header.html");
  fetchPartial("footer-placeholder", "/assets/partials/footer.html");

  const data = await loadCsvData(CSV_URL);

  renderIntroText(data);

  if (data && data.length > 0) {
    drawRuisvoorn(data);
    drawBaars(data);
    drawPaling(data);
  }
  setupScrollAnimation();

  createGraph(data);
  renderWorldMap(data);
}

init();

// Function to start the scroll animation
function setupScrollAnimation() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-frame");
        } else {
          entry.target.classList.remove("in-frame");
        }
      });
    },
    {
      // At 60% visibility the animation happens
      threshold: 0.6,
    },
  );

  const container = document.querySelector(".card-container");
  if (container) {
    observer.observe(container);
  }
}
