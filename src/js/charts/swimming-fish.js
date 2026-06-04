/* =========================================
   js/charts/swimming-fish.js
   ========================================= */

// Function to add fish to the main aquarium
export function addFishToAquarium(data, fishName, containerId, legendId, pngUrl) {
    // 1. Filter the data for the specific fish
    const fishData = data.filter(item => item.fish_name === fishName);
    const totalSpotted = fishData.length;

    // 2. Update the text in the legend above the aquarium
    const legendText = document.getElementById(legendId);
    if(legendText) {
        legendText.innerHTML = `
        <img src="${pngUrl}" alt="${fishName}" class="legend-fish-icon" />
        ${fishName} <span class="fish-count">${totalSpotted}</span>`;
    }

    // 3. Calculate how many visual fish to render
    const MAX_VISUAL_FISH = 6; 
    const DATA_MAXIMUM = 800;

    let fishToRender = Math.ceil((totalSpotted / DATA_MAXIMUM) * MAX_VISUAL_FISH);
    
    if (fishToRender === 0 && totalSpotted > 0) fishToRender = 1;
    if (fishToRender > MAX_VISUAL_FISH) fishToRender = MAX_VISUAL_FISH;

    // 4. Find the main aquarium container
    const container = document.getElementById(containerId);
    if (!container) return; 

    // 5. Generate and animate the fish
    for (let i = 0; i < fishToRender; i++) {
        const fishImg = document.createElement("img");
        fishImg.src = pngUrl;
        fishImg.classList.add("swimming-fish");
        
        // Randomize the size of the fish slightly for more realism (between 40px and 80px)
        const randomSize = 40 + Math.random() * 40;
        fishImg.style.width = `${randomSize}px`;

        // Randomize the vertical starting position (between 5% and 85% from top)
        const randomTop = 5 + Math.random() * 80;
        fishImg.style.top = `${randomTop}%`;

        // Randomize swimming speed. Bigger aquarium = longer time to cross (15 to 35 seconds)
        const randomDuration = 15 + Math.random() * 20;
        fishImg.style.animationDuration = `${randomDuration}s`;

        // Randomize start delay so they don't all spawn at once
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

        // Randomize the size (between 4px and 14px)
        const size = 4 + Math.random() * 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;

        // Randomize horizontal position (0% to 100% width of the tank)
        bubble.style.left = `${Math.random() * 100}%`;

        // Randomize floating speed (between 4 and 10 seconds)
        const duration = 4 + Math.random() * 6;
        bubble.style.animationDuration = `${duration}s`;
        
        // Negative delay so they are already floating when the page loads
        const delay = (Math.random() * 10) * -1;
        bubble.style.animationDelay = `${delay}s`;

        // Add the bubble to the water
        container.appendChild(bubble);
    }
}