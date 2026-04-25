// Sample Data with Mock Coordinates for Leaflet Map
const defaultData = [
    { id: 1, date: "2026-09-10 14:00", location: "Munich, DE", lat: 48.1351, lng: 11.5820, category: "Transport", notes: "Arrive at MUC. Pick up premium rental car. Conf #MUC882" },
    { id: 2, date: "2026-09-10 16:00", location: "Munich, DE", lat: 48.1400, lng: 11.5900, category: "Accommodation", notes: "Check-in at large multi-bedroom vacation rental. Conf #VIL991" },
    { id: 3, date: "2026-09-13 09:00", location: "Spay, DE", lat: 50.2580, lng: 7.6480, category: "Transport", notes: "Drive to Spay via the scenic Rhine route." },
    { id: 4, date: "2026-09-15 19:00", location: "Berlin, DE", lat: 52.5200, lng: 13.4050, category: "Food & Drink", notes: "Dinner reservation for Indian cuisine. Conf #IND44" },
    { id: 5, date: "2026-09-18 14:00", location: "Copenhagen, DK", lat: 55.6761, lng: 12.5683, category: "Accommodation", notes: "Check-in to premium vacation rental. Conf #CPH77" },
    { id: 6, date: "2026-09-19 15:00", location: "Copenhagen, DK", lat: 55.6700, lng: 12.5600, category: "Food & Drink", notes: "Mikkeller Brewery taproom & local bakery." }
];

// Initialize Data in Local Storage
let itinerary = JSON.parse(localStorage.getItem('euroTripData'));
if (!itinerary) {
    itinerary = defaultData;
    localStorage.setItem('euroTripData', JSON.stringify(itinerary));
}

let map; // Global map variable

// 1. Render the Application Views
function renderUI() {
    renderTimeline();
    renderList();
    initMap();
}

function renderTimeline() {
    const container = document.getElementById('timeline-list');
    container.innerHTML = itinerary.map(item => `
        <div class="timeline-item">
            <div class="timeline-node"></div>
            <div class="card">
                <div class="card-header">${item.date} • ${item.category}</div>
                <h3 class="card-title">${item.location}</h3>
                <p class="card-notes">${item.notes}</p>
            </div>
        </div>
    `).join('');
}

function renderList() {
    const container = document.getElementById('itinerary-list');
    container.innerHTML = itinerary.map(item => `
        <div class="card">
            <div class="card-header">${item.date} • ${item.category}</div>
            <h3 class="card-title">${item.location}</h3>
            <p class="card-notes">${item.notes}</p>
        </div>
    `).join('');
}

// 2. Map Configuration (Leaflet.js)
function initMap() {
    if (map) return; // Prevent re-initialization
    
    // Center map roughly between Munich and Copenhagen
    map = L.map('map-container', { zoomControl: false }).setView([51.1657, 10.4515], 5);

    // Muted CartoDB Positron Map Tiles for minimal visual noise
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO'
    }).addTo(map);

    // Plot pins
    itinerary.forEach(item => {
        const marker = L.circleMarker([item.lat, item.lng], {
            color: '#0065BD', // Bavarian Blue
            fillColor: '#0065BD',
            fillOpacity: 0.9,
            radius: 7,
            weight: 2
        }).addTo(map);

        // Slide up bottom sheet on pin tap
        marker.on('click', () => showBottomSheet(item));
    });
}

function showBottomSheet(item) {
    const sheet = document.getElementById('map-bottom-sheet');
    const content = document.getElementById('sheet-content');
    content.innerHTML = `
        <div class="card-header">${item.date} • ${item.category}</div>
        <h3 class="card-title">${item.location}</h3>
        <p class="card-notes">${item.notes}</p>
    `;
    sheet.classList.add('open');
}

// Dismiss bottom sheet when tapping outside the sheet (on the map)
document.getElementById('map-container').addEventListener('click', () => {
    document.getElementById('map-bottom-sheet').classList.remove('open');
});

// 3. View Navigation Logic
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Reset active states
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        // Activate target view
        const targetId = e.currentTarget.getAttribute('data-target');
        e.currentTarget.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        // Leaflet edge-case: Must recalculate bounds when map container changes from display:none to block
        if (targetId === 'view-map') {
            setTimeout(() => map.invalidateSize(), 50);
        } else {
            // Hide bottom sheet if leaving map view
            document.getElementById('map-bottom-sheet').classList.remove('open');
        }
    });
});

// 4. Floating Action Button Logic
function addNewItem() {
    alert("Smart Paste AI logic will be wired up here!");
}

// Boot up
document.addEventListener('DOMContentLoaded', renderUI);
