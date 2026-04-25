const defaultData = [
    { id: 1, date: "2026-09-10 14:00", location: "Munich, DE", lat: 48.1351, lng: 11.5820, category: "Transport", notes: "Arrive at MUC. Pick up premium rental car. Conf #MUC882" },
    { id: 2, date: "2026-09-10 16:00", location: "Munich, DE", lat: 48.1400, lng: 11.5900, category: "Accommodation", notes: "Check-in at large multi-bedroom vacation rental. Conf #VIL991" },
    { id: 3, date: "2026-09-13 09:00", location: "Spay, DE", lat: 50.2580, lng: 7.6480, category: "Transport", notes: "Drive to Spay via the scenic Rhine route." },
    { id: 4, date: "2026-09-15 19:00", location: "Berlin, DE", lat: 52.5200, lng: 13.4050, category: "Food & Drink", notes: "Dinner reservation for Indian cuisine. Conf #IND44" },
    { id: 5, date: "2026-09-18 14:00", location: "Copenhagen, DK", lat: 55.6761, lng: 12.5683, category: "Accommodation", notes: "Check-in to premium vacation rental. Conf #CPH77" },
    { id: 6, date: "2026-09-19 15:00", location: "Copenhagen, DK", lat: 55.6700, lng: 12.5600, category: "Food & Drink", notes: "Mikkeller Brewery taproom & local bakery." }
];

let itinerary = JSON.parse(localStorage.getItem('euroTripData'));
if (!itinerary) {
    itinerary = defaultData;
    localStorage.setItem('euroTripData', JSON.stringify(itinerary));
}

let map; 
let mapMarkers = [];

// Overlay setup for bottom sheets
const overlay = document.createElement('div');
overlay.className = 'sheet-overlay';
document.body.appendChild(overlay);
overlay.addEventListener('click', closeSheets);

function renderUI() {
    // Sort chronologically
    itinerary.sort((a, b) => new Date(a.date) - new Date(b.date));
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

function initMap() {
    if (!map) {
        map = L.map('map-container', { zoomControl: false }).setView([51.1657, 10.4515], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CARTO'
        }).addTo(map);
        
        map.on('click', () => document.getElementById('map-bottom-sheet').classList.remove('open'));
    }

    // Clear existing markers
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    // Plot pins
    itinerary.forEach(item => {
        if (item.lat && item.lng) {
            const marker = L.circleMarker([item.lat, item.lng], {
                color: '#0065BD',
                fillColor: '#0065BD',
                fillOpacity: 0.9,
                radius: 7,
                weight: 2
            }).addTo(map);

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                showMapSheet(item);
            });
            mapMarkers.push(marker);
        }
    });
}

function showMapSheet(item) {
    const sheet = document.getElementById('map-bottom-sheet');
    const content = document.getElementById('sheet-content');
    content.innerHTML = `
        <div class="card-header">${item.date} • ${item.category}</div>
        <h3 class="card-title">${item.location}</h3>
        <p class="card-notes">${item.notes}</p>
    `;
    sheet.classList.add('open');
}

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        const targetId = e.currentTarget.getAttribute('data-target');
        e.currentTarget.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'view-map') {
            setTimeout(() => map.invalidateSize(), 50);
        } else {
            document.getElementById('map-bottom-sheet').classList.remove('open');
        }
    });
});

// --- Settings & Bottom Sheet Logic ---
function openSettings() {
    document.getElementById('api-key-input').value = localStorage.getItem('geminiApiKey') || '';
    document.getElementById('settings-sheet').classList.add('open');
    overlay.classList.add('show');
}

function saveSettings() {
    const key = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('geminiApiKey', key);
    closeSheets();
}

function openSmartPaste() {
    document.getElementById('ai-input').value = '';
    document.getElementById('parsed-form').style.display = 'none';
    document.getElementById('smart-paste-sheet').classList.add('open');
    overlay.classList.add('show');
}

function closeSheets() {
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('open'));
    overlay.classList.remove('show');
}

// --- Smart Paste AI Logic ---
async function parseTextWithAI() {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        alert("Please set your Gemini API Key in the settings first.");
        openSettings();
        return;
    }

    const rawText = document.getElementById('ai-input').value.trim();
    if (!rawText) return;

    const btn = document.getElementById('parse-btn');
    btn.textContent = "Parsing...";
    btn.disabled = true;

    const prompt = `
    Extract itinerary details from the following text. Return ONLY a valid, raw JSON object (no markdown wrapping, no code blocks).
    Use these exact keys:
    - date (String in YYYY-MM-DD HH:MM format)
    - location (String, City and Country Code)
    - lat (Number, approximate latitude)
    - lng (Number, approximate longitude)
    - category (String, strictly choose one: "Transport", "Accommodation", "Food & Drink", or "Activity")
    - notes (String, brief 1-2 sentence summary including any confirmation numbers)
    
    Text: ${rawText}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        let aiText = data.candidates[0].content.parts[0].text;
        
        // Strip markdown code blocks if AI accidentally includes them
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedData = JSON.parse(aiText);

        // Populate the form
        document.getElementById('entry-date').value = parsedData.date || '';
        document.getElementById('entry-location').value = parsedData.location || '';
        document.getElementById('entry-category').value = parsedData.category || 'Activity';
        document.getElementById('entry-notes').value = parsedData.notes || '';
        document.getElementById('entry-lat').value = parsedData.lat || '';
        document.getElementById('entry-lng').value = parsedData.lng || '';

        // Show form for review
        document.getElementById('parsed-form').style.display = 'block';

    } catch (error) {
        alert("Error parsing text. Please try again or check your API key.");
        console.error(error);
    } finally {
        btn.textContent = "✨ Extract Details with AI";
        btn.disabled = false;
    }
}

function saveParsedItem() {
    const newItem = {
        id: Date.now(),
        date: document.getElementById('entry-date').value,
        location: document.getElementById('entry-location').value,
        category: document.getElementById('entry-category').value,
        notes: document.getElementById('entry-notes').value,
        lat: parseFloat(document.getElementById('entry-lat').value) || null,
        lng: parseFloat(document.getElementById('entry-lng').value) || null
    };

    itinerary.push(newItem);
    localStorage.setItem('euroTripData', JSON.stringify(itinerary));
    
    renderUI();
    closeSheets();
}

document.addEventListener('DOMContentLoaded', renderUI);
