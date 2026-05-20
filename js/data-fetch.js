const csvUrl = 'assets/data/website_event-week.csv';

const toegestaneKolommen = [
    "website_id", "session_id", "visit_id", "event_id",
    "browser", "os", "device", "screen", "language", "country",
    "region", "city", "url_path", "url_query", "referrer_query", "event_name", "created_at"
];

// Voorbeeld hoe je de data zou gebruiken.

// const alleDatums = geformatteerdeData.map(item => item.created_at);
//console.log(alleDatums);
// Output: ["2026-05-19 14:22", "2026-05-19 14:25", ...]

//const alleBrowsers = geformatteerdeData.map(item => item.browser);

let geformatteerdeData = [];

async function laadCSV() {
    try {
        const response = await fetch(csvUrl);
        const dataText = await response.text();

        geformatteerdeData = verwerkDataNaarObjecten(dataText);

        document.getElementById('loading').innerText = 'Geladen!';
        maakGrafieken(geformatteerdeData);

    } catch (error) {
        document.getElementById('loading').innerText = 'Fout bij laden: ' + error.message;
    }
}

function verwerkDataNaarObjecten(ruweTekst) {
    const regels = ruweTekst.split('\n')
        .map(regel => regel.trim())
        .filter(regel => regel.length > 0);

    if (regels.length === 0) return [];

    const alleHeaders = regels[0].split(',').map(h => h.replace(/"/g, ''));
    const dataRegels = regels.slice(1);

    const resultaat = dataRegels.map(regel => {
        const kolommen = regel.split(',');
        if (kolommen.length <= 1) return null; 

        const object = {};
        
        toegestaneKolommen.forEach(kolomNaam => {
            const index = alleHeaders.indexOf(kolomNaam);
            if (index !== -1) {
                const waarde = kolommen[index] ? kolommen[index].replace(/"/g, '') : '';
                object[kolomNaam] = waarde;
            }
        });

        const queryString = object.url_query || object.referrer_query || '';
        
        // Aan gemini gevraagd hoe ik de url query kan parsen en de visnaam en snapshot url eruit kan halen.
        // Antwoord: Omdat die link op dit moment nog gecodeerd is (met die gekke %2F en %3A tekens), moeten we JavaScript vertellen om dat stukje tekst te ontleden. Dan kun je daarna super makkelijk de afbeelding op je scherm tonen met data.snapshot_url.
        // Antwoord-2: Haal de afbeelding op en maak de URL weer normaal/leesbaar met decodeURIComponent()
        if (queryString) {
            const params = new URLSearchParams(queryString);
            
            object.fish_name = params.get('fish') || 'Onbekend';
            
            const rawImageUrl = params.get('snapshotFishImageUrl');
            object.snapshot_url = rawImageUrl ? decodeURIComponent(rawImageUrl) : null;
        } else {
            object.fish_name = 'Geen vis-event';
            object.snapshot_url = null;
        }

        return object;
    }).filter(item => item !== null);

    return resultaat;
}

function maakGrafieken(data) {
    console.log("Mijn nette data:", data);
}

laadCSV();