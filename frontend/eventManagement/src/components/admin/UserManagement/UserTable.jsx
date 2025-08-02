import { CheckCircle, Ban, Trash2 } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

const UserTable = ({ users, loading, error, onApprove, onBan, onDelete }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">User</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Join Date</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map(user => (
              <tr key={user.user_id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'faculty' ? 'bg-blue-100 text-blue-800' : 
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onApprove(user.user_id)}
                      className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                      disabled={user.is_active}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onBan(user.user_id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(user.user_id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;