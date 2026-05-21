import { loadCsvData } from "../data/data-fetch.js";

export async function fetchSnapshot() {
    const data = await loadCsvData("assets/data/website_event-week.csv");

    const snapshot = data
    .map(item =>item.snapshot_url)
    .filter(Boolean)
    .slice(0, 40)
    console.log("SNAPSHOTS:", snapshot);

    const fishSnapshots = data
    .filter(item => item.snapshot_url && item.fish_name && item.fish_name !== "Unknown" && item.fish_name !== "Geen vis-event")
    .slice(0, 40);
    console.log(fishSnapshots)

    const snapshotList = document.getElementById('fish-piture-list');

    snapshotList.innerHTML = fishSnapshots
        .map(item =>
            `<li class="snapshot-li">
                <figure>
                    <img class="snapshot-img" src="${item.snapshot_url}" alt="snapshot-of-${item.fish_name}">
                </figure>
            </li>
        `)
        .join("");
}

fetchSnapshot();