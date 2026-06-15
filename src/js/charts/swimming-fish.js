// Summary of fish sizes
const fishScaleMap = {
    "Alver": 0.5,
    "Blankvoorn": 0.7,
    "Ruisvoorn": 0.7,
    "Kolblei": 0.8,
    "Baars": 0.9,
    "Winde": 1.0,
    "Brasem": 1.1,
    "Snoekbaars": 1.3,
    "Paling": 1.3,
    "Snoek": 1.6,
    "Meerval": 2.2
};

// Het overzicht van zwemsnelheden (basis tijd in seconden om het scherm over te steken)
// Let op: Lager getal = snellere vis!
const fishSpeedMap = {
    "Alver": 10,       // Heel snel, schiet voorbij
    "Blankvoorn": 12,  // Vlotte zwemmer
    "Ruisvoorn": 12,   // Vlotte zwemmer
    "Baars": 14,       // Actieve jager
    "Kolblei": 16,     // Gemiddeld
    "Winde": 18,       // Rustige zwemmer
    "Brasem": 20,      // Log en rustig
    "Snoekbaars": 22,  // Ligt vaak stil, zwemt traag voorbij
    "Snoek": 25,       // Grote vis, indrukwekkend tempo
    "Paling": 28,      // Kronkelt heel rustig over de bodem
    "Meerval": 35      // Gigantisch, dobbert als een onderzeeër voorbij
};

// Function to add fish to the main aquarium
export function addFishToAquarium(data, fishName, containerId, legendId, pngUrl) {
    // Filter the data for the specific fish
    const fishData = data.filter(item => item.fish_name === fishName);
    const totalSpotted = fishData.length;

    // Update the text in the legend above the aquarium
    const legendText = document.getElementById(legendId);
    if (legendText) {
        legendText.innerHTML = `
        <img src="${pngUrl}" alt="${fishName}" class="legend-fish-icon" />
        ${fishName} <span class="fish-count">${totalSpotted} x gespot</span>`;
    }

    // Calculate how many visual fish to render
    const MAX_VISUAL_FISH = 7;
    const DATA_MAXIMUM = 600;

    let fishToRender = Math.ceil((totalSpotted / DATA_MAXIMUM) * MAX_VISUAL_FISH);

    if (fishToRender === 0 && totalSpotted > 0) fishToRender = 1;
    if (fishToRender > MAX_VISUAL_FISH) fishToRender = MAX_VISUAL_FISH;

    // Find the main aquarium container
    const container = document.getElementById(containerId);
    if (!container) return;

    // Check eerst of onze custom tooltip al bestaat
    let tooltip = document.getElementById("custom-fish-tooltip");
    if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.id = "custom-fish-tooltip";
        tooltip.classList.add("custom-fish-tooltip");
        document.body.appendChild(tooltip);
    }

    // Generate and animate the fish
    for (let i = 0; i < fishToRender; i++) {
        const fishImg = document.createElement("img");
        fishImg.src = pngUrl;
        fishImg.classList.add("swimming-fish");


        fishImg.alt = `Zwemmende ${fishName}`;

        // Mouse enters fish, make visible
        fishImg.addEventListener("mouseenter", () => {
            tooltip.textContent = fishName;
            tooltip.classList.add("visible");
        });

        // Mouse hovers over fish, tooltip follows
        fishImg.addEventListener("mousemove", (e) => {
            tooltip.style.left = `${e.clientX}px`;
            tooltip.style.top = `${e.clientY}px`;
        });

        // Mouse leaves fish, make invisible
        fishImg.addEventListener("mouseleave", () => {
            tooltip.classList.remove("visible");
        });

       
        // Zoek de schaalfactor op (standaard 1.0 als we hem niet kennen)
        const scale = fishScaleMap[fishName] || 1.0;

        
        
        const baseSize = 70 + (Math.random() * 20 - 10);

        // Vermenigvuldig de basis met de schaal
        const finalSize = baseSize * scale;
        fishImg.style.width = `${finalSize}px`;
       

        // Randomize the vertical starting position
        const randomTop = 5 + Math.random() * 80;
        fishImg.style.top = `${randomTop}%`;

        // Randomize swimming speed
        // Zoek de basis-snelheid op (standaard 20 seconden als we hem niet kennen)
        const baseSpeed = fishSpeedMap[fishName] || 20;
        
        // Voeg een héél klein beetje willekeur toe (+ tussen de 0 en 5 seconden erbij)
        // Zo zwemmen twee Alvers niet exact even hard, wat er natuurlijker uitziet.
        const finalDuration = baseSpeed + (Math.random() * 5);
        
        fishImg.style.animationDuration = `${finalDuration}s`;

        // Randomize start delay
        const randomDelay = (Math.random() * 20) * -1;
        fishImg.style.animationDelay = `${randomDelay}s`;

        // Add the fish to the big aquarium!
        container.appendChild(fishImg);
    }
}

// Function to generate random air bubbles
export function createBubbles(containerId, amount) {
    const container = document.getElementById(containerId);
    if (!container) return;

    for (let i = 0; i < amount; i++) {
        const bubble = document.createElement("div");
        bubble.classList.add("bubble");

        // Randomize the size
        const size = 4 + Math.random() * 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Randomize horizontal position
        bubble.style.left = `${Math.random() * 100}%`;

        // Randomize floating speed
        const duration = 4 + Math.random() * 6;
        bubble.style.animationDuration = `${duration}s`;

        // Negative delay so they are already floating when the page loads
        const delay = (Math.random() * 10) * -1;
        bubble.style.animationDelay = `${delay}s`;

        // Add the bubble to the water
        container.appendChild(bubble);
    }
}


export function initAquarium(data) {
    if (!data || data.length === 0) return;

    const aquarium = document.getElementById("main-aquarium");
    const filterInputs = document.querySelectorAll('input[name="fish-filter"]');

    const fishSpecies = [
        { name: "Ruisvoorn", legendId: "legend-ruisvoorn", imgPath: "/img/ruisvoorn.png" },
        { name: "Baars", legendId: "legend-baars", imgPath: "/img/baars.png" },
        { name: "Paling", legendId: "legend-paling", imgPath: "/img/paling.png" },
        { name: "Alver", legendId: "legend-alver", imgPath: "/img/alver.png" },
        { name: "Blankvoorn", legendId: "legend-blankvoorn", imgPath: "/img/blankvoorn.png" },
        { name: "Brasem", legendId: "legend-brasem", imgPath: "/img/brasem.png" },
        { name: "Kolblei", legendId: "legend-kolblei", imgPath: "/img/kolblei.png" },
        { name: "Meerval", legendId: "legend-meerval", imgPath: "/img/meerval.png" },
        { name: "Snoek", legendId: "legend-snoek", imgPath: "/img/snoek.png" },
        { name: "Snoekbaars", legendId: "legend-snoekbaars", imgPath: "/img/snoekbaars.png" },
        { name: "Winde", legendId: "legend-winde", imgPath: "/img/winde.png" }
    ];

    // Calculate the top 3
    const fishWithCounts = fishSpecies.map(fish => {
        const count = data.filter(d => d.fish_name === fish.name).length;
        return { ...fish, count: count };
    });

    const sortedFish = [...fishWithCounts].sort((a, b) => b.count - a.count);
    const top3Fish = sortedFish.slice(0, 3); // Grab only the top 3

    // Function to draw the aquarium based on the choice
    function renderAquarium(mode) {
        if (!aquarium) return;

        // Add decorations
        aquarium.innerHTML = `
        <img src="/img/Stone_Wall_Background-2.jpg" alt="Canal wall" class="canal-wall">
        <img src="/img/fietsklein.png" alt="Verzonken fietswrak" class="bicycle-wreck">
        <img src="/img/Planten.png" alt="Waterplant" class="water-plant">
        <img src="/img/Planten.png" alt="Waterplant" class="water-plant plant-2">
        <img src="/img/Planten.png" alt="Waterplant" class="water-plant plant-3">
        <img src="/img/zadel.png" alt="Fietszadel" class="zadel">
        `;

        // Hide all legend items first
        fishSpecies.forEach(fish => {
            const legendEl = document.getElementById(fish.legendId);
            if (legendEl) legendEl.style.display = "none";
        });

        // Decide which list to draw
        const activeList = mode === "top3" ? top3Fish : fishSpecies;

        // Draw the selected list
        activeList.forEach(fish => {
            const legendEl = document.getElementById(fish.legendId);
            if (legendEl) legendEl.style.display = "flex"; // Show legend item

            // Because addFishToAquarium is in the same file, we can just call it directly!
            addFishToAquarium(data, fish.name, "main-aquarium", fish.legendId, fish.imgPath);
        });

        // Draw the bubbles again
        createBubbles("main-aquarium", 25);
    }

    // Listen to the input changes
    filterInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            renderAquarium(e.target.value);
        });
    });

    // Draw the aquarium for the first time (All fish)
    renderAquarium("all");
}