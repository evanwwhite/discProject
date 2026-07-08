// DISCS creates a text of the csv file reads the response as text
// logs to the console to make sure it works
document.addEventListener('DOMContentLoaded', async () => {
    const csvDiscsText = await fetch('../data/all_discs.csv').then(r => r.text());
    console.log(csvDiscsText); 

    const discRows = Papa.parse(csvDiscsText, { header: true, skipEmptyLines: true }).data;
    console.log(discRows);

    const discs = discRows.map(r => ({
        id:           Number(r.id),
        name:         r.name,
        manufacturer: r.manufacturer || '',    // Matches CSV 'manufacturer'
        primaryUse:   r.primary_use || '',     // Matches CSV 'primary_use'
        stability:    r.stability !== "" ? Number(r.stability) : "?",
        speed:        r.speed !== "" ? Number(r.speed) : "?",
        glide:        r.glide !== "" ? Number(r.glide) : "?",
        turn:         r.turn !== "" ? Number(r.turn) : "?",
        fade:         r.fade !== "" ? Number(r.fade) : "?",
        diameter:     Number(r.diameter),    // Matches CSV 'diameter'
        height:       Number(r.height),      // Matches CSV 'height'
        rimDepth:     Number(r.rim_depth),          // Matches CSV 'rim_depth'
        rimThickness: Number(r.rim_thickness),  // Matches CSV 'rim_thickness'
        insideRimDiameter: Number(r.inside_rim_diameter), // Matches CSV 'inside_rim_diameter'
        rimDiameterRatio: Number(r.rim_diameter_ratio), // Matches CSV 'rim_ratio'
        rimConfig:    Number(r.rim_configuration), // Matches CSV 'rim_configuration'
        bead:         r.bead                         // Matches CSV 'bead'
    }));
    // console.log(discs);
    discs.forEach(disc => {
        const discCard = document.createElement('div');
        discCard.className = 'disc-card';

        discCard.dataset.manufacturer = disc.manufacturer;
        discCard.dataset.use = disc.primaryUse;
        discCard.dataset.speed = disc.speed;
        discCard.dataset.glide = disc.glide;
        discCard.dataset.stability = disc.stability;

        discCard.innerHTML = `
            <div class="disc-header">
            <h3>${disc.name}</h3>
            <p>Manufacturer: <span class="manufacturer">${disc.manufacturer}</span></p>
        </div>
        <img src="../data/basic_disc.svg" class="disc-image" alt="Disc Image">
        <div class="disc-details">
            <p><strong>Use:</strong> <span class="primaryUse">${disc.primaryUse}</span></p>
            <p><strong>Speed:</strong> <span class="speed">${disc.speed}</span></p>
        </div>
        <div class="disc-extra-details">
            <p><strong>Speed:</strong> <span class="speed">${disc.speed}</span></p>
            <p><strong>Glide:</strong> <span class="glide">${disc.glide}</span></p>
            <p><strong>Turn:</strong> ${disc.turn}</p>
            <p><strong>Fade:</strong> ${disc.fade}</p>
            <p><strong>Diameter:</strong> ${disc.diameter}</p>
            <p><strong>Height:</strong> ${disc.height}</p>
            <p><strong>Rim Depth:</strong> ${disc.rimDepth}</p>
            <p><strong>Rim Inside Diameter:</strong> ${disc.insideRimDiameter}</p>
            <p><strong>Rim Diameter Ratio:</strong> ${disc.rimDiameterRatio}</p>
            <p><strong>Rim Thickness:</strong> ${disc.rimThickness}</p>
            <p><strong>Rim Configuration:</strong> ${disc.rimConfig}</p>
            <p><strong>Bead:</strong> ${disc.bead}</p>
        </div>
        `;

        discCard.addEventListener('click', (e) => {
            // This simply toggles the class on and off
            e.stopPropagation();
            const isAlreadyActive = discCard.classList.contains('active');
            document.querySelectorAll('.disc-card').forEach(card => {
                card.classList.remove('active');
            });
            if (!isAlreadyActive) {
                discCard.classList.add('active');
            }
        });
        // Append the disc card to the disc list container
        document.getElementById('disc-list').appendChild(discCard);
    });

    const manufacturers = new Set();
    const uses = new Set();
    const stabilities = new Set();
    const speeds = new Set();
    const glides = new Set();

    discs.forEach(disc => {
        if (disc.manufacturer) manufacturers.add(disc.manufacturer);
        if (disc.primaryUse) uses.add(disc.primaryUse);
        if (disc.stability !== null) stabilities.add(disc.stability);
        if (disc.speed !== null) speeds.add(disc.speed);
        if (disc.glide !== null) glides.add(disc.glide);
    });

    // 2. SORT AND POPULATE (Text Filters)
    // We use [...set] to convert to Array, then .sort() for A-Z
    
    const manufacturerFilter = document.getElementById('manufacturer-filter');
    [...manufacturers].sort().forEach(manufacturer => {
        manufacturerFilter.innerHTML += `<option value="${manufacturer}">${manufacturer}</option>`;
    });

    const useFilter = document.getElementById('use-filter');
    uses.forEach(primaryUse => {
        useFilter.innerHTML += `<option value="${primaryUse}">${primaryUse}</option>`;
    });

    // 3. SORT AND POPULATE (Number Filters)
    // We use .sort((a, b) => a - b) to sort numerically (1, 2, 10) instead of alphabetically (1, 10, 2)

    const stabilityFilter = document.getElementById('stability-filter');
    [...stabilities].sort((a, b) => a - b).forEach(stability => {
        stabilityFilter.innerHTML += `<option value="${stability}">${stability}</option>`;
    });

    const speedFilter = document.getElementById('speed-filter');
    [...speeds].sort((a, b) => a - b).forEach(speed => {
        speedFilter.innerHTML += `<option value="${speed}">${speed}</option>`;
    });

    const glideFilter = document.getElementById('glide-filter');
    [...glides].sort((a, b) => a - b).forEach(glide => {
        glideFilter.innerHTML += `<option value="${glide}">${glide}</option>`;
    });

    // Populate other filters similarly...
    manufacturerFilter.addEventListener('change', filterDiscs);
    useFilter.addEventListener('change', filterDiscs);
    stabilityFilter.addEventListener('change', filterDiscs);
    speedFilter.addEventListener('change', filterDiscs);
    glideFilter.addEventListener('change', filterDiscs);

    function filterDiscs() {
        const selectedManufacturer = document.getElementById('manufacturer-filter').value;
        const selectedUse = document.getElementById('use-filter').value;
        const selectedSpeed = document.getElementById('speed-filter').value;
        const selectedGlide = document.getElementById('glide-filter').value;
        const selectedStability = document.getElementById('stability-filter').value;

        // 2. Get all disc cards
        const allCards = document.querySelectorAll('.disc-card');

        // 3. Loop through every card
        allCards.forEach(card => {
            // Get the card's specific data (The "Invisible Stickers")
            const cardManuf = card.dataset.manufacturer;
            const cardUse = card.dataset.use;
            // Note: Data attributes are always strings, so we might need to compare loosely
            const cardSpeed = card.dataset.speed; 
            const cardGlide = card.dataset.glide;
            const cardStability = card.dataset.stability;

            // 4. CHECK: Does it match?
            // Logic: Is the filter empty ("All")? OR Does it match the card?
            const matchManufacturer = !selectedManufacturer || cardManuf === selectedManufacturer;
            const matchUse = !selectedUse || cardUse === selectedUse;
            const matchSpeed = !selectedSpeed || cardSpeed === selectedSpeed;
            const matchGlide = !selectedGlide || cardGlide === selectedGlide;
            const matchStability = !selectedStability || cardStability === selectedStability;

            // 5. DECISION: If ALL criteria match, show it. Otherwise, hide it.
            if (matchManufacturer && matchUse && matchSpeed && matchGlide && matchStability) {
                card.style.display = ''; // Show (revert to default CSS, which is flex/block)
            } else {
                card.style.display = 'none'; // Hide completely
            }
        });
    }
});



const searchBar = document.getElementById('search-bar');

searchBar.addEventListener('input', () => {
    const query = searchBar.value.toLowerCase();
    const discCards = document.querySelectorAll('.disc-card');

    discCards.forEach(card => {
        const discName = card.querySelector('h3').textContent.toLowerCase();
        if (discName.includes(query)) {
            card.style.display = ''; // Show card if it matches the query
        } else {
            card.style.display = 'none'; // Hide card if it doesn't match
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const homeButton = document.getElementById('home-btn');
    const discMapButton = document.getElementById('disc-map-btn');
    const shopButton = document.getElementById('shop-btn');

    // Event listener for Home button
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            window.location.href = '../home/home.html'; // Navigate to home page
        });
    }

    // Event listener for Disc Map button
    if (discMapButton) {
        discMapButton.addEventListener('click', () => {
            window.location.href = '../discMap/map.html'; // Navigate to Disc Map page
        });
    }

    // Event listener for Shop button
    if (shopButton) {
        shopButton.addEventListener('click', () => {
            window.location.href = '../shop/shop.html'; // Navigate to Shop page
        });
    }
});

const filters = document.querySelectorAll('select'); // Grabs all dropdowns
    filters.forEach(filter => {
        filter.addEventListener('change', filterDiscs);
    });