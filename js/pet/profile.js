import { attachCheckboxListeners, buildTaskRow, buildFedTodayRow, renderFeedingLog, loadFedTodayStatus } from "/js/pet/petComponents.js";
// Wait for the HTML document to fully load
document.addEventListener('DOMContentLoaded', () => {
    fetchPetData();
});

// Fetch the JSON and tell the imported function to draw it
async function fetchPetData() {
    try {
        const response = await fetch('/dummy_data/petprofile.json');
        const data = await response.json();

        // Use the imported function here!
        renderPetProfile(data.myPets[0], 'pet_profile_content');

        const allPets = [...data.myPets, ...data.petsitting];
        loadFedTodayStatus(allPets);
        renderFeedingLog();

    } catch (error) {
        console.error("Error loading pet data:", error);
        document.getElementById('pet_profile_content').innerHTML = "<p>Error loading petprofile.</p>";
    }
}

function escapeHtml(str)
{
    if(str == null) return '';
    return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildMedicationList(meds)
{
    if(!Array.isArray(meds) || meds.lenght === 0)
    {
        return '<li class="card-text">none</li>';
    }
    return meds.map(m => {
        const name = escapeHtml(m.name ?? '');
        const dose = m.dose ? ` | ${escapeHtml(m.dose)}` : '';
        const freq = m.frequency ? ` | ${escapeHtml(m.frequency)}` : '';
        return `<li class="card-text">${name}${dose}${freq}</li>`;
    }).join('');
}

async function fetchReminders() {
  const res = await fetch('/api/reminders');
  if (!res.ok) return [];
  return res.json(); // array of { petId, taskId, enabled, remindTime }
}

async function upsertReminder({ petId, taskId, enabled, remindTime = null }) {
  await fetch('/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId, taskId, enabled, remindTime })
  });
}
async function appendRemindCheckboxes() {
  const reminders = await fetchReminders();
  const map = new Map(reminders.map(r => [`${r.petId}-${r.taskId}`, r]));

  document.querySelectorAll('.fed-today-row').forEach(row => {
    if (row.querySelector('.remind-checkbox')) return;

    const petId = row.querySelector('[data-pet-id]')?.dataset.petId ?? '';
    const taskId = row.querySelector('[data-task-id]')?.dataset.taskId ?? '';
    const petName = row.querySelector('[data-pet-name]')?.dataset.petName ?? '';

    const key = `${petId}-${taskId}`;
    const existing = map.get(key);
    const checked = !!existing && !!existing.enabled;
    // remindTime enthält hier die gespeicherte Fütterungszeit (HH:MM) falls vorhanden
    const remindTime = existing?.remindTime ?? '';

    const remindWrapper = document.createElement('div');
    remindWrapper.className = 'form-check d-flex align-items-center ms-3';
    remindWrapper.style.gap = '0.35rem';
    remindWrapper.innerHTML = `
      <input class="form-check-input remind-checkbox" type="checkbox"
        id="remind-${key}"
        data-pet-id="${petId}"
        data-pet-name="${escapeHtml(petName)}"
        data-task-id="${taskId}"
        aria-label="Remind me to feed ${escapeHtml(petName)}"
        ${checked ? 'checked' : ''}>
      <label class="form-check-label mb-0" for="remind-${key}" style="font-size:0.9rem; cursor:pointer;">Remind me</label>
      <input type="time" class="form-control form-control-sm remind-time-input" 
        style="width:110px; margin-left:6px; display:${checked && remindTime ? 'inline-block' : 'none'}"
        value="${remindTime}">
    `;

    row.appendChild(remindWrapper);
  });
}

document.addEventListener('change', async (e) => {
  // Checkbox toggle
  if (e.target.classList.contains('remind-checkbox')) {
    const cb = e.target;
    const petId = cb.dataset.petId;
    const taskId = cb.dataset.taskId;
    const wrapper = cb.closest('.form-check');
    const timeInput = wrapper.querySelector('.remind-time-input');

    if (cb.checked) {
      // Wenn es eine gespeicherte Fütterungszeit gibt (timeInput.value), benutze diese,
      // sonst setze Default 10:00. Zeige das Feld.
      if (timeInput) {
        timeInput.style.display = 'inline-block';
        if (!timeInput.value) timeInput.value = '10:00';
      }
      await upsertReminder({ petId, taskId, enabled: true, remindTime: timeInput?.value ?? null });
    } else {
      if (timeInput) timeInput.style.display = 'none';
      await upsertReminder({ petId, taskId, enabled: false, remindTime: null });
    }
  }

  // Time input changed (falls Nutzer Zeit manuell anpasst)
  if (e.target.classList.contains('remind-time-input')) {
    const input = e.target;
    const wrapper = input.closest('.form-check');
    const cb = wrapper.querySelector('.remind-checkbox');
    const petId = cb.dataset.petId;
    const taskId = cb.dataset.taskId;
    const timeVal = input.value || null;
    if (cb.checked) {
      await upsertReminder({ petId, taskId, enabled: true, remindTime: timeVal });
    }
  }
});

export function renderPetProfile(pet, container_id) {
    const container = document.getElementById(container_id);
    if(!container)
    {
        return;
    }
    const pid = escapeHtml(pet.petId ?? 'unknown');

    const foodTask = pet.tasks ? pet.tasks.find(t => t.name === 'Food') : undefined;

    let tasksHtml = "";
    if(Array.isArray(pet.tasks))
    {
        pet.tasks.forEach(task => {
            tasksHtml += buildTaskRow(pet.petID, pet.name, task);
        });
    }

    let accessHtml = "";
    if(Array.isArray(pet.access))
    {
            pet.access.forEach(user => {
            let badgeClass = user.role === "Parent" ? "bg-success" : "bg-info text-dark";
            accessHtml += `<span class="me-3">${escapeHtml(user.username)} <span class="badge ${badgeClass}">${escapeHtml(user.role)}</span></span>`;
        });
    }


    let htmlContent = `    
    
    
                <h1 class="petheading-${pid}">${escapeHtml(pet.name ?? '-')}</h1>
                  <div class="ppcontent">
                    <div class="card" style="width: 90%;">
                       <img id ="petprofilepicture-${pid}" src="${escapeHtml(pet.imageUrl ?? '-')}" class="card-img-top" alt="raven_pb">
                       <div class="card-body" id="pet_profile_content">
                        <div class="row">
                            <!-- Left Column -->
                            <div class="col-md-4">
                                <ul class="list-unstyled mb-0">
                                <li class="list-group-item mt-4">
                                    <h5 class="card-subtitle mb-2">Species: </h5>
                                    <p id="species-${pid}" class="card-text">${escapeHtml(pet.species ?? '-')}</p>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4">
                                    <h5 class="card-subtitle mb-2">Age: </h5>
                                    <p id="age-${pid}" class="card-text">${escapeHtml(pet.age ?? '-')}</p>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4">
                                    <h5 class="card-subtitle mb-2">Race: </h5>
                                    <p id="race-${pid}" class="card-text">${escapeHtml(pet.race ?? '-')}</p>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Colour: </h5>
                                    <p id="colour-${pid}" class="card-text">${escapeHtml(pet.colour ?? '-')}</p>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Gender: </h5>
                                    <p id="gender-${pid}" cl+ass="card-text">${escapeHtml(pet.gender ?? '-')}</p>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Weight: </h5>
                                    <p id="weight-${pid}" class="card-text">${escapeHtml(pet.weight ?? '-')}</p>
                                </li> <hr class="ppline"> 
                                </ul>
                            </div>
                            <!-- right Column -->
                            <div class="col-md-8">
                            <ul>
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Diagnosis: </h5>
                                    <p id="diagnosis-${pid}" class="card-text">${escapeHtml(pet.diagnosis ?? '-')}</p>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Medication: </h5>
                                    <ul id="medication-list-${pid}">
                                        ${buildMedicationList(pet.medication)}
                                    </ul>
                                </li> <hr class="ppline">
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Behaviour: </h5>
                                    <p id="behaviour-${pid}" class="card-text">${escapeHtml(pet.behaviour ?? '-')}</p>
                                </li> <hr class="ppline"> 
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Dietary Restrictions: </h5>
                                    <p id="diet-${pid}" class="card-text">${escapeHtml(pet.diet ?? '-')}</p>
                                </li> <hr class="ppline">  
                                <li class="list-group-item mt-4"> 
                                    <h5 class="card-subtitle mb-2">Medical Notes: </h5>
                                    <p id="medicalNotes-${pid}" class="card-text">${escapeHtml(pet.medicalNotes ?? '-')}</p>
                                </li>
                                <hr class="ppline">
                                </ul>
                            </div>
                        </div>
                         <br>

                        <div class="pet-card shadow-sm" data-pet-id="${escapeHtml(pet.petId ?? '')}">
                            <div class="row">
                                <h4>Tasks</h4>
                                <div id="global-remind-container" class="ms-3"></div>
                                <div class="col-md-9">
                                        ${buildFedTodayRow(pet.petId, pet.name, foodTask)}
                                    <div class="tasks-container mb-3">
                                        ${tasksHtml}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>    
        `;
    container.innerHTML = htmlContent;
    attachCheckboxListeners();
  appendRemindCheckboxes();
}
