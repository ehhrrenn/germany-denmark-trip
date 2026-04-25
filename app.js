// Sample Data: Munich to Copenhagen
const defaultData = [
    { id: 1, date: "2026-09-10 14:00", location: "Munich, DE", category: "Transport", notes: "Arrive at MUC. Pick up premium rental car. Conf #MUC882" },
    { id: 2, date: "2026-09-10 16:00", location: "Munich, DE", category: "Accommodation", notes: "Check-in at large multi-bedroom vacation rental. Conf #VIL991" },
    { id: 3, date: "2026-09-13 09:00", location: "Spay, DE", category: "Transport", notes: "Drive to Spay via the scenic Rhine route." },
    { id: 4, date: "2026-09-15 19:00", location: "Berlin, DE", category: "Food & Drink", notes: "Dinner reservation for Indian cuisine. Conf #IND44" },
    { id: 5, date: "2026-09-18 14:00", location: "Copenhagen, DK", category: "Accommodation", notes: "Check-in to premium vacation rental. Conf #CPH77" },
    { id: 6, date: "2026-09-19 15:00", location: "Copenhagen, DK", category: "Food & Drink", notes: "Mikkeller Brewery taproom & local bakery." }
];

// Initialize Data
let itinerary = JSON.parse(localStorage.getItem('euroTripData'));

if (!itinerary) {
    itinerary = defaultData;
    saveData();
}

// Render the List
function renderList() {
    const listElement = document.getElementById('itinerary-list');
    listElement.innerHTML = '';

    itinerary.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <span>${item.date}</span>
                <span>${item.category}</span>
            </div>
            <h3 class="card-title">${item.location}</h3>
            <p class="card-notes">${item.notes}</p>
        `;
        listElement.appendChild(card);
    });
}

// Save to Local Storage
function saveData() {
    localStorage.setItem('euroTripData', JSON.stringify(itinerary));
    renderList();
}

// Export Data (Copies to Clipboard)
function exportData() {
    const dataString = JSON.stringify(itinerary);
    navigator.clipboard.writeText(dataString).then(() => {
        alert("Itinerary data copied to clipboard! Paste it into a text to share.");
    }).catch(err => {
        alert("Failed to copy. Here is your data string:\n\n" + dataString);
    });
}

// Import Data (Prompts for string)
function importData() {
    const importedString = prompt("Paste the itinerary data string here:");
    if (importedString) {
        try {
            const parsedData = JSON.parse(importedString);
            itinerary = parsedData;
            saveData();
            alert("Itinerary updated successfully!");
        } catch (e) {
            alert("Invalid data format. Make sure you pasted the exact string.");
        }
    }
}

// Placeholder for adding new items
function addNewItem() {
    alert("This will open a modal to input a new stop!");
}

// Initial render
renderList();
