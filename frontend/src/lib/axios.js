import axios from 'axios';

// Create axios instance with backend URL
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Track backend health status
let backendHealthy = true;
let lastHealthCheck = Date.now();

// Response interceptor to handle backend downtime
axiosInstance.interceptors.response.use(
  (response) => {
    // Backend is responding, mark as healthy
    backendHealthy = true;
    lastHealthCheck = Date.now();
    return response;
  },
  (error) => {
    // Check if it's a network error or timeout
    if (!error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      backendHealthy = false;
      lastHealthCheck = Date.now();
      
      // Store backend status in sessionStorage for maintenance page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('backendDown', 'true');
        sessionStorage.setItem('backendDownTime', Date.now().toString());
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to check backend health
export const checkBackendHealth = async () => {
  try {
    const response = await axiosInstance.get('/api/health');
    backendHealthy = response.status === 200;
    if (backendHealthy && typeof window !== 'undefined') {
      sessionStorage.removeItem('backendDown');
      sessionStorage.removeItem('backendDownTime');
    }
    return backendHealthy;
  } catch (error) {
    backendHealthy = false;
    return false;
  }
};

// Function to get backend status
export const isBackendHealthy = () => {
  // If last check was more than 30 seconds ago, assume we need to recheck
  if (Date.now() - lastHealthCheck > 30000) {
    return null; // Unknown, needs recheck
  }
  return backendHealthy;
};

export default axiosInstance;
