import * as CarModel from '../model/CarModel.js';
import * as ReservationModel from '../model/ReservationModel.js';
import { checkAuth } from './authGuard.js';
// --- SÉLECTEURS ---
const userInfoSpan = document.getElementById("user_info");
const tableBody = document.getElementById("cars-table-body");
const searchInput = document.querySelector(".search-bar input");
const statusFilter = document.getElementById("status-filter");
const carForm = document.getElementById("add-car-form");
const modal = document.getElementById('car-modal');
const btnAdd = document.querySelector('.btn-add');
const btnClose = document.getElementById('btn-close-modal');
const btnLogout = document.getElementById("btn-logout");

let allCars = []; 
let editingCarId = null;
let vehicleToDeleteId = null;

// --- INITIALISATION ---
const init = () => {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));
    
    if (!user) {
        window.location.href = "authentification.html";
        return;
    }

    // Affichage des infos et gestion du menu admin
    if (userInfoSpan) {
        userInfoSpan.textContent = `${user.prenom} ${user.nom} : ${user.role}`;
    }

    if (user.role === 'admin'){
        // const menuEmp = document.getElementById("menu-employees");
        // if (menuEmp) menuEmp.style.display = "block";

        const avatarIcon = document.querySelector(".avatar")?.firstElementChild;
        if (avatarIcon) {
            avatarIcon.className = "fas fa-user-shield";
            avatarIcon.parentElement.style.background = "#2563eb";
            avatarIcon.style.color = "#eff6ff";
        }
    }

    loadData();
};

// --- LOGIQUE DE RENDU ---
const renderTable = (carsToDisplay) => {
    tableBody.innerHTML = ""; 

    if (carsToDisplay.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Aucun véhicule trouvé.</td></tr>`;
        return;
    }

    carsToDisplay.forEach(car => {
        const status = car.status?.toLowerCase() || car.statut?.toLowerCase();
        const isMaintenance = status === 'maintenance';
        const row = document.createElement("tr");
        
        row.innerHTML = `
            <td><div class="car-thumb"><i class="fas fa-car"></i></div></td>
            <td><strong>${car.brand} ${car.model}</strong></td>
            <td><span class="plate">${car.licensePlate}</span></td>
            <td><span class="price-tag">${car.pricePerDay} DH</span></td>
            <td><span class="badge ${getStatusClass(status)}">${status.toUpperCase()}</span></td>
            <td>
                <button class="btn-edit" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="${isMaintenance ? 'btn-activate' : 'btn-maintenance'}" 
                        title="${isMaintenance ? 'Remettre en service' : 'Envoyer en maintenance'}">
                    <i class="fas ${isMaintenance ? 'fa-check-double' : 'fa-tools'}"></i>
                </button>
                <button class="btn-delete" title="Supprimer"><i class="fas fa-trash"></i></button>
            </td>
        `;

        row.querySelector(".btn-edit").onclick = () => openEditModal(car);
        row.querySelector(".btn-delete").onclick = () => handleDelete(car.id);
        
        const btnToggle = row.querySelector(isMaintenance ? ".btn-activate" : ".btn-maintenance");
        btnToggle.onclick = () => openMaintenanceConfirmation(car, isMaintenance);

        tableBody.appendChild(row);
    });
};

// --- GESTION MAINTENANCE ---
function openMaintenanceConfirmation(car, isMaintenance) {
    const mModal = document.getElementById('maintenance-modal');
    document.getElementById('maint-modal-title').textContent = isMaintenance ? "Remise en service" : "Départ en maintenance";
    document.getElementById('maint-modal-text').textContent = isMaintenance 
        ? `Voulez-vous remettre en service ${car.brand} ${car.model} ?`
        : `Voulez-vous envoyer ${car.brand} ${car.model} en maintenance ? Cela clôturera la réservation en cours.`;

    mModal.style.display = 'flex';

    document.getElementById('maint-confirm').onclick = async () => {
        const nextStatus = isMaintenance ? 'Disponible' : 'Maintenance';
        const response = await CarModel.updateCarStatus(car.id, nextStatus);
        
        if (response.ok) {
            if (!isMaintenance) {
                await ReservationModel.terminateActiveReservationByCar(car.id);
            }
            showSuccess(isMaintenance ? "Véhicule disponible." : "Véhicule envoyé en maintenance.");
            mModal.style.display = 'none';
            loadData(); 
        } else {
            showError("Erreur de mise à jour.");
        }
    };

    document.getElementById('maint-cancel').onclick = () => mModal.style.display = 'none';
}

// --- ACTIONS API & FILTRAGE ---
const loadData = async () => {
    const data = await CarModel.getAllCars();
    allCars = Array.isArray(data) ? data : [];
    renderTable(allCars);
};

const handleFilter = () => {
    const query = searchInput.value.toLowerCase();
    const status = statusFilter.value.toLowerCase();

    const filtered = allCars.filter(car => {
        const matchesSearch = car.brand.toLowerCase().includes(query) || car.model.toLowerCase().includes(query) || car.licensePlate.toLowerCase().includes(query);
        const matchesStatus = (status === "all") || (car.status?.toLowerCase() === status);
        return matchesSearch && matchesStatus;
    });
    renderTable(filtered);
};

// -- Suppression --
const handleDelete = (id) => {
    vehicleToDeleteId = id;
    document.getElementById("delete-confirm-modal").style.display = "flex";
};

document.getElementById("confirm-delete-btn").onclick = async () => {
    if (!vehicleToDeleteId) return;
    const response = await CarModel.deleteCar(vehicleToDeleteId);
    if (response.ok) {
        document.getElementById("delete-confirm-modal").style.display = "none";
        showSuccess("Véhicule supprimé avec succès.");
        loadData();
    }
    vehicleToDeleteId = null;
};

document.getElementById("cancel-delete").onclick = () => {
    document.getElementById("delete-confirm-modal").style.display = "none";
};

// -- Ajout / Edition --
carForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const carData = {
        brand: document.getElementById("modal-brand").value,
        model: document.getElementById("modal-model").value,
        pricePerDay: parseFloat(document.getElementById("modal-price").value),
        licensePlate: document.getElementById("modal-plate").value
    };

    const submitBtn = carForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
        const response = editingCarId ? await CarModel.updateCar(editingCarId, carData) : await CarModel.createCar(carData);
        if (response.ok) {
            modal.style.display = 'none';
            showSuccess(editingCarId ? "Véhicule mis à jour !" : "Véhicule ajouté !");
            carForm.reset();
            editingCarId = null;
            loadData();
        } else {
            const err = await response.json();
            showError(err.message || "Erreur lors de l'enregistrement");
        }
    } catch (err) {
        showError("Erreur serveur");
    } finally {
        submitBtn.disabled = false;
    }
});

// --- HELPERS ---
const openEditModal = (car) => {
    editingCarId = car.id;
    document.getElementById("modal-brand").value = car.brand;
    document.getElementById("modal-model").value = car.model;
    document.getElementById("modal-price").value = car.pricePerDay;
    document.getElementById("modal-plate").value = car.licensePlate;
    document.querySelector(".modal-content h3").textContent = "Modifier le véhicule";
    modal.style.display = 'flex';
};

btnAdd.onclick = () => {
    editingCarId = null;
    carForm.reset();
    document.querySelector(".modal-content h3").innerHTML = '<i class="fas fa-car"></i> Ajouter un véhicule';
    modal.style.display = 'flex';
};

btnClose.onclick = () => modal.style.display = 'none';

const getStatusClass = (status) => {
    const s = status?.toLowerCase(); 
    if (s === 'disponible' || s === 'available') return 'badge-success';
    if (s === 'loué' || s === 'rented') return 'badge-warning';
    if (s === 'maintenance') return 'badge-danger';
    return 'badge-secondary';
};

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

// Lancement
if (checkAuth()) init();

searchInput?.addEventListener("input", handleFilter);
statusFilter?.addEventListener("change", handleFilter);
btnLogout?.addEventListener("click", () => { sessionStorage.clear(); window.location.href = "authentification.html"; });