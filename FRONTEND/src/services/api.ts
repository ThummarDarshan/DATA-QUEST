// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  sessionId?: string;
  userId: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
        // headers.Authorization = `Bearer ${this.token}`;
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  // Authentication APIs
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/me');
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Chat APIs
  async getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
    return this.request<ApiResponse<ChatSession[]>>('/chat/sessions');
  }

  async createChatSession(title?: string): Promise<ApiResponse<ChatSession>> {
    return this.request<ApiResponse<ChatSession>>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getChatSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return this.request<ApiResponse<ChatSession>>(`/chat/sessions/${sessionId}`);
  }

  async updateChatSession(
    sessionId: string,
    updates: { title?: string }
  ): Promise<ApiResponse<ChatSession>> {
    return this.request<ApiResponse<ChatSession>>(`/chat/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteChatSession(sessionId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async clearAllChatSessions(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/chat/sessions', {
      method: 'DELETE',
    });
  }

  async sendMessage(data: {
    sessionId: string;
    content: string;
  }): Promise<ApiResponse<Message>> {
    return this.request<ApiResponse<Message>>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessages(
    sessionId: string
  ): Promise<ApiResponse<Message[]>> {
    return this.request<ApiResponse<Message[]>>(`/chat/sessions/${sessionId}/messages`);
  }

  // Notification APIs
  async getNotifications(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    const endpoint = query ? `/notifications?${query}` : '/notifications';
    
    return this.request<PaginatedResponse<Notification>>(endpoint);
  }

  async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
    return this.request<ApiResponse<{ count: number }>>('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // File Upload APIs
  async uploadFile(
    file: File,
    sessionId?: string
  ): Promise<ApiResponse<UploadedFile>> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    const url = `${this.baseURL}/upload`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Upload failed');
    }

    return data;
  }

  async getUploadedFiles(): Promise<ApiResponse<UploadedFile[]>> {
    return this.request<ApiResponse<UploadedFile[]>>('/upload');
  }

  // System APIs
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<ApiResponse<{ status: string; timestamp: string }>>('/health');
  }

  async getRoot(): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>('/');
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual API functions for convenience
export const authApi = {
  register: (userData: { name: string; email: string; password: string }) =>
    apiClient.register(userData),
  login: (credentials: { email: string; password: string }) =>
    apiClient.login(credentials),
  getCurrentUser: () => apiClient.getCurrentUser(),
  updateProfile: (updates: Partial<User>) => apiClient.updateProfile(updates),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.changePassword(data),
  forgotPassword: (email: string) => apiClient.forgotPassword(email),
  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.resetPassword(data),
};

export const chatApi = {
  getSessions: () => apiClient.getChatSessions(),
  createSession: (title?: string) => apiClient.createChatSession(title),
  getSession: (sessionId: string) => apiClient.getChatSession(sessionId),
  updateSession: (sessionId: string, updates: { title?: string }) =>
    apiClient.updateChatSession(sessionId, updates),
  deleteSession: (sessionId: string) => apiClient.deleteChatSession(sessionId),
  clearAllSessions: () => apiClient.clearAllChatSessions(),
  sendMessage: (data: { sessionId: string; content: string }) =>
    apiClient.sendMessage(data),
  getMessages: (sessionId: string) => apiClient.getMessages(sessionId),
};

export const notificationApi = {
  getNotifications: (params?: { page?: number; limit?: number }) =>
    apiClient.getNotifications(params),
  getUnreadCount: () => apiClient.getUnreadNotificationCount(),
  markAsRead: (notificationId: string) =>
    apiClient.markNotificationAsRead(notificationId),
};

export const uploadApi = {
  uploadFile: (file: File, sessionId?: string) =>
    apiClient.uploadFile(file, sessionId),
  getFiles: () => apiClient.getUploadedFiles(),
};

export const systemApi = {
  healthCheck: () => apiClient.healthCheck(),
  getRoot: () => apiClient.getRoot(),
};

export default apiClient;
