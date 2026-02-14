// /FRONT/src/model/EmployeesModel.js

const API_URL = 'http://localhost:3000/users';

/**
 * Prépare les en-têtes avec le token de session pour l'authentification
 */
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem("token")}`
});

/**
 * Récupère la liste de tous les employés (Admin seulement)
 */
export const getAllEmployees = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getHeaders()
    });
    return await response.json();
};

/**
 * Crée un nouvel employé
 * @param {Object} employeeData - { nom, prenom, email, password, role }
 */
export const createEmployee = async (employeeData) => {
    return await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(employeeData)
    });
};

/**
 * Supprime un employé par son ID
 */
export const deleteEmployee = async (id) => {
    return await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
};

/**
 * Met à jour les informations d'un employé
 */
export const updateEmployee = async (id, updateData) => {
    return await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
    });
};