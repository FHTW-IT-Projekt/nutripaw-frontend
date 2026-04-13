// 1. IMPORT the render function from the components file
import { renderPetCards } from './petComponents.js';

// Wait for the HTML document to fully load
document.addEventListener('DOMContentLoaded', () => {
    fetchPetData();
});

// Fetch the JSON and tell the imported function to draw it
async function fetchPetData() {
    try {
        const response = await fetch('pets.json');
        const data = await response.json();

        // Use the imported function here!
        renderPetCards(data.myPets, 'my-pets-container');
        renderPetCards(data.petsitting, 'petsitting-container');
        
    } catch (error) {
        console.error("Error loading pet data:", error);
        document.getElementById('my-pets-container').innerHTML = "<p>Error loading dashboard.</p>";
    }
}