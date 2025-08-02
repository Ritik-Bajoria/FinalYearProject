import { useState, useEffect } from 'react';
import AdminLayout from '../admin/AdminLayout/AdminLayout';
import Dashboard from '../admin/Dashboard/Dashboard';
import UserManagement from '../admin/UserManagement/UserManagement';
import EventManagement from '../admin/EventManagement/EventManagement';
import SystemLogs from '../admin/SystemLogs/SystemLogs';
import Settings from '../admin/Settings/Settings';
import useDashboardStats from '../hooks/useDashboardStats';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { stats, recentUsers, recentEvents, loading, error, refreshAll } = useDashboardStats();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats} 
            recentUsers={recentUsers} 
            recentEvents={recentEvents} 
            loading={loading} 
            error={error} 
            refreshAll={refreshAll} 
          />
        );
      case 'users':
        return <UserManagement />;
      case 'events':
        return <EventManagement />;
      case 'logs':
        return <SystemLogs />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Auto-refresh dashboard stats every 30 seconds
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const interval = setInterval(refreshAll, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, refreshAll]);

  return (
    <AdminLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      alertCount={stats.systemAlerts}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard; 