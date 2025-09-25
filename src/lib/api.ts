import { getUserFriendlyMessage } from './errorHandling';

// Configure API and asset bases via Vite env; fall back to sensible dev defaults
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

// For asset URLs, we need to derive from API base in production but use localhost in development
export const ASSET_BASE_URL = (import.meta as any).env?.VITE_APP_ENV === 'production' 
  ? getAssetBaseUrlForProduction()
  : `http://${window.location.hostname}:5000`;

function getAssetBaseUrlForProduction(): string {
  // In production, use the backend URL for assets
  const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';
  // Remove /api from the end to get the base URL
  const baseUrl = apiUrl.replace(/\/api$/, '');
  // Ensure we're using HTTPS in production
  return baseUrl.replace(/^http:/, 'https:');
}

export const buildAssetUrl = (relativePath: string, cacheBust: boolean = false): string => {
  // If the path is already a full URL, return it as is
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // Handle empty or undefined paths
  if (!relativePath) {
    return '';
  }
  
  // Handle avatar paths - they should be prefixed with uploads/ if not already
  let cleanPath = relativePath;
  if (relativePath && !relativePath.startsWith('uploads/')) {
    cleanPath = `uploads/${relativePath}`;
  }
  
  // Ensure HTTPS is used in production
  const protocol = (import.meta as any).env?.VITE_APP_ENV === 'production' ? 'https:' : 'http:';
  const baseWithProtocol = ASSET_BASE_URL.replace(/^https?:/, protocol);
  const url = `${baseWithProtocol}/${cleanPath}`;
  console.log('Building asset URL:', url, 'from path:', relativePath);
  return cacheBust ? `${url}?t=${Date.now()}` : url;
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('token');
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData, let the browser set it
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.getToken()) {
      headers.Authorization = `Bearer ${this.getToken()}`;
    }

    try {
      console.log('Making API request to:', url);
      const response = await fetch(url, {
        ...options,
        headers,
        // Add credentials for CORS
        credentials: 'include'
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText, data);
        // Create error object with response details for better error handling
        const error = {
          response: {
            status: response.status,
            data: data
          },
          message: data.message || data || 'An error occurred'
        };
        return { error: getUserFriendlyMessage(error) };
      }

      console.log('API request successful:', url, data);
      return { data };
    } catch (error: any) {
      console.error('API request error:', error);
      // Check if it's a network error
      if (!navigator.onLine) {
        return { error: 'You appear to be offline. Please check your internet connection and try again.' };
      }
      if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        return { error: 'Unable to connect to the server. Please check your internet connection and try again.' };
      }
      return { error: getUserFriendlyMessage(error) };
    }
  }

  // Auth endpoints
  async register(userData: { name: string; email: string; password: string }) {
    const result = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async login(credentials: { email: string; password: string }) {
    const result = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (result.data?.token) {
      this.setToken(result.data.token);
    }

    return result;
  }

  async logout() {
    this.removeToken();
    return { data: null };
  }

  // User endpoints
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(updates: any) {
    // If updates contain avatar as File, send as FormData
    if (updates instanceof FormData) {
      return this.request('/users/profile', {
        method: 'PUT',
        body: updates,
      });
    } else {
      return this.request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    }
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async searchUsers(params?: {
    search?: string;
    skill?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/users/search${queryString ? `?${queryString}` : ''}`);
  }

  // Skills endpoints
  async getSkills(params?: {
    search?: string;
    category?: string;
    level?: string;
    availability?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/skills${queryString ? `?${queryString}` : ''}`);
  }

  async getMySkills() {
    return this.request('/skills/my-skills');
  }

  async createSkill(skillData: any) {
    return this.request('/skills', {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
  }

  async getSkill(id: string) {
    return this.request(`/skills/${id}`);
  }

  async updateSkill(id: string, updates: any) {
    return this.request(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSkill(id: string) {
    return this.request(`/skills/${id}`, {
      method: 'DELETE',
    });
  }

  // Messages endpoints
  async getMessages() {
    return this.request('/messages');
  }

  async sendMessage(messageData: { receiver: string; content: string }) {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async markMessageAsRead(id: string) {
    return this.request(`/messages/${id}/read`, {
      method: 'PUT',
    });
  }

  // Schedules endpoints
  async getSchedules() {
    return this.request('/schedules');
  }

  async createSchedule(scheduleData: any) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async updateSchedule(id: string, updates: any) {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSchedule(id: string) {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
    });
  }

  // Users helpers for forms
  async getUsers(limit: number = 50) {
    const params = new URLSearchParams({ limit: String(limit) });
    return this.request(`/users/search?${params.toString()}`);
  }

  // Matching endpoints
  async getMatches(params?: {
    page?: number;
    limit?: number;
    minScore?: number;
    skillName?: string;
    category?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/matching/matches${queryString ? `?${queryString}` : ''}`);
  }

  async generateMatches() {
    return this.request('/matching/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async expressInterest(matchId: string) {
    return this.request(`/matching/matches/${matchId}/interested`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async declineMatch(matchId: string) {
    return this.request(`/matching/matches/${matchId}/decline`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getInterestedStudents() {
    return this.request('/matching/interested-students');
  }

  async acceptStudent(matchId: string) {
    return this.request(`/matching/students/${matchId}/accept`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Ratings endpoints
  async getUserRatings(userId: string, params?: { limit?: number; page?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/ratings/user/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  async createRating(ratingData: {
    ratedUserId: string;
    skillId: string;
    scheduleId: string;
    rating: number;
    review?: string;
    teachingQuality?: number;
    communication?: number;
    punctuality?: number;
  }) {
    return this.request('/ratings', {
      method: 'POST',
      body: JSON.stringify(ratingData),
    });
  }

  async updateRating(ratingId: string, updates: {
    rating?: number;
    review?: string;
    teachingQuality?: number;
    communication?: number;
    punctuality?: number;
  }) {
    return this.request(`/ratings/${ratingId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRating(ratingId: string) {
    return this.request(`/ratings/${ratingId}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async adminListUsers() {
    return this.request('/admin/users');
  }
  async adminSetUserAdmin(id: string, isAdmin: boolean) {
    return this.request(`/admin/users/${id}/admin`, {
      method: 'PUT',
      body: JSON.stringify({ isAdmin }),
    });
  }
  async adminBanUser(id: string) {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'PUT',
    });
  }
  async adminUnbanUser(id: string) {
    return this.request(`/admin/users/${id}/unban`, {
      method: 'PUT',
    });
  }
  async adminListSkills() {
    return this.request('/admin/skills');
  }
  async adminDeleteSkill(id: string) {
    return this.request(`/admin/skills/${id}`, {
      method: 'DELETE',
    });
  }
  async adminListSchedules() {
    return this.request('/admin/schedules');
  }
  async adminDeleteSchedule(id: string) {
    return this.request(`/admin/schedules/${id}`, {
      method: 'DELETE',
    });
  }
  async adminListMessages() {
    return this.request('/admin/messages');
  }
  async adminDeleteMessage(id: string) {
    return this.request(`/admin/messages/${id}`, {
      method: 'DELETE',
    });
  }
  async adminGetAuditLogs(page = 1, limit = 50, action = '', admin = '') {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (action) params.append('action', action);
    if (admin) params.append('admin', admin);
    return this.request(`/admin/audit-logs?${params}`);
  }
  async adminGetStats() {
    return this.request('/admin/stats');
  }
}

export const apiService = new ApiService();