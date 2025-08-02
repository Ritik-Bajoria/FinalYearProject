import StatCard from './StatCard';
import RecentActivities from './RecentActivities';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  Bell 
} from 'lucide-react';

const Dashboard = ({ stats, recentUsers, recentEvents, loading, error, refreshAll }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={Users} 
          trend="12" 
          isLoading={loading}
        />
        <StatCard 
          title="Active Events" 
          value={stats.activeEvents} 
          icon={Calendar} 
          trend="8" 
          isLoading={loading}
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pendingApprovals} 
          icon={AlertTriangle} 
          isLoading={loading}
        />
        <StatCard 
          title="System Alerts" 
          value={stats.systemAlerts} 
          icon={Bell} 
          isLoading={loading}
        />
      </div>

      <RecentActivities 
        recentUsers={recentUsers} 
        recentEvents={recentEvents} 
        loading={loading} 
      />
    </div>
  );
};

export default Dashboard;