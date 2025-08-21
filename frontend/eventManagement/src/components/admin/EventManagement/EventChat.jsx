import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, AlertCircle } from 'lucide-react';
import useAdminSocket from '../../hooks/useAdminSocket';
import useAuthUser from '../../hooks/useAuthUser';

const EventChat = ({ eventId }) => {
  const { user } = useAuthUser();
  const { socket, isConnected, connectionError } = useAdminSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatType = 'organizer_admin';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !eventId) return;

    console.log('🎉 Setting up event chat for event:', eventId);

    // Join the event chat room
    socket.emit('join_event_chat', {
      event_id: eventId,
      chat_type: chatType
    });

    // Listen for chat messages
    socket.on('new_event_message', (message) => {
      console.log('📨 Received new message:', message);
      setMessages(prev => {
        const messageExists = prev.some(msg => 
          msg.id === message.id || 
          (msg.timestamp === message.timestamp && msg.sender_id === message.sender_id)
        );
        return messageExists ? prev : [...prev, message];
      });
    });

    // Listen for typing indicators
    socket.on('user_typing_event', (data) => {
      console.log('⌨️ Typing event:', data);
      setIsTyping(data.is_typing || (data.users && data.users.length > 0));
    });

    // Listen for joined chat confirmation
    socket.on('joined_chat', (data) => {
      console.log('✅ Joined chat:', data);
    });

    // Listen for errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setError(error.message || 'Socket error occurred');
    });

    // Fetch previous messages
    fetchPreviousMessages();

    return () => {
      console.log('🧹 Cleaning up event chat listeners');
      socket.off('new_event_message');
      socket.off('user_typing_event');
      socket.off('joined_chat');
      socket.off('error');
    };
  }, [socket, eventId]);

  const fetchPreviousMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000';
      console.log('📥 Fetching messages from:', `${API_BASE_URL}/admin/events/${eventId}/chat?chat_type=${chatType}`);
      
      const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/chat?chat_type=${chatType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📥 Fetched messages:', data);
        if (data.success) {
          setMessages(data.messages || []);
        } else {
          setError(data.error || 'Failed to load chat messages');
        }
      } else {
        console.error('❌ Failed to fetch messages:', response.status);
        setError('Failed to load chat messages');
      }
    } catch (error) {
      console.error('❌ Failed to fetch previous messages:', error);
      setError('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !isConnected) {
      console.log('❌ Cannot send message:', { 
        messageEmpty: !newMessage.trim(), 
        socketExists: !!socket, 
        isConnected 
      });
      return;
    }

    const messageData = {
      event_id: eventId,
      chat_type: chatType,
      message: newMessage.trim()
    };

    console.log('📤 Sending message:', messageData);

    socket.emit('send_event_message', messageData, (response) => {
      if (response && response.error) {
        console.error('❌ Failed to send message:', response.error);
        setError('Failed to send message');
      } else {
        console.log('✅ Message sent successfully');
        setError(null);
      }
    });

    setNewMessage('');
  };

  const handleTyping = (isTyping) => {
    if (!socket || !isConnected) return;

    socket.emit('typing_event', {
      event_id: eventId,
      chat_type: chatType,
      is_typing: isTyping
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (message) => {
    return message.sender_id === user?.user_id;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center p-3 border-b border-slate-200 bg-slate-50">
        <MessageCircle className="w-5 h-5 text-indigo-600 mr-2" />
        <h3 className="font-semibold text-slate-900">Event Organizer Chat</h3>
        <div className="ml-auto flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-slate-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="p-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <p className="text-sm text-red-600">{connectionError}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-2 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No messages yet. Start a conversation with the event organizer!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
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
                    {message.sender_name || 'Unknown'}
                  </span>
                  <span className="text-xs opacity-75">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-slate-600 ml-2">Typing...</span>
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
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping(e.target.value.length > 0);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventChat;
