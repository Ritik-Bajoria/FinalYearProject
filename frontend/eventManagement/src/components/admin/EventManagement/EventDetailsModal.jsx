import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Clock, User, Star, DollarSign, Tag, AlertCircle } from 'lucide-react';
import EventChat from './EventChat';
import useAdminApi from '../../hooks/useAdminApi';

const EventDetailsModal = ({ event, isOpen, onClose, initialTab = 'details' }) => {
  const { apiCall, loading } = useAdminApi();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [eventDetails, setEventDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      console.log('🚀 Modal opened with event:', event);
      fetchEventDetails();
      // Set the initial tab when event changes
      setActiveTab(initialTab || 'details');

      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable background scrolling when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, event, initialTab]);

  const fetchEventDetails = async () => {
    if (!event?.event_id) return;

    setLoadingDetails(true);
    try {
      console.log('🔍 Fetching event details for ID:', event.event_id);
      const response = await apiCall(`/api/admin/events/${event.event_id}`);
      console.log('📊 Event details response:', response);

      // The backend returns the event data in response.data directly
      const eventData = response.data || response;
      console.log('📋 Processed event data:', eventData);

      setEventDetails(eventData);
    } catch (error) {
      console.error('❌ Failed to fetch event details:', error);
      // Use the event data we already have as fallback
      console.log('🔄 Using fallback event data:', event);
      setEventDetails(event);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {event?.title || 'Event Details'}
            </h2>
            <p className="text-sm text-slate-600">
              Event ID: {event?.event_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {['details', 'chat'].map((tab) => (
            <button
              key={tab}
              data-tab={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(85vh-140px)]">
          {loadingDetails ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* No Data Fallback */}
              {!eventDetails && !event && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-600 font-medium">No event data available</p>
                    <p className="text-sm text-slate-500 mt-1">Unable to load event information.</p>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (eventDetails || event) && (
                <div className="p-6 space-y-6">
                  {/* Event Image */}
                  {(eventDetails?.image_url || event?.image_url) && (
                    <div className="h-64 bg-slate-100 rounded-lg overflow-hidden">
                      <img
                        src={eventDetails?.image_url || event?.image_url}
                        alt={eventDetails?.title || event?.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Event Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-3 text-slate-400" />
                            <span className="font-medium">Date:</span>
                            <span className="ml-2">{formatDate((eventDetails || event)?.event_date)}</span>
                          </div>
                          {(eventDetails || event)?.time && (
                            <div className="flex items-center text-sm">
                              <Clock className="w-4 h-4 mr-3 text-slate-400" />
                              <span className="font-medium">Time:</span>
                              <span className="ml-2">{formatTime((eventDetails || event)?.time)}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                            <span className="font-medium">Venue:</span>
                            <span className="ml-2">{(eventDetails || event)?.venue || 'TBD'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 mr-3 text-slate-400" />
                            <span className="font-medium">Capacity:</span>
                            <span className="ml-2">{(eventDetails || event)?.capacity || 'Unlimited'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Organizer</h4>
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 mr-2 text-slate-400" />
                          <span>{(eventDetails || event)?.club?.name || (eventDetails || event)?.organizer?.name || 'Unknown'}</span>
                        </div>
                        {(eventDetails || event)?.organizer?.email && (
                          <div className="text-sm text-slate-600 ml-6">
                            {(eventDetails || event)?.organizer?.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Status & Category</h4>
                        <div className="space-y-2">
                          <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor((eventDetails || event)?.approval_status)}`}>
                            {(eventDetails || event)?.approval_status || 'pending'}
                          </span>
                          {(eventDetails || event)?.category && (
                            <div className="flex items-center text-sm">
                              <Tag className="w-4 h-4 mr-2 text-slate-400" />
                              <span>{(eventDetails || event)?.category}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Budget Information</h4>
                        <div className="space-y-2 text-sm">
                          {(eventDetails || event)?.estimated_budget && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                              <span className="font-medium">Estimated:</span>
                              <span className="ml-2">${(eventDetails || event)?.estimated_budget}</span>
                            </div>
                          )}
                          {(eventDetails || event)?.actual_spent && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
                              <span className="font-medium">Actual:</span>
                              <span className="ml-2">${(eventDetails || event)?.actual_spent}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {((eventDetails || event)?.tags && (eventDetails || event)?.tags.length > 0) && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {(eventDetails || event)?.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {(eventDetails || event)?.description && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {(eventDetails || event)?.description}
                      </p>
                    </div>
                  )}

                  {/* Statistics */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Event Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {(eventDetails || event)?.stats?.registration_count || (eventDetails || event)?.registration_count || 0}
                        </div>
                        <div className="text-sm text-slate-600">Registrations</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(eventDetails || event)?.stats?.attendance_count || (eventDetails || event)?.attendance_count || 0}
                        </div>
                        <div className="text-sm text-slate-600">Attended</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-amber-600">
                          {(eventDetails || event)?.stats?.feedback_count || (eventDetails || event)?.feedback_count || 0}
                        </div>
                        <div className="text-sm text-slate-600">Reviews</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(eventDetails || event)?.stats?.message_count || (eventDetails || event)?.message_count || 0}
                        </div>
                        <div className="text-sm text-slate-600">Messages</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Chat Tab */}
              {activeTab === 'chat' && (eventDetails || event) && (
                <div className="h-[500px]">
                  <EventChat
                    eventId={(eventDetails || event)?.event_id}
                    userRole="admin"
                    currentUser={{ user_id: 1, role: 'admin' }}
                    showNotification={(message, type) => console.log('Chat notification:', message, type)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;