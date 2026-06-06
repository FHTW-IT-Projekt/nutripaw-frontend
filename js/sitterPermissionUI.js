const NOTES_KEY = 'nutripaw-sitter-notes';

function getSession() {
    return JSON.parse(sessionStorage.getItem('nutripaw_user') || 'null');
}

function isSitterRole(session) {
    return /sitter/i.test(session?.role || '');
}

// ── Sitter: hide owner-only buttons, inject note panel ───────────────────────

function applySitterRestrictions(container, sitterId) {
    container.querySelectorAll('.pet-card').forEach(card => {
        const petId = card.dataset.petId;

        card.querySelectorAll(
            '.btn-outline-warning, .btn-danger, a[href*="editProfile"]'
        ).forEach(el => { el.style.display = 'none'; });

        if (!card.querySelector('.sitter-notes-panel')) {
            card.appendChild(buildSitterNotesPanel(petId, sitterId));
        }
    });
}

// ── Owner: show sitter notes as read-only on their pet cards 
function applyOwnerView(container) {
    container.querySelectorAll('.pet-card').forEach(card => {
        const petId = card.dataset.petId;
        if (card.querySelector('.sitter-notes-panel')) return;

        const notes = getNotesForPet(petId);
        if (notes.length === 0) return;

        const panel = document.createElement('div');
        panel.className = 'sitter-notes-panel mt-3 p-3 rounded-3 border border-info-subtle';
        panel.style.background = '#f0f8ff';
        panel.innerHTML = `<h6 class="fw-bold mb-2 text-info">Sitter Notes</h6>
                           <div class="sitter-notes-list"></div>`;
        renderNotesList(notes, panel.querySelector('.sitter-notes-list'), false);
        card.appendChild(panel);
    });
}

// ── Note panel UI

function buildSitterNotesPanel(petId, sitterId) {
    const panel = document.createElement('div');
    panel.className = 'sitter-notes-panel mt-3 p-3 rounded-3 border';
    panel.style.background = '#f9f9f9';
    panel.dataset.petId = petId;

    panel.innerHTML = `
        <h6 class="fw-bold mb-2">Add Note</h6>
        <div class="row g-2 mb-2">
            <div class="col-sm-4">
                <select class="form-select form-select-sm note-type-select">
                    <option value="care">Care Note</option>
                    <option value="medical">Medical Note</option>
                </select>
            </div>
            <div class="col-sm-8">
                <textarea class="form-control form-control-sm note-text" rows="2"
                          placeholder="Write a note..."></textarea>
            </div>
        </div>
        <button class="btn btn-sm btn-primary save-note-btn">Save Note</button>
        <div class="sitter-notes-list mt-3"></div>
    `;

    const list = panel.querySelector('.sitter-notes-list');
    renderNotesList(getNotesForPet(petId), list, true);

    panel.querySelector('.save-note-btn').addEventListener('click', () => {
        const type = panel.querySelector('.note-type-select').value;
        const text = panel.querySelector('.note-text').value.trim();
        if (!text) return;

        persistNote({ petId: String(petId), sitterId: String(sitterId), type, text });
        panel.querySelector('.note-text').value = '';
        renderNotesList(getNotesForPet(petId), list, true);
    });

    return panel;
}

// ── Note persistence (localStorage — swap for API when backend is ready) ──────
// POST /api/sitter-notes
// GET /api/sitter-notes/:petId
// DELETE /api/sitter-notes/:noteId können dann geändert werden ist nur eine temporäre lösung
function persistNote({ petId, sitterId, type, text }) {
    const note = {
        id: Date.now(),
        petId,
        sitterId,
        datetime: new Date().toISOString(),
        type,
        text
    };
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
    all.unshift(note);
    localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

function deleteNote(id) {
    const all = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
    localStorage.setItem(NOTES_KEY, JSON.stringify(all.filter(n => n.id !== id)));
}

function getNotesForPet(petId) {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]')
        .filter(n => n.petId === String(petId));
}

// ── Note list renderer 
function renderNotesList(notes, container, canDelete) {
    if (notes.length === 0) {
        container.innerHTML = '<p class="text-muted small mb-0">No notes yet.</p>';
        return;
    }

    container.innerHTML = notes.map(n => {
        const dt = new Date(n.datetime);
        const dateStr = dt.toLocaleDateString() + ' ' +
                        dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const badge = n.type === 'medical'
            ? 'bg-danger'
            : 'bg-info text-dark';
        const del = canDelete
            ? `<button class="btn btn-link btn-sm text-danger p-0 ms-2 delete-note-btn"
                        data-note-id="${n.id}" title="Delete">&times;</button>`
            : '';

        return `
            <div class="border-top pt-2 mt-2" data-note-id="${n.id}">
                <div class="d-flex align-items-center justify-content-between">
                    <div>
                        <span class="badge ${badge} me-1">${n.type}</span>
                        <small class="text-muted">${dateStr}</small>
                    </div>
                    ${del}
                </div>
                <p class="mb-0 mt-1 small">${escapeHtml(n.text)}</p>
            </div>
        `;
    }).join('');

    if (canDelete) {
        container.querySelectorAll('.delete-note-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const petId = btn.closest('.sitter-notes-panel')?.dataset.petId;
                deleteNote(Number(btn.dataset.noteId));
                if (petId) renderNotesList(getNotesForPet(petId), container, true);
            });
        });
    }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
}

// ── MutationObserver: wait for dashboard.js to render pet cards 

function watchContainer(containerId, callback) {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (el.querySelector('.pet-card')) { callback(el); return; }

    const obs = new MutationObserver((_, observer) => {
        if (el.querySelector('.pet-card')) {
            observer.disconnect();
            callback(el);
        }
    });
    obs.observe(el, { childList: true, subtree: true });
}

// ── Entry point 

document.addEventListener('DOMContentLoaded', () => {
    const session = getSession();

    if (isSitterRole(session)) {
        // Hide "Add Pet" — it's static HTML, visible immediately
        document.querySelectorAll('a[href*="editProfile.html?action=add"]').forEach(el => {
            el.style.display = 'none';
        });

        watchContainer('my-pets-container',
            c => applySitterRestrictions(c, session.userId));
        watchContainer('petsitting-container',
            c => applySitterRestrictions(c, session.userId));

    } else {
        // Owner: read-only sitter notes on own pets
        watchContainer('my-pets-container', applyOwnerView);

        // Petsitting section: owner is acting as sitter here → restrict + allow notes
        watchContainer('petsitting-container', c => {
            if (session?.userId) applySitterRestrictions(c, session.userId);
        });
    }
});
