const EP_API_BASE = 'http://localhost:3000/api';
const epPetId = new URLSearchParams(window.location.search).get('petId');

document.addEventListener('DOMContentLoaded', () => {
    initExportPdf();
});

function initExportPdf() {
    const btn = document.getElementById('export-pdf-btn');
    if (!btn) return;

    if (!epPetId) {
        btn.disabled = true;
        btn.title = 'No pet selected';
        return;
    }

    btn.addEventListener('click', exportPdf);
}

async function exportPdf() {
    const btn     = document.getElementById('export-pdf-btn');
    const label   = document.getElementById('export-pdf-label');
    const spinner = document.getElementById('export-pdf-spinner');

    btn.disabled = true;
    label.textContent = 'Generating...';
    spinner.classList.remove('d-none');

    try {
        const res = await fetch(`${EP_API_BASE}/medical/${epPetId}/export-pdf`, {
            credentials: 'include'
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `medical-history-${epPetId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('PDF export failed:', err);
        alert('Failed to export PDF. Please try again.');
    } finally {
        btn.disabled = false;
        label.textContent = 'Export PDF';
        spinner.classList.add('d-none');
    }
}
