import { useState, useEffect } from 'react';
import EventFilters from './EvenFilters';
import EventTable from './EventTable';
import useAdminApi from '../../hooks/useAdminApi';

const EventManagement = () => {
  const { apiCall, loading, error } = useAdminApi();
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  const fetchEvents = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        status: filters.status,
        category: filters.category
      }).toString();

      const data = await apiCall(`/admin/events?${queryParams}`);
      setEvents(data.events || []);
      setPagination({
        total: data.total,
        pages: data.pages,
        currentPage: data.currentPage
      });
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const updateEventStatus = async (eventId, status) => {
    try {
      await apiCall(`/admin/events/${eventId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to update event status:', error);
    }
  };

  const deleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await apiCall(`/admin/events/${eventId}`, { method: 'DELETE' });
        fetchEvents();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  return (
    <div className="space-y-6">
      <EventFilters 
        filters={filters} 
        setFilters={setFilters} 
        pendingCount={0} // You would pass actual pending count
      />
      
      <EventTable 
        events={events} 
        loading={loading} 
        error={error}
        onApprove={(eventId) => updateEventStatus(eventId, 'approved')}
        onReject={(eventId) => updateEventStatus(eventId, 'rejected')}
        onDelete={deleteEvent}
      />
      
      {/* Pagination would go here */}
    </div>
  );
};

export default EventManagement;