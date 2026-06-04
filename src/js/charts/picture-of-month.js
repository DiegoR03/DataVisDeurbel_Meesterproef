export async function fetchSnapshot(data) {
    if (!data || data.length === 0) {
        return;
    }
    const fishSnapshots = data
    .filter(item => item.snapshot_url &&
                    item.fish_name &&
                    item.fish_name !== "Unknown" &&
                    item.fish_name !== "unknown" &&
                    item.fish_name !== "onbekend" &&
                    !item.fish_name.includes(","))
    console.log("SNAPSHOTS:", fishSnapshots);
    if (fishSnapshots.length === 0) {
        console.warn("Geen geldige vis-snapshots gevonden met likelyhoodOfFish > 0.34");
        return;
    }

    const fishNumber = {};

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for
    for (const snapshot of fishSnapshots) {
        const fishName = snapshot.fish_name;

        if (!fishName) continue;
        if (fishName.includes(",")) continue;

        // Filter gemaakt met hulp van Victor in zijn workshop van week 2
        const queryString = snapshot.url_query || snapshot.referrer_query;
        if (!queryString) continue;

        const searchParams = new URLSearchParams(queryString);
        const likelyhoodOfFish = parseFloat(searchParams.get('likelyhoodOfFish'));

        if (!likelyhoodOfFish || likelyhoodOfFish <= 0.345) continue;

        // // get the total amount of snapshots taken for each fish
        fishNumber[fishName] = (fishNumber[fishName] || 0) + 1;
    }

    // render fish icons to html 
    const fishOptions = [
        {name: "Kolblei", img: "/img/fish-1.png"},
        {name: "Snoek", img: "/img/fish-2.png"},
        {name: "Alver", img: "/img/fish-3.png"},
        {name: "Baars", img: "/img/fish-4.png"},
        {name: "Blankvorn", img: "/img/fish-5.png"},
        {name: "Snoekbaars", img: "/img/fish-6.png"},
        {name: "Meerval", img: "/img/fish-7.png"},
        {name: "Winde", img: "/img/fish-8.png"},
        {name: "Brasem", img: "/img/fish-9.png"},
        {name: "Paling", img: "/img/fish-10.png"},
        {name: "Ruisvoorn", img: "/img/fish-11.png"}
    ];

    function renderFishList(container) {
        if (!container) return;
        container.innerHTML = "";

        fishOptions.forEach((fish) => {
            const li = document.createElement('li');
            li.classList.add('fish-item');
            li.dataset.set = fish.name;
            li.tabIndex = 0;

            li.innerHTML =
            `<img src="${fish.img}" alt="picture of ${fish.name}">
            <p>${fish.name}</p>`;

            container.appendChild(li);
        });
    }

    // put rendered html in ul's
    const fishListGame = document.querySelector('.fish-icons-game-list');
    const fishListDetails = document.querySelector('.fish-icons-details-list')
    const fishListMobile = document.querySelector('.fish-icons-list-popover');
    renderFishList(fishListGame);
    renderFishList(fishListDetails);
    renderFishList(fishListMobile);

    const fishImages = document.querySelectorAll('.fish-image');
    const fishFeedbacks = [
        document.querySelector('.guess-fish-feedback'),
        document.querySelector('.guess-fish-feedback-popover')
    ].filter(Boolean); 

    let currentFish = null;

    // generate random img
    function getRandomFish() {
        fishSnapshots.slice(0, 100)
        const randomFish = Math.floor(Math.random() * fishSnapshots.length);
        currentFish = fishSnapshots[randomFish];

        fishImages.forEach(img => {
            img.src = currentFish.snapshot_url;
            img.alt = currentFish.fish_alt || "Raad de vis";
        });

        fishFeedbacks.forEach(feedback => {
            feedback.innerHTML = "";
        });
    }
    getRandomFish();

    // make fish icons interactive
    const fishButtons = document.querySelectorAll('.fish-icons-list li, .fish-icons-list-popover li');
    fishButtons.forEach(button => {
        button.tabIndex = 0;

        function guessingFish() {
            const guessedFish = button.dataset.set;
            const actualFish = currentFish.fish_name;
            const isCorrect = guessedFish.toLowerCase() === actualFish.toLowerCase();

            const message = isCorrect
                ? `Wat goed! Het was inderdaad een ${actualFish}`
                : `Helaas, het juiste antwoord was ${actualFish}`;

            fishFeedbacks.forEach(feedback => {
                feedback.innerHTML = message;
            });

            setTimeout(() => {
                getRandomFish();
            }, 1200);
        }

        button.addEventListener("click", () => {
            guessingFish();
        });

        button.addEventListener('keydown', (event) => {
            if(event.key === "Enter") {
                event.preventDefault();
                guessingFish();
            }
        });
    });

    // usability on keyboard for answers
    let currentIndex = 0;
    if (fishButtons.length > 0) {
        fishButtons[currentIndex].focus();
    }

    document.addEventListener("keydown", (event) => {
        if(!fishButtons.length) return;

        if(event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            currentIndex = (currentIndex + 1) % fishButtons.length;
            fishButtons[currentIndex].focus();
        }

        if(event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            currentIndex = (currentIndex - 1 + fishButtons.length) % fishButtons.length;
            fishButtons[currentIndex].focus();
        }
    });

    // popover container for guessing game
    const popOverContainer = document.querySelector('.popover-container');
    const popOverButton = document.querySelector('.popover-button');
    const closePopover = document.querySelector('.close-popover');

    if (popOverContainer && popOverButton && closePopover) {
        popOverContainer.style.display = "none";

        popOverButton.addEventListener('click', () => {
            popOverContainer.style.display = "flex";
        });

        closePopover.addEventListener("click", () => {
            popOverContainer.style.display = "none";
        });
    }

    // popover for fish details
    // open and close popover
    const fishFactsPopOver = document.querySelector('.fish-facts-popover');
    const fishFactsButtons = document.querySelectorAll('.fish-icons-details-list li');
    const fishFactsClose = document.querySelector('.fish-facts-close');
    const fishFactsList = document.querySelector('.fish-facts-recent-pictures');
    const popUpName = document.querySelector('.fish-facts-name');

    if (fishFactsPopOver) {
        fishFactsPopOver.style.display = "none";

        fishFactsButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fishName = button.dataset.set;
                popUpName.textContent = fishName;
                const fishImg = fishOptions.find(fish => fish.name === fishName);
                const fishCount = fishNumber[fishName] || 0;
                const fishFactAmount = document.querySelector('.fish-facts-amount');

                fishFactAmount.textContent = `Er zijn in totaal ${fishCount} foto's gemaakt van de ${fishName}`;
               
                fishFactsList.innerHTML = "";

                const currentFishPics = fishSnapshots.filter(snapshot => snapshot.fish_name === fishName)
                fishFactsList.innerHTML = currentFishPics
                .map(fish => {
                    return `<li><img src="${fish.snapshot_url}" alt="${fishName}"></li>`
                })
                .join("")
                
                console.log("FISH:")
                fishFactsPopOver.style.display = "grid";
            })
        })

        fishFactsClose.addEventListener('click', () => {
            fishFactsPopOver.style.display = "none"
        })
    }
}