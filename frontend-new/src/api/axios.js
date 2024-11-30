import axios from 'axios';
import { isAuthenticated } from './auth';

const instance = axios.create({
    baseURL: 'http://localhost:4001/api/files',
    timeout: 300000, // 5 minutes default timeout
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Enable sending cookies
});

// Add a request interceptor to add the auth token
instance.interceptors.request.use(
    (config) => {
        // Check authentication first
        if (!isAuthenticated()) {
            return Promise.reject(new Error('Please log in to continue'));
        }

        // Remove default Content-Type for FormData
        if (config.url === '/upload' && config.method === 'post') {
            config.timeout = 600000; // 10 minutes for uploads
            delete config.headers['Content-Type']; // Let browser set it
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle network errors
        if (!error.response) {
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // Handle timeout
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('Upload timed out. Please try again with a smaller file or check your connection.'));
        }

        // Handle specific error responses
        const errorMessage = error.response?.data?.message || error.message;
        
        switch (error.response?.status) {
            case 401:
                localStorage.removeItem('token'); // Clear invalid token
                window.location.href = '/login'; // Redirect to login
                return Promise.reject(new Error('Please log in again.'));
            case 413:
                return Promise.reject(new Error('File is too large.'));
            case 415:
                return Promise.reject(new Error('File type not supported.'));
            case 500:
                return Promise.reject(new Error(`Server error: ${errorMessage}`));
            default:
                return Promise.reject(error);
        }
    }
);

export default instance;
