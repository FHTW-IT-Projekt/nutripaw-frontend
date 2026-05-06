const form = document.getElementById('reg_form');

form.addEventListener('submit', async (event) =>
{
event.preventDefault();

document.querySelectorAll('span[id$="_error"]').forEach(el => el.innerText = '');
    document.getElementById('general_error').innerText = '';


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
        alert("Success: " + (result.message || "Registration successful"));
        form.reset(); //nur bei Erfolg wird das Formular geleert
        const successElement  = document.getElementById('general_success');
        successElement.innerText = "";
        successElement.innerText = "Registration successful";
        return result;
    }
    else
    {
        const errorElement = document.getElementById('general_error');
        errorElement.innerText = "";


        if(result.message.toLowerCase().includes("email"))
        {
            errorElement.innerText= "This email already exists or doesn't match!";  
        }
        else if(result.message.toLowerCase().includes("password"))
        {
            errorElement.innerText= "Password too short or doesn't match!";  
        }
        else
        {
            errorElement.innerText= result.message;
        }
    }

} catch (error) 
{
console.error("Network error: ", error);
alert("Server can't be reached!");
}

});