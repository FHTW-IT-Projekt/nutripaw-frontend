
const API = 'http://127.0.0.1:3000/api';

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
    loginBtn.textContent = 'Anmelden...';

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
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
        showError('Verbindung zum Server fehlgeschlagen. Bitte versuche es später erneut.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Anmelden';
    }
});
