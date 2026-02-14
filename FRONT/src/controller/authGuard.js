
export function checkAuth() {
    const token = sessionStorage.getItem('token');
    const user = sessionStorage.getItem('currentuser');

    // Si l'une des deux infos manque, on renvoie vers la connexion
    if (!token || !user) {
        console.warn("Accès refusé : session manquante.");
        window.location.href = "authentification.html";
        return false;
    }
    return true;
}
/**
 * Vérifie si l'utilisateur est un administrateur.
 * Si ce n'est pas le cas, il est redirigé vers l'accueil.
 */
export function checkAdmin() {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));

    // On vérifie si l'objet user existe et si son rôle est strictement 'admin'
    if (!user || user.role !== 'admin') {
        console.warn("Accès refusé : Tentative d'accès à une zone admin par un non-admin.");
        
        // Petite alerte pour informer l'utilisateur
       // alert("Vous n'avez pas les permissions nécessaires pour accéder à cette page.");
        
        // Redirection vers le dashboard général
        window.location.href = "home.html";
        return false;
    }

    return true; // L'utilisateur est bien admin
}