import { renderIntroText } from "./charts/intro-text.js";
import { drawRuisvoorn, drawBaars, drawPaling } from "./charts/wave-chart.js";
import { createGraph } from "./charts/timeline-graph.js";
import { fetchSnapshot } from "./charts/picture-of-month.js";
import { renderWorldMap } from "./charts/world-map.js";
import { addFishToAquarium } from "./charts/swimming-fish.js";

async function init() {
  const rawData = window.SERVER_VIS_DATA || [];
  
  const data = rawData.map(item => ({
    ...item,
    created_at: item.created_at ? new Date(item.created_at) : null
  }));

  renderIntroText(data);

  if (data && data.length > 0) {
    const aquarium = document.getElementById("main-aquarium");
      if (aquarium) aquarium.innerHTML = "";

      // Create an array with all the configurations for your 11 fish
      const fishSpecies = [
          { name: "Ruisvoorn", legendId: "legend-ruisvoorn", imgPath: "./assets/img/ruisvoorn.png" },
          { name: "Baars", legendId: "legend-baars", imgPath: "./assets/img/baars.png" },
          { name: "Paling", legendId: "legend-paling", imgPath: "./assets/img/paling.png" },
          { name: "Alver", legendId: "legend-alver", imgPath: "./assets/img/alver.png" },
          { name: "Blankvoorn", legendId: "legend-blankvoorn", imgPath: "./assets/img/blankvoorn.png" },
          { name: "Brasem", legendId: "legend-brasem", imgPath: "./assets/img/brasem.png" },
          { name: "Kolblei", legendId: "legend-kolblei", imgPath: "./assets/img/kolblei.png" },
          { name: "Meerval", legendId: "legend-meerval", imgPath: "./assets/img/meerval.png" },
          { name: "Snoek", legendId: "legend-snoek", imgPath: "./assets/img/snoek.png" },
          { name: "Snoekbaars", legendId: "legend-snoekbaars", imgPath: "./assets/img/snoekbaars.png" },
          { name: "Winde", legendId: "legend-winde", imgPath: "./assets/img/winde.png" }
      ];

      // Loop through the array and render each fish
      fishSpecies.forEach(fish => {
          addFishToAquarium(
              data, 
              fish.name, 
              "main-aquarium", 
              fish.legendId, 
              fish.imgPath
          );
      });
  }
  
  setupScrollAnimation();
  createGraph(data);
  renderWorldMap(data);
  fetchSnapshot(data);
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