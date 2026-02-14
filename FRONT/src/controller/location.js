import * as ClientModel from '../model/ClientModel.js';

// --- SÉLECTION DES ÉLÉMENTS ---
const tableBody = document.querySelector("tbody");
const searchInput = document.querySelector(".search-bar input");
const userInfoSpan = document.getElementById("user_info");
const btnAddClient = document.querySelector('.btn-add');
const clientModal = document.getElementById('client-modal');
const clientForm = document.getElementById('client-form');
const btnCloseModal = document.getElementById('btn-close-client-modal');
const editForm = document.getElementById('edit-client-form');

let allClients = [];
let clientIdToDelete = null;

// --- 1. INITIALISATION ET SÉCURITÉ ---
document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));
    
    if (user) {
    userInfoSpan.textContent = `${user.prenom} ${user.nom} : ${user.role}`;
    
    const avatarIcon = document.querySelector(".avatar")?.firstElementChild;
    
    if (avatarIcon) {
        // On nettoie d'abord les classes existantes pour éviter les doublons
        avatarIcon.className = ""; 

        if (user.role === 'admin') {
            // Icône Bouclier pour l'Admin
            avatarIcon.classList.add("fas", "fa-user-shield");
        } else {
            // Icône Utilisateur classique pour l'Agent
            avatarIcon.classList.add("fas", "fa-user"); 
        }
    }
} else {
    window.location.href = "authentification.html";
    return;
}

    // --- Logique de filtrage ---
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.style.opacity = "0.6");
            btn.style.opacity = "1";
            const statusToFilter = btn.getAttribute("data-status");
            
            if (statusToFilter === "all") {
                renderTable(allClients);
            } else {
                const filtered = allClients.filter(c => 
                    c.statut && c.statut.toLowerCase() === statusToFilter
                );
                renderTable(filtered);
            }
        });
    });

    searchInput?.addEventListener("input", handleSearch);
    await loadClients();
});

// --- 2. LOGIQUE DE DONNÉES ---

async function loadClients() {
    const data = await ClientModel.getAllClients();
    if (Array.isArray(data)) {
        allClients = data;
        renderTable(allClients);
    }
}

const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

function renderTable(clients) {
    tableBody.innerHTML = "";

    if (clients.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Aucun client trouvé.</td></tr>`;
        return;
    }

    clients.forEach(client => {
        const row = document.createElement("tr");
        const avatarClass = client.id % 2 === 0 ? "blue" : "";
        const statusNormalized = client.statut ? client.statut.toLowerCase() : "actif";
        const badgeClass = statusNormalized === "actif" ? "success" : "danger";

        row.innerHTML = `
            <td>
                <div class="user-profile">
                    <div class="user-img ${avatarClass}">${getInitials(client.prenom + ' ' + client.nom)}</div>
                    <div>
                        <strong>${client.prenom} ${client.nom}</strong><br>
                        <small>${client.email}</small>
                    </div>
                </div>
            </td>
            <td><span class="license-tag">${client.permis}</span></td>
            <td>${client.cin}</td>
            <td>${client.telephone}</td>
            <td><span class="badge ${badgeClass}">${statusNormalized.toUpperCase()}</span></td>
            <td>
                <button class="action-btn edit"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete"><i class="fas fa-trash"></i></button>
            </td>
        `;

        row.querySelector(".delete").onclick = () => openDeleteModal(client.id);
        row.querySelector(".edit").onclick = () => handleEdit(client);
        tableBody.appendChild(row);
    });
}

// --- 3. ACTIONS (RECHERCHE, AJOUT, EDIT, SUPPRESSION) ---

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allClients.filter(c => 
        c.nom.toLowerCase().includes(term) || 
        c.prenom.toLowerCase().includes(term) || 
        c.cin.toLowerCase().includes(term)
    );
    renderTable(filtered);
}

// -- Suppression --
function openDeleteModal(id) {
    clientIdToDelete = id;
    document.getElementById("delete-client-modal").style.display = "flex";
}

document.getElementById("btn-confirm-delete").onclick = async () => {
    if (!clientIdToDelete) return;

    try {
        const response = await ClientModel.deleteClient(clientIdToDelete);

        if (response.ok) {
            // Cas 200/204 : Tout s'est bien passé
            showSuccess("Client supprimé avec succès.");
            document.getElementById("delete-client-modal").style.display = "none";
            loadClients();
        } else {
            // Cas d'erreur (409 Conflict, 404 Not Found, etc.)
            // On récupère le JSON envoyé par NestJS
            const errorData = await response.json();
            
            // On affiche le message précis ("Le client est lié à X réservations")
            // Si NestJS n'a pas envoyé de message, on met un texte par défaut
            showError(errorData.message || "Une erreur est survenue lors de la suppression.");
        }
    } catch (error) {
        // Cas d'erreur réseau (Serveur éteint, coupure internet)
        console.error("Erreur critique:", error);
        showError("Impossible de contacter le serveur.");
    }
};
document.getElementById("btn-cancel-delete").onclick = async () => {
    document.getElementById("delete-client-modal").style.display = "none";
}


// -- Edition --
async function handleEdit(client) {
    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('edit-prenom').value = client.prenom || "";
    document.getElementById('edit-nom').value = client.nom || "";
    document.getElementById('edit-email').value = client.email || "";
    document.getElementById('edit-phone').value = client.telephone || "";
    document.getElementById('edit-status').value = client.statut?.toLowerCase() || "actif";
    document.getElementById('modal-edit-client').style.display = 'flex';
}

editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-client-id').value;
    const updatedData = {
        prenom: document.getElementById('edit-prenom').value,
        nom: document.getElementById('edit-nom').value,
        email: document.getElementById('edit-email').value,
        statut: document.getElementById('edit-status').value
    };

    const response = await ClientModel.updateClient(id, updatedData);
    if (response.ok) {
        showSuccess("Client mis à jour !");
        document.getElementById('modal-edit-client').style.display = 'none';
        loadClients();
    } else {
        showError("Erreur lors de la mise à jour.");
    }
});

// -- Ajout --
clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const clientData = {
        prenom: document.getElementById('client-prenom').value,
        nom: document.getElementById('client-nom').value,
        email: document.getElementById('client-email').value,
        telephone: document.getElementById('client-phone').value,
        cin: document.getElementById('client-cin').value,
        permis: document.getElementById('client-permis').value,
        statut: "ACTIF"
    };

    const response = await ClientModel.createClient(clientData);
    if (response.ok) {
        showSuccess("Client ajouté avec succès !");
        clientModal.style.display = 'none';
        clientForm.reset();
        loadClients();
    } else {
        showError("Erreur lors de l'ajout.");
    }
});

// --- 4. UTILITAIRES ET TOASTS ---

const toggleModal = (show) => {
    clientModal.style.display = show ? 'flex' : 'none';
    if (!show) clientForm.reset();
};

if (btnAddClient) btnAddClient.onclick = () => toggleModal(true);
if (btnCloseModal) btnCloseModal.onclick = () => toggleModal(false);

function showSuccess(message) {
    const toast = document.getElementById("success-toast");
    document.getElementById("success-msg").textContent = message;
    toast.style.display = "flex";
    setTimeout(() => toast.classList.add("active"), 10);
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.style.display = "none", 500);
    }, 4000);
}

function showError(message) {
    const toast = document.getElementById("error-toast");
    document.getElementById("error-msg").textContent = message;
    toast.style.display = "flex";
    setTimeout(() => toast.classList.add("active"), 10);
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.style.display = "none", 500);
    }, 5000);
}

// Logout
document.getElementById("btn-logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "authentification.html";
});