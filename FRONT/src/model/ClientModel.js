const API_URL = 'http://localhost:3000/clients';

/**
 * Prépare les en-têtes avec le token de session
 */
const getHeaders = () => {
    const token = sessionStorage.getItem("token");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/**
 * Récupère tous les clients depuis le backend NestJS
 */
export const getAllClients = async () => {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des clients:", error);
        return [];
    }
};

/**
 * Enregistre un nouveau client (CIN, Permis, etc.)
 */
export const createClient = async (clientData) => {
    return await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(clientData)
    });
};

/**
 * Met à jour les informations d'un client
 */
export const updateClient = async (id, clientData) => {
    return await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(clientData)
    });
};

/**
 * Supprime un client de la base de données
 */
export const deleteClient = async (id) => {
    return await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
};