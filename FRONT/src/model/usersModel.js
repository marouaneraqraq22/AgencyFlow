

const API_URL = 'http://localhost:3000/auth';


// UsersModel.js

export const login = async ({ email, password }) => {
    // On utilise directement email et password ici
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    return response;
};