import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import useEventSocket from '../../hooks/useEventSocket';
import useAuthUser from '../../hooks/useAuthUser';

const EventChat = ({ eventId, userRole, currentUser, showNotification }) => {
  const { user, student, faculty, admin, userRole: authUserRole } = useAuthUser();
  
  // Use passed userRole or fallback to auth user role
  const effectiveUserRole = userRole || authUserRole;
  const [newMessage, setNewMessage] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const chatType = 'organizer_admin';

  // Get the correct user ID based on user type
  const getUserId = () => {
    // Use passed currentUser first
    if (currentUser?.user_id) return currentUser.user_id;
    if (currentUser?.id) return currentUser.id;
    
    // Fallback to auth user data
    if (user?.user_id) return user.user_id;
    if (user?.id) return user.id;
    if (student?.user_id) return student.user_id;
    if (student?.id) return student.id;
    if (faculty?.user_id) return faculty.user_id;
    if (faculty?.id) return faculty.id;
    if (admin?.user_id) return admin.user_id;
    if (admin?.id) return admin.id;
    return null;
  };

  const userId = getUserId();
  


  // Ensure userRole is set for admin panel
  useEffect(() => {
    if (!localStorage.getItem('userRole') && userRole === 'admin') {
      localStorage.setItem('userRole', 'admin');
    }
  }, [userRole]);

  // Use the event socket hook
  const {
    isConnected,
    messages,
    isLoading: loading,
    typingUsers,
    sendRealTimeMessage,
    sendTypingStatus,
    connectionError,
    loadInitialMessages
  } = useEventSocket(eventId, chatType, userId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setError(connectionError);
  }, [connectionError]);

  const sendMessage = async () => {
    const messageText = newMessage.trim();
    
    if (!messageText) {
      return;
    }
    
    if (!isConnected) {
      setError('Not connected to chat server');
      return;
    }
    
    if (isSending) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Send just the message text - the socket hook will handle the payload structure
      await sendRealTimeMessage({
        message: messageText
      });
      
      setNewMessage('');
      handleTyping(false);
      
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (isTyping) => {
    if (!isConnected || !sendTypingStatus) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    try {
      // Just pass the boolean - the socket hook will handle the payload
      sendTypingStatus(isTyping);

      if (isTyping) {
        // Set timeout to stop typing after 3 seconds
        const timeout = setTimeout(() => {
          sendTypingStatus(false);
        }, 3000);
        setTypingTimeout(timeout);
      }
    } catch (err) {
      // Silently handle typing status errors
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Clear any existing error when user starts typing
    if (error) {
      setError(null);
    }
    
    if (value.trim()) {
      handleTyping(true);
    } else {
      handleTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '';
    }
  };

  const isOwnMessage = (message) => {
    return message.sender_id === userId;
  };

  const handleRetryConnection = () => {
    setError(null);
    if (loadInitialMessages) {
      loadInitialMessages();
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
        <p className="text-sm text-slate-600">Loading chat...</p>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500">No event selected</p>

        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          <p className="text-slate-500">Authentication required</p>

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b border-slate-200 bg-slate-50">
        <MessageCircle className="w-5 h-5 text-indigo-600 mr-2" />
        <h3 className="font-semibold text-slate-900">Event Organizer Chat</h3>
        <div className="ml-auto">
          <span className="text-sm text-slate-600">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-600">{connectionError}</p>
            </div>
            <button
              onClick={handleRetryConnection}
              className="text-xs text-red-600 hover:text-red-800 flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs text-slate-400 mt-1">Start a conversation with the event organizer!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const messageKey = message.id || `${message.sender_id}-${message.timestamp || message.created_at}-${index}`;
            return (
              <div
                key={messageKey}
                className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage(message)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium opacity-75">
                      {message.sender_name || message.user_name || 'Unknown'}
                    </span>
                    <span className="text-xs opacity-75">
                      {formatTime(message.timestamp || message.created_at)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{message.message}</p>
                </div>
              </div>
            );
          })
        )}
        
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-slate-600 ml-2">
                  {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50"
            disabled={!isConnected || isSending}
            maxLength={1000}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected || isSending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] flex items-center justify-center"
            title={!isConnected ? "Not connected" : isSending ? "Sending..." : "Send message"}
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-slate-500">
            Press Enter to send • {messages.length} messages
          </p>
          <p className="text-xs text-slate-400">
            {newMessage.length}/1000
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventChat;