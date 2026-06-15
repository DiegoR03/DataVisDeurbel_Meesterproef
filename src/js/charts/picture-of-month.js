function fetchSnapshot(data) {
  if (!data || data.length === 0) {
    return;
  }
  const fishSnapshots = data.filter(
    (item) =>
      item.snapshot_url &&
      item.fish_name &&
      item.fish_name !== "Unknown" &&
      item.fish_name !== "unknown" &&
      item.fish_name !== "onbekend" &&
      !item.fish_name.includes(","),
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

    // Filter gemaakt met hulp van Victor in zijn workshop van week 2
    const queryString = snapshot.url_query || snapshot.referrer_query;
    if (!queryString) continue;

    const searchParams = new URLSearchParams(queryString);
    const likelyhoodOfFish = parseFloat(searchParams.get("likelyhoodOfFish"));

    if (!likelyhoodOfFish || likelyhoodOfFish <= 0.345) continue;

    // // get the total amount of snapshots taken for each fish
    fishNumber[fishName] = (fishNumber[fishName] || 0) + 1;
  }
  console.log("fish count", fishNumber);

  // render fish icons to html
  const fishOptions = [
    { name: "Kolblei", img: "/img/kolblei.png" },
    { name: "Snoek", img: "/img/snoek.png" },
    { name: "Alver", img: "/img/alver.png" },
    { name: "Baars", img: "/img/baars.png" },
    { name: "Blankvorn", img: "/img/blankvoorn.png" },
    { name: "Snoekbaars", img: "/img/snoekbaars.png" },
    { name: "Meerval", img: "/img/meerval.png" },
    { name: "Winde", img: "/img/winde.png" },
    { name: "Brasem", img: "/img/brasem.png" },
    { name: "Paling", img: "/img/paling.png" },
    { name: "Ruisvoorn", img: "/img/ruisvoorn.png" },
  ];

  // render de html voor ul's met de bovenstaande afbeeldingen
  function renderFishList(container) {
    if (!container) return;
    container.innerHTML = "";

    fishOptions.forEach((fish) => {
      const li = document.createElement("li");
      li.classList.add("fish-item");
      li.dataset.set = fish.name;
      li.tabIndex = 0;

      li.innerHTML = `<img src="${fish.img}" alt="picture of ${fish.name}">
            <p>${fish.name}</p>`;

      container.appendChild(li);
    });
  }

  // render raadt de vis spel opties in html
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

  // willekeurige vis ophalen functie
  function getRandomFish() {
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

  // optie klkkken om vis te raden
  fishButtons.forEach((button) => {
    button.tabIndex = 0;

    function guessingFish() {
      const guessedFish = button.dataset.set;
      const actualFish = currentFish.fish_name;
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
    }

    button.addEventListener("click", guessingFish);
  });

  // klein scherm popover van raadt de vis
  const popOverContainer = document.querySelector(".popover-container");
  const popOverButton = document.querySelector(".popover-button");
  const closePopover = document.querySelector(".close-popover");


  if (popOverContainer && popOverButton && closePopover) {
    popOverContainer.style.display = "none";

    popOverButton.addEventListener("click", () => {
      popOverContainer.style.display = "flex";

      document.body.style.overflow = "hidden";
    });

    closePopover.addEventListener("click", () => {
      popOverContainer.style.display = "none";

      document.body.style.overflow = "auto";
    });
  }

  // raadt de vis, keuzes toegankelijk door toetsenbord navigatie
  let currentIndex = 0;

  document.addEventListener("keydown", (event) => {
    if (!fishButtons.length) return;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      currentIndex = (currentIndex + 1) % fishButtons.length;
      fishButtons[currentIndex].focus();
    }
  });

  // render fish-details html 
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
  // renderFishDetails(fishListDetails);

  // All fish buttons in the list
  const fishFactsButtons = document.querySelectorAll(".fish-icons-details-list li");

  // container van vis- feitjes en foto's
  const fishFactsPopOver = document.querySelector(".fish-facts-popover");

  // Elements inside the detail container
  const fishNameEl = document.querySelector(".fish-facts-name");
  const fishActivityEl = document.querySelector(".fish-facts-activity");
  const fishPicturesEl = document.querySelector(".fish-facts-pictures");
  const fishAmountEl = document.querySelector(".fish-facts-amount");

  const fishTag = document.querySelectorAll('.fish-facts-tag');

  // Feitjes van elke vis
  // https://nl.wikipedia.org/wiki/Kolblei / https://nl.wikipedia.org/wiki/Snoek / https://nl.wikipedia.org/wiki/Baars / https://nl.wikipedia.org/wiki/Alver
  const fishFacts = {
    Kolblei: "Deze zilverkleurige vis heeft een sterk zijdelings afgeplat lichaam met een bruingrijze rug. Hij heeft grote schubben. Het oog is relatief groot en kleurloos, de aanzet van de borstvinnen en buikvinnen is roodachtig.",
    Snoek: "De snoek is een grote zoetwatervis uit de familie van de snoeken (Esocidae). Het is een van de roofvissen die in België en Nederland voorkomt. De snoek is daarnaast in delen van Europa, Azië en Noord-Amerika te vinden.[2] Snoeken kunnen vijftien jaar oud worden.",
    Baars: "De Baars, ook wel Europese baars of rivierbaars genoemd, is een vis uit de familie echte baarzen, die van nature in de Benelux voorkomt. Verwanten van deze soort zijn onder andere de snoekbaars en de pos.",
    Alver: "De alver is een zoetwatervis die behoort tot de eigenlijke karpers. Hij is ook bekend onder de namen: moertje, alvenaar, alfje, alft, nesteling en panharing en in Vlaanderen als schieter, spekje of ablette.",
  };

  // UPDATE DETAIL PANEL
  function showFishDetails(fishName) {
    // Get amount of snapshots for this fish
    const fishCount = fishNumber[fishName] ?? 0;

    // filter snapshots naar dezelfde vis
    const currentFishPics = fishSnapshots.filter((snapshot) => snapshot.fish_name === fishName);

    // Update fish name
    if (fishNameEl) {
      fishNameEl.textContent = fishName;
    }

    // Update fish fact
    if (fishActivityEl) {
      fishActivityEl.textContent = fishFacts[fishName] ?? "Geen informatie beschikbaar over deze vis.";}

    // Update fish images
    if (fishPicturesEl) {
      fishPicturesEl.innerHTML = currentFishPics
        .slice(0, 4)
        .map(fish =>
            `<li><img src="${fish.snapshot_url}" alt="${fishName}"></li>`)
        .join("");
    }
    if(fishName === "Kolblei") {
      fishPicturesEl.innerHTML = `
        <li><img src="https://blub-blub.b-cdn.net/fish-2026/05/20260504-083511.jpeg" alt="${fishName}"></li>
        <li><img src="https://blub-blub.b-cdn.net/fish-2026/05/20260503-113552.jpeg" alt="${fishName}"></li>
        <li><img src="https://blub-blub.b-cdn.net/fish-2026/05/20260502-071753.jpeg" alt="${fishName}"></li>
        <li><img src="https://blub-blub.b-cdn.net/fish-2026/05/20260501-201012.jpeg" alt="${fishName}"></li>
      `
    }

    // Update amount text
    if (fishAmountEl) {
        fishAmountEl.textContent = `Er zijn ${fishCount} foto's van ${fishName}`;
      }

    fishFactsPopOver.classList.add("active");
  }

  // CLICK EVENTS
  fishFactsButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const fishName = button.dataset.set;

      // verander geselecteerde knop van kleur
      document.querySelectorAll('.fish-facts-tag').forEach(item => {
        item.classList.remove('fish-tag-green');
      })

      button.querySelector('.fish-facts-tag')?.classList.add('fish-tag-green');

      // Update the detail panel
      showFishDetails(fishName);
    });
  });

  // SHOW FIRST FISH BY DEFAULT
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
    }));

    if (data.length > 0) {
      fetchSnapshot(data);
    }
  });
}
