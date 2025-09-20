// hooks/useEventSocket.js
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const useEventSocket = (eventId, chatType, userId) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [connectionError, setConnectionError] = useState(null);
    
    const API_BASE_URL = 'http://127.0.0.1:7000';

    const loadInitialMessages = useCallback(async () => {
        if (!eventId || !chatType) return;
        
        try {
            setIsLoading(true);
            setConnectionError(null);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setConnectionError('Authentication required');
                return;
            }

            const userRole = localStorage.getItem('userRole');
            console.log("🔍 User role for API call:", userRole)
            const endpoint = userRole === 'admin' 
                ? `${API_BASE_URL}/api/admin/events/${eventId}/chat?chat_type=${chatType}`
                : `${API_BASE_URL}/api/events/${eventId}/chats/${chatType}/messages`;
            
            // console.log('Making request to:', endpoint);
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error:', response.status, errorText);
                throw new Error(`Failed to load messages: ${response.status}`);
            }
            
            const mainResponse = await response.json();
            console.log('📨 Chat API response:', mainResponse);
            
            // Handle different response formats from admin vs regular endpoints
            let messagesData = [];
            
            if (userRole === 'admin') {
                // Admin endpoint returns messages directly in data field
                if (mainResponse.data && Array.isArray(mainResponse.data)) {
                    messagesData = mainResponse.data;
                }
            } else {
                // Regular user endpoint returns messages in data.messages
                if (mainResponse.data && mainResponse.data.messages && Array.isArray(mainResponse.data.messages)) {
                    messagesData = mainResponse.data.messages;
                } else if (mainResponse.messages && Array.isArray(mainResponse.messages)) {
                    messagesData = mainResponse.messages;
                }
            }
            
            // Fallback for any other format
            if (messagesData.length === 0) {
                if (Array.isArray(mainResponse)) {
                    messagesData = mainResponse;
                } else if (Array.isArray(mainResponse.data)) {
                    messagesData = mainResponse.data;
                }
            }
            
            console.log('📋 Extracted messages:', messagesData);
            
            if (Array.isArray(messagesData)) {
                // Sort messages by timestamp (ascending order for chat display)
                const sortedMessages = messagesData.sort((a, b) => {
                    const timeA = new Date(a.timestamp || a.created_at);
                    const timeB = new Date(b.timestamp || b.created_at);
                    return timeA - timeB;
                });
                
                // REPLACE the messages, don't append
                setMessages(sortedMessages);
                console.log('✅ Messages loaded successfully:', sortedMessages.length, 'messages');
            } else {
                console.error('❌ Messages data is not an array:', messagesData);
                setMessages([]);
            }
            
        } catch (error) {
            console.error('Failed to load initial messages:', error);
            setConnectionError(error.message);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [eventId, chatType, API_BASE_URL]);

    const connectSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        
        if (!token || !eventId || !chatType) {
            setConnectionError('Missing required parameters');
            return null;
        }

        const newSocket = io(API_BASE_URL, {
            path: '/socket.io',
            transports: ['polling'],
            upgrade: true,
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('✅ Event socket connected');
            setIsConnected(true);
            setConnectionError(null);
            
            // For admin users, use admin_authenticate
            const userRole = localStorage.getItem('userRole');
            console.log('🔐 Authenticating as:', userRole);
            if (userRole === 'admin') {
                newSocket.emit('admin_authenticate', { token });
            } else {
                newSocket.emit('authenticate', { token });
            }
        });

        newSocket.on('authenticated', (data) => {
            console.log('✅ Socket authenticated:', data);
            // Join event chat room after authentication
            newSocket.emit('join_event_chat', { 
                event_id: eventId,
                chat_type: chatType 
            });
        });

        newSocket.on('admin_authenticated', (data) => {
            console.log('✅ Admin socket authenticated:', data);
            // Join event chat room after authentication
            newSocket.emit('join_event_chat', { 
                event_id: eventId,
                chat_type: chatType 
            });
        });

        newSocket.on('auth_error', (error) => {
            console.error('❌ Authentication error:', error);
            setConnectionError('Not authenticated');
        });

        newSocket.on('joined_chat', (data) => {
            console.log('✅ Joined event chat:', data);
            // Load initial messages after joining the chat
            loadInitialMessages();
        });

        // Fallback: Load messages even if socket events don't work
        setTimeout(() => {
            if (messages.length === 0) {
                console.log('🔄 Loading messages as fallback...');
                loadInitialMessages();
            }
        }, 2000);

        newSocket.on('disconnect', () => {
            console.log('❌ Event socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('new_event_message', (message) => {
            console.log('📨 Received new event message:', message);
            if (!message || !message.message) return;
            
            setMessages(prev => {
                // Check for duplicates
                const messageExists = prev.some(msg => 
                    (msg.id && msg.id === message.id) ||
                    (msg.message === message.message && 
                     msg.sender_id === message.sender_id)
                );
                
                if (messageExists) return prev;
                
                return [...prev, {
                    ...message,
                    id: message.id || `${message.sender_id}-${Date.now()}`,
                    timestamp: message.timestamp || message.created_at || new Date().toISOString()
                }];
            });
        });

        newSocket.on('user_typing_event', (data) => {
            console.log('⌨️ Typing event received:', data);
            if (data.user_id !== userId) {
                setTypingUsers(prev => {
                    if (data.is_typing) {
                        return prev.includes(data.user_id) ? prev : [...prev, data.user_id];
                    } else {
                        return prev.filter(id => id !== data.user_id);
                    }
                });
            }
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setConnectionError(error.message || 'Socket connection error');
        });

        setSocket(newSocket);
        return newSocket;
    }, [eventId, chatType, userId, API_BASE_URL, loadInitialMessages]);

    const sendRealTimeMessage = useCallback((messageData) => {
        if (!socket || !isConnected || !eventId || !chatType) {
            return Promise.reject(new Error("Socket not connected"));
        }
        
        if (!messageData?.message?.trim()) {
            return Promise.reject(new Error("Message cannot be empty"));
        }

        return new Promise((resolve, reject) => {
            const payload = {
                event_id: eventId,
                chat_type: chatType,
                message: messageData.message.trim(),
                reply_to_id: messageData.reply_to_id
            };
            
            socket.emit("send_event_message", payload, (response) => {
                if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response || { success: true });
                }
            });
        });
    }, [socket, isConnected, eventId, chatType]);

    const sendTypingStatus = useCallback((isTyping) => {
        if (socket && isConnected && eventId && chatType) {
            socket.emit('typing_event', {
                event_id: eventId,
                chat_type: chatType,
                is_typing: isTyping
            });
        }
    }, [socket, isConnected, eventId, chatType]);

    useEffect(() => {
        if (eventId && chatType) {
            const newSocket = connectSocket();
            return () => {
                if (newSocket) {
                    newSocket.disconnect();
                }
            };
        }
    }, [connectSocket, eventId, chatType]);

    // Load messages when chat type changes
    useEffect(() => {
        if (eventId && chatType) {
            loadInitialMessages();
        }
    }, [eventId, chatType, loadInitialMessages]);

    // console.log('Current messages:', messages);
    
    return {
        socket,
        isConnected,
        messages,
        isLoading,
        typingUsers,
        connectionError,
        sendRealTimeMessage,
        sendTypingStatus,
        loadInitialMessages
    };
};

export default useEventSocket;