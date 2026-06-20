// Dummy data used while backend is unavailable
const mockApiResponse = {
    status: 200,
    data: {
        name: 'Nao',
        species: 'Cat',
        race: 'European Shorthair',
        age: '10 Years',
        gender: 'Female',
        castrated: true,
        color: 'tabby',
        weight: '3.6kg',
        medicine: [
            { name: 'Apelka', dosage: '2.0mg', daily_frequency: '2' },
            { name: 'Blood Pressure', dosage: 'Half a pill', daily_frequency: '1' }
        ],
        diagnosis: [
            { description: 'Hyperthyroidism', date: '01-01-2026' },
            { description: 'Hypertension', date: '01-01-2026' },
        ],
        dietary_restrictions: [
            { description: 'No Dry Food' },
            { description: 'Raw Fish abc abc' },
        ],
        medical_notes: [
            { date: '20-03-2026', description: 'Scratching ear' },
            { date: '20-02-2026', description: 'Constipated for 3 days' },
            { date: '20-01-2026', description: 'Ate garlic and onions' },
        ],
        behavior: ['Skitish', 'Cuddly', 'Scratchy', 'Food Motivated'],
        weight_changes: [
            { date: '20-12-2025', weight: '3.2kg', change: '----' },
            { date: '20-01-2026', weight: '3.6kg', change: '+0.4g' },
            { date: '18-02-2026', weight: '3.3kg', change: '-0.3g' },
            { date: '20-03-2026', weight: '3.3kg', change: '----' },
            { date: '25-04-2026', weight: '3.5kg', change: '+0.2g' },
        ]
    }
};

const MH_API_BASE = 'http://localhost:3000/api/medical-history';
const mhPetId = new URLSearchParams(window.location.search).get('petId');

document.addEventListener('DOMContentLoaded', () => {
    fillData();
});

async function fillData() {
    let data = [];
    const petId = 1;
    try {
        const res = await fetch(`${MH_API_BASE}/${petId}/dashboard`);
        if(res.status === 200){
            data = await res.json()
            data = data.data
        }else{
            data = {}
        }
    } catch (e) {
        data = mockApiResponse.data;
    }


    document.getElementById('pet-name').textContent = data.name;
    document.getElementById('species').textContent = data.species;
    document.getElementById('race').textContent = data.race;
    document.getElementById('age').textContent = data.age;
    document.getElementById('gender').textContent = data.gender;
    document.getElementById('colour').textContent = data.color;
    document.getElementById('weight').textContent = data.weight;
    document.getElementById('castrated').textContent = data.castrated ? 'Yes' : 'No';

    const populateList = (elementId, array, formatter) => {
        const el = document.getElementById(elementId);
        if (el && array.length) {
            el.innerHTML = '';
            array.forEach(item => {
                const li = document.createElement('li');
                li.textContent = formatter(item);
                el.appendChild(li);
            });
        }
    };

    populateList('diagnosis', data.diagnosis, item => `${item.description} (Date: ${item.date})`);
    populateList('diet', data.dietary_restrictions, item => item.description);
    populateList('medication', data.medicine, item => `${item.name} - ${item.dosage} - ${item.daily_frequency}x daily`);
    populateList('behaviour', data.behavior, item => item);
    populateList('weight-changes', data.weight_changes, item => `${item.date} || ${item.weight} || ${item.change}`);
    populateList('medical-notes', data.medical_notes, item => `${item.date}: ${item.description}`);
}


const params = new URLSearchParams(document.location.search);
const petIdforLink = params.get('petId');

console.log("Aus der URL extrahierte petId:", petIdforLink);

// 2. Sicherheits-Check: Falls der Link fehlerhaft war und keine ID mitkam
if (!petIdforLink) {
    console.error("Fehler: Keine petId in der URL der medizinischen Historie gefunden!");
}

const profileBtn = document.getElementById("back-to-profile-btn");
console.log("profilbtn",profileBtn);

if (profileBtn && petIdforLink) {
    // Hier wird die ID dynamisch an die URL gehängt!
    profileBtn.href = `/pages/pet/profile.html?petId=${petIdforLink}`;
    console.log(" Profil-Link dynamisch gesetzt auf:", profileBtn.href);
}

console.log("profilbtn",profileBtn.href);