const EP_API_BASE = 'http://localhost:3000/api';
const epPetId = new URLSearchParams(window.location.search).get('petId');
const PDF_LOGO_PATH = '/img/logo-png-transparent-smaller.png';

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
        await generateMedicalHistoryPdf();
    } catch (err) {
        console.error('PDF export failed:', err);
        alert('Failed to export PDF. Please try again.');
    } finally {
        btn.disabled = false;
        label.textContent = 'Export PDF';
        spinner.classList.add('d-none');
    }
}

async function generateMedicalHistoryPdf() {
    if (!window.jspdf?.jsPDF) {
        throw new Error('jsPDF is not available');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const page = {
        width: doc.internal.pageSize.getWidth(),
        height: doc.internal.pageSize.getHeight(),
        margin: 16
    };

    const colors = {
        primary: [91, 67, 6],
        accent: [225, 160, 41],
        muted: [120, 120, 120],
        text: [20, 20, 20]
    };

    const logo = await loadImageAsDataUrl(PDF_LOGO_PATH);
    if (logo) {
        doc.addImage(logo, 'PNG', page.margin, 10, 30, 18);
    }

    drawHeader(doc, page, colors);

    let y = 44;
    y = drawSection(doc, page, colors, y, 'PET INFORMATION', getPetInformationLines());
    y = drawSection(doc, page, colors, y, 'DIAGNOSIS', getLinesFromList('diagnosis'));
    y = drawSection(doc, page, colors, y, 'DIETARY RESTRICTIONS', getLinesFromList('diet'));
    y = drawSection(doc, page, colors, y, 'BEHAVIOUR', getLinesFromList('behaviour'));
    y = drawSection(doc, page, colors, y, 'MEDICATION', getLinesFromList('medication'));
    y = drawSection(doc, page, colors, y, 'MEDICAL NOTES', getLinesFromList('medical-notes'));

    const uploadLines = await getUploadedDocumentLines();
    drawSection(doc, page, colors, y, 'UPLOADED DOCUMENTS', uploadLines);

    doc.save(`medical-history-${epPetId}.pdf`);
}

function drawHeader(doc, page, colors) {
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Nutri-Paw', page.width / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(166, 107, 0);
    doc.text('Pet Medical History Report', page.width / 2, 26, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(...colors.muted);
    doc.text(`Generated: ${formatGeneratedAt(new Date())}`, page.width / 2, 34, { align: 'center' });

    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.5);
    doc.line(page.margin, 39, page.width - page.margin, 39);
}

function drawSection(doc, page, colors, y, title, lines) {
    y = ensurePageSpace(doc, page, y, 24);

    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, page.margin, y);

    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.3);
    doc.line(page.margin, y + 3, page.width - page.margin, y + 3);

    doc.setTextColor(...colors.text);
    doc.setFontSize(10);

    const content = lines.length ? lines : ['None'];
    y += 8;

    content.forEach(line => {
        const wrapped = doc.splitTextToSize(line, page.width - page.margin * 2);
        wrapped.forEach(part => {
            y = ensurePageSpace(doc, page, y, 10);
            doc.text(part, page.margin, y);
            y += 5;
        });
    });

    return y + 6;
}

function ensurePageSpace(doc, page, y, requiredSpace) {
    if (y + requiredSpace <= page.height - page.margin) {
        return y;
    }

    doc.addPage();
    return page.margin;
}

function getPetInformationLines() {
    return [
        ['Name', getText('pet-name')],
        ['Species', getText('species')],
        ['Race', getText('race')],
        ['Age', getText('age')],
        ['Gender', getText('gender')],
        ['Colour', getText('colour')],
        ['Weight', getText('weight')]
    ].map(([label, value]) => `${label}: ${value || 'None'}`);
}

function getLinesFromList(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return [];

    const items = [...el.querySelectorAll('li')]
        .map(item => item.textContent.trim())
        .filter(Boolean);

    if (items.length) return items;

    const text = el.textContent.trim();
    return text ? [text] : [];
}

async function getUploadedDocumentLines() {
    if (!epPetId) return [];

    try {
        const res = await fetch(`${EP_API_BASE}/pets/${epPetId}/uploads`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        const uploads = data.uploads ?? data;
        if (!Array.isArray(uploads)) return [];

        return uploads.map(upload => {
            const date = upload.uploaded_at ? ` (${formatDate(upload.uploaded_at)})` : '';
            return `- ${upload.filename}${date}`;
        });
    } catch (err) {
        console.warn('Failed to load uploaded documents for PDF:', err);
        return [];
    }
}

async function loadImageAsDataUrl(src) {
    try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const blob = await res.blob();
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (err) {
        console.warn('Failed to load PDF logo:', err);
        return null;
    }
}

function getText(elementId) {
    return document.getElementById(elementId)?.textContent.trim() || '';
}

function formatDate(value) {
    return new Date(value).toLocaleDateString('en-GB');
}

function formatGeneratedAt(date) {
    const datePart = date.toLocaleDateString('en-GB');
    const timePart = date.toLocaleTimeString('en-GB', { hour12: false });
    return `${datePart}, ${timePart}`;
}
