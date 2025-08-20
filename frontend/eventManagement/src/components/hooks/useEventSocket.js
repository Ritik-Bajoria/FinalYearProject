// hooks/useEventSocket.js
import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const useEventSocket = (eventId, chatType, userId) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    
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

            const response = await fetch(`${API_BASE_URL}/events/${eventId}/chats/${chatType}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract messages from the nested data structure
            // Your API returns: { data: { messages: [...] } }
            const messagesData = data.data?.messages || [];
            setMessages(messagesData);
            
        } catch (error) {
            console.error('Failed to load initial messages:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [eventId, chatType, API_BASE_URL]);

    const connectSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
            console.error('No token available for socket connection');
            return null;
        }

        const newSocket = io(API_BASE_URL, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
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
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('new_event_message', (message) => {
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
            setTypingUsers(data.users || []);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);
        return newSocket;
    }, [eventId, chatType, loadInitialMessages, API_BASE_URL]);

    const sendRealTimeMessage = useCallback(
        (messageData) => {
            if (socket && eventId && chatType) {
                return new Promise((resolve, reject) => {
                    try {
                        socket.timeout(5000).emit(
                            "send_event_message",
                            {
                                event_id: eventId,
                                chat_type: chatType,
                                ...messageData,
                            },
                            (err, response) => {
                                if (err) {
                                    reject(new Error("Message send timeout"));
                                } else if (response && response.error) {
                                    reject(new Error(response.error));
                                } else {
                                    resolve(response || { success: true });
                                }
                            }
                        );
                    } catch (error) {
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
            socket.emit('typing_event', {
                event_id: eventId,
                chat_type: chatType,
                isTyping
            });
        }
    }, [socket, eventId, chatType]);

    useEffect(() => {
        // Reset when eventId or chatType changes
        setMessages([]);
        setIsLoading(true);
        setTypingUsers([]);
    }, [eventId, chatType]);

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

    return {
        socket,
        isConnected,
        messages,
        isLoading,
        typingUsers,
        sendRealTimeMessage,
        sendTypingStatus
    };
};

export default useEventSocket;