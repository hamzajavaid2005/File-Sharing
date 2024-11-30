import axios from 'axios';

const authApi = axios.create({
    baseURL: 'http://localhost:4001/api/users',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor
authApi.interceptors.request.use(
    (config) => {
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

// Add a response interceptor
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

authApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is due to an invalid token
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                try {
                    const token = await new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    });
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axios(originalRequest);
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const response = await authApi.post('/refresh-token');
                const { accessToken } = response.data.data;
                
                localStorage.setItem('token', accessToken);
                
                // Update headers for future requests
                authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                
                processQueue(null, accessToken);
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // If refresh fails, logout the user
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
    try {
        const response = await authApi.post('/login', { email, password });
        const { data } = response.data;
        
        if (data.accessToken) {
            localStorage.setItem('token', data.accessToken);
        }
        
        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const verifyLoginCode = async (email, code) => {
    try {
        const response = await authApi.post('/verify-login', { 
            email, 
            code: String(code).trim() 
        });
        
        const { accessToken } = response.data.data;
        if (accessToken) {
            localStorage.setItem('token', accessToken);
            authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        
        return response.data;
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const response = await authApi.post('/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await authApi.post('/logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clean up local storage and headers
        localStorage.removeItem('token');
        delete authApi.defaults.headers.common['Authorization'];
    }
};

export const refreshToken = async () => {
    try {
        const response = await authApi.post('/refresh-token');
        const { accessToken } = response.data.data;
        
        if (accessToken) {
            localStorage.setItem('token', accessToken);
            authApi.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        
        return accessToken;
    } catch (error) {
        console.error('Token refresh error:', error);
        localStorage.removeItem('token');
        delete authApi.defaults.headers.common['Authorization'];
        throw error;
    }
};

export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // You could also add token expiration check here if your tokens include an expiration claim
    return true;
};

export const getAuthToken = () => {
    return localStorage.getItem('token');
};

export default authApi;
