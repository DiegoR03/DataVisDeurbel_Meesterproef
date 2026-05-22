import { loadCsvData } from "../data/data-fetch.js"

export async function fetchSnapshot() {
    const data = await loadCsvData("assets/data/website_event-week.csv");

    console.log("pics", data)
    const snapshot = data
    .map(item =>item.snapshot_url)
    .filter(Boolean)
    .slice(0, 10)
    console.log("SnapSHOTS:", snapshot);

    const snapshotList = document.getElementById('fish-piture-list');

    snapshotList.innerHTML = snapshot
        .filter(url => url)
        .map(url => `<li><img src="${url}" alt="snapshot of fish"></li>`)
        .join("");
}
fetchSnapshot();