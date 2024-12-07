import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:10000/api';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor
axios.interceptors.request.use(
    async (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add CSRF token if available
        const csrfToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN'))
            ?.split('=')[1];
        if (csrfToken) {
            config.headers['X-XSRF-TOKEN'] = csrfToken;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
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

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

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
                const response = await axios.post('/users/refresh-token');
                const { accessToken } = response.data;
                localStorage.setItem('token', accessToken);
                
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                
                processQueue(null, accessToken);
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// Utility function to handle API errors
const handleApiError = (error, defaultMessage = 'An error occurred') => {
    console.error('API Error:', error);
    if (error.response?.data?.message) {
        toast.error(error.response.data.message);
    } else if (error.message === 'Network Error') {
        toast.error('Unable to connect to server. Please try again later.');
    } else {
        toast.error(defaultMessage);
    }
    return {
        success: false,
        message: error.response?.data?.message || error.message || defaultMessage
    };
};

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            const response = await axios.get('/users/me');
            if (response.data.success) {
                setUser(response.data.data);
            } else {
                // If the response is not successful, clear auth state
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // If there's an error (including 404), clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            
            // Don't redirect to login if we're already on the login or verification pages
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/login') && !currentPath.includes('/verify')) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/users/login', { email, password });
            const { data } = response.data;

            if (data.requiresVerification) {
                return {
                    success: true,
                    requiresVerification: true,
                    email: email
                };
            }

            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                await checkAuth();
            }

            return {
                success: true,
                requiresVerification: false
            };
        } catch (error) {
            console.error('Login Error:', error.response?.data || error.message);
            return handleApiError(error, 'Login failed');
        }
    };

    const verifyLoginCode = async (email, code) => {
        try {
            const response = await axios.post('/api/users/verify-login', { email, code });
            const { data } = response.data;

            if (data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                await checkAuth();
                return { success: true };
            }

            return handleApiError(new Error('Invalid response from server'));
        } catch (error) {
            console.error('Verify Login Code Error:', error.response?.data || error.message);
            return handleApiError(error, 'Verification failed');
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/users/register', userData);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            return handleApiError(error, 'Registration failed');
        }
    };

    const logout = async () => {
        try {
            await axios.post('/users/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        verifyLoginCode,
        checkAuth
    };

    if (loading) {
        return null; // or a loading spinner
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
