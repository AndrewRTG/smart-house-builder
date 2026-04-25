import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:20025/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor pentru request-uri (opțional - pentru logging sau autentificare)
api.interceptors.request.use(
  (config) => {
    // Poți adăuga token-uri de autentificare aici dacă e necesar
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor pentru response-uri (opțional - pentru error handling global)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Poți gestiona erorile global aici
    if (error.response?.status === 401) {
      // Redirect la login sau refresh token
    }
    return Promise.reject(error);
  }
);

export default api;
