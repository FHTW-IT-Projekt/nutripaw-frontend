import { calculateTimeSince } from './timeUtil.js';

const API = 'http://localhost:3000/api';
const LOG_KEY = 'nutripaw-feeding-log';

export function renderPetCards(petsArray, containerId) {
    const container = document.getElementById(containerId);
    let htmlContent = "";

    petsArray.forEach(pet => {
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
                    <div class="col-md-3 text-center mb-3 mb-md-0">
                        <img src="${pet.imageUrl}" alt="${pet.name}" class="pet-avatar mb-2">
                        <button class="btn btn-tan w-100 btn-sm">View Full Profile</button>
                    </div>
                    <div class="col-md-9">
                        <h4 class="mb-3">
                            <strong>${pet.name}</strong> <span class="fs-6 text-muted">| ${pet.species} | ${pet.age} | ${pet.weight}</span>
                        </h4>
                        ${buildFedTodayRow(pet.petId, pet.name, foodTask)}
                        <div class="tasks-container mb-3">
                            ${tasksHtml}
                        </div>
                        ${pet.access.length > 0 ? `
                            <div class="task-row">
                                <strong>Profile Access</strong><br>
                                ${accessHtml}
                                <button class="btn btn-outline-warning btn-sm float-end">Edit</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
    attachCheckboxListeners();
}

function buildFedTodayRow(petId, petName, foodTask) {
    if (!foodTask) return '';
    const timeSinceString = calculateTimeSince(foodTask.lastCompletedTime);
    const cbId = `fed-${petId}-${foodTask.taskId}-fedtoday`;
    return `
        <div class="fed-today-row d-flex align-items-center gap-3 mb-3 p-2 rounded-3" style="background:#f5f0e8;">
            <input type="checkbox"
                class="form-check-input feeding-checkbox"
                id="${cbId}"
                data-pet-id="${petId}"
                data-pet-name="${petName}"
                data-task-id="${foodTask.taskId}"
                data-task-name="Food"
                data-schedule-time="fedtoday"
                style="width:1.3em;height:1.3em;cursor:pointer;">
            <label for="${cbId}" class="fw-bold mb-0 fs-6" style="cursor:pointer;">Fed today</label>
            <span class="text-muted ms-auto" id="last-fedtoday-${petId}-${foodTask.taskId}" style="font-size:0.875rem;">
                last: ${timeSinceString}
            </span>
        </div>
    `;
}

function buildTaskRow(petId, petName, task) {
    let scheduleHtml = "";
    task.schedule.forEach(time => {
        const cbId = `fed-${petId}-${task.taskId}-${time.replace(' ', '')}`;
        scheduleHtml += `
            <label class="me-2">
                ${time} <input type="checkbox"
                    class="form-check-input ms-1 feeding-checkbox"
                    id="${cbId}"
                    data-pet-id="${petId}"
                    data-pet-name="${petName}"
                    data-task-id="${task.taskId}"
                    data-task-name="${task.name}"
                    data-schedule-time="${time}">
            </label>
            <span class="text-muted me-2">|</span>
        `;
    });

    const timeSinceString = calculateTimeSince(task.lastCompletedTime);

    return `
        <div class="task-row" data-task-id="${task.taskId}">
            <strong>${task.name}</strong> <span class="badge bg-success mb-2">${task.frequency}</span><br>
            <div class="d-flex align-items-center flex-wrap">
                ${scheduleHtml}
                <label class="me-2 text-muted" style="font-size: 0.9rem;">
                    late feeding at: <input type="time"
                        class="form-control form-control-sm time-input ms-1"
                        data-pet-id="${petId}"
                        data-pet-name="${petName}"
                        data-task-id="${task.taskId}"
                        data-task-name="${task.name}">
                </label>
                <span class="time-since-text ms-2" id="last-${petId}-${task.taskId}">
                    | last: ${timeSinceString}
                </span>
                <button class="btn btn-outline-warning btn-sm ms-auto">Edit</button>
            </div>
        </div>
    `;
}

function attachCheckboxListeners() {
    document.querySelectorAll('.feeding-checkbox').forEach(cb => {
        cb.addEventListener('change', onCheckboxChange);
    });
    document.querySelectorAll('.time-input').forEach(input => {
        input.addEventListener('change', onTimeInputChange);
    });
}

async function onTimeInputChange(e) {
    const input = e.target;
    const timeValue = input.value;
    if (!timeValue) return;

    const petId = input.dataset.petId;
    const petName = input.dataset.petName;
    const taskId = input.dataset.taskId;
    const taskName = input.dataset.taskName;
    const scheduleTime = `late-${timeValue}`;
    const now = new Date();

    // Build a Date with today's date + the entered time
    const [h, m] = timeValue.split(':');
    now.setHours(parseInt(h), parseInt(m), 0, 0);
    const fedAt = now.toISOString();
    const today = fedAt.split('T')[0];

    const lastEl = document.getElementById(`last-${petId}-${taskId}`);
    if (lastEl) lastEl.textContent = `| last: ${timeValue}`;

    saveLocalEvent(petId, taskId, scheduleTime, fedAt);
    addToFeedingLog({ petId, petName, taskId, taskName, scheduleTime: timeValue, fedAt, date: today });
    renderFeedingLog();

    try {
        await fetch(`${API}/feeding-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_id: petId, task_id: taskId, schedule_time: scheduleTime })
        });
    } catch {
        // backend not reachable
    }
}

async function onCheckboxChange(e) {
    const cb = e.target;
    const petId = cb.dataset.petId;
    const petName = cb.dataset.petName;
    const taskId = cb.dataset.taskId;
    const taskName = cb.dataset.taskName;
    const scheduleTime = cb.dataset.scheduleTime;

    if (cb.checked) {
        const now = new Date().toISOString();

        // Update UI immediately
        const lastElId = scheduleTime === 'fedtoday'
            ? `last-fedtoday-${petId}-${taskId}`
            : `last-${petId}-${taskId}`;
        const lastEl = document.getElementById(lastElId);
        if (lastEl) lastEl.textContent = scheduleTime === 'fedtoday' ? 'last: just now' : '| last: just now';

        saveLocalEvent(petId, taskId, scheduleTime, now);
        addToFeedingLog({ petId, petName, taskId, taskName, scheduleTime, fedAt: now, date: now.split('T')[0] });
        renderFeedingLog();

        try {
            await fetch(`${API}/feeding-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pet_id: petId, task_id: taskId, schedule_time: scheduleTime })
            });
        } catch {
            // backend not reachable — localStorage keeps the state
        }
    } else {
        removeLocalEvent(petId, taskId, scheduleTime);
        removeFromFeedingLog(petId, taskId, scheduleTime);
        renderFeedingLog();

        try {
            await fetch(`${API}/feeding-events`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pet_id: petId, task_id: taskId, schedule_time: scheduleTime })
            });
        } catch {
            // backend not reachable
        }
    }
}

// ── localStorage: feeding events (for checkbox state) ────────────────────────

function saveLocalEvent(petId, taskId, scheduleTime, timestamp) {
    const key = `feeding-${petId}`;
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = stored.filter(e =>
        !(e.task_id === taskId && e.schedule_time === scheduleTime && e.date === today)
    );
    filtered.push({ task_id: taskId, schedule_time: scheduleTime, fed_at: timestamp, date: today });
    localStorage.setItem(key, JSON.stringify(filtered));
}

function removeLocalEvent(petId, taskId, scheduleTime) {
    const key = `feeding-${petId}`;
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(
        stored.filter(e => !(e.task_id === taskId && e.schedule_time === scheduleTime && e.date === today))
    ));
}

function getLocalEventsToday(petId) {
    const key = `feeding-${petId}`;
    const today = new Date().toISOString().split('T')[0];
    return JSON.parse(localStorage.getItem(key) || '[]').filter(e => e.date === today);
}

// ── localStorage: feeding log (for protocol display) ─────────────────────────

function addToFeedingLog(entry) {
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    const filtered = log.filter(e =>
        !(e.petId === entry.petId && e.taskId === entry.taskId &&
          e.scheduleTime === entry.scheduleTime && e.date === entry.date)
    );
    filtered.unshift(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(filtered.slice(0, 100)));
}

function removeFromFeedingLog(petId, taskId, scheduleTime) {
    const today = new Date().toISOString().split('T')[0];
    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    localStorage.setItem(LOG_KEY, JSON.stringify(
        log.filter(e => !(e.petId === petId && e.taskId === taskId &&
                         e.scheduleTime === scheduleTime && e.date === today))
    ));
}

export function renderFeedingLog(containerId = 'feeding-log-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');

    if (log.length === 0) {
        container.innerHTML = '<p class="text-muted text-center py-2 mb-0">Noch keine Einträge heute.</p>';
        return;
    }

    const scheduleLabel = s => s === 'fedtoday' ? 'Fed today' : s;

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead style="background:#f5f0e8;">
                    <tr>
                        <th>Datum</th>
                        <th>Uhrzeit</th>
                        <th>Tier</th>
                        <th>Aufgabe</th>
                        <th>Zeitslot</th>
                    </tr>
                </thead>
                <tbody>
                    ${log.map(e => {
                        const dt = new Date(e.fedAt);
                        return `<tr>
                            <td>${dt.toLocaleDateString('de-AT')}</td>
                            <td>${dt.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td><strong>${e.petName}</strong></td>
                            <td>${e.taskName}</td>
                            <td><span class="badge bg-secondary">${scheduleLabel(e.scheduleTime)}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ── Load today's status on page load ─────────────────────────────────────────

export async function loadFedTodayStatus(petsArray) {
    for (const pet of petsArray) {
        let events = [];

        try {
            const res = await fetch(`${API}/feeding-events/today/${pet.petId}`);
            events = await res.json();
        } catch {
            events = getLocalEventsToday(pet.petId);
        }

        const foodTask = pet.tasks ? pet.tasks.find(t => t.name === 'Food') : null;
        let foodFedToday = false;

        events.forEach(event => {
            const cbId = `fed-${pet.petId}-${event.task_id}-${event.schedule_time.replace(' ', '')}`;
            const cb = document.getElementById(cbId);
            if (cb) cb.checked = true;

            if (foodTask && event.task_id === foodTask.taskId) {
                foodFedToday = true;
            }
        });

        if (foodFedToday && foodTask) {
            const fedTodayCb = document.getElementById(`fed-${pet.petId}-${foodTask.taskId}-fedtoday`);
            if (fedTodayCb) fedTodayCb.checked = true;
        }
    }
}
