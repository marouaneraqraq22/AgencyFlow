import * as CarModel from '../model/CarModel.js';
import * as ReservationModel from '../model/ReservationModel.js';
import { checkAuth } from './authGuard.js';

// --- SÉLECTION DES ÉLÉMENTS ---
const userInfoSpan = document.getElementById("user_info");
const totalVehicles = document.querySelector(".stat-card:nth-child(1) h3");
const maintenanceVehicles = document.querySelector(".stat-card:nth-child(2) h3");
const availableVehicles = document.querySelector(".stat-card:nth-child(3) h3");
const totalRevenue = document.getElementById("total-revenue");
const btnLogout = document.getElementById("btn-logout");

let allReservations = [];

// --- GESTION DES DÉTAILS RÉSERVATION ---
window.showResDetails = (id) => {
    const res = allReservations.find(r => r.id == id);
    if (!res) return;

    // Remplissage dynamique de la modale de détails Don't Repeat Yourself
    const fields = {
        'det-res-client': `${res.client?.prenom || ''} ${res.client?.nom || ''}`,
        'det-res-tel': res.client?.telephone || 'N/A',
        'det-res-cin': res.client?.cin || 'N/A',
        'det-res-car': `${res.car?.brand || ''} ${res.car?.model || ''}`,
        'det-res-car-mat': res.car?.licensePlate || 'N/A',
        'det-res-price': `${res.car?.pricePerDay || 0} DH/j`,
        'det-res-start': new Date(res.startDate).toLocaleDateString('fr-FR'),
        'det-res-end': new Date(res.endDate).toLocaleDateString('fr-FR'),
        'det-res-total': `${res.totalPrice || 0} DH`
    };

    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
        // Le remplissage et apres l'affichage
    document.getElementById('details-res-modal').style.display = 'flex';
};

window.closeResDetails = () => {
    document.getElementById('details-res-modal').style.display = 'none';
};

// --- CHARGEMENT DES STATISTIQUES ---
async function loadDataAndStats() {
    
    try {
        // parallélisation des requêtes.
        const [cars, reservations] = await Promise.all([
            CarModel.getAllCars(),
            ReservationModel.getAllReservations()
        ]);

        allReservations = Array.isArray(reservations) ? reservations : [];

        // 1. Mise à jour des compteurs véhicules
        if (totalVehicles) totalVehicles.textContent = cars.length;
        
        const countByStatus = (statusArray) => 
            //normalisation
            cars.filter(c => statusArray.includes(c.status?.toLowerCase() || c.statut?.toLowerCase())).length;

        if (maintenanceVehicles) maintenanceVehicles.textContent = countByStatus(['maintenance', 'entretien']);
        if (availableVehicles) availableVehicles.textContent = countByStatus(['available', 'disponible']);

        // 2. Calcul du Chiffre d'Affaires total
        const turnover = allReservations.reduce((sum, res) => sum + parseFloat(res.totalPrice || 0), 0);
        if (totalRevenue) totalRevenue.textContent = `${turnover.toLocaleString('fr-FR')} DH`;

        renderRecentActivity(allReservations);
    } catch (error) {
        console.error("Erreur Dashboard:", error);
    }
}

// --- RENDU DU TABLEAU D'ACTIVITÉ ---
function renderRecentActivity(reservations) {
    const tableBody = document.querySelector(".recent-activity tbody");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    // On affiche les 5 dernières réservations (les plus récentes en premier)
    const latestRes = [...reservations].slice(-5).reverse();
    
    latestRes.forEach(res => {
        const status = (res.status || "Inconnu").toLowerCase();
        let badgeClass = "info"; 
        
        if (status === "en cours" || status === "active") badgeClass = "success";
        else if (status === "terminée" || status === "annulée") badgeClass = "secondary";
        else if (status === "maintenance") badgeClass = "warning";

        const row = document.createElement("tr");
        row.innerHTML = ` 
            <td><strong>${res.car?.brand || 'N/A'} ${res.car?.model || ''}</strong></td>
            <td>${res.client?.prenom || ''} ${res.client?.nom || 'Client Inconnu'}</td>
            <td>${new Date(res.startDate).toLocaleDateString('fr-FR')}</td>
            <td><span class="badge ${badgeClass}">${res.status}</span></td>
            <td>
                <button class="action-btn details" onclick="showResDetails(${res.id})">
                    <i class="fas fa-eye"></i>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- INITIALISATION DU DASHBOARD ---
const init = () => {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));
   
    if (!user) return;

    // 1. UI Setup (Menu & Avatar)
    if (user.role === 'admin') {
        const menuEmp = document.getElementById("menu-employees");
        if (menuEmp) menuEmp.style.display = "block";
        
        const avatarIcon = document.querySelector(".avatar i");
        if (avatarIcon) {
            avatarIcon.className = "fas fa-user-shield";
            avatarIcon.parentElement.style.background = "#2563eb";
            avatarIcon.style.color = "#eff6ff";
        }
    }

    if (userInfoSpan) {
        userInfoSpan.textContent = `${user.prenom} ${user.nom} : ${user.role}`;
    }

    // 2. Notification de Bienvenue (Toast)
    if (!sessionStorage.getItem("welcomeShown")) {
        showWelcomeToast(user.prenom);
        sessionStorage.setItem("welcomeShown", "true");
    }

    loadDataAndStats();
};

function showWelcomeToast(name) {
    const toast = document.getElementById("success-toast"); // On réutilise ton système de toast
    const msg = document.getElementById("success-msg");
    if (toast && msg) {
        msg.textContent = `Ravi de vous revoir, ${name} !`;
        toast.style.display = "flex";
        setTimeout(() => toast.classList.add("active"), 10);
        setTimeout(() => {
            toast.classList.remove("active");
            setTimeout(() => toast.style.display = "none", 500);
        }, 4000);
    }
}

if (checkAuth()) init();

// Logout
btnLogout?.addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.clear();
    window.location.href = "authentification.html";
});