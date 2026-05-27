import { loadCsvData } from "../data/data-fetch.js";

export async function fetchSnapshot() {
    const data = await loadCsvData("assets/data/website_event-week.csv");

    const fishOptions = [
        {name: "Kolblei", img: "./assets/img/fish-1.png"},
        {name: "Snoek", img: "./assets/img/fish-2.png"},
        {name: "Alver", img: "./assets/img/fish-3.png"},
        {name: "Baars", img: "./assets/img/fish-4.png"},
        {name: "Blankvorn", img: "./assets/img/fish-5.png"},
        {name: "Snoekbaars", img: "./assets/img/fish-6.png"},
        {name: "Meerval", img: "./assets/img/fish-7.png"},
        {name: "Winde", img: "./assets/img/fish-8.png"},
        {name: "Brasem", img: "./assets/img/fish-9.png"},
        {name: "Paling", img: "./assets/img/fish-10.png"},
        {name: "Ruisvoorn", img: "./assets/img/fish-11.png"}
    ];

    function renderFishList(container) {
        container.innerHTML = "";

        fishOptions.forEach((fish) => {
            const li = document.createElement('li');
            li.dataset.set = fish.name;
            li.tabIndex = 0;

            li.innerHTML =
            `<img src="${fish.img}" alt="picture of ${fish.name}">
            <p>${fish.name}</p>`;

            container.appendChild(li);
        })
    }

    const fishList = document.querySelector('.fish-icons-list');
    const fishListMobile = document.querySelector('.fish-icons-list-popover');
    renderFishList(fishList);
    renderFishList(fishListMobile);

    const snapshot = data
    .map(item =>item.snapshot_url)
    .filter(Boolean)
    .slice(0, 40)
    console.log("SNAPSHOTS:", snapshot);

    const fishSnapshots = data
    .filter(item => item.snapshot_url &&
                    item.fish_name &&
                    item.fish_name !== "Unknown" &&
                    item.fish_name !== "unknown" &&
                    item.fish_name !== "onbekend" &&
                    item.fish_name !== "Geen vis-event")
    .slice(0, 100);

    const fishImg = document.getElementById('fish-image');
    const fishFeedback = document.querySelector('.guess-fish-feedback')
    const fishButtons = document.querySelectorAll('.fish-icons-list li');

    let currentFish = null

    function getRandomFish() {
        const randomFish = Math.floor(Math.random() * fishSnapshots.length);

        currentFish = fishSnapshots[randomFish];

        fishImg.src = currentFish.snapshot_url;
        fishImg.alt = currentFish.fish_alt;

        fishFeedback.innerHTML = "";
    }
    getRandomFish();

    fishButtons.forEach(button => {
        button.tabIndex = 0;

        function guessingFish() {
            const guessedFish = button.dataset.set;
            const actualFish = currentFish.fish_name;

            const isCorrect = guessedFish.toLowerCase() === actualFish.toLowerCase();

            if(isCorrect) {
                fishFeedback.innerHTML = `Wat goed! het was inderdaad een ${actualFish}`;
            } else {
                fishFeedback.innerHTML = `Jammer, het juiste antwoord was ${actualFish}`;
            }

            setTimeout(() => {
                getRandomFish();
            }, 1200);
        }

        button.addEventListener("click", () => {
            guessingFish();
        })

        button.addEventListener('keydown', (event) => {
            if(event.key === "Enter") {
                event.preventDefault();
                guessingFish();
            }
        })
    })

    let currentIndex = 0;
    fishButtons[currentIndex].focus();

    document.addEventListener("keydown", (event) => {
        if(!fishButtons.length) return;

        if(event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            currentIndex = (currentIndex + 1) % fishButtons.length;
            fishButtons[currentIndex].focus()
        }

        if(event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            currentIndex = (currentIndex - 1 + fishButtons.length) % fishButtons.length;

            fishButtons[currentIndex].focus();
        }
    })

    // popover

    const popOverContainer = document.querySelector('.popover-container');
    const popOverButton = document.querySelector('.popover-button');

    popOverContainer.style.display = "none";

    popOverButton.addEventListener('click', () => {
        popOverContainer.style.display = "flex";
    })
    
}

fetchSnapshot();