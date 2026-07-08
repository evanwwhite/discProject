document.addEventListener('DOMContentLoaded', () => {
    // --- Header Navigation ---
    // Note: I renamed IDs in HTML to 'nav-...' to distinguish from hero buttons
    // If you kept the old IDs in the header, keep these variable names as they were.
    const navHome = document.getElementById('nav-home-btn');
    const navMap = document.getElementById('nav-map-btn');
    const navShop = document.getElementById('nav-shop-btn');

    if(navHome) navHome.addEventListener('click', () => window.location.href = '../home/home.html');
    if(navMap) navMap.addEventListener('click', () => window.location.href = '../discMap/map.html');
    if(navShop) navShop.addEventListener('click', () => window.location.href = '../shop/shop.html');

    // --- Hero Menu Buttons (The New Stack) ---
    const heroMap = document.getElementById('hero-map-btn');
    const heroShop = document.getElementById('hero-shop-btn');
    const heroCompare = document.getElementById('hero-compare-btn');
    const heroGuide = document.getElementById('hero-guide-btn');

    if (heroMap) {
        heroMap.addEventListener('click', () => {
            window.location.href = '../discMap/map.html';
        });
    }

    if (heroShop) {
        heroShop.addEventListener('click', () => {
            window.location.href = '../shop/shop.html';
        });
    }

    if (heroCompare) {
        heroCompare.addEventListener('click', () => {
            // Placeholder until you build the page
            alert("Compare Tool feature is coming soon!");
            // window.location.href = '../compare/compare.html'; 
        });
    }

    if (heroGuide) {
        heroGuide.addEventListener('click', () => {
            // Placeholder until you build the page
            alert("Flight Guide feature is coming soon!");
            // window.location.href = '../guide/guide.html';
        });
    }
});