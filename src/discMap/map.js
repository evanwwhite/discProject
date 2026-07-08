// map.js

// event listener to see when the document or html is fully loaded
// bypasses the issue of the map not existing before the script runs
document.addEventListener('DOMContentLoaded', async () => {

    // initialize the map
    let userLatitude = 0;
    let userLongitude = 0;
    const map = L.map('map').setView([userLatitude, userLongitude], 16);
  
    // Creates a tile layer and adds on top of the map
    L.tileLayer(
      'https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=dl2uTG1RToVYg9Uxvtzt',
      {
        attribution:
          '<a href="https://www.maptiler.com/" target="_blank">&copy; MapTiler</a> ' +
          '<a href="https://www.openstreetmap.org/" target="_blank">&copy; OpenStreetMap contributors</a>',
        tileSize: 512,
        zoomOffset: -1,
      }
    ).addTo(map);
    
    const userIcon = L.icon({
              iconUrl: '../data/pin2.svg',
      iconSize: [50, 50],
      iconAnchor: [25, 35],
      popupAnchor: [0, -30],
    });
    // COURSES creates a text of the csv file reads the response as text
    // logs to the console to make sure it works
    // /data/courses/areax`x?lat_min=34&lat_max=35&lng_min=...
    const csvText = await fetch('../data/courses.csv').then(r => r.text());
    console.log(csvText); 

    const coursesRows = Papa.parse(csvText, { header: true, skipEmptyLines: true }).data;
    console.log(coursesRows);

    const courses = coursesRows.map(r => ({
      name  : r.name,
      coords: [Number(r.latitude), Number(r.longitude)],
      holes : Number(r.holeCount) || null,   
      rating: Number(r.rating)    || null,
      city  : r.city || '',
      state : r.state || '',
      zip   : r.zip || ''
    })).filter(c => !Number.isNaN(c.coords[0]) && !Number.isNaN(c.coords[1]));

    // if the user's location is available, center the map on the user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          userLatitude = latitude;
          userLongitude = longitude;
          map.setView([latitude, longitude], 16);
          
          // Create a marker for the user's location using the custom icon
          const userMarker = L.marker([latitude, longitude], { icon: userIcon }) // Use the custom icon here
            .addTo(map)
            .bindPopup('You are here.')
            .openPopup();

          setTimeout(() => {
          userMarker.closePopup(); // Close the popup after 3 seconds (or any duration you choose)
          }, 2000); // Adjust the duration as needed (3000 ms = 3 seconds)
          
          // Build UI only after user location is obtained
          buildUI(courses, map);
        },
        err => {
          console.warn('Geolocation unavailable or denied.');
          // Build UI with default coordinates if geolocation fails
          buildUI(courses, map);
        }
      );
    } else {
      // Build UI immediately if geolocation is not supported
      buildUI(courses, map);
    }
    
  map.invalidateSize();

  function buildUI(courses, map) {
    const courseListEl = document.getElementById('course-list');
    if (!courseListEl) {
        console.error('Missing <div id="course-list"> in your HTML!');
        return;
    }
    // Clear existing course cards
    courseListEl.innerHTML = '';
    const courseMarkers = new Map();

    // Function to calculate distance between two coordinates using Haversine formula
    function distance(lat1, lon1, lat2, lon2) {
      let x1 = Math.abs(lat1 - lat2);
      let y1 = Math.abs(lon1 - lon2);
      return Math.sqrt((x1 * x1) + (y1 * y1));
    }

    // Create a custom icon for course markers
    const courseIcon = L.icon({
        iconUrl: '../data/pin3.svg',
        iconSize: [50, 50],
        iconAnchor: [25, 35],
        popupAnchor: [0, -30],
    });

    courses.forEach(course => {
      const marker = L.marker(course.coords, { icon: courseIcon })
          .addTo(map)
          .bindPopup(`<strong>${course.name}</strong>`, { closeButton: false });
      courseMarkers.set(course.name, marker);

      // Adding event listener to the marker to allow centering
      marker.on('click', () => {
          const zoomLevel = 17;
          console.log('Centering map on:', marker.getLatLng(), 'with zoom level:', zoomLevel);
          map.setView(marker.getLatLng(), zoomLevel, { autoPan: false });
          marker.openPopup();
          openSidebar(course);
      });

      marker.on('mouseover', () => {
        marker.openPopup(); // Show the popup
        // Set a timeout to close the popup after a short duration
        setTimeout(() => {
            marker.closePopup(); // Close the popup after 3 seconds (or any duration you choose)
        }, 3000); // Adjust the duration as needed (3000 ms = 3 seconds)
      });

      // Optionally, you can also close the popup immediately when the mouse leaves
      marker.on('mouseout', () => {
          marker.closePopup(); // Close the popup when the mouse leaves
      });

      const radius = distance(userLatitude, userLongitude, course.coords[0], course.coords[1]);
      course.distance = radius; // Store distance in the course object
    });

    courses.sort((a, b) => a.distance - b.distance);

    // Calculate distances and sort courses
    const coursesWithDistance = courses.map(course => {
      const courseDistance = distance(userLatitude, userLongitude, course.coords[0], course.coords[1]);
      return { ...course, distance: courseDistance };
    }).sort((a, b) => a.distance - b.distance); // Sort by distance, closest first

    // Get sidebar elements
    const sidebar = document.getElementById('sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarBtn = document.getElementById('close-sidebar');

    // Function to open the sidebar
    function openSidebar(course) {
      const address = `${course.city}, ${course.state} ${course.zip}`.trim();
      
      // 1. Construct the Google Maps Directions URL
      // We use the 'dir' action and the coordinates for 100% accuracy.
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${course.coords[0]},${course.coords[1]}`;

      // 2. Insert into the HTML
      sidebarContent.innerHTML = `
          <div class="square"></div>
          <h2>${course.name}</h2>
          <p>Holes: ${course.holes}</p>
          <p>Rating: ${course.rating}</p>
          <p>Location: ${address}</p>
          
          <a href="${googleMapsUrl}" target="_blank" class="sidebar-button">Directions</a>
          
          <a href="#" onclick="openPlaySidebarFromButton(this)" data-course-index="${coursesWithDistance.indexOf(course)}" class="sidebar-button" style="margin-top: 10px;">Play</a>`;
          
      sidebar.classList.add('active');
    }

    // Function to open the play sidebar
    function openPlaySidebar(course) {
        const playSidebar = document.getElementById('play-sidebar');
        const playSidebarContent = document.getElementById('play-sidebar-content');
        
        // Create address string
        const address = `${course.city}, ${course.state} ${course.zip}`.trim();
        
        playSidebarContent.innerHTML = `
            <h2>${course.name}</h2>
            <div class="hole-progress progress-0">
                <h3>Course Progress</h3>
                <div class="hole-number">0</div>
                <div class="total-holes">of ${course.holes} holes</div>
            </div>
            <div class="player-box">
                <p>Player 1 (You)</p>
                <div class="stroke-controls">
                    <span>Strokes:</span>
                    <button class="stroke-btn" onclick="decreaseStroke(this)">-</button>
                    <span class="stroke-count">3</span>
                    <button class="stroke-btn" onclick="increaseStroke(this)">+</button>
                </div>
            </div>
            <div class="player-buttons">
                <button class="sidebar-button" onclick="addPlayer()">Add Player</button>
                <button class="sidebar-button" onclick="removePlayer()" disabled style="opacity: 0.5;">Min Players (1)</button>
            </div>
            <button class="sidebar-button" style="margin-top: 10px;" onclick="startGame()">Ready to play!</button>`;
        
        // Close the left sidebar first
        sidebar.classList.remove('active');
        
        // Then open the play sidebar
        playSidebar.classList.add('active');
        
        // Also zoom to the course
        const zoomLevel = 18;
        map.setView(course.coords, zoomLevel, { animate: true });
        map.invalidateSize();
    }

    // Function to add a new player
    window.addPlayer = function() {
        const playSidebarContent = document.getElementById('play-sidebar-content');
        const playerBoxes = playSidebarContent.querySelectorAll('.player-box');
        
        if (playerBoxes.length < 6) {
            const newPlayerNumber = playerBoxes.length + 1;
            const newPlayerBox = document.createElement('div');
            newPlayerBox.className = 'player-box';
            newPlayerBox.innerHTML = `
                <p>Player ${newPlayerNumber}</p>
                <div class="stroke-controls">
                    <span>Strokes:</span>
                    <button class="stroke-btn" onclick="decreaseStroke(this)">-</button>
                    <span class="stroke-count">3</span>
                    <button class="stroke-btn" onclick="increaseStroke(this)">+</button>
                </div>
            `;
            
            // Insert the new player box before the player buttons container
            const playerButtonsContainer = playSidebarContent.querySelector('.player-buttons');
            playSidebarContent.insertBefore(newPlayerBox, playerButtonsContainer);
            
            // Enable the Remove Player button if we have more than 1 player
            const removePlayerButton = playSidebarContent.querySelector('button[onclick="removePlayer()"]');
            removePlayerButton.disabled = false;
            removePlayerButton.textContent = 'Remove Player';
            removePlayerButton.style.opacity = '1';
            
            // Disable the Add Player button if we've reached the limit
            if (playerBoxes.length + 1 >= 6) {
                const addPlayerButton = playSidebarContent.querySelector('button[onclick="addPlayer()"]');
                addPlayerButton.disabled = true;
                addPlayerButton.textContent = 'Max Players (6)';
                addPlayerButton.style.opacity = '0.5';
            }
        }
    };

    // Function to remove the last player
    window.removePlayer = function() {
        const playSidebarContent = document.getElementById('play-sidebar-content');
        const playerBoxes = playSidebarContent.querySelectorAll('.player-box');
        
        if (playerBoxes.length > 1) {
            // Remove the last player box (excluding Player 1)
            const lastPlayerBox = playerBoxes[playerBoxes.length - 1];
            lastPlayerBox.remove();
            
            // Disable the Remove Player button if we're back to 1 player
            if (playerBoxes.length - 1 <= 1) {
                const removePlayerButton = playSidebarContent.querySelector('button[onclick="removePlayer()"]');
                removePlayerButton.disabled = true;
                removePlayerButton.textContent = 'Min Players (1)';
                removePlayerButton.style.opacity = '0.5';
            }
            
            // Re-enable the Add Player button if it was disabled
            const addPlayerButton = playSidebarContent.querySelector('button[onclick="addPlayer()"]');
            if (addPlayerButton.disabled) {
                addPlayerButton.disabled = false;
                addPlayerButton.textContent = 'Add Player';
                addPlayerButton.style.opacity = '1';
            }
        }
    };

    // Function to start the game
    window.startGame = function() {
        const playSidebarContent = document.getElementById('play-sidebar-content');
        
        // Hide the player buttons container
        const playerButtonsContainer = playSidebarContent.querySelector('.player-buttons');
        playerButtonsContainer.style.display = 'none';
        
        // Update the hole progress indicator
        const holeProgress = playSidebarContent.querySelector('.hole-progress');
        const holeNumber = holeProgress.querySelector('.hole-number');
        holeNumber.textContent = '1';
        holeProgress.className = 'hole-progress progress-1 hole-change';
        
        // Remove the animation class after animation completes
        setTimeout(() => {
            holeProgress.classList.remove('hole-change');
        }, 600);
        
        // Change the Ready to play button text and functionality
        const readyButton = playSidebarContent.querySelector('button[onclick="startGame()"]');
        readyButton.textContent = 'Next Hole';
        readyButton.onclick = nextHole;
        
        // Initialize game state
        window.currentHole = 1;
        // Get total holes from the course name in the h2 element
        const courseName = playSidebarContent.querySelector('h2').textContent;
        // Find the course in the coursesWithDistance array
        const currentCourse = window.coursesWithDistance.find(c => c.name === courseName);
        window.totalHoles = currentCourse ? parseInt(currentCourse.holes) : 18;
        window.playerScores = {};
        console.log('Game started with', window.totalHoles, 'holes');
    };

    // Function to handle next hole
    window.nextHole = function() {
        console.log('Next Hole function called');
        const playSidebarContent = document.getElementById('play-sidebar-content');
        
        // Initialize playerScores if it doesn't exist
        if (!window.playerScores) {
            window.playerScores = {};
        }
        
        // Store current hole scores
        const playerBoxes = playSidebarContent.querySelectorAll('.player-box');
        console.log('Found', playerBoxes.length, 'player boxes');
        
        playerBoxes.forEach((playerBox, index) => {
            const playerName = playerBox.querySelector('p').textContent;
            const strokeCount = parseInt(playerBox.querySelector('.stroke-count').textContent);
            console.log('Player:', playerName, 'Strokes:', strokeCount);
            
            if (!window.playerScores[playerName]) {
                window.playerScores[playerName] = [];
            }
            window.playerScores[playerName].push(strokeCount);
        });
        
        // Reset stroke counts to 3 for next hole
        playerBoxes.forEach(playerBox => {
            const strokeCount = playerBox.querySelector('.stroke-count');
            strokeCount.textContent = '3';
        });
        
        // Increment hole number
        window.currentHole++;
        console.log('Current hole:', window.currentHole, 'Total holes:', window.totalHoles);
        
                        // Update hole progress indicator
                const holeProgress = playSidebarContent.querySelector('.hole-progress');
                const holeNumber = holeProgress.querySelector('.hole-number');
                holeNumber.textContent = window.currentHole;
                
                // Calculate progress percentage and update progress bar
                const progressPercentage = Math.min((window.currentHole / window.totalHoles) * 100, 100);
                const progressClass = `progress-${Math.ceil(progressPercentage / 10)}`;
                holeProgress.className = `hole-progress ${progressClass} hole-change`;
                
                // Remove the animation class after animation completes
                setTimeout(() => {
                    holeProgress.classList.remove('hole-change');
                }, 600);
        
        // Check if we've reached the last hole
        if (window.currentHole >= window.totalHoles) {
            console.log('Reached last hole, changing to Finish Round');
            const nextButton = playSidebarContent.querySelector('button[style*="margin-top: 10px"]');
            nextButton.textContent = 'Finish Round';
            nextButton.onclick = finishRound;
        }
    };

    // Function to finish the round
    window.finishRound = function() {
        const playSidebarContent = document.getElementById('play-sidebar-content');
        
        // Store final hole scores
        const playerBoxes = playSidebarContent.querySelectorAll('.player-box');
        playerBoxes.forEach((playerBox, index) => {
            const playerName = playerBox.querySelector('p').textContent;
            const strokeCount = parseInt(playerBox.querySelector('.stroke-count').textContent);
            
            if (!window.playerScores[playerName]) {
                window.playerScores[playerName] = [];
            }
            window.playerScores[playerName].push(strokeCount);
        });
        
        // Calculate and display final scores
        let finalScores = '';
        for (const [playerName, scores] of Object.entries(window.playerScores)) {
            const totalScore = scores.reduce((sum, score) => sum + score, 0);
            finalScores += `${playerName}: ${totalScore} strokes\n`;
        }
        
        // Update the display to show final results
        playSidebarContent.innerHTML = `
            <h2>Round Complete!</h2>
            <div class="final-scores">
                <h3>Final Scores:</h3>
                <pre>${finalScores}</pre>
            </div>
            <button class="sidebar-button" onclick="closePlaySidebar()">Close</button>`;
    };

    // Function to decrease stroke count
    window.decreaseStroke = function(button) {
        const strokeCount = button.parentElement.querySelector('.stroke-count');
        let currentCount = parseInt(strokeCount.textContent);
        
        if (currentCount > 1) {
            currentCount--;
            strokeCount.textContent = currentCount;
        }
    };

    // Function to increase stroke count
    window.increaseStroke = function(button) {
        const strokeCount = button.parentElement.querySelector('.stroke-count');
        let currentCount = parseInt(strokeCount.textContent);
        
        if (currentCount < 8) {
            currentCount++;
            strokeCount.textContent = currentCount;
        }
    };

    // Make functions globally accessible
    window.openPlaySidebar = openPlaySidebar;
    window.coursesWithDistance = coursesWithDistance;
    
    // Function to close play sidebar
    window.closePlaySidebar = function() {
        const playSidebar = document.getElementById('play-sidebar');
        playSidebar.classList.remove('active');
    };
    
    // Helper function to open play sidebar from button
    window.openPlaySidebarFromButton = function(button) {
        const courseIndex = button.getAttribute('data-course-index');
        const course = window.coursesWithDistance[courseIndex];
        if (course) {
            openPlaySidebar(course);
        }
        return false;
    };

    // Event listener for closing the sidebar
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
    });

    // Event listener for closing the play sidebar
    const closePlaySidebarBtn = document.getElementById('close-play-sidebar');
    closePlaySidebarBtn.addEventListener('click', () => {
        const playSidebar = document.getElementById('play-sidebar');
        playSidebar.classList.remove('active');
    });

    // Show only the first 30 courses as normal cards
    const maxVisibleCourses = 30;
    
    coursesWithDistance.forEach((course, index) => {
      const card = document.createElement('div');
      card.className = 'course-card';
      card.innerHTML = `<h3>${course.name}</h3><p>Holes: ${course.holes}</p>`;

      // Update the course card click event
      card.addEventListener('click', () => {
          const zoomLevel = 16; // Set your desired zoom level
          console.log('Centering map on:', course.coords, 'with zoom level:', zoomLevel);
          map.setView(course.coords, zoomLevel, { autoPan: false });
          map.invalidateSize();
          openSidebar(course); // Open the sidebar with course details
      });

      // Show first 30 courses as normal cards, rest as hidden
      if (index < maxVisibleCourses) {
          courseListEl.appendChild(card); // Normal course card
      } else {
          card.className = 'hidden-course-card'; // Change class for hidden cards
          card.style.display = 'none'; // Initially hide hidden course cards
          courseListEl.appendChild(card); // Append hidden course card
      }
    });
  }

  // Search functionality for hidden course cards
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(null, args);
      }, delay);
    };
  }

  const searchBar = document.getElementById('search-bar');
  const searchCourses = debounce(() => {
    const query = searchBar.value.toLowerCase(); // Get the search query
    const courseCards = document.querySelectorAll('.course-card'); // Select all course cards
    const hiddenCards = document.querySelectorAll('.hidden-course-card'); // Select hidden course cards

    // Clear all cards initially
    if (query === "") {
      courseCards.forEach(card => {
        card.style.display = ''; // Show all normal cards
      });
      hiddenCards.forEach(card => {
        card.style.display = 'none'; // Hide all cards
      });
      return;
    }

    // refreshes filtering
    courseCards.forEach(card => {
      card.style.display = 'none'; 
    });
    
    // Show matching course cards
    courseCards.forEach(card => {
      const h3 = card.querySelector('h3');
      if (h3) {
        const courseName = h3.textContent.toLowerCase();
        if (courseName.includes(query)) {
          card.style.display = ''; 
        }
      }
    });

    // Show matching hidden course cards
    hiddenCards.forEach(card => {
        const courseName = card.querySelector('h3').textContent.toLowerCase(); // Get the course name
        if (courseName.includes(query)) {
            card.style.display = ''; // Show hidden card if it matches the query
        }
        else {
          card.style.display = 'none'; // Hide card if the course name is null
        }
    });
  }, 300); // Adjust the delay as needed (300 ms is a common choice)

  searchBar.addEventListener('input', searchCourses);

  const headerBtns = [
    { name: 'Home' },
    { name: 'Disc Map' },
    { name: 'Shop' }
  ]

});

// Navigation event listeners - moved outside the main DOMContentLoaded
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
