const RecentActivities = ({ recentUsers, recentEvents, loading }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent User Registrations</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-slate-400">Loading...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {recentUsers.map(user => (
              <div key={user.user_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{user.full_name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {user.is_active ? 'Active' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Event Activity</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-slate-400">Loading...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map(event => (
              <div key={event.event_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{event.title}</p>
                  <p className="text-sm text-slate-600">{event.organizer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{event.registered_count} registered</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    event.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivities;