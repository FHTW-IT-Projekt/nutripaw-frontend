const form = document.querySelector('form');

form.addEventListener('submit', async (event) =>
{
event.preventDefault();
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
    const result = await response.json();
    if (response.ok)
    {
        alert("Success: " + result.message);
        form.reset(); //nur bei Erfolg wird das Formular geleert
    }
    else
    {
        alert("Error: " + result.message);
    }
} catch (error) 
{
console.error("Network error: ", error);
alert("Server can't be reached!");
}

});