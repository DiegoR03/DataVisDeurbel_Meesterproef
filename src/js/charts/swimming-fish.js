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
        legendText.innerHTML = `${fishName} <span class="fish-count">${totalSpotted}</span>`;
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