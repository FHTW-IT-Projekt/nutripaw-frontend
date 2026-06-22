import { getImageUrl } from '/js/imageUtil.js';

const API = 'http://127.0.0.1:3000/api';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile(session);
    loadPets(session.userId);
    setupAddPetForm(session.userId);
    setupEditProfileForm();
});

async function loadUserProfile(session) {
    try {
        const res = await fetch(`${API}/users/${session.userId}`);
        if (!res.ok) throw new Error();
        currentUser = await res.json();
    } catch {
        // Fall back to session data
        const nameParts = (session.name || '').split(' ');
        currentUser = {
            userId: session.userId,
            firstname: nameParts[0] || '',
            lastname: nameParts.slice(1).join(' ') || '',
            name: session.name,
            email: session.email,
            role: session.role || '',
            imageUrl: session.imageUrl || null
        };
    }

    renderUserInfo(currentUser);
}

function renderUserInfo(user) {
    const fullName = user.name || [user.firstname, user.lastname].filter(Boolean).join(' ') || 'Unknown User';
    document.getElementById('user-name').textContent = fullName;
    document.getElementById('user-email').textContent = user.email || '';

    const initials = fullName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const avatarImg = document.getElementById('user-avatar-img');
    const initialsEl = document.getElementById('user-initials');
    if (user.imageUrl) {
    avatarImg.src = getImageUrl(user.imageUrl);
         avatarImg.classList.remove('d-none');
        initialsEl.classList.add('d-none');
    } else {
        avatarImg.classList.add('d-none');
        initialsEl.classList.remove('d-none');
        initialsEl.textContent = initials;
    }

    const roleBadge = document.getElementById('user-role-badge');
    if (user.role) {
        roleBadge.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        roleBadge.className = `badge role-badge role-${user.role}`;
    } else {
        roleBadge.className = 'badge role-badge d-none';
    }
}

function setupEditProfileForm() {
    const modal = document.getElementById('editProfileModal');
    const alertBox = document.getElementById('edit-profile-alert');
    const imageInput = document.getElementById('edit-profile-image');
    const modalAvatarImg = document.getElementById('modal-avatar-img');
    const modalAvatarInitials = document.getElementById('modal-avatar-initials');

    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        if (!currentUser) return;

        const nameParts = (currentUser.name || '').split(' ');
        document.getElementById('edit-firstname').value = currentUser.firstname || nameParts[0] || '';
        document.getElementById('edit-lastname').value = currentUser.lastname || nameParts.slice(1).join(' ') || '';
        document.getElementById('edit-email').value = currentUser.email || '';
        document.getElementById('edit-role').value = currentUser.role || 'owner';

        imageInput.value = '';
        if (currentUser.imageUrl) {
            modalAvatarImg.src = getImageUrl(currentUser.imageUrl);
            modalAvatarImg.classList.remove('d-none');
            modalAvatarInitials.classList.add('d-none');
        } else {
            const fullName = currentUser.name || [currentUser.firstname, currentUser.lastname].filter(Boolean).join(' ') || '';
            const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
            modalAvatarInitials.textContent = initials;
            modalAvatarImg.classList.add('d-none');
            modalAvatarInitials.classList.remove('d-none');
        }

        alertBox.className = 'alert d-none';
        document.activeElement.blur();
        bootstrap.Modal.getOrCreateInstance(modal).show();
    });

    imageInput.addEventListener('change', () => {
        alertBox.className = 'alert d-none';
        const file = imageInput.files[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png'];
        if (!allowed.includes(file.type)) {
            alertBox.textContent = 'Invalid file type. Only JPG, JPEG, and PNG images are supported.';
            alertBox.className = 'alert alert-danger';
            imageInput.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alertBox.textContent = 'File is too large. Maximum size is 5MB.';
            alertBox.className = 'alert alert-danger';
            imageInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            modalAvatarImg.src = e.target.result;
            modalAvatarImg.classList.remove('d-none');
            modalAvatarInitials.classList.add('d-none');
        };
        reader.readAsDataURL(file);
    });

    document.getElementById('edit-profile-submit').addEventListener('click', async () => {
        const firstname = document.getElementById('edit-firstname').value.trim();
        const lastname = document.getElementById('edit-lastname').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const role = document.getElementById('edit-role').value;
        const imageFile = imageInput.files[0];

        alertBox.className = 'alert d-none';

        if (!firstname || !lastname) {
            alertBox.textContent = 'First name and last name are required.';
            alertBox.className = 'alert alert-danger';
            return;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alertBox.textContent = 'Please enter a valid email address.';
            alertBox.className = 'alert alert-danger';
            return;
        }

        if (imageFile && !['image/jpeg', 'image/png'].includes(imageFile.type)) {
            alertBox.textContent = 'Invalid file type. Only JPG, JPEG, and PNG images are supported.';
            alertBox.className = 'alert alert-danger';
            return;
        }

        try {
            const res = await fetch(`${API}/users/${currentUser.userId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstname, lastname, email, role })
            });
            if (!res.ok) throw new Error();

            const updated = await res.json().catch(() => null);
            currentUser = {
                ...currentUser,
                userId: updated?.userId || currentUser.userId,
                firstname,
                lastname,
                name: updated?.name || `${firstname} ${lastname}`,
                email: updated?.email || email,
                role: updated?.role || role
            };

            let imageUploadFailed = false;
            if (imageFile) {
                try {
                    const imgFormData = new FormData();
                    imgFormData.append('image', imageFile);
                    const imgRes = await fetch(`${API}/users/${currentUser.userId}/image`, {
                        method: 'POST',
                        credentials: 'include',
                        body: imgFormData
                    });
                    if (!imgRes.ok) throw new Error();
                    const imgData = await imgRes.json().catch(() => null);
                    if (imgData?.imageUrl) currentUser.imageUrl = imgData.imageUrl;
                } catch {
                    imageUploadFailed = true;
                }
            }

            const session = JSON.parse(sessionStorage.getItem('nutripaw_user') || '{}');
            session.name = currentUser.name;
            session.email = currentUser.email;
            session.role = currentUser.role;
            if (currentUser.imageUrl) session.imageUrl = currentUser.imageUrl;
            sessionStorage.setItem('nutripaw_user', JSON.stringify(session));

            bootstrap.Modal.getInstance(modal).hide();
            document.activeElement.blur();
            renderUserInfo(currentUser);

            const profileAlert = document.getElementById('profile-alert');
            if (imageUploadFailed) {
                profileAlert.textContent = 'Profile updated, but image upload failed. Please try again.';
                profileAlert.className = 'alert alert-warning mt-3';
            } else {
                profileAlert.textContent = 'Profile updated successfully.';
                profileAlert.className = 'alert alert-success mt-3';
            }
            setTimeout(() => { profileAlert.className = 'alert d-none'; }, 4000);
        } catch {
            alertBox.textContent = 'Could not save changes. Please check your connection and try again.';
            alertBox.className = 'alert alert-danger';
        }
    });

    modal.addEventListener('hidden.bs.modal', () => {
        alertBox.className = 'alert d-none';
        imageInput.value = '';
    });
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
                    src="${getImageUrl(pet.imageUrl)}"                      
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
                <div class="col-12 col-md-auto d-flex flex-column flex-sm-row gap-2 mt-3 mt-md-0 justify-content-sm-end">
                    <a href="/pages/pet/profile.html?petId=${pet.petId}" class="btn btn-tan btn-sm">
                        View Pet Profile
                    </a>
                    <a href="/pages/pet/access.html?petId=${pet.petId}" class="btn btn-tan btn-sm">
                        Manage Access
                    </a>
                    <button class="btn btn-brown btn-sm" data-edit-pet="${pet.petId}">Edit</button>
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
            window.location.href = `/pages/pet/editProfile.html?petId=${editBtn.dataset.editPet}`;
        }
    });
}

function setupAddPetForm(userId) {
    const alertBox = document.getElementById('add-pet-alert');
    const modal = document.getElementById('addPetModal');

    document.getElementById('add-pet-submit').addEventListener('click', async (e) => {
        // 1. Verhindert störendes Standardverhalten des Browsers
        e.preventDefault(); 

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

            // 2. Sicherer Weg, das Modal zu schließen, ohne abzustürzen
            const modalInstance = bootstrap.Modal.getInstance(modal) || bootstrap.Modal.getOrCreateInstance(modal);
            modalInstance.hide();
            
            // 3. Nach einem winzigen Augenblick laden wir die Seite neu. 
            // Das killt jede blockierende Bootstrap-Schicht und zeigt das neue Tier sofort an.
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch {
            alertBox.textContent = 'Could not add pet. Please check your connection and try again.';
            alertBox.className = 'alert alert-danger';
        }
    });

    modal.addEventListener('hidden.bs.modal', () => {
        alertBox.className = 'alert d-none';
        const form = document.getElementById('add-pet-form');
        if (form) form.reset();
    });
}