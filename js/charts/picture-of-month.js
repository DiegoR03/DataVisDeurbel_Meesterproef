import { loadCsvData } from "../data/data-fetch.js";

export async function fetchSnapshot() {
    // feetch csv data and filter for snapshots
    const data = await loadCsvData("assets/data/website_event-week.csv");
    console.log(data);
    const fishSnapshots = data
    .filter(item => item.snapshot_url &&
                    item.fish_name &&
                    item.fish_name !== "Unknown" &&
                    item.fish_name !== "unknown" &&
                    item.fish_name !== "onbekend" &&
                    item.fish_name !== "Geen vis-event" &&
                    item.fish_name !== item.fish_name.includes(","))
    // Filter gemaakt met hulp van Victor in zijn workshop van week 2
    .filter(item => {
        const searchParams = new URLSearchParams(item.referrer_query);
        const likelyhoodOfFish = searchParams.get('likelyhoodOfFish');

        return parseFloat(likelyhoodOfFish) > 0.345;
    })
    .slice(0, 100);
    console.log("SNAPSHOTS:", fishSnapshots);

    // Render fishOptions to html from js
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
            li.classList.add('fish-item')
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

    const fishImages = document.querySelectorAll('.fish-image');
    const fishFeedbacks = [
        document.querySelector('.guess-fish-feedback'),
        document.querySelector('.guess-fish-feedback-popover')
    ];
    const fishButtons = document.querySelectorAll('.fish-icons-list li, .fish-icons-list-popover');

    let currentFish = null

    function getRandomFish() {
        const randomFish = Math.floor(Math.random() * fishSnapshots.length);

        currentFish = fishSnapshots[randomFish];

        fishImages.forEach(img => {
            img.src = currentFish.snapshot_url;
            img.alt = currentFish.fish_alt;
        });

        fishFeedbacks.forEach(feedback => {
            feedback.innerHTML = "";
        })
    }
    getRandomFish();

    fishButtons.forEach(button => {
        button.tabIndex = 0;

        function guessingFish() {
            const guessedFish = button.dataset.set;
            const actualFish = currentFish.fish_name;

            const isCorrect = guessedFish === actualFish;

            const message = isCorrect
                ? `Wat goed! Het was inderdaad een ${actualFish}`
                : `Helaas, het juiste antwoord was ${actualFish}`;

            fishFeedbacks.forEach(feedback => {
                feedback.innerHTML = message;
            });
            console.log(currentFish);

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
    const closePopover = document.querySelector('.close-popover');

    popOverContainer.style.display = "none";

    popOverButton.addEventListener('click', () => {
        popOverContainer.style.display = "flex";
    })

    closePopover.addEventListener("click", () => {
        popOverContainer.style.display = "none"
    })
}

fetchSnapshot();