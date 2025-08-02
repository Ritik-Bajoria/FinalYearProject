import { useState, useEffect } from 'react';
import LogFilters from './LogFilters';
import LogTable from './LogTable';
import useAdminApi from '../../hooks/useAdminApi';
// import { saveAs } from 'file-saver'; // For handling file downloads

const SystemLogs = () => {
  const { apiCall, loading, error } = useAdminApi();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    action_type: '',
    log_type: '',
    date_from: '',
    date_to: ''
  });

  const fetchLogs = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      }).toString();

      const response = await apiCall(`/admin/logs?${queryParams}`);
      if (response && response.data) {
        setLogs(response.data.logs || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          pages: response.data.pages || 1
        }));
      }
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
    }
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await apiCall(`/admin/logs/export?${queryParams}`, {
        method: 'GET',
        responseType: 'blob' // Important for file downloads
      });

      // Handle file download
      const blob = new Blob([response], { type: 'text/csv' });
      saveAs(blob, `system_logs_${new Date().toISOString().slice(0,10)}.csv`);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      action_type: '',
      log_type: '',
      date_from: '',
      date_to: ''
    });
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page, pagination.limit]);

  return (
    <div className="space-y-6">
      <LogFilters 
        filters={filters} 
        setFilters={setFilters} 
        onExport={exportLogs} 
        onClear={clearFilters}
      />
      
      <LogTable 
        logs={logs} 
        loading={loading} 
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default SystemLogs;