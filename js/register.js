const form = document.getElementById('reg_form');
const alertBox = document.getElementById('register-alert');
const successBox = document.getElementById('success-alert');

function showError(message) {
    alertBox.textContent = message;
    alertBox.classList.remove('d-none');
}

function hideError() {
    alertBox.classList.add('d-none');
}

function showSuccess(message) {
    successBox.textContent = message;
    successBox.classList.remove('d-none');
}

function hideSuccess() {
    successBox.classList.add('d-none');
}


form.addEventListener('submit', async (event) =>
{
event.preventDefault();
hideError();
hideSuccess();

const formData = new FormData(form);
const data = Object.fromEntries(formData.entries());

try{
    const response = await fetch('http://127.0.0.1:3000/api/register', 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }
    );
    const result = await response.json().catch(()=> ({}));
    if(response.ok)
    {
        form.reset(); //nur bei Erfolg wird das Formular geleert
        showSuccess("Registration successful!");
        return result;
    }
    else
    {
        if(result.message.toLowerCase().includes("email"))
        {
            showError("This email already exists or doesn't match!");
        }
        else if(result.message.toLowerCase().includes("password"))
        { 
            showError("Password too short or doesn't match!");
        }
        else
        {
            showError(result.message);
        }
    }

} catch (error) 
{
console.error("Network error: ", error);
alert("Server can't be reached!");
}

});