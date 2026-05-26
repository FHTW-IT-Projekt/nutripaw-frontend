import { renderPetCards, loadFedTodayStatus, renderFeedingLog } from './pet/petComponents.js';

const API = 'http://127.0.0.1:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchPetData();
});

async function fetchPetData() {
    let myPets = [];
    let petsitting = [];

    const session = JSON.parse(sessionStorage.getItem('nutripaw_user') || 'null');

    if (session?.userId) {
        try {
            const res = await fetch(`${API}/pets?userId=${session.userId}`, { credentials: 'include' });
            if (!res.ok) throw new Error();
            myPets = await res.json();
        } catch {
            // fall through to dummy data
        }
    }

    if (myPets.length === 0) {
        try {
            const res = await fetch('../dummy_data/pet.json');
            const data = await res.json();
            myPets = data.myPets || [];
            petsitting = data.petsitting || [];
        } catch (error) {
            console.error("Error loading pet data:", error);
            document.getElementById('my-pets-container').innerHTML = "<p>Error loading dashboard.</p>";
            return;
        }
    }

    renderPetCards(myPets, 'my-pets-container');
    if (petsitting.length > 0) {
        renderPetCards(petsitting, 'petsitting-container');
    }

    const allPets = [...myPets, ...petsitting];
    loadFedTodayStatus(allPets);
    renderFeedingLog();
}
