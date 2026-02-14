import * as EmployeeModel from '../model/EmployeesModel.js';
import { checkAuth, checkAdmin } from './authGuard.js';

// Sélection des éléments
const tableBody = document.getElementById("employees-table-body");
const searchInput = document.getElementById("searchEmployee");
const modal = document.getElementById("employee-modal");
const btnAdd = document.getElementById("btn-add-employee");
const btnClose = document.getElementById("btn-close-modal");
const employeeForm = document.getElementById("employee-form");
const userInfoSpan = document.getElementById("user_info");
const filterButtons = document.querySelectorAll(".filter-btn");

let allEmployees = [];

// 1. PROTECTION DE LA PAGE
if (checkAuth() && checkAdmin()) {
    init();
}


function init() {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));
    
    // Affichage des infos utilisateur et icône Admin
    if (user && userInfoSpan) {
        userInfoSpan.textContent = `${user.prenom} ${user.nom} : ${user.role}`;
        
        // Si c'est un admin, on s'assure que l'icône dans le header est le bouclier
        const avatarIcon = document.querySelector(".user-avatar i");
        if (user.role === 'admin' && avatarIcon) {
            avatarIcon.className = "fas fa-user-shield";
        }
    }

    // Gestion du menu sidebar
    const menuEmp = document.getElementById("menu-employees");
    if (user && user.role === 'admin' && menuEmp) {
        menuEmp.style.display = "block";
    }

    // Chargement des données
    loadEmployees();

    // --- Logique des filtres ---
    filterButtons.forEach(btn => {
        btn.onclick = () => {
            filterButtons.forEach(b => b.style.opacity = "0.6");
            btn.style.opacity = "1";

            const roleToFilter = btn.getAttribute("data-role");
            if (roleToFilter === "all") {
                renderTable(allEmployees);
            } else {
                const filtered = allEmployees.filter(emp => 
                    emp.role && emp.role.toLowerCase() === roleToFilter
                );
                renderTable(filtered);
            }
        };
    });

    // Événements du Modal
    btnAdd.onclick = () => { modal.style.display = "flex"; };
    btnClose.onclick = () => { 
        modal.style.display = "none"; 
        employeeForm.reset();
    };

    searchInput.oninput = handleSearch;
    employeeForm.onsubmit = handleAddEmployee;
}

// --- LOGIQUE DE RENDU ---

async function loadEmployees() {
    try {
        const result = await EmployeeModel.getAllEmployees();
        if (Array.isArray(result)) {
            allEmployees = result;
            renderTable(allEmployees);
        } else if (result.message) {
            console.error("Erreur API :", result.message);
        }
    } catch (error) {
        console.error("Erreur critique chargement employés:", error);
    }
}

function renderTable(data) {
    tableBody.innerHTML = "";
    
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">Aucun collaborateur trouvé.</td></tr>`;
        return;
    }

    data.forEach(emp => {
        const row = document.createElement("tr");
        
        // Détermination du badge et de l'icône selon le rôle
        const isAdmin = emp.role && emp.role.toLowerCase() === 'admin';
        const badgeClass = isAdmin ? 'badge-admin' : 'badge-agent'; // Utilise tes classes CSS spécifiques
        const iconClass = isAdmin ? 'fa-user-shield' : 'fas fa-user-tie';

        row.innerHTML = `
            <td>
                <div class="user-avatar-small" style="background:#f1f5f9; color:${isAdmin ? '#ef4444' : '#166534'};">
                    <i class="fas ${iconClass}"></i>
                </div>
            </td>
            <td><strong>${emp.prenom} ${emp.nom}</strong></td>
            <td>${emp.email}</td>
            <td><span class="badge ${badgeClass}">${emp.role.toUpperCase()}</span></td>
            <td>
                <button class="btn-delete" title="Supprimer l'employé">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        // Suppression
        row.querySelector('.btn-delete').onclick = () => handleDelete(emp.id);

        tableBody.appendChild(row);
    });
}

// --- ACTIONS ---

async function handleAddEmployee(e) {
    e.preventDefault();
    const newEmp = {
        prenom: document.getElementById("emp-prenom").value,
        nom: document.getElementById("emp-nom").value,
        email: document.getElementById("emp-email").value,
        password: document.getElementById("emp-password").value,
        role: document.getElementById("emp-role").value
    };

    const response = await EmployeeModel.createEmployee(newEmp);
    if (response.ok) {
        showSuccess("L'employé ajouté avec succés");
        modal.style.display = "none";
        employeeForm.reset();
        loadEmployees();
    } else {
        const err = await response.json();
        showError("Erreur : " + (err.message || "Impossible d'ajouter l'employé"));
    }
}

let employeeIdToDelete = null;

// Cette fonction ouvre la modale
async function handleDelete(id) {
    employeeIdToDelete = id;
    const modal = document.getElementById("delete-emp-modal");
    modal.style.display = "flex";
}

// Gestionnaire pour le bouton "Supprimer" de la modale
document.getElementById("confirm-emp-delete-btn").onclick = async () => {
    if (!employeeIdToDelete) return;

    try {
        const response = await EmployeeModel.deleteEmployee(employeeIdToDelete);
        
        if (response.ok) {
            showSuccess("L'utilisateur a été retiré avec succès.");
            document.getElementById("delete-emp-modal").style.display = "none";
            loadEmployees(); // Rafraîchit le tableau
        } else {
            const errorData = await response.json();
            showError(errorData.message || "Erreur lors de la suppression.");
        }
    } catch (error) {
        showError("Impossible de contacter le serveur.");
    } finally {
        employeeIdToDelete = null;
    }
};

// Gestionnaire pour le bouton "Annuler"
document.getElementById("cancel-emp-delete").onclick = () => {
    document.getElementById("delete-emp-modal").style.display = "none";
    employeeIdToDelete = null;
};

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = allEmployees.filter(emp => 
        (emp.nom && emp.nom.toLowerCase().includes(query)) || 
        (emp.prenom && emp.prenom.toLowerCase().includes(query)) ||
        (emp.email && emp.email.toLowerCase().includes(query))
    );
    renderTable(filtered);
}

// Logout
const btnLogout = document.getElementById("btn-logout");
if (btnLogout) {
    btnLogout.onclick = (e) => {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = "authentification.html";
    };
}

 function showSuccess(message) {
    const toast = document.getElementById("success-toast");
    const msgElement = document.getElementById("success-msg");
    
    msgElement.textContent = message;
    toast.style.display = "flex";
    
    // On force un léger délai pour que la transition CSS s'active
    setTimeout(() => toast.classList.add("active"), 10);

    // Disparition automatique après 4 secondes
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.style.display = "none", 500);
    }, 4000);
}
function showError(message) {
    const toast = document.getElementById("error-toast");
    const msgElement = document.getElementById("error-msg");
    
    msgElement.textContent = message;
    toast.style.display = "flex";
    setTimeout(() => toast.classList.add("active"), 10);

    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.style.display = "none", 500);
    }, 5000); // Un peu plus long pour laisser le temps de lire l'erreur
}