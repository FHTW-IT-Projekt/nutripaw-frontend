// Dummy JSON Data
const mockApiResponse = {
    status: 200,
    data: {
        pet_id: 1,
        owner_id: 101, 
        name: "Nao",
        species: "Housecat",
        breed: "Domestic Shorthair",
        age: 7,
        color: "Brown Tabby",
        profile_image: "nao.jpg",
        special_features: "Very vocal when hungry. Sleeps all day.",
        health_record: {
            diagnosis: "Slightly overweight",
            weight: 11.5
        },
        currentUserRole: "owner" 
    }
};

//initialisation
document.addEventListener("DOMContentLoaded", () => {
    loadPetData();
});

function loadPetData() {
    const pet = mockApiResponse.data;

    
    if (pet.currentUserRole !== "owner") {
        document.getElementById("edit-pet-form").style.display = "none";
        document.getElementById("error-message").style.display = "block";
        document.getElementById("error-message").innerText = "Access Denied: You can only edit profiles for your own pets, not pets you are sitting.";
        return;
    }

    //fill out the form with existing DB data as placeholders
    document.getElementById("pet_id").value = pet.pet_id;
    document.getElementById("name").value = pet.name || "";
    document.getElementById("species").value = pet.species || "";
    document.getElementById("breed").value = pet.breed || "";
    document.getElementById("age").value = pet.age || "";
    document.getElementById("color").value = pet.color || "";
    document.getElementById("special_features").value = pet.special_features || "";
    
    // Populate joined table data
    if (pet.health_record) {
        document.getElementById("diagnosis").value = pet.health_record.diagnosis || "";
    }
}

//POST Request
document.getElementById("edit-pet-form").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default page reload

    // Gather data
    const formData = new FormData(e.target);
    
    const payload = {
        pet_id: parseInt(formData.get("pet_id")),
        pet_data: {
            name: formData.get("name"),
            species: formData.get("species"),
            breed: formData.get("breed"),
            age: parseFloat(formData.get("age")),
            color: formData.get("color"),
            special_features: formData.get("special_features")
        },
        health_record_data: {
            diagnosis: formData.get("diagnosis"),
            record_date: new Date().toISOString().split('T')[0] //Captures today's date for the record update
        }
    };

    console.log("Submitting Payload to Backend:", JSON.stringify(payload, null, 2));

    try {
        //POST Request
        const response = await fetch('/api/pets/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${userToken}` // Add JWT if applicable
            },
            body: JSON.stringify(payload)
        });

        // if (!response.ok) throw new Error('Network response was not ok');
        
        alert("Pet profile updated successfully!");
        // Redirect back to dashboard: window.location.href = '/dashboard';
        
    } catch (error) {
        console.error("Error updating pet profile:", error);
        alert("Simulated Success! (Network fetch failed because /api/pets/update is a placeholder endpoint). Check console for the POST payload.");
    }
});