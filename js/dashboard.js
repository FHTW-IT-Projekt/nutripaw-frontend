// 1. IMPORT the render function from the components file
import { renderPetCards, loadFedTodayStatus, renderFeedingLog } from './petComponents.js';

// Wait for the HTML document to fully load
document.addEventListener('DOMContentLoaded', () => {
    fetchPetData();
});

// Fetch the JSON and tell the imported function to draw it
async function fetchPetData() {
    try {
        const response = await fetch('../dummy_data/pet.json');
        const data = await response.json();

        // Use the imported function here!
        renderPetCards(data.myPets, 'my-pets-container');
        renderPetCards(data.petsitting, 'petsitting-container');

        const allPets = [...data.myPets, ...data.petsitting];
        loadFedTodayStatus(allPets);
        renderFeedingLog();

    } catch (error) {
        console.error("Error loading pet data:", error);
        document.getElementById('my-pets-container').innerHTML = "<p>Error loading dashboard.</p>";
    }
}
