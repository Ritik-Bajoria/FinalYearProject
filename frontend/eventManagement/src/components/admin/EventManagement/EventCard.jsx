import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Eye, CheckCircle, XCircle, MessageCircle, AlertCircle } from 'lucide-react';

const EventCard = ({ event, onViewDetails, onApprove, onReject, userRole = 'admin' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection for admin users
  useEffect(() => {
    if (userRole === 'admin' && typeof window !== 'undefined' && window.io) {
      const socketInstance = window.io();
      
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        
        // Use admin authentication instead of regular authentication
        const token = localStorage.getItem('token'); // Adjust based on your token storage
        if (token) {
          socketInstance.emit('admin_authenticate', { token });
        }
      });

      socketInstance.on('admin_authenticated', (data) => {
        console.log('Admin authenticated:', data);
      });

      socketInstance.on('auth_error', (error) => {
        console.error('Admin authentication error:', error);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [userRole]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const handleApprove = () => {
    onApprove(event.event_id);
    setShowConfirmation(null);
  };

  const handleReject = () => {
    onReject(event.event_id);
    setShowConfirmation(null);
  };

  const handleViewChat = () => {
    if (socket && socket.connected) {
      // Join event chat room
      socket.emit('join_event_chat', {
        event_id: event.event_id,
        chat_type: 'organizer_admin'
      });

      socket.on('joined_chat', (data) => {
        console.log('Joined chat:', data);
        // Navigate to chat view or open chat modal
        onViewDetails({ ...event, initialTab: 'chat' }, 'chat');
      });

      socket.on('error', (error) => {
        console.error('Chat join error:', error);
        // Fallback to regular view details
        onViewDetails({ ...event, initialTab: 'chat' }, 'chat');
      });
    } else {
      // Fallback if socket not connected
      onViewDetails({ ...event, initialTab: 'chat' }, 'chat');
    }
  };

  return (
    <div style={{minWidth:'350px'}}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-lg border-slate-300 transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Event Image */}
      {event.image_url && (
        <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden relative">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm ${getStatusColor(event.approval_status)}`}>
              {event.approval_status}
            </span>
          </div>
        </div>
      )}

      {/* Event Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2 leading-tight">
              {event.title}
            </h3>
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>
          {!event.image_url && (
            <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(event.approval_status)}`}>
              {event.approval_status}
            </span>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-sm text-slate-700">
            <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
            <span className="truncate font-medium">{event.venue || 'Venue TBD'}</span>
          </div>
          
          <div className="flex items-center text-sm text-slate-700">
            <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
            <span className="font-medium">{formatDate(event.event_date)}</span>
            {event.time && (
              <>
                <Clock className="w-4 h-4 ml-4 mr-2 flex-shrink-0 text-slate-400" />
                <span className="font-medium">{formatTime(event.time)}</span>
              </>
            )}
          </div>

          <div className="flex items-center text-sm text-slate-700">
            <Users className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
            <span className="font-medium">
              {event.stats?.registration_count || 0} / {event.capacity || '∞'} registered
            </span>
          </div>

          {/* Organizer Info */}
          <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-900">Organizer:</span> 
            <span className="ml-1">{event.club?.name || 'Unknown'}</span>
          </div>

          {/* Category and Tags */}
          <div className="flex flex-wrap gap-2">
            {event.category && (
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {event.category}
              </span>
            )}
            {event.tags?.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                {tag}
              </span>
            ))}
            {event.tags?.length > 2 && (
              <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                +{event.tags.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-5 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{event.stats?.attendance_count || 0}</div>
            <div className="text-xs text-slate-600 font-medium">Attended</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{event.stats?.feedback_count || 0}</div>
            <div className="text-xs text-slate-600 font-medium">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{event.stats?.message_count || 0}</div>
            <div className="text-xs text-slate-600 font-medium">Messages</div>
          </div>
        </div>

        {/* Connection Status Indicator */}
        {userRole === 'admin' && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-blue-700">
                Socket: {socket?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-1">
                  {showConfirmation === 'approve' ? 'Approve Event?' : 'Reject Event?'}
                </h4>
                <p className="text-sm text-amber-700 mb-3">
                  {showConfirmation === 'approve' 
                    ? 'This event will be published and visible to all users.'
                    : 'This event will be rejected and the organizer will be notified.'
                  }
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={showConfirmation === 'approve' ? handleApprove : handleReject}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      showConfirmation === 'approve'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirmation(null)}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* View Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewDetails(event)}
              className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            <button
              onClick={handleViewChat}
              className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </button>
          </div>

          {/* Approval Actions */}
          {event.approval_status === 'pending' && !showConfirmation && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowConfirmation('approve')}
                className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:bg-emerald-800 transform hover:scale-105 transition-all duration-200 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Event
              </button>
              <button
                onClick={() => setShowConfirmation('reject')}
                className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800 transform hover:scale-105 transition-all duration-200 shadow-sm"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Event
              </button>
            </div>
          )}

          {/* Status Messages for Approved/Rejected Events */}
          {event.approval_status === 'approved' && (
            <div className="flex items-center justify-center px-4 py-3 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Event Approved
            </div>
          )}

          {event.approval_status === 'rejected' && (
            <div className="flex items-center justify-center px-4 py-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-4 h-4 mr-2" />
              Event Rejected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;