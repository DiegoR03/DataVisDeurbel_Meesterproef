export function fetchPartial(elementId, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;

            if (elementId === 'header-placeholder') {
                initSmartHeader();
            }
        })
        .catch(error => console.error('Fout bij laden partial:', error));
}

function initSmartHeader() {
    const headerElement = document.querySelector('header');
    if (!headerElement) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 50) {
            headerElement.classList.add('header--hidden');
        }
        else {
            headerElement.classList.remove('header--hidden');
        }
        
        lastScrollY = currentScrollY;
    });
}