import { useState } from 'react';

const useAdminApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const apiCall = async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error };
};

export default useAdminApi;