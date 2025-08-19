import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Chip,
    Tabs,
    Tab,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Send as SendIcon,
    Chat as ChatIcon,
    AdminPanelSettings as AdminIcon,
    VolunteerActivism as VolunteerIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import useEventApi from '../hooks/useEventApi';

const EventChat = ({ eventId, userRole, eventStatus, showNotification }) => {
    const [activeChat, setActiveChat] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    const { getEventChats, sendEventMessage } = useEventApi();

    // Determine available chat types based on user role
    const getAvailableChats = () => {
        const chats = [];
        
        if (userRole === 'organizer') {
            chats.push(
                { type: 'organizer_admin', label: 'Admin Chat', icon: <AdminIcon /> },
                { type: 'organizer_volunteer', label: 'Organizer & Volunteers', icon: <VolunteerIcon /> }
            );
        } else if (userRole === 'volunteer') {
            chats.push(
                { type: 'organizer_volunteer', label: 'Organizer & Volunteers', icon: <VolunteerIcon /> }
            );
        } else if (userRole === 'attendee') {
            chats.push(
                { type: 'attendee_only', label: 'Attendees Chat', icon: <PeopleIcon /> }
            );
        }
        
        return chats;
    };

    const availableChats = getAvailableChats();

    useEffect(() => {
        if (availableChats.length > 0 && !activeChat) {
            setActiveChat(availableChats[0].type);
        }
    }, [availableChats]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages();
        }
    }, [activeChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        if (!activeChat) return;
        
        setLoading(true);
        try {
            const chatMessages = await getEventChats(eventId, activeChat);
            setMessages(chatMessages);
        } catch (error) {
            showNotification('Failed to load messages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;

        // Check if event has ended
        if (eventStatus === 'completed') {
            showNotification('Chat is disabled for completed events', 'warning');
            return;
        }

        try {
            await sendEventMessage(eventId, activeChat, newMessage.trim());
            setNewMessage('');
            fetchMessages(); // Refresh messages
            showNotification('Message sent successfully', 'success');
        } catch (error) {
            showNotification('Failed to send message', 'error');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    };

    if (availableChats.length === 0) {
        return (
            <Alert severity="info">
                No chat access available for your role in this event.
            </Alert>
        );
    }

    return (
        <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Chat Type Tabs */}
            {availableChats.length > 1 && (
                <Tabs
                    value={activeChat}
                    onChange={(_, newValue) => setActiveChat(newValue)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                >
                    {availableChats.map((chat) => (
                        <Tab
                            key={chat.type}
                            value={chat.type}
                            label={chat.label}
                            icon={chat.icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            )}

            {/* Event Status Alert */}
            {eventStatus === 'completed' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This event has ended. Chat is now view-only.
                </Alert>
            )}

            {/* Messages Area */}
            <Paper
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: 1,
                    borderColor: 'divider'
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        backgroundColor: '#f8f9fa'
                    }}
                >
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : messages.length === 0 ? (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                            <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">
                                No messages yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Start the conversation!
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {messages.map((message) => (
                                <ListItem
                                    key={message.message_id}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        mb: 2,
                                        p: 0
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mb: 1,
                                            width: '100%'
                                        }}
                                    >
                                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                            {message.sender_name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {message.sender_name}
                                        </Typography>
                                        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                                            {formatTimestamp(message.timestamp)}
                                        </Typography>
                                    </Box>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            ml: 5,
                                            backgroundColor: 'white',
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            maxWidth: 'calc(100% - 40px)'
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {message.message}
                                        </Typography>
                                    </Paper>
                                </ListItem>
                            ))}
                            <div ref={messagesEndRef} />
                        </List>
                    )}
                </Box>

                {/* Message Input */}
                {eventStatus !== 'completed' && (
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'white' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={3}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                variant="outlined"
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                sx={{ minWidth: 'auto', px: 2 }}
                            >
                                <SendIcon />
                            </Button>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                            Press Enter to send, Shift+Enter for new line
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default EventChat;