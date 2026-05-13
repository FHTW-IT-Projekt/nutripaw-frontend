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

function handleAddActions() {
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Add Pet';
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
        }
    };
}

const editFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const payload = buildPayload(formData);

    console.log("Submitting Update Payload to Backend:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch('/api/pets/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert("Pet profile updated successfully!");
    } catch (error) {
        console.error("Error updating pet profile:", error);
        alert("Simulated Success! Check console for the POST payload.");
    }
};

const addFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const payload = buildPayload(formData);

    console.log("Submitting Create Payload to Backend:", JSON.stringify(payload, null, 2));

    try {
        // Endpunkt für das Erstellen eines neuen Datensatzes
        const response = await fetch('/api/pets/create', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        alert("Pet profile added successfully!");
    } catch (error) {
        console.error("Error adding pet profile:", error);
        alert("Simulated Success! Check console for the POST payload.");
    }
};