import React, { useState, useEffect } from 'react';
import useEventSocket from '../hooks/useEventSocket';

const SocketTest = () => {
  const [eventId, setEventId] = useState('1');
  const [chatType, setChatType] = useState('organizer_admin');
  const [testMessage, setTestMessage] = useState('Test message from frontend');
  const [userId, setUserId] = useState('1');

  const {
    isConnected,
    messages,
    isLoading,
    typingUsers,
    sendRealTimeMessage,
    sendTypingStatus,
    connectionError
  } = useEventSocket(eventId, chatType, userId);

  const handleSendTest = async () => {
    try {
      await sendRealTimeMessage({ message: testMessage });
      console.log('✅ Test message sent');
    } catch (error) {
      console.error('❌ Test message failed:', error);
    }
  };

  const handleTypingTest = () => {
    sendTypingStatus(true);
    setTimeout(() => sendTypingStatus(false), 2000);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Socket Connection Test</h2>
      
      {/* Connection Status */}
      <div className="mb-4 p-3 border rounded">
        <h3 className="font-semibold mb-2">Connection Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {connectionError && (
          <div className="text-red-600 text-sm mt-1">{connectionError}</div>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-4 p-3 border rounded">
        <h3 className="font-semibold mb-2">Test Controls</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">Event ID:</label>
            <input
              type="text"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Chat Type:</label>
            <select
              value={chatType}
              onChange={(e) => setChatType(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="organizer_admin">Organizer Admin</option>
              <option value="organizer_volunteer">Organizer Volunteer</option>
              <option value="attendee_only">Attendee Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">User ID:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Test Message:</label>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSendTest}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Send Test Message
          </button>
          <button
            onClick={handleTypingTest}
            disabled={!isConnected}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Test Typing
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="mb-4 p-3 border rounded">
        <h3 className="font-semibold mb-2">Messages ({messages.length})</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="text-gray-500">No messages yet</div>
          ) : (
            messages.map((msg, index) => (
              <div key={msg.id || index} className="p-2 bg-gray-100 rounded">
                <div className="text-sm text-gray-600">
                  {msg.sender_name} - {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
                <div>{msg.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Typing Users */}
      {typingUsers.length > 0 && (
        <div className="mb-4 p-3 border rounded">
          <h3 className="font-semibold mb-2">Typing Users</h3>
          <div>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="mt-2">Loading messages...</div>
        </div>
      )}
    </div>
  );
};

export default SocketTest;