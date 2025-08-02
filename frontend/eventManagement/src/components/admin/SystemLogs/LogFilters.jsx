import { Download } from 'lucide-react';

const LogFilters = ({ filters, setFilters, onExport, onClear }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 className="text-2xl font-bold text-slate-900">System Audit Logs</h2>
      <div className="flex items-center space-x-3">
        <select
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({...filters, dateFrom: e.target.value, page: 1})}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({...filters, dateTo: e.target.value, page: 1})}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          onClick={onExport}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>
    </div>
  );
};

export default LogFilters;