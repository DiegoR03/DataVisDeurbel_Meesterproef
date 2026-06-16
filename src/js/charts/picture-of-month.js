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
      // tabindex makes element focusable (MDN: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex)

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

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      // preventDefault stops browser default scroll behavior (MDN: https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)

      currentIndex = (currentIndex + 1) % fishButtons.length;
      fishButtons[currentIndex].focus();
      // focus() moves keyboard focus (MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)
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

      li.innerHTML =
      `<div class="fish-facts-tag">
        <img src="${fish.img}" alt="picture of ${fish.name}">
        <p>${fish.name}</p>
      </div>`;

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

  const fishTag = document.querySelectorAll('.fish-facts-tag');

  const fishFacts = {
  kolblei: {
      fact: "Deze zilverkleurige vis heeft een sterk zijdelings afgeplat lichaam met een bruingrijze rug. Hij heeft grote schubben. Het oog is relatief groot en kleurloos, de aanzet van de borstvinnen en buikvinnen is roodachtig.",
      activeTime: "18:00",
      size: "15 tot 25",
    },
    snoek: {
      fact: "De snoek is een grote zoetwatervis uit de familie van de snoeken (Esocidae). Het is een van de roofvissen die in België en Nederland voorkomt. De snoek is daarnaast in delen van Europa, Azië en Noord-Amerika te vinden.[2] Snoeken kunnen vijftien jaar oud worden.",
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

  function showFishDetails(fishName) {
    // optional chaining (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)

    const currentFishPics = fishSnapshots.filter((snapshot) => snapshot.fish_name === fishName);

    if (fishNameEl) {
      fishNameEl.textContent = fishName;
    }

    const fishData = fishFacts?.[fishName?.trim().toLowerCase()];

    if (aboutFishEl) {
        aboutFishEl.textContent = fishData?.fact ?? "Geen informatie beschikbaar over deze vis.";
        // nullish coalescing (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
    }

    if (smallFishFacts) {
      smallFishFacts.innerHTML = `
        <li><h3>Vis-feitjes</h3></li>
        <li><p>De ${fishName} is het meest actief rond ${fishData?.activeTime ?? "onbekend"}</p></li>
        <li><p>${fishName} word gemiddeld ${fishData?.size ?? "onbekend"} cm</p></li>
        `;
    }


    if (fishPicturesEl) {
      fishPicturesEl.innerHTML = currentFishPics
        .slice(0, 4)
        .map(fish =>`<li><img class="fish-preview" src="${fish.snapshot_url}" alt="${fishName}"></li>`)
        .join("");
      // map() transforms arrays (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
      // join() converts array -> string (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join)
    }

    if(fishName === "Kolblei") {
      fishPicturesEl.innerHTML = `
        <li><img class="fish-preview" src="https://blub-blub.b-cdn.net/fish-2026/05/20260504-083511.jpeg" alt="${fishName}"></li>
        <li><img class="fish-preview" src="https://blub-blub.b-cdn.net/fish-2026/05/20260503-113552.jpeg" alt="${fishName}"></li>
        <li><img class="fish-preview" src="https://blub-blub.b-cdn.net/fish-2026/05/20260502-071753.jpeg" alt="${fishName}"></li>
        <li><img class="fish-preview" src="https://blub-blub.b-cdn.net/fish-2026/05/20260501-201012.jpeg" alt="${fishName}"></li>
      `
    }

    fishFactsPopOver.classList.add("active");
  }

  const imageModel = document.querySelector('.fish-image-modal');
  const closeImage = document.querySelector('.fish-image-close');
  const openImage = document.querySelector('.fish-image-full');

  fishPicturesEl.addEventListener('click', (event) =>  {
    const image = event.target.closest('.fish-preview');
    // closest() finds nearest matching ancestor (MDN: https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

    console.log(image);

    if(!image) return;

    openImage.src = image.src;
    openImage.alt = image.alt;

    imageModel.classList.add('active-img');
    document.body.style.overflow = "hidden"
    // DOM style manipulation (MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)
  });

  closeImage.addEventListener('click', () => {
    imageModel.classList.remove("active-img");
    document.body.style.overflow = "scroll";
  });

  fishFactsButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const fishName = button.dataset.set;

      document.querySelectorAll('.fish-facts-tag').forEach(item => {
        item.classList.remove('fish-tag-green');
      });

      button.querySelector('.fish-facts-tag')?.classList.add('fish-tag-green');

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
      // Date object usage (MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
    }));

    if (data.length > 0) {
      fetchSnapshot(data);
    }
  });
}