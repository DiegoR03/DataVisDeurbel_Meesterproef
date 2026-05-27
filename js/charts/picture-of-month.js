import { loadCsvData } from "../data/data-fetch.js";

export async function fetchSnapshot() {
    const data = await loadCsvData("assets/data/website_event-week.csv");

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
    .slice(0, 40);

    const fishPopup = document.querySelector('.fish-picture-popup');
    const fishPopupButton = document.querySelector('.fish-popup-button');

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
        button.addEventListener("click", () => {
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
        })
    })
}

fetchSnapshot();