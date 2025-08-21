import { 
  Loader, 
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar
} from 'lucide-react';

const RecentActivities = ({ recentUsers, recentEvents, loading }) => {
  const getStatusIcon = (status, isActive) => {
    if (isActive === false) return <Clock className="w-3 h-3" />;
    if (status === 'approved' || isActive === true) return <CheckCircle2 className="w-3 h-3" />;
    if (status === 'pending') return <Clock className="w-3 h-3" />;
    return <XCircle className="w-3 h-3" />;
  };

  const getStatusColor = (status, isActive) => {
    if (isActive === false || status === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status === 'approved' || isActive === true) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Users */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center">
            <User className="w-4 h-4 text-slate-500 mr-2" />
            <h3 className="text-base font-semibold text-slate-900">Recent Registrations</h3>
          </div>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="w-5 h-5 animate-spin text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Loading users...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {(recentUsers || []).slice(0, 5).map(user => (
                <div key={user.user_id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg hover:bg-slate-100/80 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 text-sm truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-600 truncate">{user.email}</p>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(null, user.is_active)}`}>
                    {getStatusIcon(null, user.is_active)}
                    <span className="ml-1">{user.is_active ? 'Active' : 'Pending'}</span>
                  </div>
                </div>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No recent registrations
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-slate-500 mr-2" />
            <h3 className="text-base font-semibold text-slate-900">Event Activity</h3>
          </div>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="w-5 h-5 animate-spin text-slate-400 mr-2" />
              <span className="text-slate-500 text-sm">Loading events...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {(recentEvents || []).slice(0, 5).map(event => (
                <div key={event.event_id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg hover:bg-slate-100/80 transition-colors">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium text-slate-900 text-sm truncate">{event.title}</p>
                    <p className="text-xs text-slate-600 truncate">by {event.organizer_name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-slate-700 mb-1">
                      {event.registered_count || 0} registered
                    </p>
                    <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                      <span className="ml-1 capitalize">{event.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!recentEvents || recentEvents.length === 0) && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No recent events
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;