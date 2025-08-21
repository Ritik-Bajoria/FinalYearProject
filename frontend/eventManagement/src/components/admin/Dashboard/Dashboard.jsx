import StatCard from './StatCard';
import RecentActivities from './RecentActivities';
import {
  Users,
  Calendar,
  AlertTriangle,
  Bell
} from 'lucide-react';

const Dashboard = ({ stats = {}, recentUsers = [], recentEvents = [], loading = false, error, refreshAll }) => {
  if (error) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          {refreshAll && (
            <button
              onClick={refreshAll}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50/30 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-600">Overview of your system metrics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Recent Activities */}
      <RecentActivities
        recentUsers={recentUsers}
        recentEvents={recentEvents}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;