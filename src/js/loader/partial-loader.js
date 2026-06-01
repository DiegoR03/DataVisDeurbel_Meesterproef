export function initSmartHeader() {
  const headerElement = document.querySelector('header');
  if (!headerElement) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      headerElement.classList.add('header--hidden');
    } else {
      headerElement.classList.remove('header--hidden');
    }
    
    lastScrollY = currentScrollY;
  });
}

export function initNavigation() {
  const menuToggle = document.getElementById('menu-toggle');
  const navList = document.getElementById('nav-list');

  if (!menuToggle || !navList) return;

  menuToggle.addEventListener('click', () => {
    const isCurrentlyOpen = navList.classList.contains('is-open');

    if (isCurrentlyOpen) {
      navList.classList.remove('is-open');
      navList.classList.add('is-closing');
      menuToggle.setAttribute('aria-expanded', 'false');

      navList.addEventListener('animationend', function handler() {
        navList.classList.remove('is-closing');
        navList.removeEventListener('animationend', handler);
      }, { once: true });

    } else {
      navList.classList.remove('is-closing');
      navList.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
    }
    
    const icon = menuToggle.querySelector('i');
    if (icon) {
      if (!isCurrentlyOpen) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    }
  });
}