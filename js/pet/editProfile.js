import { getImageUrl } from '../imageUtil.js';

const API = 'http://127.0.0.1:3000/api';

// Dummy JSON Data (Angepasst an die gewünschte Reihenfolge und Struktur)
const mockApiResponse = {
    status: 200,
    data: {
        pet_id: 1,
        owner_id: 101,
        currentUserRole: "owner",
        
        // Tierstammdaten
        name: "Nao",
        species: "Housecat",
        breed: "Domestic Shorthair",
        age: 7,
        color: "Brown Tabby",
        gender: "Male",
        weight: 11.5,
        
        // Medizinische & Verhaltensdaten
        health_record: {
            diagnosis: "Slightly overweight",
            medication: "None",
            behaviour: "Very vocal when hungry. Sleeps all day.",
            dietaryRestrictions: "Strict feeding schedule, measured portions",
            medicalNotes: "Check dental health at next routine visit"
        }
    }
};

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
    setupImageUpload();

    let params = new URLSearchParams(document.location.search);
    let action = params.get("action");

    if (action === 'add') {
        handleAddActions();
        return;
    }

    // Handle Edit Actions
    document.getElementById("pet-form").addEventListener("submit", editFormSubmit);
    loadPetData();
});

function setupImageUpload() {
    const imageInput = document.getElementById('edit-pet-image');
    const previewImg = document.getElementById('pet-avatar-preview-img');
    const previewIcon = document.getElementById('pet-avatar-preview-icon');
    const alertBox = document.getElementById('image-upload-alert');

    if (!imageInput) return;

    imageInput.addEventListener('change', () => {
        alertBox.className = 'alert d-none';
        const file = imageInput.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alertBox.textContent = 'Invalid file type. Only JPG, JPEG, and PNG images are supported.';
            alertBox.className = 'alert alert-danger';
            imageInput.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alertBox.textContent = 'File too large. Maximum size is 5 MB.';
            alertBox.className = 'alert alert-danger';
            imageInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            previewImg.src = e.target.result;
            previewImg.classList.remove('d-none');
            previewIcon.classList.add('d-none');
        };
        reader.readAsDataURL(file);
    });
}

async function uploadPetImage(petId, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const token = localStorage.getItem('authToken'); // Falls Sie einen Token speichern
    
    const res = await fetch(`${API}/petedit/${petId}/image`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}` // Token-basierte Auth
        },
        body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
}

function handleAddActions() {
    const pageTitle = document.getElementById('page-title');
    const saveButton = document.getElementById('profile-save-btn');

    if (pageTitle) {
        pageTitle.textContent = 'Create new pet';
    }
    
    if (saveButton) {
        saveButton.textContent = 'Create pet';
    }

    document.getElementById("pet-form").addEventListener("submit", addFormSubmit);
}

function loadPetData() {
    const pet = mockApiResponse.data;

    if (pet.currentUserRole !== "owner") {
        document.getElementById("edit-pet-form").style.display = "none";
        document.getElementById("error-message").style.display = "block";
        document.getElementById("error-message").innerText = "Access Denied: You can only edit profiles for your own pets, not pets you are sitting.";
        return;
    }

    // Formularfelder mit bestehenden DB-Daten befüllen (in gewünschter Reihenfolge)
    if (document.getElementById("pet_id")) document.getElementById("pet_id").value = pet.pet_id;
    
    document.getElementById("name").value = pet.name || "";
    document.getElementById("species").value = pet.species || "";
    document.getElementById("breed").value = pet.breed || "";
    document.getElementById("age").value = pet.age || "";
    document.getElementById("color").value = pet.color || "";
    document.getElementById("gender").value = pet.gender || "";
    document.getElementById("weight").value = pet.weight || "";

    // Verschachtelte Daten aus dem health_record befüllen
    if (pet.health_record) {
        document.getElementById("diagnosis").value = pet.health_record.diagnosis || "";
        document.getElementById("medication").value = pet.health_record.medication || "";
        document.getElementById("behaviour").value = pet.health_record.behaviour || "";
        document.getElementById("dietaryRestrictions").value = pet.health_record.dietaryRestrictions || "";
        document.getElementById("medicalNotes").value = pet.health_record.medicalNotes || "";
    }
}

// Hilfsfunktion zum sauberen Auslesen und Strukturieren der Formulardaten
function buildPayload(formData) {
    const petIdVal = formData.get("pet_id");
    
//Neuerungen Medication Handling
    // 1. Alle dynamisch generierten Uhrzeit-Inputs auslesen
    const timeInputs = document.querySelectorAll('.med-time-input');
    const selectedTimes = Array.from(timeInputs).map(input => input.value);
    
    // 2. Wochentage auslesen (falls wöchentlich gewählt wurde)
    const interval = formData.get("medication_interval");
    let targetDays = "all"; 
    if (interval === "weekly") {
        const checkedDays = document.querySelectorAll('.week-day-checkbox:checked');
        targetDays = Array.from(checkedDays).map(box => box.value).join(','); // z.B. "1,4"
    }


    return {
        pet_id: petIdVal ? parseInt(petIdVal) : null, // Bei 'add' eventuell noch nicht vorhanden
        pet_data: {
            name: formData.get("name"),
            species: formData.get("species"),
            breed: formData.get("breed"),
            age: parseFloat(formData.get("age")),
            color: formData.get("color"),
            gender: formData.get("gender"),
            weight: parseFloat(formData.get("weight"))
        },
        health_record_data: {
            diagnosis: formData.get("diagnosis"),
            medication: formData.get("medication"),
            behaviour: formData.get("behaviour"),
            dietaryRestrictions: formData.get("dietaryRestrictions"),
            medicalNotes: formData.get("medicalNotes"),
            record_date: new Date().toISOString().split('T')[0] // Aktuelles Datum
        },
        // --- SAUBERE, SEPARATE STRUKTUR FÜR DAS MEDIKAMENT ---
        medication_data: {
            medication_name: formData.get("medication_name"),
            medication_type: formData.get("medication_type"),
            dosage: formData.get("dosage"),
            start_date: formData.get("start_date"),
            end_date: formData.get("end_date"),
            times: selectedTimes,      // Wird als Array übergeben, z.B. ["08:00", "20:00"]
            week_days: targetDays      // Wird als String übergeben, z.B. "all" oder "1,4"
        }
    };
}

const editFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const payload = buildPayload(formData);
    const imageFile = document.getElementById('edit-pet-image')?.files[0];
    const alertBox = document.getElementById('image-upload-alert');

    console.log("Submitting Update Payload to Backend:", JSON.stringify(payload, null, 2));

    try {
        console.log(document.cookie);
        const response = await fetch(`${API}/petedit/${payload.pet_id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload.pet_data, ...payload.health_record_data, ...payload.medication_data })
        });

        if (imageFile && payload.pet_id) {
            try {
                const imgData = await uploadPetImage(payload.pet_id, imageFile);
                if (imgData?.imageUrl) {
                    document.getElementById('pet-avatar-preview-img').src = getImageUrl(imgData.imageUrl);
                }
            } catch {
                alertBox.textContent = 'Profile saved, but photo upload failed. Please try again.';
                alertBox.className = 'alert alert-warning';
                return;
            }
        }

        alertBox.textContent = 'Pet profile updated successfully!';
        alertBox.className = 'alert alert-success';
        setTimeout(() => { alertBox.className = 'alert d-none'; }, 4000);
    } catch (error) {
        console.error("Error updating pet profile:", error);
        alertBox.textContent = 'Simulated Success! Check console for the POST payload.';
        alertBox.className = 'alert alert-info';
        setTimeout(() => { alertBox.className = 'alert d-none'; }, 4000);
    }
};

const addFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const payload = buildPayload(formData);
    const imageFile = document.getElementById('edit-pet-image')?.files[0];
    const alertBox = document.getElementById('image-upload-alert');

    console.log("Submitting Create Payload to Backend:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${API}/petedit/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload.pet_data, ...payload.health_record_data })
        });

        let newPetId = payload.pet_id;
        try { const data = await response.json(); newPetId = data?.petId ?? newPetId; } catch { /* ignore */ }

        if (imageFile && newPetId) {
            try {
                const imgData = await uploadPetImage(newPetId, imageFile);
                if (imgData?.imageUrl) {
                    document.getElementById('pet-avatar-preview-img').src = getImageUrl(imgData.imageUrl);
                }
            } catch {
                alertBox.textContent = 'Pet created, but photo upload failed. You can add a photo by editing the pet.';
                alertBox.className = 'alert alert-warning';
                return;
            }
        }

        alertBox.textContent = 'Pet profile added successfully!';
        alertBox.className = 'alert alert-success';
        setTimeout(() => { alertBox.className = 'alert d-none'; }, 4000);
    } catch (error) {
        console.error("Error adding pet profile:", error);
        alertBox.textContent = 'Simulated Success! Check console for the POST payload.';
        alertBox.className = 'alert alert-info';
        setTimeout(() => { alertBox.className = 'alert d-none'; }, 4000);
    }
};

//Neuerungen Medication handling
// Blendet die Wochentage ein/aus, je nach Auswahl
function toggleWeeklyOptions() {
    const interval = document.getElementById('medication-interval').value;
    const daysContainer = document.getElementById('weekly-days-container');
    if (interval === 'weekly') {
        daysContainer.classList.remove('d-none');
    } else {
        daysContainer.classList.add('d-none');
    }
}

// Fügt ein neues Uhrzeit-Eingabefeld hinzu
document.addEventListener('DOMContentLoaded', () => {
    const addTimeBtn = document.getElementById('add-time-btn');
    const container = document.getElementById('dynamic-times-list');

    // Falls der Button auf dieser spezifischen Seite existiert
    if (addTimeBtn && container) {
        addTimeBtn.addEventListener('click', () => {
            // Erstelle eine neue Zeile für die Uhrzeit
            const newRow = document.createElement('div');
            newRow.className = 'd-flex gap-2 time-row mt-2'; // mt-2 sorgt für etwas Abstand nach oben
            
            newRow.innerHTML = `
                <input type="time" class="form-control med-time-input" style="max-width: 150px;" value="12:00" required>
                <button type="button" class="btn btn-outline-danger btn-sm remove-time-btn">X</button>
            `;
            
            // Event-Listener für den Löschen-Button (X) direkt anвязать
            newRow.querySelector('.remove-time-btn').addEventListener('click', () => {
                newRow.remove();
            });

            // Die neue Zeile in die Liste einfügen
            container.appendChild(newRow);

        });
    }


     const intervalSelect = document.getElementById('medication-interval');
    const daysContainer = document.getElementById('weekly-days-container');

    if (intervalSelect && daysContainer) {
        // Wir hören auf jede Änderung des Dropdowns
        intervalSelect.addEventListener('change', () => {
            if (intervalSelect.value === 'weekly') {
                // Zeigt die Wochentage an, indem die Bootstrap-Klasse gelöscht wird
                daysContainer.classList.remove('d-none');
            } else {
                // Versteckt sie wieder bei "daily"
                daysContainer.classList.add('d-none');
                
                // Setzt alle eventuell angehakten Wochentage zurück
                const checkboxes = daysContainer.querySelectorAll('.week-day-checkbox');
                checkboxes.forEach(cb => cb.checked = false);
            }

                  });
    }
});