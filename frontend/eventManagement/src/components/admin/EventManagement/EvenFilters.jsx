import { Search, AlertTriangle } from 'lucide-react';

const EventFilters = ({ filters, setFilters, pendingCount }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 className="text-2xl font-bold text-slate-900">Event Moderation</h2>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search events..." 
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="flex items-center space-x-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
          <AlertTriangle className="w-4 h-4" />
          <span>Pending ({pendingCount})</span>
        </button>
      </div>
    </div>
  );
};

export default EventFilters;