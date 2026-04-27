const loadSampleData = async () => {
    try {
        // Wir rufen jetzt deine neue Route für das Tier mit ID 1 auf
        const response = await fetch("http://localhost:3000/api/pets/1", {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error("Fehler beim Laden der Daten");
        }

        const res = await response.json();

        // 1. Das "rohe" Daten-Element (falls sie es noch zum Testen braucht)
        const dataEl = document.getElementById('sample-data');
        if (dataEl) dataEl.textContent = JSON.stringify(res);

        // 2. Die Daten in die Felder deines Profils eintragen
        // Wir nutzen hier die IDs aus dem HTML (species, age, race, etc.)
        document.querySelector('.petheading').innerText = res.name || 'Unbekannt';
        document.getElementById('species').innerText = res.species || '-';
        document.getElementById('age').innerText = (res.age || '0') + " Jahre";
        document.getElementById('race').innerText = res.race || '-';
        document.getElementById('colour').innerText = res.colour || '-';
        document.getElementById('gender').innerText = res.gender || '-';
        document.getElementById('diagnosis').innerText = res.diagnosis || '-';
        document.getElementById('medication').innerText = res.medication || '-';
        document.getElementById('behaviour').innerText = res.behaviour || '-';

    } catch (error) {
        console.error("Da lief was schief:", error);
    }
}

loadSampleData();
