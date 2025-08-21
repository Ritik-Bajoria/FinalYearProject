import { Search, AlertTriangle } from "lucide-react";

const EventFilters = ({ filters, setFilters, pendingCount }) => {
  // Generic handler for updating filters
  const handleChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      {/* Title */}
      <h2 className="text-xl font-bold text-slate-900">Event Management</h2>

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            className="pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Approval Status Dropdown */}
        <select
          value={filters.approval_status}
          onChange={(e) => handleChange("approval_status", e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg 
                     focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">All Approval Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Category Dropdown */}
        <select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg 
                     focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          <option value="">All Categories</option>
          <option value="Academic">Academic</option>
          <option value="Cultural">Cultural</option>
          <option value="Sports">Sports</option>
          <option value="Technical">Technical</option>
          <option value="Social">Social</option>
          <option value="Other">Other</option>
        </select>

        {/* Pending Filter Button */}
        <button
          onClick={() => handleChange("approval_status", "pending")}
          className="flex items-center gap-2 px-3 py-1.5 
                     bg-amber-500 text-white rounded-lg 
                     hover:bg-amber-600 transition-colors text-sm"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Pending ({pendingCount})</span>
        </button>
      </div>
    </div>
  );
};

export default EventFilters;
