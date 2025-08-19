import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const useSocket = (clubId, userId) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    const connectSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        const newSocket = io('http://127.0.0.1:7000', {
            path: '/socket.io',
            transports: ['websocket'],
            auth: { token },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            setIsConnected(true);
            newSocket.emit('authenticate', { token });
            if (clubId) {
                newSocket.emit('joinClubRoom', { club_id: clubId });
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        newSocket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        newSocket.on('userTyping', (data) => {
            setTypingUsers(data.users || []);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);
        return newSocket;
    }, [clubId]);

    const sendMessage = useCallback((messageText) => {
        if (socket && clubId) {
            socket.emit('sendMessage', {
                club_id: clubId,
                message_text: messageText
            });
        }
    }, [socket, clubId]);

    const sendTypingStatus = useCallback((isTyping) => {
        if (socket && clubId) {
            socket.emit('typing', {
                club_id: clubId,
                isTyping
            });
        }
    }, [socket, clubId]);

    useEffect(() => {
        const newSocket = connectSocket();
        return () => {
            newSocket.disconnect();
        };
    }, [connectSocket]);

    return {
        socket,
        isConnected,
        messages,
        typingUsers,
        sendMessage,
        sendTypingStatus
    };
};

export default useSocket;