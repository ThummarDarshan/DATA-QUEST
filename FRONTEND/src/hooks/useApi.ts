import { useState, useEffect, useCallback } from 'react';
import { chatApi, notificationApi, uploadApi, systemApi, ChatSession, Message, Notification, UploadedFile } from '../services/api';

// Generic hook for API calls with loading and error states
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error, execute };
}

// Chat-related hooks
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.getSessions();
      if (response.success && response.data) {
        setSessions(response.data.sessions || []);
      } else {
        setError(response.message || 'Failed to fetch sessions');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (title?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.createSession(title);
      if (response.success && response.data) {
        setSessions(prev => [response.data.session, ...(prev || [])]);
        return response.data.session;
      } else {
        setError(response.message || 'Failed to create session');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (sessionId: string, updates: { title?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.updateSession(sessionId, updates);
      if (response.success && response.data) {
        setSessions(prev => 
          (prev || []).map(session => 
            session.id === sessionId ? response.data.session : session
          )
        );
        return response.data.session;
      } else {
        setError(response.message || 'Failed to update session');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.deleteSession(sessionId);
      if (response.success) {
        setSessions(prev => (prev || []).filter(session => session.id !== sessionId));
        return true;
      } else {
        setError(response.message || 'Failed to delete session');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearAllSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.clearAllSessions();
      if (response.success) {
        setSessions([]);
        return true;
      } else {
        setError(response.message || 'Failed to clear sessions');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear sessions';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    clearAllSessions,
  };
}

export function useChatMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.getMessages(sessionId);
      if (response.success && response.data) {
        setMessages(response.data.session?.messages || []);
      } else {
        setError(response.message || 'Failed to fetch messages');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string, overrideSessionId?: string) => {
    const currentSessionId = overrideSessionId || sessionId;
    
    if (!currentSessionId) {
      setError('No session selected');
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await chatApi.sendMessage({ sessionId: currentSessionId, content });
      if (response.success && response.data) {
        setMessages(prev => [...(prev || []), ...response.data.messages]);
        return response.data;
      } else {
        setError(response.message || 'Failed to send message');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
  };
}

// Notification hooks
export function useNotifications(page: number = 1, limit: number = 20) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationApi.getNotifications({ page, limit });
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        // Since backend doesn't provide pagination metadata, we'll set default values
        setPagination({
          page,
          limit,
          total: response.data.notifications?.length || 0,
          totalPages: 1, // Assume single page for now
        });
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev =>
          (prev || []).map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to mark notification as read');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
      setError(errorMessage);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAsRead,
  };
}

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.success && response.data) {
        setCount(response.data.count);
      } else {
        setError('Failed to fetch unread count');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return {
    count,
    loading,
    error,
    fetchCount,
  };
}

// File upload hooks
export function useFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadApi.getFiles();
      if (response.success && response.data) {
        setUploadedFiles(response.data);
      } else {
        setError(response.message || 'Failed to fetch files');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: File, sessionId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadApi.uploadFile(file, sessionId);
      if (response.success && response.data) {
        setUploadedFiles(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.message || 'Failed to upload file');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    uploadedFiles,
    loading,
    error,
    fetchFiles,
    uploadFile,
  };
}

// System health hook
export function useSystemHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await systemApi.healthCheck();
      if (response.success) {
        setIsHealthy(true);
      } else {
        setIsHealthy(false);
        setError('System is not healthy');
      }
    } catch (err) {
      setIsHealthy(false);
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    isHealthy,
    loading,
    error,
    checkHealth,
  };
}
