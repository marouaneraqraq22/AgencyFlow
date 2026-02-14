const API_URL = 'http://localhost:3000/reservations';

/**
 * Prépare les en-têtes avec le token de session
 */
const getHeaders = () => {
    let token = sessionStorage.getItem("token");
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

/**
 * Récupère toutes les réservations avec les détails Client et Voiture
 */
export const getAllReservations = async () => {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error("Erreur lors du chargement");
        return await response.json();
    } catch (error) {
        console.error("Erreur ReservationModel:", error);
        return [];
    }
};

/**
 * Crée une nouvelle réservation
 * @param {Object} resData { clientId, carId, startDate, endDate }
 */
export const createReservation = async (resData) => {
    try {
        return await fetch(API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(resData)
        });
    } catch (error) {
        console.error("Erreur création réservation:", error);
    }
};

/**
 * Annuler ou supprimer une réservation
 */
export const deleteReservation = async (id) => {
    return await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
};
/**
 * Récupère toutes les réservations et calcule le Chiffre d'Affaires total
 * @returns {Promise<number>} Le montant total du CA
 */
export const getTotalRevenue = async () => {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error("Erreur lors de la récupération des revenus");

        const reservations = await response.json();

        // Logique de calcul centralisée ici
        return reservations.reduce((sum, res) => sum + parseFloat(res.totalPrice || 0), 0);
    } catch (error) {
        console.error("Erreur Model Revenue:", error);
        return 0;
    }
};



/**
 * Met à jour une réservation existante
 */
export async function updateReservation(id, data) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH', // NestJS utilise souvent PATCH pour les updates partiels
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return response;
    } catch (error) {
        console.error("Erreur dans ReservationModel.updateReservation:", error);
        return { ok: false };
    }
}
// Dans FRONT/src/model/ReservationModel.js

export async function terminateActiveReservationByCar(carId) {
    try {
        const response = await fetch(`${API_URL}/terminate-by-car/${carId}`, {
            method: 'PATCH',
            headers:getHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la clôture de la réservation:", error);
    }
}