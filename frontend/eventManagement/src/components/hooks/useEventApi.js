import { useState, useCallback } from 'react';

const useEventApi = () => {
  const [eventData, setEventData] = useState({
    event: null,
    loading: false,
    error: null,
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000';

  // Centralized API call handler
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    try {
      setEventData((prev) => ({ ...prev, loading: true, error: null }));

      const headers = {
        ...(options.body instanceof FormData
          ? {} // don't set content-type for FormData
          : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorData?.message || errorMsg;
        } catch {
          // ignore non-JSON error body
        }

        // Handle expired/invalid token
        if (response.status === 401 || response.status === 422) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      setEventData((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      throw err;
    } finally {
      setEventData((prev) => ({ ...prev, loading: false }));
    }
  }, [API_BASE_URL]);

  // ---- Event API functions ----
  const getEventDetails = useCallback(
    async (eventId) => {
      const event = await apiCall(`/events/${eventId}`);
      setEventData((prev) => ({ ...prev, event }));
      return event;
    },
    [apiCall]
  );
const updateEventBudget = useCallback(
  async (eventId, budgetData) =>
    apiCall(`/events/${eventId}/budget`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    }),
  [apiCall]
);

const updateUserRole = useCallback(
  async (eventId, userId, newRole) =>
    apiCall(`/events/${eventId}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    }),
  [apiCall]
);

const getEventFeedbacks = useCallback(
  async (eventId) => apiCall(`/events/${eventId}/feedbacks`),
  [apiCall]
);

const deleteEventDocument = useCallback(
  async (eventId, docId) =>
    apiCall(`/events/${eventId}/documents/${docId}`, {
      method: 'DELETE',
    }),
  [apiCall]
);
  const updateEvent = useCallback(
  async (eventId, formData) => {
    const updatedEvent = await apiCall(`/events/${eventId}`, {
      method: 'PUT',
      body: formData,
    });

    setEventData((prev) => ({ ...prev, event: updatedEvent }));
    return updatedEvent;
  },
  [apiCall]
);

  const deleteEvent = useCallback(
    async (eventId) => {
      await apiCall(`/events/${eventId}`, { method: 'DELETE' });
      setEventData((prev) => ({ ...prev, event: null }));
    },
    [apiCall]
  );

  const getEventChats = useCallback(
    (eventId, chatType, page = 1, perPage = 50) => apiCall(`/events/${eventId}/chats/${chatType}/messages?page=${page}&per_page=${perPage}`),
    [apiCall]
  );

  const sendEventMessage = useCallback(
    (eventId, chatType, message, replyToId = null) =>
      apiCall(`/events/${eventId}/chats/${chatType}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message, reply_to: replyToId }),
      }),
    [apiCall]
  );

  const uploadEventDocument = useCallback(
    (eventId, file) => {
      const formData = new FormData();
      formData.append('file', file);

      return apiCall(`/events/${eventId}/documents`, {
        method: 'POST',
        body: formData,
      });
    },
    [apiCall]
  );

  const getEventAttendance = useCallback(
    (eventId) => apiCall(`/events/${eventId}/attendance`),
    [apiCall]
  );

  const markAttendance = useCallback(
    (eventId, userId) =>
      apiCall(`/events/${eventId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }),
    [apiCall]
  );

  const submitFeedback = useCallback(
    (eventId, rating, comment) =>
      apiCall(`/events/${eventId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      }),
    [apiCall]
  );

  const getEventRegistrations = useCallback(
    (eventId) => apiCall(`/events/${eventId}/registrations`),
    [apiCall]
  );

  const updateRegistrationStatus = useCallback(
    (eventId, registrationId, status) =>
      apiCall(`/events/${eventId}/registrations/${registrationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    [apiCall]
  );

  const getEventQRCode = useCallback(
    (eventId) => apiCall(`/events/${eventId}/qr-code`),
    [apiCall]
  );

  const createVolunteerPosting = useCallback(
    (eventId, postingData) =>
      apiCall(`/events/${eventId}/volunteer-postings`, {
        method: 'POST',
        body: JSON.stringify(postingData),
      }),
    [apiCall]
  );

  return {
    event: eventData.event,
    loading: eventData.loading,
    error: eventData.error,
    getEventDetails,
    updateEvent,
    deleteEvent,
    getEventChats,
    sendEventMessage,
    uploadEventDocument,
    getEventAttendance,
    markAttendance,
    submitFeedback,
    getEventRegistrations,
    updateRegistrationStatus,
    getEventQRCode,
    createVolunteerPosting,
    
      updateEventBudget,
      updateUserRole,
      getEventFeedbacks,
      deleteEventDocument
  };
};

export default useEventApi;
