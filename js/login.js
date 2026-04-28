
const API_BASE = 'http://localhost:3000/api';

const form = document.getElementById('login-form');
const alertBox = document.getElementById('login-alert');
const loginBtn = document.getElementById('login-btn');

function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
}

function hideError() {
    alertBox.classList.add('d-none');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Login...';

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showError(data.error || 'Ungültige E-Mail-Adresse oder Passwort.');
            return;
        }

        sessionStorage.setItem('nutripaw_user', JSON.stringify({ userId: data.userId, name: data.name, email: data.email }));
        window.location.href = '/pages/user.html';

    } catch {
        showError('Connection to the server failed. Please try again later.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});
