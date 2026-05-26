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

    // const snapshotList = document.getElementById('fish-picture-list');

    // snapshotList.innerHTML = fishSnapshots
    //     .map(item =>
    //         `<li class="snapshot-li">
    //             <img    class="snapshot-img"
    //                     src="${item.snapshot_url}"
    //                     alt="snapshot-of-${item.fish_name}"
    //                     data-fish="${item.fish_name}"
    //                     data-date="${item.created_at}">
    //         </li>
    //     `)
    //     .join("");


    const fishPopup = document.querySelector('.fish-picture-popup');
    const fishPopupButton = document.querySelector('.fish-popup-button');

    const fishImg = document.getElementById('fish-image');

    let currentFish = null

    function getRandomFish() {
        const randomFish = Math.floor(Math.random() * fishSnapshots.length);

        currentFish = fishSnapshots[randomFish];

        fishImg.src = currentFish.snapshot_url;
        fishImg.alt = currentFish.alt

    }


    fishPopupButton.addEventListener('click', () => {
        fishPopup.style.display = "none";
        fishPopupButton.style.display = "none"
    })

}

fetchSnapshot();