import { calculateTimeSince } from './timeUtil.js';

const API = 'http://localhost:3000/api';
let currentPet = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const petId = params.get('petId');
    const openEdit = params.get('edit') === 'true';

    if (!petId) {
        document.querySelector('.petheading').textContent = 'No pet selected.';
        return;
    }

    setupEditForm(petId);
    setupOwnershipCheck();
    await loadPet(petId, openEdit);
});

async function loadPet(petId, openEdit) {
    try {
        const res = await fetch(`${API}/getSampleData`);
        if (!res.ok) throw new Error();
        currentPet = await res.json();
    } catch {
        try {
            const res = await fetch('../dummy_data/pet.json');
            const data = await res.json();
            const all = [...(data.myPets || []), ...(data.petsitting || [])];
            currentPet = all.find(p => String(p.petId) === String(petId)) || null;
        } catch {
            currentPet = null;
        }
    }

    if (!currentPet) {
        document.querySelector('.petheading').textContent = 'Pet not found.';
        return;
    }

    populatePage(currentPet);

    if (openEdit) {
        openEditModal();
    }
}

function populatePage(pet) {
    document.querySelector('.petheading').textContent = pet.name || 'Unknown';

    if (pet.imageUrl) {
        document.getElementById('petprofilepicture').src = pet.imageUrl;
    }

    document.getElementById('species').textContent = pet.species || '-';
    document.getElementById('age').textContent = pet.age || '-';
    document.getElementById('race').textContent = pet.race || '-';
    document.getElementById('colour').textContent = pet.colour || '-';
    document.getElementById('gender').textContent = pet.gender || '-';
    document.getElementById('diagnosis').textContent = pet.diagnosis || '-';
    document.getElementById('medication').textContent = pet.medication || '-';
    document.getElementById('behaviour').textContent = pet.behaviour || '-';
}

function setupOwnershipCheck() {
    const session = JSON.parse(sessionStorage.getItem('nutripaw_user') || 'null');
    if (!session) return;

    const btn = document.getElementById('edit-pet-btn');
    btn.classList.remove('d-none');
    btn.addEventListener('click', openEditModal);
}

function openEditModal() {
    if (!currentPet) return;

    document.getElementById('edit-pet-name').value = currentPet.name || '';
    document.getElementById('edit-pet-species').value = currentPet.species || '';
    document.getElementById('edit-pet-race').value = currentPet.race || '';
    document.getElementById('edit-pet-age').value = currentPet.age || '';
    document.getElementById('edit-pet-colour').value = currentPet.colour || '';
    document.getElementById('edit-pet-diagnosis').value = currentPet.diagnosis || '';
    document.getElementById('edit-pet-behaviour').value = currentPet.behaviour || '';

    new bootstrap.Modal(document.getElementById('editPetModal')).show();
}

function setupEditForm(petId) {
    const alertBox = document.getElementById('edit-pet-alert');
    const modal = document.getElementById('editPetModal');

    document.getElementById('edit-pet-submit').addEventListener('click', async () => {
        const name = document.getElementById('edit-pet-name').value.trim();
        const species = document.getElementById('edit-pet-species').value.trim();
        const breed = document.getElementById('edit-pet-race').value.trim();
        const age = parseFloat(document.getElementById('edit-pet-age').value.trim()) || 0;
        const color = document.getElementById('edit-pet-colour').value.trim();
        const gender = document.getElementById('edit-pet-gender').value.trim();
        const weight = document.getElementById('edit-pet-weight').value.trim();
        const diagnosis = document.getElementById('edit-pet-diagnosis').value.trim();
        const medication = document.getElementById('edit-pet-medication').value.trim();
        const behaviour = document.getElementById('edit-pet-behaviour').value.trim();
        const dietaryRestrictions = document.getElementById('edit-pet-dietary').value.trim();
        const medicalNotes = document.getElementById('edit-pet-medical').value.trim();

        alertBox.className = 'alert d-none';

        if (!name || !species) {
            alertBox.textContent = 'Pet name and species are required.';
            alertBox.className = 'alert alert-danger';
            return;
        }

        const payload = { name, species, breed, age, color, diagnosis, behaviour };

        try {
            const res = await fetch(`${API}/petedit/${petId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();

            bootstrap.Modal.getInstance(modal).hide();
            await loadPet(petId, false);
        } catch {
            alertBox.textContent = 'Could not save changes. Please check your connection and try again.';
            alertBox.className = 'alert alert-danger';
        }
    });

    modal.addEventListener('hidden.bs.modal', () => {
        alertBox.className = 'alert d-none';
    });
}