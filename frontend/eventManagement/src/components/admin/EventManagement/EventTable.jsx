import { Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

const EventTable = ({ events, loading, error, onApprove, onReject, onDelete }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Event</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Organizer</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Registered</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {events.map(event => (
              <tr key={event.event_id} className="hover:bg-slate-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-slate-900">{event.title}</p>
                    <p className="text-sm text-slate-600">{event.venue}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">{event.organizer_name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {new Date(event.event_date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">
                  {event.registered_count}/{event.capacity}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    event.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    event.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    event.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {event.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onApprove(event.event_id)}
                      className="p-1 text-slate-400 hover:text-green-600 transition-colors"
                      disabled={event.status === 'approved'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onReject(event.event_id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(event.event_id)}
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

export default EventTable;