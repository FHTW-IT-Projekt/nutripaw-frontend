const loadSampleData = async () => {
    debugger
    const response = await fetch("http://localhost:3000/api/getSampleData", {
        method: "GET"
    });
    const res = await response.json();
    const dataEl = document.getElementById('sample-data');
    dataEl.textContent = JSON.stringify(res);

}
loadSampleData();
