
const API = 'http://localhost:3000/api';

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
    const rememberMe = document.getElementById('rememberMe').checked;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Login...';

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe })
        });

        const data = await res.json();

        if (!res.ok) {
            showError(data.error || 'Invalid email address or password.');
            return;
        }

        window.location.href = '/pages/user.html';

    } catch {
        showError('Connection to the server failed. Please try again later.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});