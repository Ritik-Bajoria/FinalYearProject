import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const useAdminSocket = () => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    const connectSocket = useCallback(() => {
        const token = localStorage.getItem('token');
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000';
        
        if (!token) {
            console.error('No authentication token found');
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
            console.log('✅ Admin socket connected');
            setIsConnected(true);
            setConnectionError(null);
            newSocket.emit('authenticate', { token });
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Admin socket disconnected:', reason);
            setIsConnected(false);
            setConnectionError(`Disconnected: ${reason}`);
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Admin socket connection error:', error);
            setIsConnected(false);
            setConnectionError(`Connection error: ${error.message}`);
        });

        newSocket.on('authenticated', (data) => {
            console.log('✅ Admin socket authenticated:', data);
        });

        newSocket.on('auth_error', (error) => {
            console.error('❌ Admin socket authentication error:', error);
            setConnectionError(`Authentication error: ${error.message}`);
        });

        newSocket.on('error', (error) => {
            console.error('❌ Admin socket error:', error);
            setConnectionError(`Socket error: ${error.message}`);
        });

        setSocket(newSocket);
        return newSocket;
    }, []);

    useEffect(() => {
        const newSocket = connectSocket();
        return () => {
            if (newSocket) {
                console.log('🔌 Disconnecting admin socket');
                newSocket.disconnect();
            }
        };
    }, [connectSocket]);

    return {
        socket,
        isConnected,
        connectionError
    };
};

export default useAdminSocket;

