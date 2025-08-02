import { useState, useEffect } from 'react';
import UserFilters from './UserFilters';
import UserTable from './UserTable';
import useAdminApi from '../../hooks/useAdminApi';

const UserManagement = () => {
  const { apiCall, loading, error } = useAdminApi();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        role: filters.role,
        status: filters.status
      }).toString();

      const data = await apiCall(`/admin/users?${queryParams}`);
      setUsers(data.users || []);
      setPagination({
        total: data.total,
        pages: data.pages,
        currentPage: data.currentPage
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await apiCall(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiCall(`/admin/users/${userId}`, { method: 'DELETE' });
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  return (
    <div className="space-y-6">
      <UserFilters 
        filters={filters} 
        setFilters={setFilters} 
        onExport={() => {/* export logic */}} 
      />
      
      <UserTable 
        users={users} 
        loading={loading} 
        error={error}
        onApprove={(userId) => updateUserStatus(userId, 'active')}
        onBan={(userId) => updateUserStatus(userId, 'banned')}
        onDelete={deleteUser}
      />
      
      {/* Pagination would go here */}
    </div>
  );
};

export default UserManagement;