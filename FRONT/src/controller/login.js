import * as UsersModel from '../model/usersModel.js';

// --- SÉLECTION DES ÉLÉMENTS ---
const inputmail = document.getElementById("email");
const inputpass = document.getElementById("password");
const btnconnect = document.getElementById("login-btn");
const btnText = document.getElementById("btn-text");
const btnSpinner = document.getElementById("btn-spinner");
const messageauthentification = document.getElementById("messageauth");
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');

// Initialisation
if (messageauthentification) messageauthentification.style.display = "none";

// --- GESTION DE LA VISIBILITÉ DU MOT DE PASSE ---
togglePassword?.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle de l'icône (FontAwesome)
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// --- GESTION DU LOGIN ---
btnconnect.addEventListener("click", handlelogin);

// Permettre de valider avec la touche "Entrée"
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlelogin(e);
});

async function handlelogin(event) {
    event.preventDefault();
    
    const email = inputmail.value.trim();
    const password = inputpass.value;

    // 1. VALIDATION FRONTEND
    if (!email || !password) {
        showMessage("Veuillez remplir tous les champs.");
        shakeForm();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage("Format d'email invalide.");
        shakeForm();
        return;
    }

    // 2. APPEL AU MODÈLE
    setLoading(true);

    try {
        const response = await UsersModel.login({ email, password });

        if (response.ok) {
            const data = await response.json();
            
            // Stockage des informations de session
            sessionStorage.setItem("token", data.access_token);
            sessionStorage.setItem("currentuser", JSON.stringify(data.user));
            
            // Redirection vers le tableau de bord
            window.location.href = "home.html";
        } else {
            const errorData = await response.json();
            showMessage(errorData.message || "Email ou mot de passe incorrect.");
            shakeForm();
            setLoading(false);
        }
    } catch (error) {
        console.error("Erreur de connexion :", error);
        showMessage("Le serveur AgencyFlow ne répond pas.");
        setLoading(false);
    }
}

// --- FONCTIONS UTILITAIRES ---

/**
 * Gère l'état visuel du bouton de connexion
 */
function setLoading(isLoading) {
    btnconnect.disabled = isLoading;
    if (btnText) btnText.style.display = isLoading ? "none" : "inline-block";
    if (btnSpinner) btnSpinner.style.display = isLoading ? "inline-block" : "none";
    if (isLoading && messageauthentification) messageauthentification.style.display = "none";
}

/**
 * Affiche un message d'erreur stylisé
 */
function showMessage(text) {
    if (!messageauthentification) return;
    messageauthentification.innerHTML = `<i class="fas fa-exclamation-circle"></i> <span>${text}</span>`;
    messageauthentification.style.display = "flex";
}

/**
 * Ajoute un effet visuel de vibration en cas d'erreur
 */
function shakeForm() {
    const loginCard = document.querySelector('.login-card') || document.querySelector('.login-container');
    if (loginCard) {
        loginCard.classList.add('shake');
        setTimeout(() => loginCard.classList.remove('shake'), 500);
    }
}