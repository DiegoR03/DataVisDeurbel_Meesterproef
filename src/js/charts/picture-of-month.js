function fetchSnapshot(data) {
  // Validatie: stop als er geen data is om mee te werken
  // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else
  if (!data || data.length === 0) {
    return;
  }

  const fishContainer = document.querySelector('.fish-facts-container');

  const fishOptions = fishContainer.dataset.fishOptions
    ? JSON.parse(fishContainer.dataset.fishOptions)
    : [];
  // dataset + JSON parsing
  // MDN dataset: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
  // MDN JSON.parse: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse

  if(!fishOptions.length) {
    console.warn('Geen vissen gevonden in component');
    return;
  }

  // Filter snapshots: alleen geldige visdata behouden
  const fishSnapshots = data.filter((item) =>
      item.snapshot_url &&
      item.fish_name &&
      item.fish_name !== "Unknown" &&
      item.fish_name !== "unknown" &&
      item.fish_name !== "onbekend" &&
      !item.fish_name.includes(",")
  );
  // Array.filter MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter

  console.log("SNAPSHOTS:", fishSnapshots);

  if (fishSnapshots.length === 0) {
    console.warn("Geen geldige vis-snapshots gevonden");
    return;
  }

  const fishNumber = {};

  for (const snapshot of fishSnapshots) {
    const fishName = snapshot.fish_name;

    if (!fishName) continue;
    // Guard clause: voorkomt errors bij ontbrekende data
    // (ChatGPT: gebruikt om “defensive coding” te doen)

    const queryString = snapshot.url_query || snapshot.referrer_query;
    if (!queryString) continue;
    // fallback pattern (ChatGPT + best practice): eerst primary value, anders backup

    const searchParams = new URLSearchParams(queryString);
    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams

    const likelyhoodOfFish = parseFloat(searchParams.get("likelyhoodOfFish"));
    // MDN parseFloat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat

    if (!likelyhoodOfFish || likelyhoodOfFish <= 0.345) continue;
    // filter op confidence score (ChatGPT: data cleaning / threshold filtering)
  }

  function renderFishList(container) {
    if (!container) return;

    container.innerHTML = "";
    // DOM manipulation: clean slate before rendering
    // MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML

    fishOptions.forEach((fish) => {
      const li = document.createElement("li");
      // MDN createElement: https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement

      li.classList.add("fish-item");
      // classList API
      // MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList

      li.dataset.set = fish.name;
      // ChatGPT: dataset wordt gebruikt om data in HTML te koppelen zonder extra state

      li.tabIndex = 0;
      // W3Schools tabindex: https://www.w3schools.com/tags/att_tabindex.asp

      li.innerHTML = `
        <img src="${fish.img}" alt="picture of ${fish.name}">
        <p>${fish.name}</p>
      `;

      container.appendChild(li);
      // MDN appendChild: https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
    });
  }

  const fishListGame = document.querySelector(".fish-icons-game-list");
  const fishListMobile = document.querySelector(".fish-icons-list-popover");

  renderFishList(fishListGame);
  renderFishList(fishListMobile);

  const fishImages = document.querySelectorAll(".fish-image");

  const fishFeedbacks = [
    document.querySelector(".guess-fish-feedback"),
    document.querySelector(".guess-fish-feedback-popover"),
  ].filter(Boolean);

  let currentFish = null;

  function getRandomFish() {
    const randomFish = Math.floor(Math.random() * fishSnapshots.length);
    // MDN Math.random: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

    currentFish = fishSnapshots[randomFish];

    fishImages.forEach((img) => {
      img.src = currentFish.snapshot_url;
      img.alt = currentFish.fish_alt || "Raad de vis";
    });

    fishFeedbacks.forEach((feedback) => {
      feedback.innerHTML = "";
    });
  }

  getRandomFish();

  const fishButtons = document.querySelectorAll(".fish-icons-list li, .fish-icons-list-popover li");

  fishButtons.forEach((button) => {
    button.tabIndex = 0;

    function guessingFish() {
      const guessedFish = button.dataset.set;
      const actualFish = currentFish.fish_name;

      const isCorrect = guessedFish.toLowerCase() === actualFish.toLowerCase();
      // MDN toLowerCase: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase

      const message = isCorrect
        ? `Wat goed! Het was inderdaad een ${actualFish}`
        : `Helaas, het juiste antwoord was ${actualFish}`;

      fishFeedbacks.forEach((feedback) => {
        feedback.innerHTML = message;
      });

      setTimeout(() => {
        getRandomFish();
      }, 1200);
      // MDN setTimeout: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
    }

    button.addEventListener("click", guessingFish);
    // MDN addEventListener: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  });

  let currentIndex = 0;

  document.addEventListener("keydown", (event) => {
    if (!fishButtons.length) return;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      // MDN preventDefault: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault

      currentIndex = (currentIndex + 1) % fishButtons.length;
      fishButtons[currentIndex].focus();
      // MDN focus: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
    }
  });

  function renderFishDetails(container) {
    if (!container) return;

    container.innerHTML = "";

    fishOptions.forEach((fish) => {
      const li = document.createElement("li");
      li.classList.add("fish-item");
      li.dataset.set = fish.name;
      li.tabIndex = 0;

      li.innerHTML = `
        <div class="fish-facts-tag">
          <img src="${fish.img}" alt="picture of ${fish.name}">
          <p>${fish.name}</p>
        </div>
      `;

      container.appendChild(li);
    });
  }

  const fishListDetails = document.querySelector(".fish-icons-details-list");
  renderFishDetails(fishListDetails);

  const fishFactsButtons = document.querySelectorAll(".fish-icons-details-list li");

  const fishFactsPopOver = document.querySelector(".fish-facts-popover");

  const fishNameEl = document.querySelector(".fish-facts-name");
  const aboutFishEl = document.querySelector(".fish-facts-about");
  const fishPicturesEl = document.querySelector(".fish-facts-pictures");
  const smallFishFacts = document.querySelector('.fish-facts-activity');

  const fishFacts = {
    kolblei: {
      fact: "Deze vis is zilverkleurig...",
      activeTime: "18:00",
      size: "15 tot 25",
    },
    snoek: {
      fact: "De snoek is een roofvis...",
      activeTime: "14:00",
      size: "40 tot 100",
    },
    baars: {
      fact: "De baars is een zoetwatervis...",
      activeTime: "08:00",
      size: "15 tot 35",
    },
    alver: {
      fact: "De alver is een kleine vis...",
      activeTime: "18:00",
      size: "15 tot 17",
    }
  };

  function showFishDetails(fishName) {
    const currentFishPics = fishSnapshots.filter(
      (snapshot) => snapshot.fish_name === fishName
    );

    if (fishNameEl) {
      fishNameEl.textContent = fishName;
    }

    const fishData = fishFacts?.[fishName?.trim().toLowerCase()];
    // optional chaining MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining

    if (aboutFishEl) {
      aboutFishEl.textContent =
        fishData?.fact ?? "Geen informatie beschikbaar.";
      // nullish coalescing MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
    }

    if (fishPicturesEl) {
      fishPicturesEl.innerHTML = currentFishPics
        .slice(0, 4)
        .map(fish =>
          `<li><img class="fish-preview" src="${fish.snapshot_url}" alt="${fishName}"></li>`
        )
        .join("");
      // ChatGPT: gebruikt map + join om dynamische HTML lijst te bouwen
    }

    fishFactsPopOver.classList.add("active");
  }

  const imageModel = document.querySelector('.fish-image-modal');
  const closeImage = document.querySelector('.fish-image-close');
  const openImage = document.querySelector('.fish-image-full');

  fishPicturesEl.addEventListener('click', (event) => {
    const image = event.target.closest('.fish-preview');
    // MDN closest: https://developer.mozilla.org/en-US/docs/Web/API/Element/closest

    if(!image) return;

    openImage.src = image.src;
    openImage.alt = image.alt;

    imageModel.classList.add('active-img');

    document.body.style.overflow = "hidden";
    // ChatGPT: voorkomt scrollen wanneer modal open staat
  });

  closeImage.addEventListener('click', () => {
    imageModel.classList.remove("active-img");
    document.body.style.overflow = "scroll";
  });

  fishFactsButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const fishName = button.dataset.set;

      document.querySelectorAll('.fish-facts-tag')
        .forEach(item => item.classList.remove('fish-tag-green'));

      button.querySelector('.fish-facts-tag')
        ?.classList.add('fish-tag-green');

      showFishDetails(fishName);
    });
  });

  if (fishOptions.length > 0) {
    showFishDetails(fishOptions[0].name);
  }
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const rawData = window.SERVER_VIS_DATA || [];

    const data = rawData.map((item) => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at) : null,
      // MDN Date: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    }));

    if (data.length > 0) {
      fetchSnapshot(data);
    }
  });
}