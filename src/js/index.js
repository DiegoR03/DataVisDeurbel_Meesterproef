import { renderIntroText } from "./charts/intro-text.js";
import { drawRuisvoorn, drawBaars, drawPaling } from "./charts/wave-chart.js";
import { createGraph } from "./charts/timeline-graph.js";
import { fetchSnapshot } from "./charts/picture-of-month.js";
import { renderWorldMap } from "./charts/world-map.js";
import { drawDynamicStopwatch } from "./charts/average-time.js";
import { addFishToAquarium, createBubbles } from "./charts/swimming-fish.js";

async function init() {
  const rawData = window.SERVER_VIS_DATA || [];
  
  const data = rawData.map(item => ({
    ...item,
    created_at: item.created_at ? new Date(item.created_at) : null
  }));

  renderIntroText(data);

  if (data && data.length > 0) {
      const aquarium = document.getElementById("main-aquarium");
      const filterInputs = document.querySelectorAll('input[name="fish-filter"]');
      
      // Jouw originele array met de juiste afbeeldingspaden
      const fishSpecies = [
          { name: "Ruisvoorn", legendId: "legend-ruisvoorn", imgPath: "./public/img/ruisvoorn.png" },
          { name: "Baars", legendId: "legend-baars", imgPath: "./public/img/baars.png" },
          { name: "Paling", legendId: "legend-paling", imgPath: "./public/img/paling.png" },
          { name: "Alver", legendId: "legend-alver", imgPath: "./public/img/alver.png" },
          { name: "Blankvoorn", legendId: "legend-blankvoorn", imgPath: "./public/img/blankvoorn.png" },
          { name: "Brasem", legendId: "legend-brasem", imgPath: "./public/img/brasem.png" },
          { name: "Kolblei", legendId: "legend-kolblei", imgPath: "./public/img/kolblei.png" },
          { name: "Meerval", legendId: "legend-meerval", imgPath: "./public/img/meerval.png" },
          { name: "Snoek", legendId: "legend-snoek", imgPath: "./public/img/snoek.png" },
          { name: "Snoekbaars", legendId: "legend-snoekbaars", imgPath: "./public/img/snoekbaars.png" },
          { name: "Winde", legendId: "legend-winde", imgPath: "./public/img/winde.png" }
      ];

      // Calculate the top 3
      const fishWithCounts = fishSpecies.map(fish => {
          const count = data.filter(d => d.fish_name === fish.name).length;
          return { ...fish, count: count };
      });
      
      const sortedFish = [...fishWithCounts].sort((a, b) => b.count - a.count);
      const top3Fish = sortedFish.slice(0, 3); // Grab only the top 3

      // 2. Function to draw the aquarium based on the choice
      function renderAquarium(mode) {
          if (!aquarium) return;
          aquarium.innerHTML = `
          <img src="./public/img/fietsklein.png" alt="Verzonken fietswrak" class="bicycle-wreck">
          <img src="./public/img/Planten.png" alt="Waterplant" class="water-plant">
          <img src="./public/img/Planten.png" alt="Waterplant" class="water-plant plant-2">
          <img src="./public/img/Planten.png" alt="Waterplant" class="water-plant plant-3">
          <img src="./public/img/zadel.png" alt="Fietszadel" class="zadel">
          `; 
          
          // Hide all legend items first
          fishSpecies.forEach(fish => {
              const legendEl = document.getElementById(fish.legendId);
              if (legendEl) legendEl.style.display = "none";
          });

          // Decide which list to draw
          const activeList = mode === "top3" ? top3Fish : fishSpecies;

          // Draw the selected list
          activeList.forEach(fish => {
              const legendEl = document.getElementById(fish.legendId);
              if (legendEl) legendEl.style.display = "flex"; // Show legend item

              addFishToAquarium(data, fish.name, "main-aquarium", fish.legendId, fish.imgPath);
          });

          // Draw the bubbles again
          createBubbles("main-aquarium", 25);
      }

      // Listen to the input changes
      filterInputs.forEach(input => {
          input.addEventListener('change', (e) => {
              renderAquarium(e.target.value);
          });
      });

      // Draw the aquarium for the first time (All fish)
      renderAquarium("all");
  }
  
  setupScrollAnimation();
  createGraph(data);
  renderWorldMap(data);
  fetchSnapshot(data);
  drawDynamicStopwatch(data);
  initSmartHeader();
  initNavigation();
}

init();

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
    { threshold: 0.6 }
  );

  const container = document.querySelector(".card-container");
  if (container) {
    observer.observe(container);
  }
}

function initSmartHeader() {
  const headerElement = document.querySelector('header');
  if (!headerElement) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      headerElement.classList.add('header--hidden');
    } else {
      headerElement.classList.remove('header--hidden');
    }
    lastScrollY = currentScrollY;
  });
}

function initNavigation() {
  const menuToggle = document.getElementById('menu-toggle');
  const navList = document.getElementById('nav-list');

  if (!menuToggle || !navList) return;

  menuToggle.addEventListener('click', () => {
    const isCurrentlyOpen = navList.classList.contains('is-open');

    if (isCurrentlyOpen) {
      navList.classList.remove('is-open');
      navList.classList.add('is-closing');
      menuToggle.setAttribute('aria-expanded', 'false');

      navList.addEventListener('animationend', function handler() {
        navList.classList.remove('is-closing');
        navList.removeEventListener('animationend', handler);
      }, { once: true });

    } else {
      navList.classList.remove('is-closing');
      navList.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
    }
    
    const icon = menuToggle.querySelector('i');
    if (icon) {
      if (!isCurrentlyOpen) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    }
  });
}