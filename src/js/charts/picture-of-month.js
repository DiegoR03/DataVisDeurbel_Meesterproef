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
      </div>
        <div class="fish-facts-popover">
          <h2 class="fish-facts-name"></h2>
          <p class="fish-facts-activity"></p>
          <h3>Foto's van de vis</h3>
          <ul class="fish-facts-pictures"></ul>
          <h3 class="fish-facts-amount">Data..</h3>
          <h3>Data..</h3>
        </div>`;

      container.appendChild(li);
    });
  }

  const fishListDetails = document.querySelector(".fish-icons-details-list");
  renderFishDetails(fishListDetails);

  // popover for fish details
  const fishFactsPopOver = document.querySelector(".fish-facts-popover");
  const fishFactsButtons = document.querySelectorAll(".fish-icons-details-list li");
  const fishFactsClose = document.querySelector(".fish-facts-close");
  const fishFactsList = document.querySelector(".fish-facts-pictures");
  const popUpName = document.querySelector(".fish-facts-name");

  if (fishFactsPopOver) {

    fishFactsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const fishName = button.dataset.set;
        const fishCount = fishNumber[fishName] ?? 0;
        const currentFishPics = fishSnapshots.filter((snapshot) => snapshot.fish_name === fishName);

        const fishItem = button.closest(".fish-item");
        const popover = fishItem.querySelector(".fish-facts-popover");

        const isOpen = popover.classList.contains("active")

        // sluit de popovers die hiervoor open waren
        document.querySelectorAll('.fish-facts-popover').forEach(item => {
            item.classList.remove("active");
        });

        // sluit de huidig open optie
        if(isOpen) return;

        // plaats content in de elementen
        const title = popover.querySelector("p");

        title.textContent = fishName;
        const list = popover.querySelector(".fish-facts-list");

        if (list) {
          list.innerHTML = currentFishPics
            .map(fish => `<li><img src="${fish.snapshot_url}" alt=""${fishName}></li>`)
            .slice(0, 4)
            .join("");
        }

        // feit van wikepedia:
        // https://nl.wikipedia.org/wiki/Kolblei
        let fishFact = ""
        if(fishName === "Kolblei") {
          fishFact = "Deze zilverkleurige vis heeft een sterk zijdelings afgeplat lichaam met een bruingrijze rug. Hij heeft grote schubben. Het oog is relatief groot en kleurloos, de aanzet van de borstvinnen en buikvinnen is roodachtig."
        }

        const fact = document.querySelector('.fish-facts-activity');
        if(fact) {
          fact.textContent = fishFact;
        }

        if(!fact) {
          fact.textContent = "Geen informatie beschikbaar over deze vis";
        }

        // Toont hoeveel foto's er van elke vis is genomen
        const countEl = popover.querySelector(".fish-facts-amount");
        if (countEl) {
          countEl.textContent = `Er zijn ${fishCount} foto's van ${fishName}`;
        }

        popover.classList.toggle("active");
      });
    });
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
