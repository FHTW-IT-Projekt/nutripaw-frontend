import { calculateTimeSince } from './timeUtil.js';

const PET_API = 'http://localhost:3000/api';
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
        const res = await fetch(`${PET_API}/pets/${petId}`);

        if (!res.ok) {
            throw new Error('Pet not found');
        }

        currentPet = await res.json();
    } catch (error) {
        console.error('Pet konnte nicht geladen werden:', error);
        currentPet = null;
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

function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`Element fehlt: ${id}`);
        return;
    }
    el.textContent = value || '-';
}

function populatePage(pet) {
    console.log('populate pet:', pet);


    const heading = document.querySelector('.petheading');

    if (heading) {
        heading.textContent = pet.name || 'Unknown';
    }

    const img = document.getElementById('petprofilepicture');

    if (img && pet.imageUrl) {
        img.src = pet.imageUrl;
    }

    setText('species', pet.species);
    setText('age', pet.age);
    setText('race', pet.breed || pet.race);
    setText('colour', pet.color || pet.colour);
    setText('gender', pet.gender);
    setText('weight', pet.weight);
    setText('diagnosis', pet.diagnosis);
    setText('medication', pet.medication);
    setText('behaviour', pet.behaviour);
    setText(
  'dietary',
  pet.health_record_data?.dietary_restrictions ||
  pet.dietaryRestrictions ||
  pet.dietary_restrictions || '-'
);    
    setText('medicalNotes', pet.medicalNotes || pet.medical_notes);
}

function setupOwnershipCheck() {
    const session = JSON.parse(sessionStorage.getItem('nutripaw_user') || 'null');
    if (!session) return;

     const btn = document.getElementById('edit-pet-btn');

    if (!btn) return;

    btn.classList.remove('d-none');
    btn.addEventListener('click', openEditModal);
}

function openEditModal() {
    if (!currentPet) return;

    document.getElementById('edit-pet-name').value = currentPet.name || '';
    document.getElementById('edit-pet-species').value = currentPet.species || '';
    document.getElementById('edit-pet-race').value = currentPet.breed || currentPet.race || '';
    document.getElementById('edit-pet-age').value = currentPet.age || '';
    document.getElementById('edit-pet-colour').value = currentPet.color || currentPet.colour || '';
    document.getElementById('edit-pet-gender').value = currentPet.gender || '';
    document.getElementById('edit-pet-weight').value = currentPet.weight || '';
    document.getElementById('edit-pet-diagnosis').value = currentPet.diagnosis || '';
    document.getElementById('edit-pet-medication').value = currentPet.medication || '';
    document.getElementById('edit-pet-behaviour').value = currentPet.behaviour || '';
    document.getElementById('edit-pet-dietary').value = currentPet.dietaryRestrictions || currentPet.dietary_restrictions || '';
    document.getElementById('edit-pet-medical').value = currentPet.medicalNotes || currentPet.medical_notes || '';

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
        const colour = document.getElementById('edit-pet-colour').value.trim();
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

        const payload = { name, species, breed, age, colour, gender, weight, diagnosis, medication, behaviour, dietaryRestrictions, medicalNotes};

        try {
            const res = await fetch(`${PET_API}/petedit/${petId}`, {
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