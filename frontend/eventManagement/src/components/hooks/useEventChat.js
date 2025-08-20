// hooks/useEventChat.js
import { useState, useCallback, useRef, useEffect } from 'react';
import useEventApi from './useEventApi';
import useEventSocket from './useEventSocket';

const useEventChat = (eventId, chatType, currentUser) => {
  const [initialMessages, setInitialMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const typingTimeoutRef = useRef(null);
  const perPage = 50;

  // HTTP API functions
  const { getEventChats, sendEventMessage, loading, error } = useEventApi();
  
  // Socket for real-time functionality
  const {
    isConnected,
    messages: realTimeMessages,
    typingUsers,
    sendRealTimeMessage,
    sendTypingStatus,
  } = useEventSocket(eventId, chatType, currentUser?.user_id);

  // Combine initial messages with real-time messages
  // Make sure we're not duplicating messages
  const allMessages = [...initialMessages];
  
  // Add real-time messages that aren't already in initial messages
  realTimeMessages.forEach(rtMessage => {
    if (!allMessages.some(msg => msg.id === rtMessage.id)) {
      allMessages.push(rtMessage);
    }
  });

  // Sort messages by timestamp
  const sortedMessages = allMessages.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  // Load initial messages
  const loadMessages = useCallback(async (reset = false) => {
    if (!eventId || !chatType) return;
    
    try {
      const currentPage = reset ? 1 : page;
      const response = await getEventChats(eventId, chatType, currentPage, perPage);
      
      // Extract messages from the nested response structure
      const messagesData = response.data?.messages || response.messages || response;
      
      if (reset) {
        setInitialMessages(messagesData);
        setPage(1);
      } else {
        setInitialMessages(prev => [...prev, ...messagesData]);
        setPage(prev => prev + 1);
      }
      
      // Check if there are more messages to load
      setHasMoreMessages(messagesData.length === perPage);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [eventId, chatType, getEventChats, page, perPage]);

  // Load initial messages when component mounts or chatType changes
  useEffect(() => {
    if (eventId && chatType) {
      loadMessages(true);
    }
  }, [eventId, chatType, loadMessages]);

  // Send message (tries socket first, falls back to HTTP)
  const sendMessage = useCallback(async (message, replyToId = null) => {
    if (!message.trim() || !eventId || !chatType) return false;

    setIsSending(true);
    try {
      // Try socket first for real-time
      if (isConnected) {
        await sendRealTimeMessage({
          message: message.trim(),
          reply_to: replyToId
        });
      } else {
        // Fallback to HTTP
        await sendEventMessage(eventId, chatType, message.trim(), replyToId);
        // Reload messages to get the latest
        await loadMessages(true);
      }
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [isConnected, sendRealTimeMessage, sendEventMessage, eventId, chatType, loadMessages]);

  // Handle typing indicators
  const handleTyping = useCallback((isTyping) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    sendTypingStatus(isTyping);
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 3000);
    }
  }, [sendTypingStatus]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback((value) => {
    setNewMessage(value);
    if (value.trim()) {
      handleTyping(true);
    } else {
      handleTyping(false);
    }
  }, [handleTyping]);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage, replyTo?.id);
    if (success) {
      setNewMessage('');
      setReplyTo(null);
      handleTyping(false);
    }
    return success;
  }, [newMessage, replyTo, sendMessage, handleTyping]);

  // Load more messages (for infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (hasMoreMessages && !loading) {
      await loadMessages(false);
    }
  }, [hasMoreMessages, loading, loadMessages]);

  // Reset chat when eventId or chatType changes
  const resetChat = useCallback(() => {
    setInitialMessages([]);
    setPage(1);
    setHasMoreMessages(true);
    setReplyTo(null);
    setNewMessage('');
  }, []);

  return {
    // Messages data
    messages: sortedMessages,
    hasMoreMessages,
    
    // Message functions
    handleSendMessage,
    loadMoreMessages,
    resetChat,
    
    // Input state
    newMessage,
    setNewMessage: handleInputChange,
    replyTo,
    setReplyTo,
    
    // Real-time features
    isConnected,
    typingUsers,
    handleTyping,
    
    // Status
    loading,
    error,
    isSending,
  };
};

export default useEventChat;