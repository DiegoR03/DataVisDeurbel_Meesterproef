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
                    item.fish_name !== "Geen vis-event" &&
                    item.fish_name !== ",")
    .filter(item => {
        const queryString = item.url_query || item.referrer_query;
        const searchParams = new URLSearchParams(queryString);
        const likelyhoodOfFish = searchParams.get('likelyhoodOfFish');

        return parseFloat(likelyhoodOfFish) > 0.34;
    })
    .slice(0, 100);
    
    console.log("SNAPSHOTS:", fishSnapshots);

    if (fishSnapshots.length === 0) {
        console.warn("Geen geldige vis-snapshots gevonden met likelyhoodOfFish > 0.34");
        return;
    }

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

    const fishList = document.querySelector('.fish-icons-list');
    const fishListMobile = document.querySelector('.fish-icons-list-popover');
    renderFishList(fishList);
    renderFishList(fishListMobile);

    const fishImages = document.querySelectorAll('.fish-image');
    const fishFeedbacks = [
        document.querySelector('.guess-fish-feedback'),
        document.querySelector('.guess-fish-feedback-popover')
    ].filter(Boolean); 

    const fishButtons = document.querySelectorAll('.fish-icons-list li, .fish-icons-list-popover li');

    let currentFish = null;

    function getRandomFish() {
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
}