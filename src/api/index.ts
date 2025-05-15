/**
 * PomoSpace API Client
 * 
 * This module handles all API communication with the backend services
 */

// API configuration
const API_CONFIG = {
  // Use the proxy defined in vite.config.ts
  baseUrl: '/api',
};

// Helper for making API requests
const fetchApi = async (
  endpoint: string, 
  method: string = 'GET', 
  data?: any, 
  withCredentials: boolean = true
) => {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: withCredentials ? 'include' : 'omit',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  // If response is not OK (status in the range 200-299), throw an error
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }
  
  // If response is 204 No Content, return null
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

// Auth API
export const authApi = {
  register: (userData: { email: string; password: string; name?: string }) =>
    fetchApi('/auth/register', 'POST', userData),
  
  login: (credentials: { email: string; password: string }) =>
    fetchApi('/auth/login', 'POST', credentials),
  
  logout: () => fetchApi('/auth/logout', 'POST'),
  
  getCurrentUser: () => fetchApi('/auth/me'),
};

// Settings API
export const settingsApi = {
  getSettings: () => fetchApi('/settings'),
  
  updateSettings: (settings: any) => fetchApi('/settings', 'PUT', settings),
};

// Tasks API
export const tasksApi = {
  getTasks: () => fetchApi('/tasks'),
  
  createTask: (task: { text: string; estimatedPomodoros?: number }) =>
    fetchApi('/tasks', 'POST', task),
  
  updateTask: (taskId: string, task: { text?: string; estimatedPomodoros?: number }) =>
    fetchApi(`/tasks/${taskId}`, 'PUT', task),
  
  deleteTask: (taskId: string) => fetchApi(`/tasks/${taskId}`, 'DELETE'),
  
  toggleTaskCompletion: (taskId: string) =>
    fetchApi(`/tasks/${taskId}/toggle`, 'PATCH'),
  
  incrementPomodoro: (taskId: string, minutes: number = 25) =>
    fetchApi(`/tasks/${taskId}/pomodoro`, 'PATCH', { minutes }),
};

// History API
export const historyApi = {
  getHistory: (filters?: { startDate?: string; endDate?: string; taskId?: string }) => {
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.taskId) queryParams.append('taskId', filters.taskId);
    
    const queryString = queryParams.toString();
    return fetchApi(`/history${queryString ? `?${queryString}` : ''}`);
  },
  
  logPomodoro: (data: { taskId?: string; taskName: string; minutes: number; date?: string }) =>
    fetchApi('/history', 'POST', data),
};

// Reports API
export const reportsApi = {
  getSummary: (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') =>
    fetchApi(`/reports/summary?timeRange=${timeRange}`),
  
  getFocusTime: (timeRange: 'day' | 'week' | 'month' | 'year' = 'week') =>
    fetchApi(`/reports/focus-time?timeRange=${timeRange}`),
};

export default {
  auth: authApi,
  settings: settingsApi,
  tasks: tasksApi,
  history: historyApi,
  reports: reportsApi,
}; 