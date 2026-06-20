const API = 'http://127.0.0.1:3000/api';
const session  = sessionStorage.getItem('nutripaw_user');

document.addEventListener("DOMContentLoaded", () => {
    const shareForm = document.getElementById("share-access-form");
    if (shareForm) {
        shareForm.addEventListener("submit", handleGrantAccess);
    }
    
    // pet ID from URL query parameters 
    const params = new URLSearchParams(document.location.search);
    const petId = params.get('petId');
    
    if (petId) {
        if (document.getElementById("pet_id")) {
            document.getElementById("pet_id").value = petId;
        }
        loadAccessData(petId);
    } else {
        showError("No pet specified in the URL.");
    }
});

// Fetch configuration and permissions directly from backend API
async function loadAccessData(petId) {
    try {
        const response = await fetch(`${API}/petedit/${petId}/share`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.status === 401 || response.status === 403) {
            const errData = await response.json();
            showError(errData.message || "Access Denied: Only primary owners can manage sharing configurations.");
            return;
        }

        if (!response.ok) throw new Error('Failed to load access data');

        const result = await response.json();


        // if (document.getElementById("pet-name-display")) {
        //     document.getElementById("pet-name-display").textContent = "Nao";
        // }

        renderUserList(result.shared_users || []);
    } catch (error) {
        console.error("Error loading access list:", error);
        showError("Could not retrieve access logs. Please check your connection.");
    }
}

// Draw the access control list elements
function renderUserList(users) {
    const listContainer = document.getElementById("access-list");
    listContainer.innerHTML = "";

    if (users.length === 0) {
        listContainer.innerHTML = `<li class="list-group-item text-muted text-center py-3">No other users have access to this pet profile.</li>`;
        return;
    }

    users.forEach(user => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center py-2";
        li.innerHTML = `
            <div>
                <span class="fw-bold d-block">${user.email}</span>
                <small class="text-muted text-capitalize">Role: ${user.role}</small>
            </div>
            <button class="btn btn-outline-danger btn-sm remove-access-btn" data-access-id="${user.id}" data-email="${user.email}">
                Revoke Access
            </button>
        `;
        listContainer.appendChild(li);
    });

    // add click event management to newly added removal buttons
    document.querySelectorAll(".remove-access-btn").forEach(button => {
        button.addEventListener("click", handleRemoveAccess);
    });
}

// granting new access
async function handleGrantAccess(e) {
    e.preventDefault();

    const petId = document.getElementById("pet_id").value;
    const emailInput = document.getElementById("share-email");
    const targetEmail = emailInput.value.trim();
    const alertBox = document.getElementById("access-alert");

    alertBox.className = "alert d-none";

    try {
        const response = await fetch(`${API}/petedit/${petId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail })
        });

        const resData = await response.json();

        if (!response.ok) {
            throw new Error(resData.message || 'Grant action failed');
        }

        alertBox.textContent = `Access successfully shared with ${targetEmail}!`;
        alertBox.className = "alert alert-success";
        emailInput.value = "";
        
        // refresh structural access list UI from the database
        loadAccessData(petId);
    } catch (error) {
        console.error("Error granting share entry:", error);
        alertBox.textContent = error.message || 'Could not share access. Verify email is correct.';
        alertBox.className = "alert alert-danger";
    }
}

//removing user entries
async function handleRemoveAccess(e) {
    const petId = document.getElementById("pet_id").value;
    const accessId = e.target.getAttribute("data-access-id"); 
    const targetEmail = e.target.getAttribute("data-email");
    const alertBox = document.getElementById("access-alert");

    if (!confirm(`Are you sure you want to revoke pet access from ${targetEmail}?`)) {
        return;
    }

    alertBox.className = "alert d-none";

    try {
        const response = await fetch(`${API}/petedit/${petId}/share/${accessId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const resData = await response.json();

        if (!response.ok) {
            throw new Error(resData.message || 'Revocation failed');
        }

        alertBox.textContent = `Successfully revoked access from ${targetEmail}`;
        alertBox.className = "alert alert-success";

        // refresh structural access list UI from the database
        loadAccessData(petId);
    } catch (error) {
        console.error("Error terminating permission entry:", error);
        alertBox.textContent = error.message || 'Could not revoke access.';
        alertBox.className = "alert alert-danger";
    }
}

// Helper utility to show main page errors
function showError(message) {
    document.getElementById("share-access-form").classList.add("d-none");
    document.getElementById("access-list").classList.add("d-none");
    
    const errorBox = document.getElementById("error-message");
    errorBox.classList.remove("d-none");
    errorBox.innerText = message;
}