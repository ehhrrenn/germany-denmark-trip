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
let currentEditingId = null; // Tracks if we are editing an existing item

const overlay = document.createElement('div');
overlay.className = 'sheet-overlay';
document.body.appendChild(overlay);
overlay.addEventListener('click', closeSheets);

function renderUI() {
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
            <div class="card" onclick="openItemDetail(${item.id})">
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
        <div class="card" onclick="openItemDetail(${item.id})">
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
    }

    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    itinerary.forEach(item => {
        if (item.lat && item.lng) {
            const marker = L.circleMarker([item.lat, item.lng], {
                color: '#0065BD',
                fillColor: '#0065BD',
                fillOpacity: 0.9,
                radius: 7,
                weight: 2
            }).addTo(map);

            // Hook map pins directly into the new detail modal
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                openItemDetail(item.id);
            });
            mapMarkers.push(marker);
        }
    });
}

// --- Detail View Logic ---
function openItemDetail(id) {
    const item = itinerary.find(i => i.id === id);
    if (!item) return;

    document.getElementById('detail-content').innerHTML = `
        <div class="card-header">${item.date} • ${item.category}</div>
        <h3 class="card-title">${item.location}</h3>
        <p class="card-notes">${item.notes}</p>
    `;

    // Map Google Maps button
    const directionsBtn = document.getElementById('btn-directions');
    directionsBtn.onclick = () => {
        const query = (item.lat && item.lng) ? `${item.lat},${item.lng}` : encodeURIComponent(item.location);
        window.open(`https://maps.google.com/?q=${query}`, '_blank');
    };

    // Map Edit button
    document.getElementById('btn-edit').onclick = () => editItem(id);

    // Map Delete button
    document.getElementById('btn-delete').onclick = () => deleteItem(id);

    document.getElementById('detail-sheet').classList.add('open');
    overlay.classList.add('show');
}

function deleteItem(id) {
    if (confirm("Are you sure you want to delete this itinerary item?")) {
        itinerary = itinerary.filter(i => i.id !== id);
        localStorage.setItem('euroTripData', JSON.stringify(itinerary));
        renderUI();
        closeSheets();
    }
}

function editItem(id) {
    const item = itinerary.find(i => i.id === id);
    if (!item) return;
    
    currentEditingId = id; // Set global state to edit mode
    closeSheets();

    // Setup form for editing (hide AI tools, show form immediately)
    document.getElementById('form-title').innerText = "Edit Item";
    document.getElementById('ai-input-group').style.display = 'none';
    document.getElementById('parsed-form').style.display = 'block';

    document.getElementById('entry-date').value = item.date || '';
    document.getElementById('entry-location').value = item.location || '';
    document.getElementById('entry-category').value = item.category || 'Activity';
    document.getElementById('entry-notes').value = item.notes || '';
    document.getElementById('entry-lat').value = item.lat || '';
    document.getElementById('entry-lng').value = item.lng || '';

    // Reopen as the Smart Paste sheet, but loaded with existing data
    document.getElementById('smart-paste-sheet').classList.add('open');
    overlay.classList.add('show');
}

// --- Navigation & Sheet Controls ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        const targetId = e.currentTarget.getAttribute('data-target');
        e.currentTarget.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'view-map') setTimeout(() => map.invalidateSize(), 50);
    });
});

function openSmartPaste() {
    currentEditingId = null; // Ensure we are in "Create" mode
    
    document.getElementById('form-title').innerText = "Add Itinerary Item";
    document.getElementById('ai-input-group').style.display = 'flex';
    document.getElementById('ai-input').value = '';
    document.getElementById('parsed-form').style.display = 'none';
    
    document.getElementById('smart-paste-sheet').classList.add('open');
    overlay.classList.add('show');
}

function closeSheets() {
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('open'));
    overlay.classList.remove('show');
}

function openSettings() {
    document.getElementById('api-key-input').value = localStorage.getItem('geminiApiKey') || '';
    document.getElementById('settings-sheet').classList.add('open');
    overlay.classList.add('show');
}

function saveSettings() {
    localStorage.setItem('geminiApiKey', document.getElementById('api-key-input').value.trim());
    closeSheets();
}

// --- Smart Paste AI Logic ---
async function parseTextWithAI() {
    const apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        alert("Please set your Gemini API Key in the settings first.");
        return;
    }

    const rawText = document.getElementById('ai-input').value.trim();
    if (!rawText) return;

    const btn = document.getElementById('parse-btn');
    btn.textContent = "Parsing...";
    btn.disabled = true;

    // We make the prompt much stricter and give it fallback instructions
    const prompt = `Extract itinerary details from the following text. Return ONLY a valid JSON object. Do not include markdown formatting or conversational text.
    Keys:
    - date (String, YYYY-MM-DD HH:MM format, or empty string if unknown)
    - location (String, City, Country, or empty string if unknown)
    - lat (Number, or null if unknown)
    - lng (Number, or null if unknown)
    - category (String: strictly choose "Transport", "Accommodation", "Food & Drink", or "Activity")
    - notes (String, summary of all important details like terminals, seats, bags, confirmation numbers)
    
    Text: ${rawText}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();

        // 1. Check if the API itself threw an error (e.g., bad API key)
        if (data.error) {
            throw new Error(`Google API Error: ${data.error.message}`);
        }

        // 2. Check if the AI failed to generate a response
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No content generated by the AI.");
        }

        let aiText = data.candidates[0].content.parts[0].text;
        
        // 3. Clean up the text (removes markdown backticks regardless of case)
        aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // 4. Regex to extract ONLY the JSON object, in case the AI added conversational text
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not locate a valid JSON object in the AI response.");
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        // Populate the form with extracted data (or fallbacks)
        document.getElementById('entry-date').value = parsedData.date || '';
        document.getElementById('entry-location').value = parsedData.location || '';
        document.getElementById('entry-category').value = parsedData.category || 'Transport';
        document.getElementById('entry-notes').value = parsedData.notes || '';
        document.getElementById('entry-lat').value = parsedData.lat || '';
        document.getElementById('entry-lng').value = parsedData.lng || '';

        document.getElementById('parsed-form').style.display = 'block';
    } catch (error) {
        // Output the exact error to the console and alert the user
        console.error("AI Parsing Error:", error);
        alert(`Error parsing text: ${error.message}`);
    } finally {
        btn.textContent = "✨ Extract Details with AI";
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', renderUI);
