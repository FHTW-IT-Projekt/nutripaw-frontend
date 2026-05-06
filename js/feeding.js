const API = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    setDefaultDateTime();
    loadPets();
    loadFeedingLog();
    loadMedicationLog();

    document.getElementById('pet-select').addEventListener('change', onPetChange);
    document.getElementById('feeding-form').addEventListener('submit', onSubmit);
});

function setDefaultDateTime() {
    const now = new Date();
    document.getElementById('entry-date').value = now.toISOString().split('T')[0];
    document.getElementById('entry-time').value = now.toTimeString().slice(0, 5);
}

async function loadPets() {
    const select = document.getElementById('pet-select');
    try {
        const res = await fetch(`${API}/pets`);
        const pets = await res.json();
        pets.forEach(pet => {
            const opt = document.createElement('option');
            opt.value = pet.pet_id;
            opt.textContent = `${pet.name} (${pet.species})`;
            select.appendChild(opt);
        });
    } catch {
        select.innerHTML = '<option value="">Backend nicht erreichbar</option>';
    }
}

async function onPetChange() {
    const petId = this.value;
    const section = document.getElementById('medication-section');
    const container = document.getElementById('medication-checkboxes');

    if (!petId) {
        section.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`${API}/pets/${petId}/medications`);
        const meds = await res.json();

        if (meds.length === 0) {
            section.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        container.innerHTML = meds.map(med => `
            <div class="form-check">
                <input class="form-check-input med-checkbox" type="checkbox"
                    id="med-${med.medication_id}"
                    data-med-id="${med.medication_id}">
                <label class="form-check-label" for="med-${med.medication_id}">
                    ${med.medication_name} <span class="text-muted">(${med.dosage})</span>
                </label>
            </div>
        `).join('');

        section.style.display = 'block';
    } catch {
        section.style.display = 'none';
    }
}

async function onSubmit(e) {
    e.preventDefault();

    const petId   = document.getElementById('pet-select').value;
    const date    = document.getElementById('entry-date').value;
    const time    = document.getElementById('entry-time').value;
    const food    = document.getElementById('food-type').value.trim();
    const amount  = document.getElementById('food-amount').value;
    const feedback = document.getElementById('form-feedback');

    feedback.style.display = 'none';

    try {
        const feedRes = await fetch(`${API}/food-entries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pet_id: petId,
                food_type: food,
                amount: amount,
                food_time: time,
                entry_date: date
            })
        });
        if (!feedRes.ok) throw new Error('Fütterung konnte nicht gespeichert werden');

        const checkedMeds = document.querySelectorAll('.med-checkbox:checked');
        const givenAt = `${date} ${time}:00`;
        for (const cb of checkedMeds) {
            await fetch(`${API}/medication-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    medication_id: cb.dataset.medId,
                    pet_id: petId,
                    given_at: givenAt
                })
            });
        }

        feedback.textContent = '✓ Eintrag gespeichert!';
        feedback.style.display = 'inline';
        setTimeout(() => { feedback.style.display = 'none'; }, 3000);

        document.getElementById('food-type').value = '';
        document.getElementById('food-amount').value = '';
        document.querySelectorAll('.med-checkbox').forEach(cb => cb.checked = false);

        loadFeedingLog();
        loadMedicationLog();

    } catch (err) {
        feedback.textContent = '✗ ' + err.message;
        feedback.style.color = '#dc3545';
        feedback.style.display = 'inline';
    }
}

export async function loadFeedingLog() {
    const tbody = document.getElementById('feeding-tbody');
    try {
        const res = await fetch(`${API}/food-entries`);
        const entries = await res.json();

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Noch keine Einträge.</td></tr>';
            return;
        }

        tbody.innerHTML = entries.map(e => `
            <tr>
                <td>${e.entry_date}</td>
                <td>${e.food_time}</td>
                <td><strong>${e.pet_name}</strong></td>
                <td>${e.food_type}</td>
                <td>${e.amount} g</td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Backend nicht erreichbar.</td></tr>';
    }
}

export async function loadMedicationLog() {
    const tbody = document.getElementById('med-tbody');
    try {
        const res = await fetch(`${API}/medication-logs`);
        const logs = await res.json();

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Noch keine Einträge.</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(l => `
            <tr>
                <td>${formatDateTime(l.given_at)}</td>
                <td><strong>${l.pet_name}</strong></td>
                <td>${l.medication_name}</td>
                <td>${l.dosage}</td>
                <td>${l.notes || '—'}</td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Backend nicht erreichbar.</td></tr>';
    }
}

export function formatDateTime(dtStr) {
    const dt = new Date(dtStr);
    return dt.toLocaleDateString('de-AT') + ' ' + dt.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
}
