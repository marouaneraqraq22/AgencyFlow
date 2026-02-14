import * as ReservationModel from '../model/ReservationModel.js';
import * as ClientModel from '../model/ClientModel.js';
import * as CarModel from '../model/CarModel.js';

// --- SÉLECTION DES ÉLÉMENTS ---
const resTableBody = document.getElementById("res-table-body");
const resModal = document.getElementById("res-modal");
const btnNewRes = document.getElementById("btn-new-res");
const closeResModal = document.getElementById("close-res-modal");
const resForm = document.getElementById("res-form");
const btnLogout = document.getElementById("btn-logout");

// Recherche Client (Input + Datalist)
const inputClientSearch = document.getElementById("res-client-search");
const datalistClients = document.getElementById("clients-list");
const hiddenClientId = document.getElementById("res-client-id");

const selectCar = document.getElementById("res-car");
const dateStartInput = document.getElementById("res-start");
const dateEndInput = document.getElementById("res-end");
const pricePreview = document.getElementById("price-preview");

let allReservations = [];
let resIdToCancel = null;
let currentResIdToComplete = null;

// --- INITIALISATION ---
document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));
    if (!user) window.location.href = "authentification.html";
    
    document.getElementById("user_info").textContent = `${user.prenom} ${user.nom} : ${user.role}`;
    
    if (user.role === 'admin') {
        const avatarIcon = document.querySelector(".avatar")?.firstElementChild;
        if (avatarIcon) avatarIcon.className = "fas fa-user-shield";
    }
    

    // Filtres de statut
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.style.opacity = "0.6");
            btn.style.opacity = "1";
            const statusToFilter = btn.getAttribute("data-status");
            statusToFilter === "all" ? renderTable(allReservations) : renderTable(allReservations.filter(res => res.status === statusToFilter));
        });
    });

    // Écouteurs d'événements
    btnNewRes.addEventListener("click", openModal);
    closeResModal.addEventListener("click", () => { resModal.style.display = "none"; resForm.reset(); });
    resForm.addEventListener("submit", handleCreateReservation);

    // Calcul du prix
    const updatePrice = () => {
        const start = new Date(dateStartInput.value);
        const end = new Date(dateEndInput.value);
        const selectedOption = selectCar.options[selectCar.selectedIndex];
        const priceMatch = selectedOption?.text.match(/(\d+)\s*DH/);
        const dailyPrice = priceMatch ? parseInt(priceMatch[1]) : 0;

        // 1. On récupère la date d'aujourd'hui (à minuit pile pour comparer juste les jours)
const today = new Date();
today.setHours(0, 0, 0, 0);

// 2. Votre condition mise à jour
// On vérifie que : start existe, end existe, end est après start, 
// le prix est valide ET que start n'est pas dans le passé.
if (start && end && end > start && dailyPrice > 0 && start >= today) {
    
    // Calcul de la différence en millisecondes, puis conversion en jours
    const diffInMs = end - start;
    const days = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    
    const totalPrice = days * dailyPrice;

    pricePreview.innerHTML = `
        <span>Période: <strong>${days} jour${days > 1 ? 's' : ''}</strong></span> 
        -- 
        <span style="color:#2563eb">Total: <strong>${totalPrice} DH</strong></span>
    `;
} else {
    
    if (start < today && start !== null) {
        pricePreview.textContent = "La date de début ne peut pas être dans le passé";
    } else {
        pricePreview.textContent = "Sélectionnez des dates valides";
    }
}
    };

    [dateStartInput, dateEndInput, selectCar].forEach(el => el.addEventListener("change", updatePrice));

    // Sync recherche client
    inputClientSearch.addEventListener("input", () => {
        const selected = Array.from(datalistClients.options).find(opt => opt.value === inputClientSearch.value);
        hiddenClientId.value = selected ? selected.dataset.id : "";
    });

    loadReservations();
});

// --- LOGIQUE MODALE ---
async function openModal() {
    resModal.style.display = "flex";
    
    // Remplir Clients
    const clients = await ClientModel.getAllClients();
    datalistClients.innerHTML = "";
    clients.forEach(c => {
        const option = document.createElement("option");
        option.value = `${c.prenom} ${c.nom}`;
        option.dataset.id = c.id;
        if (c.statut?.toLowerCase() === "bloqué") option.disabled = true;
        datalistClients.appendChild(option);
    });

    // Remplir Voitures
    const cars = await CarModel.getAllCars();
    selectCar.innerHTML = '<option value="">-- Sélectionner un véhicule --</option>';
    cars.filter(car => (car.status || car.statut || "").toLowerCase() === 'disponible').forEach(car => {
        const opt = document.createElement("option");
        opt.value = car.id;
        opt.textContent = `${car.brand} ${car.model} (${car.pricePerDay} DH/j)`;
        selectCar.appendChild(opt);
    });
}

// --- LOGIQUE RENDU TABLEAU ---
async function loadReservations() {
    allReservations = await ReservationModel.getAllReservations();
    renderTable(allReservations);
}

function renderTable(reservations) {
    resTableBody.innerHTML = "";
    reservations.forEach(res => {
        const row = document.createElement("tr");
        const statusClass = res.status === 'Terminée' ? 'badge-secondary' : 'badge-success';
        
        row.innerHTML = `
            <td><button class="action-btn download" onclick="downloadInvoice(${res.id})"><i class="fa-solid fa-download"></i></i></button></td>
            <td><strong>${res.client.prenom} ${res.client.nom}</strong></td>
            <td>${res.car.brand} ${res.car.model}</td>
            <td>${new Date(res.startDate).toLocaleDateString()}</td>
            <td>${new Date(res.endDate).toLocaleDateString()}</td>
            <td><strong>${res.totalPrice} DH</strong></td>
            <td><span class="badge ${statusClass}">${res.status}</span></td>
            <td>
                ${res.status === 'En cours' ? `<button class="action-btn terminate" onclick="completeRes(${res.id})"><i class="fas fa-check-circle"></i></button>` : ''}
                <button class="btn-delete" onclick="cancelRes(${res.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        resTableBody.appendChild(row);
    });
}

// --- ACTIONS API ---
async function handleCreateReservation(e) {
    e.preventDefault();

    // 1. Récupération des valeurs
    const startStr = dateStartInput.value;
    const endStr = dateEndInput.value;
    const clientId = hiddenClientId.value;
    const carId = selectCar.value;

    // 2. Vérification de la présence des données
    if (!clientId) return showError("Veuillez sélectionner un client valide.");
    if (!carId) return showError("Veuillez sélectionner une voiture.");
    if (!startStr || !endStr) return showError("Les dates de début et de fin sont obligatoires.");

    // 3. Conversion en objets Date pour les calculs
    const start = new Date(startStr);
    const end = new Date(endStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // On ignore l'heure pour comparer juste le jour

    // --- NOUVELLES VÉRIFICATIONS DE DATE ---

    // A. Vérifier que la date de début n'est pas dans le passé
    if (start < today) {
        return showError("La date de début ne peut pas être antérieure à aujourd'hui.");
    }

    // B. Vérifier que la date de fin est après la date de début
    if (end <= start) {
        return showError("La date de fin doit être strictement après la date de début.");
    }

    // C. Optionnel : Vérifier une durée minimale (ex: 1 jour minimum)
    const diffInMs = end - start;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    if (diffInDays < 1) {
        return showError("La location doit durer au moins 24 heures.");
    }

    // 4. Envoi au serveur si tout est OK
    try {
        const response = await ReservationModel.createReservation({
            clientId: parseInt(clientId),
            carId: parseInt(carId),
            startDate: startStr,
            endDate: endStr
        });

        if (response.ok) {
            showSuccess("Location enregistrée !");
            resModal.style.display = "none";
            resForm.reset(); // Très important de vider le formulaire
            loadReservations();
        } else {
            const err = await response.json();
            showError(err.message || "Une erreur est survenue lors de la création.");
        }
    } catch (error) {
        showError("Impossible de contacter le serveur.");
    }
}

// --- CONFIRMATIONS PERSONNALISÉES ---
window.cancelRes = (id) => {
    resIdToCancel = id;
    document.getElementById("cancel-res-modal").style.display = "flex";
};

document.getElementById("btn-confirm-cancel").onclick = async () => {
    const btn = document.getElementById("btn-confirm-cancel");
    btn.disabled = true;
    const response = await ReservationModel.deleteReservation(resIdToCancel);
    if (response.ok) {
        document.getElementById("cancel-res-modal").style.display = "none";
        showSuccess("Réservation annulée.");
        loadReservations();
    }
    btn.disabled = false;
};

// 1. Ouverture de la modale
window.completeRes = (id) => {
    currentResIdToComplete = id;
    document.getElementById("complete-res-modal").style.display = "flex";
};

// 2. Action de confirmation
document.getElementById("btn-confirm-complete").onclick = async () => {
    const response = await ReservationModel.updateReservation(currentResIdToComplete, { status: 'Terminée' });
    if (response.ok) {
        document.getElementById("complete-res-modal").style.display = "none";
        setTimeout(() => showSuccess("Véhicule restitué !"), 100);
        loadReservations();
    }
    currentResIdToComplete = null;
};

// 3. Action d'annulation (LA CORRECTION)
document.getElementById("btn-abort-complete").onclick = () => {
    document.getElementById("complete-res-modal").style.display = "none";
    currentResIdToComplete = null;
};
// 4.Pour que le modal ce ferme dnas niporte quel click
window.addEventListener("click", (e) => {
    const modal = document.getElementById("complete-res-modal");
    if (e.target === modal) {
        modal.style.display = "none";
        currentResIdToComplete = null;
    }
});
const searchInput = document.getElementById("search-res");

searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtered = allReservations.filter(res => {
        const clientName = `${res.client.prenom} ${res.client.nom}`.toLowerCase();
        const carInfo = `${res.car.brand} ${res.car.model}`.toLowerCase();
        return clientName.includes(term) || carInfo.includes(term);
    });
    renderTable(filtered);
});

window.downloadInvoice = (id) => {
    const res = allReservations.find(r => r.id === id);
    if (!res) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- 1. EN-TÊTE ---
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("AgencyFlow", 15, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Système de Gestion de Location de Véhicules", 15, 27);

    // --- 2. INFOS FACTURE ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`FACTURE N° : ${res.id}${new Date().getFullYear()}`, 15, 45);

    // --- 3. INFOS CLIENT ---
    doc.setFontSize(10);
    doc.text(`Client : ${res.client.prenom} ${res.client.nom}`, 15, 55);
    doc.text(`ID:${res.client.cin}`,15,61);
    doc.text(`Véhicule : ${res.car.brand} ${res.car.model}`, 15, 67);
    doc.text(`Période : Du ${new Date(res.startDate).toLocaleDateString()} au ${new Date(res.endDate).toLocaleDateString()}`, 15, 73);
    doc.text(`Période : Du ${new Date(res.startDate).toLocaleDateString()} au ${new Date(res.endDate).toLocaleDateString()}`, 15, 73);

    // --- 4. TABLEAU ---
    const columns = ["Description", "Détails"];
    const data = [
        ["Modèle", `${res.car.brand} ${res.car.model}`],
        ["Prix Journalier", `${res.car.pricePerDay || res.car.prixJournalier} DH`],
        ["Statut", res.status],
        [{ content: "TOTAL À PAYER", styles: { fontStyle: 'bold' } }, { content: `${res.totalPrice} DH`, styles: { fontStyle: 'bold' } }]
    ];

    doc.autoTable({
        startY: 80,
        head: [columns],
        body: data,
        theme: 'striped',
        headStyles: { fillStyle: [37, 99, 235] }
    });

    // --- 5. SECTION NB (Position relative au tableau) ---
    let currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38); 
    doc.setFont("helvetica", "bold");
    doc.text("NB : Politique de Carburant", 15, currentY);

    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");
    const msg = "Le véhicule doit être restitué avec le même niveau de carburant qu'au départ. À défaut, un supplément sera appliqué.";
    const splitMsg = doc.splitTextToSize(msg, 180);
    doc.text(splitMsg, 15, currentY + 7);

    // --- 6. PIED DE PAGE (Suit immédiatement le NB) ---
    // On ajoute la hauteur du message précédent pour calculer la nouvelle position
    currentY = currentY + 7 + (splitMsg.length * 5) + 15; 

    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("Merci de votre confiance !", 105, currentY, { align: "center" });

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Document généré par AgencyFlow ", 105, currentY + 7, { align: "center" });

    // --- EXPORT ---
    doc.save(`Facture_${res.client.nom}.pdf`);
};
// --- TOASTS ---
function showSuccess(m) {
    const t = document.getElementById("success-toast");
    document.getElementById("success-msg").textContent = m;
    t.style.display = "flex";
    setTimeout(() => t.classList.add("active"), 10);
    setTimeout(() => { t.classList.remove("active"); setTimeout(() => t.style.display="none", 500); }, 4000);
}

function showError(m) {
    const t = document.getElementById("error-toast");
    document.getElementById("error-msg").textContent = m;
    t.style.display = "flex";
    setTimeout(() => t.classList.add("active"), 10);
    setTimeout(() => { t.classList.remove("active"); setTimeout(() => t.style.display="none", 500); }, 5000);
}
btnLogout?.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "authentification.html";
});