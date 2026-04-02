const container = document.getElementById('navCont');

const navLinks = [
    {name: 'Home', link:'#'},
    {name: 'About us', link: '#'},
    {name: 'Sign In / Sign Up', link: '#'}
];

let linksHtml = '';
for(const item of navLinks){
    // Bootstrap Klassen: nav-item und nav-link
    linksHtml += `
        <li class="nav-item">
            <a class="nav-link text-dark" href="${item.link}">${item.name}</a>
        </li>`;
}

const navbarHtml = `
<div class="container mt-3">
    <nav class="navbar navbar-expand-lg bg-white shadow-sm rounded-4 px-3">
        <div class="container-fluid">
           
            <div class="d-flex align-items-center">
                <div class="logo-placeholder me-3"></div>
                <span class="fw-bold fst-italic fs-4">NutriPaw</span>
            </div>

           
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav">
                    ${linksHtml}
                </ul>
            
            </div>
        </div>
    </nav>
 </div>   
`;

if(container) {
    container.innerHTML = navbarHtml;
} else {console.error("Container nicht gefunden!")};