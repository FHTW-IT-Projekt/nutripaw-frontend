const container = document.getElementById('navCont');

const isLoggedIn = !!sessionStorage.getItem('nutripaw_user');

const navLinks = [
    {name: 'Home', link: '/pages/user.html'},
    {name: 'About us', link: '/pages/aboutus.html'},
];

let linksHtml = '';
for (const item of navLinks) {
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
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('nutripaw_user');
            window.location.href = '/pages/login.html';
        });
    }
} else {
    console.error("Container nicht gefunden!");
}
