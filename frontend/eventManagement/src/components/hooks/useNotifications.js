import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  const token = localStorage.getItem('token');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const fetchNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(
        `/notifications?page=${page}&per_page=20&unread_only=${unreadOnly}`
      );

      if (response.success) {
        setNotifications(response.data.notifications || []);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiCall('/notifications/unread-count');
      
      if (response.success) {
        setUnreadCount(response.data.unread_count || 0);
        return response.data.unread_count;
      } else {
        throw new Error(response.message || 'Failed to fetch unread count');
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
      return 0;
    }
  }, [token, API_BASE_URL]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await apiCall(`/notifications/${notificationId}/mark-read`, {
        method: 'PUT'
      });

      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }, [token, API_BASE_URL]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiCall('/notifications/mark-all-read', {
        method: 'PUT'
      });

      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }, [token, API_BASE_URL]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await apiCall(`/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        // Update local state
        const wasUnread = notifications.find(n => n.id === notificationId && !n.read);
        
        setNotifications(prev => 
          prev.filter(n => n.id !== notificationId)
        );
        
        // Update unread count if the deleted notification was unread
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, [token, API_BASE_URL, notifications]);

  const refreshNotifications = useCallback(async () => {
    try {
      await Promise.all([
        fetchNotifications(),
        fetchUnreadCount()
      ]);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Set up Socket.IO connection for real-time notifications
  useEffect(() => {
    if (token && API_BASE_URL) {
      // Create socket connection
      const socketConnection = io(API_BASE_URL, {
        auth: {
          token: token
        }
      });

      // Set up event listeners
      socketConnection.on('connect', () => {
        console.log('Connected to notification server');
        // Authenticate with the server
        socketConnection.emit('authenticate', { token });
      });

      socketConnection.on('authenticated', (data) => {
        console.log('Authenticated for notifications:', data);
        setSocket(socketConnection);
      });

      socketConnection.on('new_notification', (notificationData) => {
        console.log('New notification received:', notificationData);
        
        // Add new notification to the list
        setNotifications(prev => [notificationData, ...prev]);
        
        // Update unread count
        if (!notificationData.read) {
          setUnreadCount(prev => prev + 1);
        }
      });

      socketConnection.on('unread_count_update', (data) => {
        console.log('Unread count updated:', data.count);
        setUnreadCount(data.count);
      });

      socketConnection.on('club_notification', (data) => {
        console.log('Club notification received:', data);
        // Handle club-specific notifications
      });

      socketConnection.on('auth_error', (error) => {
        console.error('Authentication error:', error);
        setError(error.message);
      });

      socketConnection.on('disconnect', () => {
        console.log('Disconnected from notification server');
        setSocket(null);
      });

      // Cleanup on unmount
      return () => {
        socketConnection.disconnect();
      };
    }
  }, [token, API_BASE_URL]);

  // Auto-fetch unread count on mount and periodically (fallback)
  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      
      // Set up periodic refresh for unread count (every 60 seconds as fallback)
      const interval = setInterval(fetchUnreadCount, 60000);
      
      return () => clearInterval(interval);
    }
  }, [token, fetchUnreadCount]);

  // Function to join club room for club-specific notifications
  const joinClubRoom = useCallback((clubId) => {
    if (socket) {
      socket.emit('join_club_room', { club_id: clubId });
    }
  }, [socket]);

  // Function to leave club room
  const leaveClubRoom = useCallback((clubId) => {
    if (socket) {
      socket.emit('leave_club_room', { club_id: clubId });
    }
  }, [socket]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    socket,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    joinClubRoom,
    leaveClubRoom
  };
};

export default useNotifications;