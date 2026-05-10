const API = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const session = JSON.parse(sessionStorage.getItem('nutripaw_user') || 'null');
    if (!session) {
        window.location.href = '/pages/login.html';
        return;
    }

    renderUserInfo(session);
    loadPets(session.userId);
    setupAddPetForm(session.userId);
});

function renderUserInfo(user) {
    document.getElementById('user-name').textContent = user.name || 'Unknown User';
    document.getElementById('user-email').textContent = user.email || '';

    const initials = (user.name || '?')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    document.getElementById('user-initials').textContent = initials;
}

async function loadPets(userId) {
    const container = document.getElementById('my-pets-container');

    let pets = [];
    try {
        const res = await fetch(`${API}/pets?userId=${userId}`);
        if (!res.ok) throw new Error();
        pets = await res.json();
    } catch {
        try {
            const res = await fetch('../dummy_data/pet.json');
            const data = await res.json();
            pets = data.myPets || [];
        } catch {
            pets = [];
        }
    }

    renderPetList(pets, container);
}

function renderPetList(pets, container) {
    if (pets.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center">
                <p class="text-muted fs-5 mb-3">No pets added yet.</p>
                <button class="btn btn-tan" data-bs-toggle="modal" data-bs-target="#addPetModal">
                    + Add your first pet
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = pets.map(pet => `
        <div class="pet-list-card shadow-sm">
            <div class="row align-items-center">
                <div class="col-auto">
                    <img
                        src="${pet.imageUrl || 'https://placecats.com/80/80'}"
                        alt="${pet.name}"
                        class="pet-avatar"
                        data-fallback="https://placecats.com/80/80">
                </div>
                <div class="col">
                    <h5 class="mb-1 fw-bold">${pet.name}</h5>
                    <p class="text-muted mb-0 small">
                        ${[pet.species, pet.age, pet.weight].filter(Boolean).join(' · ')}
                    </p>
                </div>
                <div class="col-auto d-flex flex-column flex-sm-row gap-2">
                    <a href="/pages/petprofile.html?petId=${pet.petId}" class="btn btn-tan btn-sm">
                        View Pet Profile
                    </a>
                    <button class="btn btn-outline-secondary btn-sm" data-edit-pet="${pet.petId}">
                        Edit
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('img[data-fallback]').forEach(img => {
        img.addEventListener('error', () => { img.src = img.dataset.fallback; });
    });

    container.addEventListener('click', e => {
        const editBtn = e.target.closest('[data-edit-pet]');
        if (editBtn) {
            window.location.href = `/pages/petprofile.html?petId=${editBtn.dataset.editPet}&edit=true`;
        }
    });
}

function setupAddPetForm(userId) {
    const alertBox = document.getElementById('add-pet-alert');
    const modal = document.getElementById('addPetModal');

    document.getElementById('add-pet-submit').addEventListener('click', async () => {
        const name = document.getElementById('pet-name').value.trim();
        const species = document.getElementById('pet-species').value.trim();
        const age = document.getElementById('pet-age').value.trim();
        const weight = document.getElementById('pet-weight').value.trim();

        alertBox.className = 'alert d-none';

        if (!name || !species) {
            alertBox.textContent = 'Pet name and species are required.';
            alertBox.className = 'alert alert-danger';
            return;
        }

        try {
            const res = await fetch(`${API}/pets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, species, age, weight, userId })
            });
            if (!res.ok) throw new Error();

            bootstrap.Modal.getInstance(modal).hide();
            loadPets(userId);
        } catch {
            alertBox.textContent = 'Could not add pet. Please check your connection and try again.';
            alertBox.className = 'alert alert-danger';
        }
    });

    modal.addEventListener('hidden.bs.modal', () => {
        alertBox.className = 'alert d-none';
        document.getElementById('add-pet-form').reset();
    });
}
