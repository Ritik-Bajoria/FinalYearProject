import React, { useState, useCallback, useEffect, useRef } from 'react';
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
    CircularProgress,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Send as SendIcon,
    Chat as ChatIcon,
    AdminPanelSettings as AdminIcon,
    VolunteerActivism as VolunteerIcon,
    People as PeopleIcon,
    MoreVert as MoreIcon,
    Reply as ReplyIcon,
    CopyAll as CopyIcon,
    PushPin as PinIcon
} from '@mui/icons-material';
import useEventSocket from '../hooks/useEventSocket';

const EventChat = ({ eventId, userRole, eventStatus, showNotification, currentUser }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const messagesEndRef = useRef(null);
    
    // Determine available chat types based on user role
    const getAvailableChats = () => {
        const chats = [];
        
        if (userRole === 'organizer') {
            chats.push(
                { type: 'organizer_admin', label: 'Admin Chat', icon: <AdminIcon /> },
                { type: 'organizer_volunteer', label: 'Volunteer Chat', icon: <VolunteerIcon /> }
            );
        } else if (userRole === 'volunteer') {
            chats.push(
                { type: 'organizer_volunteer', label: 'Chat with Organizers', icon: <VolunteerIcon /> }
            );
        } else if (userRole === 'attendee') {
            chats.push(
                { type: 'attendee_only', label: 'Attendees Chat', icon: <PeopleIcon /> }
            );
        }
        return chats;
    };

    const availableChats = getAvailableChats();
    
    // Set default active chat based on available chats
    useEffect(() => {
        if (availableChats.length > 0 && !activeChat) {
            setActiveChat(availableChats[0].type);
        }
    }, [availableChats, activeChat]);

    // Use the custom hook
    const {
        socket,
        isConnected,
        messages,
        isLoading,
        typingUsers,
        connectionError,
        sendRealTimeMessage,
        sendTypingStatus,
        loadInitialMessages
    } = useEventSocket(eventId, activeChat, currentUser?.user_id);
    console.log("messages recieved",messages)
    // Show connection errors as notifications
    useEffect(() => {
        if (connectionError) {
            showNotification(connectionError, 'error');
        }
    }, [connectionError, showNotification]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;

        try {
            const messageData = {
                message: newMessage.trim(),
                reply_to_id: replyTo?.id
            };

            await sendRealTimeMessage(messageData);
            setNewMessage('');
            setReplyTo(null);
            
            // Stop typing indicator
            sendTypingStatus(false);
        } catch (err) {
            console.error('Failed to send message:', err);
            showNotification(err.message || 'Failed to send message', 'error');
        }
    };

    const handleTyping = useCallback((isTyping) => {
        sendTypingStatus(isTyping);
    }, [sendTypingStatus]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        // Start typing indicator with debounce
        handleTyping(true);
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

    const handleMessageAction = (message, action) => {
        switch (action) {
            case 'reply':
                setReplyTo(message);
                break;
            case 'copy':
                navigator.clipboard.writeText(message.message);
                showNotification('Message copied to clipboard', 'success');
                break;
            case 'pin':
                showNotification('Message pinned', 'info');
                break;
            default:
                break;
        }
        setAnchorEl(null);
    };

    if (availableChats.length === 0) {
        return (
            <Alert severity="info">
                No chat access available for your role in this event.
            </Alert>
        );
    }

    const isOthersTyping = typingUsers.length > 0;

    // Don't render tabs until activeChat is set
    if (!activeChat) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
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

            {/* Connection Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isConnected ? 'success.main' : 'error.main',
                        mr: 1
                    }}
                />
                <Typography variant="caption" color="text.secondary">
                    {isConnected ? 'Connected' : 'Disconnected'} • {messages.length} messages
                </Typography>
            </Box>

            {/* Event Status Alert */}
            {eventStatus === 'completed' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    This event has ended. Chat is now view-only.
                </Alert>
            )}

            {/* Reply Banner */}
            {replyTo && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 2 }}
                    action={
                        <IconButton
                            size="small"
                            onClick={() => setReplyTo(null)}
                        >
                            <ReplyIcon fontSize="small" />
                        </IconButton>
                    }
                >
                    <Typography variant="body2">
                        Replying to {replyTo.sender_name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                        {replyTo.message.length > 50 
                            ? `${replyTo.message.substring(0, 50)}...` 
                            : replyTo.message
                        }
                    </Typography>
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
                        backgroundColor: '#f8f9fa',
                        position: 'relative'
                    }}
                >
                    {isLoading ? (
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
                                    key={message.id || `${message.sender_id}-${message.timestamp}`}
                                    sx={{
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        mb: 2,
                                        p: 0,
                                        position: 'relative'
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
                                        {message.sender_id === currentUser?.user_id && (
                                            <Chip
                                                label="You"
                                                size="small"
                                                sx={{ ml: 1, height: 20 }}
                                            />
                                        )}
                                        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                                            {formatTimestamp(message.timestamp || message.created_at)}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setAnchorEl(e.currentTarget);
                                                setSelectedMessage(message);
                                            }}
                                            sx={{ ml: 1 }}
                                        >
                                            <MoreIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    
                                    <Paper
                                        sx={{
                                            p: 2,
                                            ml: 5,
                                            backgroundColor: 'white',
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            maxWidth: 'calc(100% - 40px)',
                                            position: 'relative'
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

                    {/* Typing Indicator */}
                    {isOthersTyping && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 16,
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                px: 2,
                                py: 1,
                                borderRadius: 2,
                                boxShadow: 1
                            }}
                        >
                            <Box sx={{ display: 'flex', mr: 1 }}>
                                {[0, 1, 2].map((i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 4,
                                            height: 4,
                                            borderRadius: '50%',
                                            backgroundColor: 'text.secondary',
                                            mx: 0.5,
                                            animation: 'pulse 1.5s infinite',
                                            animationDelay: `${i * 0.2}s`,
                                            '@keyframes pulse': {
                                                '0%, 100%': { opacity: 0.4 },
                                                '50%': { opacity: 1 }
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
                            </Typography>
                        </Box>
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
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                placeholder={replyTo ? `Reply to ${replyTo.sender_name}...` : "Type your message..."}
                                disabled={!isConnected}
                                variant="outlined"
                                size="small"
                            />
                            <Button
                                variant="contained"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || !isConnected}
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

            {/* Message Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => handleMessageAction(selectedMessage, 'reply')}>
                    <ReplyIcon sx={{ mr: 1 }} fontSize="small" /> Reply
                </MenuItem>
                <MenuItem onClick={() => handleMessageAction(selectedMessage, 'copy')}>
                    <CopyIcon sx={{ mr: 1 }} fontSize="small" /> Copy
                </MenuItem>
                <MenuItem onClick={() => handleMessageAction(selectedMessage, 'pin')}>
                    <PinIcon sx={{ mr: 1 }} fontSize="small" /> Pin
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default EventChat;