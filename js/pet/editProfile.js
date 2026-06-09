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

async function loadPetData() {
   // const pet = mockApiResponse.data;
    const params = new URLSearchParams(document.location.search);
    const petId = params.get('petId');

    if (!petId) {
        document.getElementById("error-message").style.display = "block";
        document.getElementById("error-message").innerText = "Fehler: Keine Haustier-ID in der URL gefunden.";
        return;
    }

    try {
        // Fetch-Aufruf an eure echte API
        const res = await fetch(`${API}/pets/${petId}`, { credentials: 'include' });
        if (!res.ok) throw new Error("Fehler beim Laden der API-Daten");
        
        const pet = await res.json();
        console.log(pet);

   /* if (pet.currentUserRole !== "owner") {
        const editPetForm = document.getElementById("edit-pet-form");
        if(editPetForm)
        {
            editPetForm.style.display = "none";
        }
        document.getElementById("error-message").style.display = "block";
        document.getElementById("error-message").innerText = "Access Denied: You can only edit profiles for your own pets, not pets you are sitting.";
        return;
    }*/

    // Formularfelder mit bestehenden DB-Daten befüllen (in gewünschter Reihenfolge)
    if (document.getElementById("pet_id")) document.getElementById("pet_id").value = pet.petId;
    
    document.getElementById("name").value = pet.name || "";
    document.getElementById("species").value = pet.species || "";
    document.getElementById("race").value = pet.breed || "";
    document.getElementById("age").value = pet.age || "";
    document.getElementById("colour").value = pet.color || "";
    document.getElementById("gender").value = pet.gender || "";
    document.getElementById("weight").value = pet.weight || "";
    document.getElementById("diagnosis").value = pet.diagnosis || "";
    document.getElementById("medication").value = pet.medication || "";
    document.getElementById("behaviour").value = pet.behaviour || "";
    document.getElementById("dietary_restrictions").value = pet.dietaryRestrictions || "";
    document.getElementById("medical_notes").value = pet.medicalNotes || "";
    
} catch(error)
    {
         console.error("Fehler beim Abrufen der Haustierdaten:", error);
    
         // Sicherstellen, dass das Element existiert, bevor style aufgerufen wird
         const errorElement = document.getElementById("error-message");
        if (errorElement) {
            errorElement.style.display = "block";
            errorElement.innerText = "Fehler beim Laden der echten Datenbank-Daten.";
        } else {
            // Fallback, falls das HTML-Element fehlt
            alert("Fehler beim Laden der echten Datenbank-Daten. Siehe Konsole.");
        }
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
            race: formData.get("race"),
            age: parseFloat(formData.get("age")),
            colour: formData.get("colour"),
            gender: formData.get("gender"),
            weight: parseFloat(formData.get("weight"))
        },
        health_record_data: {
            diagnosis: formData.get("diagnosis"),
            medication: formData.get("medication"),
            behaviour: formData.get("behaviour"),
            dietary_restrictions: formData.get("dietary_restrictions"),
            medical_notes: formData.get("medical_notes"),
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
        console.log("document cookie: ", document.cookie);
        
        // 1. Token holen
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API}/petedit/${payload.pet_id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Token integriert
            },
            body: JSON.stringify({ 
                ...payload.pet_data, 
                ...payload.health_record_data, 
                ...payload.medication_data 
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server lehnte die Anfrage ab mit Status: ${response.status}`);
        }

        // Bildupload-Block
        if (imageFile && payload.pet_id) {
            try {
                const imgData = await uploadPetImage(payload.pet_id, imageFile);
                if (imgData?.imageUrl) {
                    document.getElementById('pet-avatar-preview-img').src = getImageUrl(imgData.imageUrl);
                }
            } catch {
                alertBox.textContent = 'Profile saved, but photo upload failed. Please try again.';
                alertBox.className = 'alert alert-warning';
                alertBox.classList.remove('d-none');
                setTimeout(() => { window.location.reload(); }, 2000);
                return;
            }
        }

        // Erfolgs-Block
        alertBox.textContent = 'Pet profile updated successfully!';
        alertBox.className = 'alert alert-success';
        alertBox.classList.remove('d-none');
        
        setTimeout(() => { 
            alertBox.className = 'alert d-none'; 
            window.location.reload(); 
        }, 1500);

    } catch (error) {
        console.error("Error updating pet profile:", error);
        alertBox.textContent = `Error saving profile: ${error.message}`;
        alertBox.className = 'alert alert-danger';
        alertBox.classList.remove('d-none');
        setTimeout(() => { alertBox.className = 'alert d-none'; }, 4000);
    }
};
const addFormSubmit = async (e) => {
    e.preventDefault();
    console.log("SCHRITT 1: Formular abgeschickt.");
    
    const formData = new FormData(e.target);
    const payload = buildPayload(formData);
    const imageFile = document.getElementById('edit-pet-image')?.files[0];
    const alertBox = document.getElementById('image-upload-alert');

    console.log("Submitting Create Payload to Backend:", JSON.stringify(payload, null, 2));

    try {
        // 1. Token holen
        const token = localStorage.getItem('authToken'); 

        const response = await fetch(`${API}/petedit/`, {
            method: 'POST',
            credentials: 'include',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Token integriert
            },
            body: JSON.stringify({ 
                ...payload.pet_data, 
                ...payload.health_record_data,
                ...payload.medication_data 
            })
        });

        // Backend-Fehler abfangen
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server lehnte die Anfrage ab mit Status: ${response.status}`);
        }

        let newPetId = payload.pet_id;
        try { 
            const data = await response.json(); 
            newPetId = data?.petId ?? newPetId; 
        } catch { /* ignorieren */ }

        // Bildupload-Block
        if (imageFile && newPetId) {
            try {
                const imgData = await uploadPetImage(newPetId, imageFile);
                if (imgData?.imageUrl) {
                    document.getElementById('pet-avatar-preview-img').src = getImageUrl(imgData.imageUrl);
                }
            } catch {
                alertBox.textContent = 'Tier erstellt, aber Foto-Upload fehlgeschlagen. Du kannst später ein Foto hinzufügen.';
                alertBox.className = 'alert alert-warning';
                alertBox.classList.remove('d-none');
                setTimeout(() => { window.location.reload(); }, 2000);
                return;
            }
        }

        // Erfolgs-Block
        alertBox.textContent = 'Haustier-Profil erfolgreich hinzugefügt!';
        alertBox.className = 'alert alert-success';
        alertBox.classList.remove('d-none'); 
        
        setTimeout(() => { 
            alertBox.className = 'alert d-none'; 
            window.location.reload(); 
        }, 1500);

    } catch (error) {
        console.error("Fehler beim Hinzufügen des Haustier-Profils:", error);
        alertBox.textContent = `Fehler beim Erstellen des Profils: ${error.message}`;
        alertBox.className = 'alert alert-danger';
        alertBox.classList.remove('d-none');
        setTimeout(() => { alertBox.className = 'alert d-none'; }, 4000);
    }
};

//Neuerungen Medication handling
// Blendet die Wochentage ein/aus, je nach Auswahl
window.toggleWeeklyOptions = function() {
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

    if (container) {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-outline-danger') || e.target.innerText === 'X') {
                e.target.parentElement.remove();
            }
        });
    }

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
    if (intervalSelect) {
        intervalSelect.addEventListener('change', window.toggleWeeklyOptions);
    }
});