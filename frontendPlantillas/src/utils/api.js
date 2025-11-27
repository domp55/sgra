import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

// User functions
export const userAPI = {
  getUsers: () => api.get('/users'),
  getPendingUsers: () => api.get('/users/pending'),
  approveUser: (userId, role) => api.put(`/users/${userId}/approve`, { role }),
  deactivateUser: (userId) => api.put(`/users/${userId}/deactivate`)
};

// Project functions
export const projectAPI = {
  getProjects: () => api.get('/projects'),
  createProject: (projectData) => api.post('/projects', projectData),
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),
  addMember: (projectId, userId) => api.post(`/projects/${projectId}/members`, { user_id: userId }),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`)
};

// Requirement functions
export const requirementAPI = {
  getRequirements: (projectId) => api.get(`/requirements?project_id=${projectId}`),
  createRequirement: (requirementData) => api.post('/requirements', requirementData),
  updateRequirement: (requirementId, updateData) => api.put(`/requirements/${requirementId}`, updateData),
  deleteRequirement: (requirementId) => api.delete(`/requirements/${requirementId}`)
};
