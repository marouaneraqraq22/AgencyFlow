const API_URL = 'http://localhost:3000/cars';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem("token")}`
});

export const getAllCars = async () => {
    const response = await fetch(API_URL, {
        method: 'GET',
        headers: getHeaders(),
    });
    return await response.json();
};

export const createCar = async (carData) => {
    return await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(carData)
    });
};

export const deleteCar = async (id) => {
    return await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
};
// Ajoute cette fonction à la fin de ton fichier CarModel.js
export const updateCar = async (id, carData) => {
   
    return await fetch(`${API_URL}/${id}`, {
        method: 'PUT', // ou PATCH selon ton contrôleur NestJS
        headers: getHeaders(),
        body: JSON.stringify(carData)
    });
};

export const updateCarStatus = async (id, newStatus) => {
    const user = JSON.parse(sessionStorage.getItem("currentuser"));
    return await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH', // On utilise PATCH car on ne modifie qu'une seule propriété
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
    });
};