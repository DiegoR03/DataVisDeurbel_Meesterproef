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
  setupScrollAnimatie()

}

init();



// Functie om de scroll-animatie te starten
function setupScrollAnimatie() {
    // 1. Maak de sensor (Intersection Observer)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Als de kaarten-container in beeld schuift...
            if (entry.isIntersecting) {
                // ...voeg de class 'in-beeld' toe!
                entry.target.classList.add('in-frame');
                
                // Optioneel: stop met observeren na 1 keer, zodat de animatie 
                // niet wéér afspeelt als je naar boven en beneden scrolt.
                observer.unobserve(entry.target); 
            }
        });
    }, { 
        // 0.4 betekent: activeer pas als de kaarten voor 40% op het scherm staan
        threshold: 0.6 
    });

    // 2. Plak de sensor op de kaarten-container
    const container = document.querySelector('.card-container');
    if (container) {
        observer.observe(container);
    }
}