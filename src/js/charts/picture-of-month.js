function fetchSnapshot(data) {
  if (!data || data.length === 0) {
    return;
  }

  const fishContainer = document.querySelector('.fish-facts-container');
  const fishOptions = fishContainer.dataset.fishOptions ? JSON.parse(fishContainer.dataset.fishOptions) : [];

  if(!fishOptions.length) {
    console.warn('Geen vissen gevonden in component');
    return;
  }

  const fishSnapshots = data.filter((item) =>
      item.snapshot_url &&
      item.fish_name &&
      item.fish_name !== "Unknown" &&
      item.fish_name !== "unknown" &&
      item.fish_name !== "onbekend" &&
      !item.fish_name.includes(",")
  );

  console.log("SNAPSHOTS:", fishSnapshots);
  if (fishSnapshots.length === 0) {
    console.warn("Geen geldige vis-snapshots gevonden met likelyhoodOfFish > 0.34",);
    return;
  }

  const fishNumber = {};

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
  for (const snapshot of fishSnapshots) {
    const fishName = snapshot.fish_name;

    if (!fishName) continue;

    // URLSearchParams parses query strings safely (MDN: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
    const queryString = snapshot.url_query || snapshot.referrer_query;
    if (!queryString) continue;

    const searchParams = new URLSearchParams(queryString);

    // parseFloat converts string -> number (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)
    const likelyhoodOfFish = parseFloat(searchParams.get("likelyhoodOfFish"));

    // guard clause: skip invalid or low confidence values
    if (!likelyhoodOfFish || likelyhoodOfFish <= 0.345) continue;
  }

  // render de html voor ul's met de bovenstaande afbeeldingen
  function renderFishList(container) {
    if (!container) return;
    container.innerHTML = "";

    fishOptions.forEach((fish) => {
      const li = document.createElement("li");
      li.classList.add("fish-item"); 
      // classList API (MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)
      li.dataset.set = fish.name;
      // dataset = HTML data-* attributes (MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset)
      li.tabIndex = 0;
      // tabindex makes element focusable (MDN: https://developer.mozilla.org/en-Web/HTML/Global_attributes/tabindex)

      li.innerHTML = `<img src="${fish.img}" alt="picture of ${fish.name}">
            <p>${fish.name}</p>`;

      container.appendChild(li);
      // appendChild inserts node into DOM (MDN: https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild)
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
    if (!fishSnapshots.length) return;
    // Math.random generates pseudo-random number 0–1 (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)
    const randomFish = Math.floor(Math.random() * fishSnapshots.length);
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
      if (!currentFish) return;
      const guessedFish = button.dataset.set;
      const actualFish = currentFish.fish_name;

      // case-insensitive comparison
      const isCorrect = guessedFish.toLowerCase() === actualFish.toLowerCase();

      const message = isCorrect
        ? `Wat goed! Het was inderdaad een ${actualFish}`
        : `Helaas, het juiste antwoord was ${actualFish}`;

      fishFeedbacks.forEach((feedback) => {
        feedback.innerHTML = message;
      });

      setTimeout(() => {
        getRandomFish();
      }, 1200);
      // setTimeout delays execution (MDN: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout)
    }

    button.addEventListener("click", guessingFish);
    // addEventListener handles events (MDN: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
  });

  let currentIndex = 0;

  document.addEventListener("keydown", (event) => {
    if (!fishButtons.length) return;

    // Check if the element the user is currently focused on the document
    // is actually a button inside the 'Guess the Fish' game!
    const isInsideGame = Array.from(fishButtons).includes(document.activeElement);

    // Only execute the navigation if they are inside the game:
    if (isInsideGame) {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        // MDN preventDefault: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault

        currentIndex = (currentIndex + 1) % fishButtons.length;
        fishButtons[currentIndex].focus();
        // MDN focus: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus
      }
      
      // Left/Up arrow to navigate backwards in the game
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
         event.preventDefault();
         currentIndex = (currentIndex - 1 + fishButtons.length) % fishButtons.length;
         fishButtons[currentIndex].focus();
      }
    }
  });

  // =========================================================================
  // GEWIJZIGD GEDEELTE: LEER ONZE VISSEN KENNEN (CARROUSEL)
  // =========================================================================

  const fishFacts = {
    kolblei: {
      fact: "Deze zilverkleurige vis heeft een sterk zijdelings afgeplat lichaam met een bruingrijze rug. Hij heeft grote schubben. Het oog is relatief groot en kleurloos, de aanzet van de borstvinnen en buikvinnen is roodachtig.",
      activeTime: "18:00",
      size: "15 tot 25",
    },
    snoek: {
      fact: "De snoek is een grote zoetwatervis uit de familie van de snoeken (Esocidae). Het is een van de roofvissen die in België en Nederland voorkomt. De snoek is daarnaast in delen van Europa, Azië en Noord-Amerika te vinden. Snoeken kunnen vijftien jaar oud worden.",
      activeTime: "14:00",
      size: "40 tot 100",
    },
    baars: {
      fact: "De Baars, ook wel Europese baars of rivierbaars genoemd, is een vis uit de familie echte baarzen, die van nature in de Benelux voorkomt. Verwanten van deze soort zijn onder andere de snoekbaars en de pos.",
      activeTime: "08:00",
      size: "15 tot 35",
    },
    alver: {
      fact: "De alver is een zoetwatervis die behoort tot de eigenlijke karpers. Hij is ook bekend onder de namen: moertje, alvenaar, alfje, alft, nesteling en panharing en in Vlaanderen als schieter, spekje of ablette.",
      activeTime: "18:00",
      size: "15 tot 17",
    }
  };

  let currentFishIndex = 0;
  const photoIndices = {};

  function initFishCarousel() {
    const cards = document.querySelectorAll('.fish-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      const fishName = card.dataset.fishName;
      if (!fishName) return;

      // Filterd fishfacts data
      const fishData = fishFacts?.[fishName?.trim().toLowerCase()];
      
      const sizeEl = card.querySelector('.fish-size');
      const activeTimeEl = card.querySelector('.fish-active-time');
      const descEl = card.querySelector('.fish-description');
      
      // textcontent
      if (sizeEl) sizeEl.textContent = `Grootte: ${fishData?.size ?? "onbekend"} cm`;
      if (activeTimeEl) activeTimeEl.textContent = `Het meest actief rond ${fishData?.activeTime ?? "onbekend"} uur`;
      if (descEl) descEl.textContent = fishData?.fact ?? "Geen informatie beschikbaar over deze vis.";

      // filter naar snapshots van dezelfde vis
      let currentFishPics = fishSnapshots.filter((snapshot) => snapshot.fish_name === fishName);

      const photoList = card.querySelector('.fish-photos-list');
      if (photoList) {
        photoList.innerHTML = currentFishPics
          .slice(0, 4)
          .map(fish => `<li><img class="fish-preview" src="${fish.snapshot_url}" alt="${fishName}"></li>`)
          // join() converts array -> string (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)
          .join("");
      }

      if (fishName === "Kolblei") {
        currentFishPics = [
          { snapshot_url: "https://blub-blub.b-cdn.net/fish-2026/05/20260504-083511.jpeg" },
          { snapshot_url: "https://blub-blub.b-cdn.net/fish-2026/05/20260503-113552.jpeg" },
          { snapshot_url: "https://blub-blub.b-cdn.net/fish-2026/05/20260502-071753.jpeg" },
          { snapshot_url: "https://blub-blub.b-cdn.net/fish-2026/05/20260501-201012.jpeg" }
        ];
      }

      // elke vis start op 0
      photoIndices[fishName] = 0;

      const prevPhotoBtn = card.querySelector('.prev-photo');
      const nextPhotoBtn = card.querySelector('.next-photo');

      if (prevPhotoBtn) {
        prevPhotoBtn.addEventListener('click', (e) => {
          // voorkomt dat dit event niet word meegegeven aan de parent of children
          e.stopPropagation(); 
          // Ga een visfoto's terug
          movePhoto(card, fishName, -1, Math.min(currentFishPics.length, 4));
        });
      }
      if (nextPhotoBtn) {
        nextPhotoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Ga een visfoto's verder
          movePhoto(card, fishName, 1, Math.min(currentFishPics.length, 4));
        });
      }
    });

    updateCarouselPositions();
  }

  function updateCarouselPositions() {
    const cards = document.querySelectorAll('.fish-card');
    const totalCards = cards.length;
    if (!totalCards) return;

    // Met hulp vaan Diego geschreven
    cards.forEach((card, i) => {
      card.classList.remove('active', 'prev-1', 'next-1', 'prev-2', 'next-2');

      // afstand berekenen
      let diff = i - currentFishIndex;
      // Gemaakt met chatGPT, zorgt ervoor dat je in een nette cirkel kan omdraaien
      if (diff < -Math.floor(totalCards / 2)) diff += totalCards;
      if (diff > Math.floor(totalCards / 2)) diff -= totalCards;

      if (diff === 0) {
        card.classList.add('active');
      } else if (diff === -1) {
        card.classList.add('prev-1');
      } else if (diff === 1) {
        card.classList.add('next-1');
      }
    });
  }

  // Met hulp van Diego
  function movePhoto(card, fishName, direction, maxPhotos) {
    if (maxPhotos <= 1) return;

    photoIndices[fishName] += direction;

    // Als van positie 0 naar de laatste gaat, door op links te klikken
    if (photoIndices[fishName] < 0) photoIndices[fishName] = maxPhotos - 1;

    // Veranderd photoIndices naar 0 als je op de laatste kaart bent
    if (photoIndices[fishName] >= maxPhotos) photoIndices[fishName] = 0;

    const photoList = card.querySelector('.fish-photos-list');
    if (photoList) {
      photoList.style.transform = `translateX(-${photoIndices[fishName] * 100}%)`;
    }
  }

  const prevFishBtn = document.querySelector('.prev-fish');
  const nextFishBtn = document.querySelector('.next-fish');
  const totalFishCards = fishOptions.length;

  if (prevFishBtn) {
    prevFishBtn.addEventListener('click', () => {
      // Haalt de waarde -1 als je op prev drukt
      currentFishIndex = (currentFishIndex - 1 + totalFishCards) % totalFishCards;
      updateCarouselPositions();
    });
  }

  if (nextFishBtn) {
    nextFishBtn.addEventListener('click', () => {
      // Haalt de waarde +1 als je op next drukt
      currentFishIndex = (currentFishIndex + 1) % totalFishCards;
      updateCarouselPositions();
    });
  }

  const imageModel = document.querySelector('.fish-image-modal');
  const closeImage = document.querySelector('.fish-image-close');
  const openImage = document.querySelector('.fish-image-full');
  const fishCardsTrack = document.querySelector('.fish-cards-track');

  if (fishCardsTrack) {
    fishCardsTrack.addEventListener('click', (event) =>  {
      const image = event.target.closest('.fish-preview');
      // closest() finds nearest matching ancestor (MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
      if (!image) return;

      if (!image.closest('.fish-card').classList.contains('active')) return;

      if (openImage) {
        openImage.src = image.src;
        openImage.alt = image.alt;
      }

      if (imageModel) {
        imageModel.classList.add('active-img');
      }
      document.body.style.overflow = "hidden";
    });
  }

  if (closeImage) {
    closeImage.addEventListener('click', () => {
      if (imageModel) {
        imageModel.classList.remove("active-img");
      }
      document.body.style.overflow = "scroll";
    });
  }

  initFishCarousel();
}

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const rawData = window.SERVER_VIS_DATA || [];

    const data = rawData.map((item) => ({
      ...item,
      created_at: item.created_at ? new Date(item.created_at) : null,
      // Date object usage (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
    }));

    if (data.length > 0) {
      fetchSnapshot(data);
    }
  });
}