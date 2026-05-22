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
    console.log(fishSnapshots)

    const snapshotList = document.getElementById('fish-piture-list');

    snapshotList.innerHTML = fishSnapshots
        .map(item =>
            `<li class="snapshot-li">
                <figure>
                    <img    class="snapshot-img"
                            src="${item.snapshot_url}"
                            alt="snapshot-of-${item.fish_name}"
                            data-fish="${item.fish_name}"
                            data-date="${item.created_at}">
                </figure>
            </li>
        `)
        .join("");


    const fishTip = document.getElementById("fish-tip");

    const fishPopup = document.querySelector('.fish-picture-popup');
    const fishPopupImg = document.querySelector('.fish-popup-img');
    const fishPopupHeader = document.querySelector('.fish-popup-name');
    const fishPopupButton = document.querySelector('.fish-popup-button')

    // Showcase the name of the fish on hover 
    document.querySelectorAll('.snapshot-img').forEach(img => {
        img.addEventListener("mouseenter", (event) => {
            const fishName = img.dataset.fish;

            fishTip.style.display = "block";
            fishTip.innerHTML =
            `<strong>${fishName}</strong>`
        })

        img.addEventListener("mousemove", (event) => {
            fishTip.style.left = `${event.pageX + 15}px`
            fishTip.style.top = `${event.pageY - 40}px`
        })

        img.addEventListener("mouseleave", (event) => {
            fishTip.style.display = "none"
        })

        img.addEventListener('click', (event) => {
            const fishTitle = img.dataset.fish;
            const snapshotDate = img.dataset.date;

            fishPopup.style.display = "flex";
            fishPopupButton.style.display = "flex";
            fishPopup.classList.add('fish-picture-slide-popup')

            fishPopupImg.src = img.src;
            fishPopupImg.alt = img.alt;

            fishPopupHeader.innerHTML = 
            `
            <h3>${fishTitle} - ${snapshotDate}</h3>
            `;
        })
    })

    fishPopupButton.addEventListener('click', () => {
        fishPopup.style.display = "none";
        fishPopupButton.style.display = "none"
    })

}

fetchSnapshot();