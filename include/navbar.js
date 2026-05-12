const API = 'http://localhost:3000/api';

const container = document.getElementById('navCont');

const session = JSON.parse(sessionStorage.getItem('nutripaw_user') || 'null');
const isLoggedIn = !!session;

const staticLinks = [
    { name: 'Home', link: '/pages/user.html' },
    { name: 'My Profile', link: '/pages/userprofile.html' },
    { name: 'About us', link: '/pages/aboutus.html' },
];

let linksHtml = '';
for (const item of staticLinks) {
    linksHtml += `
        <li class="nav-item">
            <a class="nav-link text-dark" href="${item.link}">${item.name}</a>
        </li>`;
}

if (isLoggedIn) {
    linksHtml += `
        <li class="nav-item">
            <button class="btn btn-link nav-link text-dark" id="logout-btn">Logout</button>
        </li>`;
} else {
    linksHtml += `
        <li class="nav-item">
            <a class="nav-link text-dark" href="/pages/login.html">Login</a>
        </li>`;
}

const navbarHtml = `
<div class="container mt-3">
    <nav class="navbar navbar-expand-lg bg-white shadow-sm rounded-4 px-3">
        <div class="container-fluid">

            <div class="d-flex align-items-center">
                <img src="/img/logo-png-transparent-smaller.png" alt="NutriPaw Logo" class="me-3" style="height: 40px; width: auto;">
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

if (container) {
    container.innerHTML = navbarHtml;

    if (isLoggedIn) {
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                await fetch(`${API}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch {
                // proceed with local logout even if backend call fails
            }

            sessionStorage.removeItem('nutripaw_user');
            window.location.href = '/pages/login.html';
        });
    }
} else {
    console.error("Container nicht gefunden!");
}
