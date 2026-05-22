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
  setupScrollAnimation()

}

init();



// Function to start the scroll animation
function setupScrollAnimation() {
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            
            if (entry.isIntersecting) {
                
                entry.target.classList.add('in-frame');

            } else {

                entry.target.classList.remove('in-frame')

            }
        });
    }, { 
        // At 60% visibility the animation happens
        threshold: 0.6 
    });

    
    const container = document.querySelector('.card-container');
    if (container) {
        observer.observe(container);
    }
}