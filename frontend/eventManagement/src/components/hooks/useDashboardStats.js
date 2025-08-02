import { useState, useEffect } from 'react';
import useAdminApi from './useAdminApi';

const useDashboardStats = () => {
  const { apiCall, loading, error } = useAdminApi();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEvents: 0,
    pendingApprovals: 0,
    systemAlerts: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  const fetchStats = async () => {
    try {
      const data = await apiCall('/admin/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const [usersData, eventsData] = await Promise.all([
        apiCall('/admin/users/recent?limit=3'),
        apiCall('/admin/events/recent?limit=3')
      ]);
      setRecentUsers(usersData.users || []);
      setRecentEvents(eventsData.events || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchStats(), fetchRecentActivities()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  return { 
    stats, 
    recentUsers, 
    recentEvents, 
    loading, 
    error, 
    refreshAll 
  };
};

export default useDashboardStats;