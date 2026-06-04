// Function to add fish to the main aquarium
export function addFishToAquarium(data, fishName, containerId, legendId, pngUrl) {
    // Filter the data for the specific fish
    const fishData = data.filter(item => item.fish_name === fishName);
    const totalSpotted = fishData.length;

    // Update the text in the legend above the aquarium
    const legendText = document.getElementById(legendId);
    if(legendText) {
        legendText.innerHTML = `
        <img src="${pngUrl}" alt="${fishName}" class="legend-fish-icon" />
        ${fishName} <span class="fish-count">${totalSpotted}</span>`;
    }

    // Calculate how many visual fish to render
    const MAX_VISUAL_FISH = 6; 
    const DATA_MAXIMUM = 800;

    let fishToRender = Math.ceil((totalSpotted / DATA_MAXIMUM) * MAX_VISUAL_FISH);
    
    if (fishToRender === 0 && totalSpotted > 0) fishToRender = 1;
    if (fishToRender > MAX_VISUAL_FISH) fishToRender = MAX_VISUAL_FISH;

    // Find the main aquarium container
    const container = document.getElementById(containerId);
    if (!container) return; 

    // Generate and animate the fish
    for (let i = 0; i < fishToRender; i++) {
        const fishImg = document.createElement("img");
        fishImg.src = pngUrl;
        fishImg.classList.add("swimming-fish");
        
        // Randomize the size
        const randomSize = 40 + Math.random() * 40;
        fishImg.style.width = `${randomSize}px`;

        // Randomize the vertical starting position
        const randomTop = 5 + Math.random() * 80;
        fishImg.style.top = `${randomTop}%`;

        // Randomize swimming speed
        const randomDuration = 15 + Math.random() * 20;
        fishImg.style.animationDuration = `${randomDuration}s`;

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