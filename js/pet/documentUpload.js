const API_BASE = 'http://localhost:3000/api';
const FILE_BASE = API_BASE.replace('/api', '');
const petId = new URLSearchParams(window.location.search).get('petId');
console.log(petId)

let selectedFile = null;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

document.addEventListener('DOMContentLoaded', () => {
    initUpload();
    loadUploads();
});

// ── Upload setup ───────────────────────────────────────────────────────────
function initUpload() {
    const dropZone  = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const clearBtn  = document.getElementById('clear-file-btn');

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') fileInput.click();
    });

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleFileSelect(fileInput.files[0]);
    });

    clearBtn.addEventListener('click', clearFileSelection);
    uploadBtn.addEventListener('click', uploadFile);
}

// ── File selection ─────────────────────────────────────────────────────────
function handleFileSelect(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
        alert('Please select an image (JPG, PNG, GIF, WEBP) or PDF file.');
        return;
    }

    selectedFile = file;
    document.getElementById('selected-file-name').textContent = file.name;
    document.getElementById('file-preview-area').classList.remove('d-none');
    document.getElementById('upload-btn').disabled = false;

    const previewEl = document.getElementById('selected-file-preview');
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => {
            previewEl.innerHTML = `<img src="${e.target.result}" alt="Preview" class="upload-thumb-preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        previewEl.innerHTML = '<div class="upload-pdf-icon">&#128196;</div>';
    }
}

function clearFileSelection() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.getElementById('upload-btn').disabled = false;
    document.getElementById('file-preview-area').classList.add('d-none');
    document.getElementById('selected-file-preview').innerHTML = '';
    document.getElementById('upload-status').textContent = '';
}

// ── Upload ─────────────────────────────────────────────────────────────────
async function uploadFile() {
    if (!selectedFile) {
        document.getElementById('file-input').click();
        return;
    }

    if (!petId) {
        alert('Kein petId in der URL gefunden.');
        return;
    }

    const note = document.getElementById('record-note').value.trim();
    const statusEl = document.getElementById('upload-status');
    const uploadBtn = document.getElementById('upload-btn');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('petId', petId);
    if (note) formData.append('note', note);

    statusEl.textContent = 'Uploading...';
    uploadBtn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/pets/${petId}/uploads`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        if (!res.ok) {
            const message = await getResponseErrorMessage(res);
            throw new Error(message || `Status ${res.status}`);
        }

        statusEl.textContent = 'Uploaded successfully!';
        document.getElementById('record-note').value = '';
        clearFileSelection();
        await loadUploads();

    } catch (err) {
        console.error('Upload error:', err);
        statusEl.textContent = `Upload failed: ${err.message}`;
        uploadBtn.disabled = false;
    }
}

// ── Load & render uploads ──────────────────────────────────────────────────
async function loadUploads() {
    if (!petId) {
        showNoUploads();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/pets/${petId}/uploads`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        renderTimeline(data.uploads ?? data);
    } catch (err) {
        console.error('Failed to load uploads:', err);
        showNoUploads();
    }
}

function showNoUploads() {
    document.getElementById('no-uploads-msg').classList.remove('d-none');
    document.getElementById('upload-timeline').innerHTML = '';
}

/*
 * Expected upload object from backend:
 * {
 *   upload_id:    number,
 *   filename:     string,
 *   file_url:     string,
 *   mime_type:    string,
 *   note:         string|null,
 *   uploaded_at:  string       // ISO 8601
 * }
 */
function renderTimeline(uploads) {
    const container = document.getElementById('upload-timeline');
    const noMsg     = document.getElementById('no-uploads-msg');

    if (!uploads || uploads.length === 0) {
        noMsg.classList.remove('d-none');
        container.innerHTML = '';
        return;
    }

    noMsg.classList.add('d-none');

    const sorted = [...uploads].sort(
        (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)
    );

    container.innerHTML = sorted.map(buildTimelineItem).join('');
}

function buildTimelineItem(upload) {
    const date     = new Date(upload.uploaded_at);
    const dateStr  = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr  = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const isImage  = upload.mime_type && upload.mime_type.startsWith('image/');
    const fileUrl  = normalizeFileUrl(upload.file_url);
    const safeUrl  = escapeHtml(fileUrl);
    const safeName = escapeHtml(upload.filename);
    const downloadUrl = `${API_BASE}/pets/${petId}/uploads/${upload.upload_id}/download`;
    const safeDownloadUrl = escapeHtml(downloadUrl);

    const thumbnail = isImage
        ? `<img src="${safeUrl}" alt="${safeName}" class="timeline-thumb">`
        : `<div class="timeline-pdf-icon">&#128196;</div>`;

    const action = `
    <button class="btn btn-sm btn-outline-danger"
            onclick="deleteUpload(${upload.upload_id})">
        ✕
    </button>
    ${isImage
        ? `<button class="btn btn-sm btn-outline-primary"
               onclick="openImagePreview('${safeUrl}', '${safeName}')">Preview</button>`
        : `<a class="btn btn-sm btn-outline-success"
               href="${safeDownloadUrl}">Download PDF</a>`
    }
`;

    const noteHtml = upload.note
        ? `<p class="mb-0 text-muted small">${escapeHtml(upload.note)}</p>`
        : '';

    return `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-date">${dateStr} at ${timeStr}</div>
            <div class="timeline-card d-flex align-items-center gap-3">
                ${thumbnail}
                <div class="flex-grow-1 overflow-hidden">
                    <div class="fw-bold text-truncate">${safeName}</div>
                    ${noteHtml}
                </div>
                <div class="flex-shrink-0">${action}</div>
            </div>
        </div>`;
}

// ── Image preview modal ────────────────────────────────────────────────────
function openImagePreview(url, filename) {
    document.getElementById('preview-modal-img').src = url;
    document.getElementById('imagePreviewModalLabel').textContent = filename;
    document.getElementById('preview-modal-download').href = url;
    document.getElementById('preview-modal-download').download = filename;
    new bootstrap.Modal(document.getElementById('imagePreviewModal')).show();
}

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeFileUrl(fileUrl) {
    if (!fileUrl) return '';
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const slash = fileUrl.startsWith('/') ? '' : '/';
    return FILE_BASE + slash + fileUrl;
}

async function getResponseErrorMessage(res) {
    try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await res.json();
            return data.message || data.error || JSON.stringify(data);
        }

        return await res.text();
    } catch {
        return '';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}



async function deleteUpload(uploadId) {
const confirmed = confirm('Diese Datei löschen?');
if (!confirmed) return;

try {
    const res = await fetch(`${API_BASE}/pets/${petId}/uploads/${uploadId}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (!res.ok) {
        const message = await getResponseErrorMessage(res);
        throw new Error(message || `Status ${res.status}`);
    }

    await loadUploads();

} catch (err) {
    console.error('Delete error:', err);
    alert(`Datei konnte nicht gelöscht werden: ${err.message}`);
}

}
