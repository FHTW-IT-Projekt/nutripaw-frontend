import { calculateTimeSince } from './timeUtil.js';

const API = 'http://localhost:3000/api';

export function renderPetCards(petsArray, containerId) {
    const container = document.getElementById(containerId);
    let htmlContent = "";

    petsArray.forEach(pet => {
        let tasksHtml = "";
        pet.tasks.forEach(task => {
            tasksHtml += buildTaskRow(pet.petId, task);
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

function buildTaskRow(petId, task) {
    let scheduleHtml = "";
    task.schedule.forEach(time => {
        const cbId = `fed-${petId}-${task.taskId}-${time.replace(' ', '')}`;
        scheduleHtml += `
            <label class="me-2">
                ${time} <input type="checkbox"
                    class="form-check-input ms-1 feeding-checkbox"
                    id="${cbId}"
                    data-pet-id="${petId}"
                    data-task-id="${task.taskId}"
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
                    late feeding at: <input type="time" class="form-control form-control-sm time-input ms-1">
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
}

async function onCheckboxChange(e) {
    const cb = e.target;
    const petId = cb.dataset.petId;
    const taskId = cb.dataset.taskId;
    const scheduleTime = cb.dataset.scheduleTime;

    if (cb.checked) {
        try {
            await fetch(`${API}/feeding-events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pet_id: petId, task_id: taskId, schedule_time: scheduleTime })
            });
            const lastEl = document.getElementById(`last-${petId}-${taskId}`);
            if (lastEl) lastEl.textContent = '| last: just now';
        } catch {
            cb.checked = false;
        }
    } else {
        try {
            await fetch(`${API}/feeding-events`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pet_id: petId, task_id: taskId, schedule_time: scheduleTime })
            });
        } catch {
            cb.checked = true;
        }
    }
}

export async function loadFedTodayStatus(petsArray) {
    for (const pet of petsArray) {
        try {
            const res = await fetch(`${API}/feeding-events/today/${pet.petId}`);
            const events = await res.json();
            events.forEach(event => {
                const cbId = `fed-${pet.petId}-${event.task_id}-${event.schedule_time.replace(' ', '')}`;
                const cb = document.getElementById(cbId);
                if (cb) cb.checked = true;
            });
        } catch {
            // backend not reachable, checkboxes stay unchecked
        }
    }
}
