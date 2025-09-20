import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import EventFilters from './EvenFilters';
import EventCard from './EventCard';
import EventDetailsModal from './EventDetailsModal';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';
import useAdminApi from '../../hooks/useAdminApi';

const EventManagement = () => {
  const { apiCall, loading, error } = useAdminApi();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    approval_status: '',
    category: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  // Fetch events
  const fetchEvents = async (filtersToUse) => {
    try {
      const queryParams = new URLSearchParams({
        page: filtersToUse.page,
        limit: filtersToUse.limit,
        search: filtersToUse.search,
        approval_status: filtersToUse.approval_status,
        category: filtersToUse.category
      }).toString();

      const data = await apiCall(`/admin/events?${queryParams}`);
      // Handle different response structures
      const events = data.events || data.data?.events || [];
      const total = data.total || data.data?.total || 0;
      const pages = data.pages || data.data?.pages || 1;
      const currentPage = data.current_page || data.data?.current_page || filtersToUse.page;
      setEvents(events);
      setPagination({
        total,
        pages,
        currentPage
      });
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  // Debounced version of fetchEvents for search input
  const debouncedFetchEvents = useCallback(
    debounce((filtersToUse) => {
      fetchEvents(filtersToUse);
    }, 300),
    []
  );

  // Watch filters changes
useEffect(() => {
  // Fetch events immediately if any filter other than search changes
  fetchEvents(filters);
}, [filters.approval_status, filters.category, filters.page, filters.limit]);

useEffect(() => {
  // Debounce only search input
  debouncedFetchEvents({ ...filters, page: 1 });
  // Cleanup on unmount
  return () => debouncedFetchEvents.cancel();
}, [filters.search]); // only trigger when search changes

  // Update event approval status
  const updateEventStatus = async (eventId, approvalStatus) => {
    try {
      await apiCall(`/admin/events/${eventId}/approval-status`, {
        method: 'PATCH',
        body: { approval_status: approvalStatus }
      });
      // Update the event in the local state immediately for better UX
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.event_id === eventId 
            ? { ...event, approval_status: approvalStatus }
            : event
        )
      );
      // Also refresh from server
      fetchEvents(filters);
    } catch (err) {
      console.error('Failed to update event status:', err);
      // Optionally show error notification
    }
  };

  // Modal handlers
  const handleViewDetails = (event, tab = 'details') => {
    setSelectedEvent({ ...event, initialTab: tab });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <EventFilters
        filters={filters}
        setFilters={setFilters}
        pendingCount={events.filter(e => e.approval_status === 'pending').length}
      />

      {/* Events Grid */}
      {loading ? (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 animate-pulse">
              <div className="h-36 bg-slate-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map(event => (
            <EventCard 
              key={event.event_id}
              event={event}
              onViewDetails={handleViewDetails}
              onApprove={() => updateEventStatus(event.event_id, 'approved')}
              onReject={() => updateEventStatus(event.event_id, 'rejected')}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No events found</h3>
          <p className="text-slate-600">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">
            Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} events
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={filters.page === 1}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm text-slate-600 bg-slate-50 rounded-lg">
              Page {filters.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
              disabled={filters.page >= pagination.pages}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialTab={selectedEvent?.initialTab || 'details'}
      />
    </div>
  );
};

export default EventManagement;
