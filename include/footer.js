const footerContainer = document.createElement('footer');
footerContainer.className = 'bg-white shadow-lg mt-5 py-4 rounded-top-4';

const footerHtml = `
    <div class="container">
        <div class="row align-items-center">
           
            <div class="col-md-4 d-flex align-items-center justify-content-center justify-content-md-start mb-3 mb-md-0">
                <div class="logo-placeholder me-2" style="width: 30px; height: 30px;"></div>
                <span class="fw-bold fst-italic">NutriPaw</span>
            </div>

            <div class="col-md-4 text-center text-muted small">
                &copy; 2026 NutriPaw Team. Alle Pfoten vorbehalten.
            </div>

           
            <div class="col-md-4 text-center text-md-end">
                <a href="#" class="text-decoration-none text-dark me-3 small">Impressum</a>
                <a href="#" class="text-decoration-none text-dark small">Datenschutz</a>
            </div>
        </div>
    </div>
`;

footerContainer.innerHTML = footerHtml;
document.body.appendChild(footerContainer);