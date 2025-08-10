import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Loader from '../student/UI/loader';
import ErrorMessage from '../student/UI/ErrorMessage';
import { useEffect, useState } from 'react';

const NotificationsPanel = ({ 
  isOpen, 
  notifications, 
  loading, 
  error, 
  onClose, 
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh 
}) => {
  const [localNotifications, setLocalNotifications] = useState(notifications);
  
  // Keep local state in sync with props
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await onMarkAsRead(notificationId);
      // Optimistic UI update
      setLocalNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await onMarkAllAsRead();
      // Optimistic UI update
      setLocalNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Background overlay */}
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>
        
        {/* Panel container */}
        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          {/* Panel */}
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Notifications
                </h2>
                <div className="flex items-center space-x-3">
                  {localNotifications.some(n => !n.read) && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader />
                  </div>
                ) : error ? (
                  <div className="p-4">
                    <ErrorMessage 
                      message={error} 
                      onRetry={onRefresh}
                    />
                  </div>
                ) : localNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No notifications
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any notifications yet.
                    </p>
                    <div className="mt-6">
                      <button
                        onClick={onRefresh}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {localNotifications.map((notification) => (
                      <li 
                        key={notification.id} 
                        className={`px-4 py-4 ${!notification.read ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="ml-4 flex-shrink-0 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                <button
                  onClick={onRefresh}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh notifications
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;