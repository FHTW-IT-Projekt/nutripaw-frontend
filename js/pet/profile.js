import { attachCheckboxListeners, buildTaskRow, buildFedTodayRow, renderFeedingLog, loadFedTodayStatus } from "./petComponents.js";

// Wait for the HTML document to fully load
document.addEventListener('DOMContentLoaded', () => {
    fetchPetData();
});

// Fetch the JSON and tell the imported function to draw it
async function fetchPetData() {
    try {
        const response = await fetch('/dummy_data/pet.json');
        const data = await response.json();

        // Use the imported function here!
        renderPetProfile(data.myPets[0], 'pet_profile_content');

        const allPets = [...data.myPets, ...data.petsitting];
        loadFedTodayStatus(allPets);
        renderFeedingLog();

    } catch (error) {
        console.error("Error loading pet data:", error);
        document.getElementById('pet_profile_content').innerHTML = "<p>Error loading petprofile.</p>";
    }
}


export function renderPetProfile(pet, container_id) {
    const container = document.getElementById(container_id);
    let htmlContent = `  <ul></ul>
                <li class="list-group-item">
                    <h5 class="card-subtitle mb-2">Species: </h5>
                    <p id="species" class="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item">
                    <h5 class="card-subtitle mb-2">Age: </h5>
                    <p id="age" class="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item">
                    <h5 class="card-subtitle mb-2">Race: </h5>
                    <p id="race" class="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item"> 
                    <h5 class="card-subtitle mb-2">Colour: </h5>
                    <p id="colour" class="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item"> 
                    <h5 class="card-subtitle mb-2">Gender: </h5>
                    <p id="gender" cl+ass="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item"> 
                    <h5 class="card-subtitle mb-2">Diagnosis: </h5>
                    <p id="diagnosis" class="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item"> 
                    <h5 class="card-subtitle mb-2">Medication: </h5>
                    <p id="medication" class="card-text">TextPlaceholder</p>
                </li> <hr class="ppline">
                <li class="list-group-item"> 
                    <h5 class="card-subtitle mb-2">Behaviour: </h5>
                    <p id="behaviour" class="card-text">TextPlaceholder</p>
                </li>             
                </ul>`
        const foodTask = pet.tasks.find(t => t.name === 'Food');

        let tasksHtml = "";
        pet.tasks.forEach(task => {
            tasksHtml += buildTaskRow(pet.petId, pet.name, task);
        });

        let accessHtml = "";
        pet.access.forEach(user => {
            let badgeClass = user.role === "Parent" ? "bg-success" : "bg-info text-dark";
            accessHtml += `<span class="me-3">${user.username} <span class="badge ${badgeClass}">${user.role}</span></span>`;
        });
        htmlContent += `
            <div class="pet-card shadow-sm" data-pet-id="${pet.petId}">
                <div class="row">
                    <div class="col-md-9">
                            ${buildFedTodayRow(pet.petId, pet.name, foodTask)}
                        <div class="tasks-container mb-3">
                            ${tasksHtml}
                    
                </div>
            </div>
        `;
    container.innerHTML = htmlContent;
    attachCheckboxListeners();
}
