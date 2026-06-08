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
    console.warn(
      "Geen geldige vis-snapshots gevonden met likelyhoodOfFish > 0.34",
    );
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

  // put rendered html in ul's
  const fishListGame = document.querySelector(".fish-icons-game-list");
  const fishListDetails = document.querySelector(".fish-icons-details-list");
  const fishListMobile = document.querySelector(".fish-icons-list-popover");
  renderFishList(fishListGame);
  renderFishList(fishListDetails);
  renderFishList(fishListMobile);

  const fishImages = document.querySelectorAll(".fish-image");
  const fishFeedbacks = [
    document.querySelector(".guess-fish-feedback"),
    document.querySelector(".guess-fish-feedback-popover"),
  ].filter(Boolean);

  let currentFish = null;

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

  const fishButtons = document.querySelectorAll(
    ".fish-icons-list li, .fish-icons-list-popover li",
  );

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

  let currentIndex = 0;

  document.addEventListener("keydown", (event) => {
    if (!fishButtons.length) return;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      currentIndex = (currentIndex + 1) % fishButtons.length;
      fishButtons[currentIndex].focus();
    }
  });

  // popover for fish details
  // open and close popover
  const fishFactsPopOver = document.querySelector(".fish-facts-popover");
  const fishFactsButtons = document.querySelectorAll(
    ".fish-icons-details-list li",
  );
  const fishFactsClose = document.querySelector(".fish-facts-close");
  const fishFactsList = document.querySelector(".fish-facts-pictures");
  const popUpName = document.querySelector(".fish-facts-name");

  if (fishFactsPopOver) {
    fishFactsPopOver.style.display = "none";

    fishFactsButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const fishName = button.dataset.set;
        popUpName.textContent = fishName;
        const fishImg = fishOptions.find((fish) => fish.name === fishName);
        const fishCount = fishNumber[fishName] || 0;
        const fishFactAmount = document.querySelector(".fish-facts-amount");

        fishFactAmount.textContent = `Er zijn in totaal ${fishCount} foto's gemaakt van de ${fishName}`;

        const currentFishPics = fishSnapshots.filter(
          (snapshot) => snapshot.fish_name === fishName,
        );
        fishFactsList.innerHTML = currentFishPics
          .map((fish) => {
            return `<li><img src="${fish.snapshot_url}" alt="${fishName}"></li>`;
          })
          .slice(0, 4)
          .join("");

        console.log("popOver of:", fishName, currentFishPics.length);
        fishFactsPopOver.style.display = "grid";
        document.body.style.overflow = "hidden";
      });
    });

    fishFactsClose.addEventListener("click", () => {
      fishFactsPopOver.style.display = "none";
      document.body.style.overflow = "auto";
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
