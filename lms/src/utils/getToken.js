import axios from 'axios';

// API_BASE_URL example: https://dash:8087/api

export async function getToken(API_BASE_URL, userToken) {
  
  try {
    const isDev = import.meta.env.MODE === 'development';
    console.log("isDev:", isDev);
    let token = null;
    if (isDev) {
      const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
        email: '123',
        password: '123',
        role: 'USER'
      });
      token = loginResponse.data.data.accessToken;
    } else {
      token = userToken;
    }
    return token;
  } catch (err) {
    console.error("Error during getToken:", err);
    return null;
  }
}