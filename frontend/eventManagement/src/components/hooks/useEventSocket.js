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
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000';

    const loadInitialMessages = useCallback(async () => {
        if (!eventId || !chatType) return;
        
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                setIsLoading(false);
                return;
            }

            // Use admin endpoint for admin users, regular endpoint for others
            const isAdmin = localStorage.getItem('userRole') === 'admin';
            const endpoint = isAdmin 
                ? `${API_BASE_URL}/admin/events/${eventId}/chat?chat_type=${chatType}`
                : `${API_BASE_URL}/events/${eventId}/chats/${chatType}`;
                
            console.log('📥 Loading messages from:', endpoint);
            
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract messages from the response
            // Admin endpoint returns: { success: true, messages: [...] }
            // Regular endpoint returns: { data: { messages: [...] } }
            const messagesData = data.success ? (data.messages || []) : (data.data?.messages || []);
            setMessages(messagesData);
            
        } catch (error) {
            console.error('❌ Failed to load initial messages:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [eventId, chatType, API_BASE_URL]);

    const connectSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No token available for socket connection');
            setConnectionError('No authentication token found');
            return null;
        }

        console.log('🔌 Connecting to socket server:', API_BASE_URL);

        const newSocket = io(API_BASE_URL, {
            path: '/socket.io',
            transports: ['polling', 'websocket'],
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            forceNew: true,
            autoConnect: true,
            upgrade: true
        });

        newSocket.on('connect', () => {
            console.log('✅ Event socket connected');
            setIsConnected(true);
            setConnectionError(null);
            newSocket.emit('authenticate', { token });
            
            if (eventId && chatType) {
                newSocket.emit('join_event_chat', { 
                    event_id: eventId,
                    chat_type: chatType 
                });
                // Load initial messages after connecting
                loadInitialMessages();
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Event socket disconnected:', reason);
            setIsConnected(false);
            setConnectionError(`Disconnected: ${reason}`);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Event socket connection error:', error);
            setIsConnected(false);
            setConnectionError(`Connection error: ${error.message}`);
        });

        newSocket.on('authenticated', (data) => {
            console.log('✅ Event socket authenticated:', data);
        });

        newSocket.on('auth_error', (error) => {
            console.error('❌ Event socket authentication error:', error);
            setConnectionError(`Authentication error: ${error.message}`);
        });

        newSocket.on('new_event_message', (message) => {
            console.log('📨 Received new event message:', message);
            setMessages(prev => {
                const messageExists = prev.some(msg => 
                    msg.id === message.id || 
                    (msg.timestamp === message.timestamp && msg.sender_id === message.sender_id)
                );
                return messageExists ? prev : [...prev, message];
            });
        });

        newSocket.on('chat_history', (data) => {
            // If server sends chat history via socket
            const messagesData = data.messages || [];
            setMessages(messagesData);
        });

        newSocket.on('user_typing_event', (data) => {
            console.log('⌨️ Typing event received:', data);
            setTypingUsers(data.users || []);
        });

        newSocket.on('error', (error) => {
            console.error('❌ Event socket error:', error);
            setConnectionError(`Socket error: ${error.message}`);
        });

        setSocket(newSocket);
        return newSocket;
    }, [eventId, chatType, loadInitialMessages, API_BASE_URL]);

    const sendRealTimeMessage = useCallback(
        (messageData) => {
            if (socket && eventId && chatType) {
                return new Promise((resolve, reject) => {
                    try {
                        console.log('📤 Sending real-time message:', messageData);
                        socket.timeout(7000).emit(
                            "send_event_message",
                            {
                                event_id: eventId,
                                chat_type: chatType,
                                ...messageData,
                            },
                            (err, response) => {
                                if (err) {
                                    console.error('❌ Message send timeout:', err);
                                    reject(new Error("Message send timeout"));
                                } else if (response && response.error) {
                                    console.error('❌ Message send error:', response.error);
                                    reject(new Error(response.error));
                                } else {
                                    console.log('✅ Message sent successfully:', response);
                                    resolve(response || { success: true });
                                }
                            }
                        );
                    } catch (error) {
                        console.error('❌ Message send exception:', error);
                        reject(error);
                    }
                });
            }
            return Promise.reject(new Error("Socket not connected"));
        },
        [socket, eventId, chatType]
    );

    const sendTypingStatus = useCallback((isTyping) => {
        if (socket && eventId && chatType) {
            console.log('⌨️ Sending typing status:', isTyping);
            socket.emit('typing_event', {
                event_id: eventId,
                chat_type: chatType,
                is_typing: isTyping
            });
        }
    }, [socket, eventId, chatType]);

    useEffect(() => {
        // Reset when eventId or chatType changes
        setMessages([]);
        setIsLoading(true);
        setTypingUsers([]);
        setConnectionError(null);
    }, [eventId, chatType]);

    useEffect(() => {
        if (eventId && chatType) {
            console.log('🎉 Setting up event socket for:', { eventId, chatType });
            const newSocket = connectSocket();
            
            return () => {
                if (newSocket) {
                    console.log('🧹 Disconnecting event socket');
                    newSocket.disconnect();
                }
            };
        }
    }, [connectSocket, eventId, chatType]);

    return {
        socket,
        isConnected,
        messages,
        isLoading,
        typingUsers,
        connectionError,
        sendRealTimeMessage,
        sendTypingStatus
    };
};

export default useEventSocket;