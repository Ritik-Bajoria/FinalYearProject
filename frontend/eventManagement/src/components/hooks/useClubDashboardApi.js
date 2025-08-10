import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      };

      // Handle FormData differently for file uploads
      if (options.body instanceof FormData) {
        // Don't set Content-Type for FormData - browser will set it with boundary
        delete headers['Content-Type'];
      } else if (!headers['Content-Type'] && options.body) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options,
        body: options.body instanceof FormData ? options.body : JSON.stringify(options.body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Something went wrong');
      }

      return data;
    } catch (err) {
      setError(err.message);
      console.error('API call failed:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error };
};

const useClubDashboardApi = (userId) => {
  const [dashboardData, setDashboardData] = useState({
    clubs: [],
    filteredClubs: [],
    loading: true,
    error: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { apiCall, loading: apiLoading, error: apiError } = useApi();

  const fetchClubs = async () => {
  try {
    const response = await apiCall('/clubs');
    // Handle both array response and object with data property
    const clubsData = Array.isArray(response) ? response : response.data;
    
    setDashboardData({
      clubs: Array.isArray(clubsData) ? clubsData : [],
      filteredClubs: Array.isArray(clubsData) ? clubsData : [],
      loading: false,
      error: null
    });
  } catch (err) {
    setDashboardData({
      clubs: [],
      filteredClubs: [],
      loading: false,
      error: err.message
    });
  }
};

  const joinClub = async (clubId) => {
    try {
      await apiCall(`/clubs/${clubId}/join`, {
        method: 'POST'
      });
      await fetchClubs();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const leaveClub = async (clubId) => {
    try {
      await apiCall(`/clubs/${clubId}/leave`, {
        method: 'POST'
      });
      await fetchClubs();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const createClub = async (clubData) => {
    try {
      const formData = new FormData();
      
      // Append all fields to formData
      formData.append('name', clubData.name);
      formData.append('description', clubData.description);
      formData.append('category', clubData.category);
      formData.append('club_details', clubData.club_details || '');
      
      // Append files if they exist
      if (clubData.logo_file) {
        formData.append('logo_url', clubData.logo_file);
      }
      if (clubData.image_file) {
        formData.append('image_url', clubData.image_file);
      }

      const response = await apiCall('/clubs', {
        method: 'POST',
        body: formData
      });
      
      await fetchClubs();
      return response;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (userId) fetchClubs();
  }, [userId]);

  useEffect(() => {
    const results = dashboardData.clubs.filter(club =>
      club?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club?.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDashboardData(prev => ({ ...prev, filteredClubs: results }));
  }, [searchTerm, dashboardData.clubs]);

  return {
    clubs: dashboardData.clubs,
    filteredClubs: dashboardData.filteredClubs,
    loading: dashboardData.loading || apiLoading,
    error: dashboardData.error || apiError,
    searchTerm,
    setSearchTerm,
    refetch: fetchClubs,
    joinClub,
    leaveClub,
    createClub
  };
};

export default useClubDashboardApi;