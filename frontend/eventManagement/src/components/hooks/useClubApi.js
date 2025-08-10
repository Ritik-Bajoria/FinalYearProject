import { useState, useEffect } from 'react';

const useClubApi = (userId) => {
    const [clubData, setClubData] = useState({
        club: null,
        events: [],
        members: [],
        messages: [],
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
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
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
            // Get user's club
            const club = await apiCall(`/clubs/${userId}/club`);

            if (!club) {
                setClubData({
                    club: null,
                    events: [],
                    members: [],
                    messages: [],
                    loading: false,
                    error: null
                });
                return;
            }

            // Fetch related data in parallel
            const [events, members, messages] = await Promise.all([
                apiCall(`/clubs/${club.club_id}/events`),
                apiCall(`/clubs/${club.club_id}/members`),
                apiCall(`/clubs/${club.club_id}/messages`)
            ]);

            setClubData({
                club,
                events: Array.isArray(events) ? events : [],
                members: Array.isArray(members) ? members : [],
                messages: Array.isArray(messages) ? messages : [],
                loading: false,
                error: null
            });
        } catch (error) {
            // error already handled in apiCall
        }
    };

    const sendMessage = async (clubId, messageText) => {
        const response = await apiCall(`/clubs/${clubId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
                message_text: messageText
            })
        });
        await fetchClubData(); // Refresh data
        return response;
    };

    const leaveClub = async (clubId) => {
        await apiCall(`/clubs/${clubId}/members/${userId}`, {
            method: 'DELETE'
        });
        await fetchClubData(); // Refresh data
        return true;
    };

    const createEvent = async (clubId, eventData) => {
        const response = await apiCall(`/clubs/${clubId}/events`, {
            method: 'POST',
            body: JSON.stringify({
                title: eventData.title,
                description: eventData.description,
                event_date: eventData.event_date,
                end_date: eventData.end_date || null,
                venue: eventData.venue,
                category: eventData.category,
                visibility: eventData.visibility,
                capacity: eventData.capacity
            })
        });
        await fetchClubData(); // Refresh data
        return response;
    };

    useEffect(() => {
        if (userId) fetchClubData();
    }, [userId]);

    return {
        ...clubData,
        refetch: fetchClubData,
        sendMessage,
        leaveClub,
        createEvent
    };
};

export default useClubApi;