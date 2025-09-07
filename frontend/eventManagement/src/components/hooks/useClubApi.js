import { useState, useEffect } from 'react';

const useClubApi = (userId) => {
    const [clubData, setClubData] = useState({
        club: null,
        events: [],
        pastEvents: [],
        members: [],
        messages: [],
        pendingRequests: [],
        loading: true,
        error: null
    });

    const token = localStorage.getItem('token');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const apiCall = async (endpoint, options = {}) => {
        try {
            setClubData(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                },
                ...options
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
            setClubData(prev => ({ ...prev, loading: false }));
            return data;
        } catch (error) {
            setClubData(prev => ({
                ...prev,
                loading: false,
                error: error.message
            }));
            throw error;
        }
    };

    const fetchClubData = async () => {
        try {
            setClubData(prev => ({ ...prev, loading: true, error: null }));

            const clubs = await apiCall('/clubs/my');
            const club = clubs.length > 0 ? clubs[0] : null;

            if (!club) {
                setClubData({
                    club: null,
                    events: [],
                    pastEvents: [],
                    members: [],
                    messages: [],
                    pendingRequests: [],
                    loading: false,
                    error: null
                });
                return;
            }

            // Fetch all data in parallel
            const [upcomingEvents, pastEvents, members, messages] = await Promise.all([
                apiCall(`/clubs/${club.club_id}/events?type=upcoming`),
                apiCall(`/clubs/${club.club_id}/events?type=past`),
                apiCall(`/clubs/${club.club_id}/members`),
                apiCall(`/clubs/${club.club_id}/initialchats`),
            ]);

            // Only fetch requests if user is leader
            let pendingRequests = [];
            if (club.leader_id === userId) {
                const requestsResponse = await apiCall(`/clubs/${club.club_id}/requests`);
                pendingRequests = requestsResponse?.data || [];
            }

            setClubData({
                club,
                events: upcomingEvents?.data || [],
                pastEvents: pastEvents?.data || [],
                members: members?.data || [],
                messages: messages?.data || [],
                pendingRequests,
                loading: false,
                error: null
            });
        } catch (error) {
            setClubData(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to fetch club data'
            }));
        }
    };

    const sendMessage = async (clubId, messageText) => {
        return await apiCall(`/clubs/${clubId}/chats`, {
            method: 'POST',
            body: JSON.stringify({ message: messageText })
        });
    };

    const leaveClub = async (clubId) => {
        await apiCall(`/clubs/${clubId}/leave`, {
            method: 'POST'
        });
        await fetchClubData();
    };

    const createEvent = async (clubId, eventData) => {
        const formData = new FormData();

        // Helper function to safely append non-undefined values
        const safeAppend = (key, value) => {
            if (value !== undefined && value !== null && value !== '') {
                formData.append(key, value);
            }
        };

        // Required fields - only append if they exist
        safeAppend('title', eventData.title);
        safeAppend('description', eventData.description);
        safeAppend('date', eventData.date);
        safeAppend('time', eventData.time);
        safeAppend('venue', eventData.venue);
        safeAppend('duration_minutes', eventData.duration_minutes);

        // Optional fields
        safeAppend('end_date', eventData.end_date);
        safeAppend('category', eventData.category);
        safeAppend('visibility', eventData.visibility);
        safeAppend('target_audience', eventData.target_audience);
        safeAppend('capacity', eventData.capacity);
        safeAppend('estimated_budget', eventData.estimated_budget);
        safeAppend('registration_end_date', eventData.registration_end_date);

        // Boolean flags - convert to string and only append if defined
        if (eventData.is_recurring !== undefined) {
            formData.append('is_recurring', String(eventData.is_recurring));
        }
        if (eventData.is_certified !== undefined) {
            formData.append('is_certified', String(eventData.is_certified));
        }
        if (eventData.qr_check_in_enabled !== undefined) {
            formData.append('qr_check_in_enabled', String(eventData.qr_check_in_enabled));
        }

        // Image upload
        if (eventData.image && eventData.image instanceof File) {
            formData.append('image', eventData.image);
        }

        try {
            // Debug: Log FormData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await apiCall(`/clubs/${clubId}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Don't set Content-Type for FormData - let browser set it with boundary
                },
                body: formData
            });

            return response;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    };

    const updateClubDetails = async (clubId, formData) => {
        try {
            const dataToUpdate = new FormData();
            // console.log('Received FormData from child:');
            // for (let [key, value] of formData.entries()) {
            //     console.log(key, value);
            // }
            // Safely iterate through formData properties
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    // For files, append with the file object
                    dataToUpdate.append(key, value);
                } else if (Array.isArray(value)) {
                    // For arrays, append each item individually
                    value.forEach(item => {
                        dataToUpdate.append(key, item);
                    });
                } else {
                    // For other values, append as-is (FormData will convert to string)
                    dataToUpdate.append(key, value);
                }
            }
            console.log(dataToUpdate)
            return await apiCall(`/clubs/${clubId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: dataToUpdate
            });
        } catch (error) {
            console.error('Error in updateClubDetails:', error);
            throw error;
        }
    };

    const deleteClub = async (clubId) => {
        return await apiCall(`/clubs/${clubId}`, {
            method: 'DELETE',
            body: JSON.stringify({ confirmation: "DELETE" })
        });
    };

    const getPendingRequests = async (clubId) => {
        const requests = await apiCall(`/clubs/${clubId}/requests`);
        const pendingRequests = Array.isArray(requests['data']) ? requests['data'] : [];
        setClubData(prev => ({ ...prev, pendingRequests }));
        return pendingRequests;
    };

    const approveMember = async (clubId, userId) => {
        return await apiCall(`/clubs/${clubId}/requests/${userId}/approve`, {
            method: 'PUT'
        });
    };

    const rejectMember = async (clubId, userId) => {
        return await apiCall(`/clubs/${clubId}/requests/${userId}/reject`, {
            method: 'PUT'
        });
    };

    const removeMember = async (clubId, userId) => {
        return await apiCall(`/clubs/${clubId}/members/${userId}`, {
            method: 'DELETE'
        });
    };

    const changeLeader = async (clubId, newLeaderId) => {
        return await apiCall(`/clubs/${clubId}/leader`, {
            method: 'PUT',
            body: JSON.stringify({ new_leader_id: newLeaderId })
        });
    };

    useEffect(() => {
        if (userId) fetchClubData();
    }, [userId]);

    return {
        ...clubData,
        refetch: fetchClubData,
        sendMessage,
        leaveClub,
        createEvent,
        updateClubDetails,
        deleteClub,
        getPendingRequests,
        approveMember,
        rejectMember,
        removeMember,
        changeLeader
    };
};

export default useClubApi;