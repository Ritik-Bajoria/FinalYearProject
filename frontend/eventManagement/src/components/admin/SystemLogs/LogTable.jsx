import { Activity } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

const LogTable = ({ logs, loading, error }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {logs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Timestamp</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Action</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">User</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Details</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-900">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map(log => (
                <tr key={log.log_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{log.action_type}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{log.user_email || 'System'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{log.description}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.log_type === 'success' ? 'bg-green-100 text-green-800' :
                      log.log_type === 'warning' ? 'bg-amber-100 text-amber-800' :
                      log.log_type === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.log_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No system logs found</p>
          <p className="text-sm text-slate-500 mt-1">System activities will appear here</p>
        </div>
      )}
    </div>
  );
};

export default LogTable;