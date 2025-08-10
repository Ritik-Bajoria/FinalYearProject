import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Avatar,
    TextField,
    Button,
    Chip,
    Divider,
    CircularProgress,
    Grid,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Event as EventIcon,
    Chat as ChatIcon,
    People as PeopleIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import useClubApi from '../../hooks/useClubApi';
import OrganizeEventDialog from './OrganizeEventDialog';

const MyClubTab = ({ user }) => {
    const [activeSubTab, setActiveSubTab] = useState('events');
    const [newMessage, setNewMessage] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [openDialog, setOpenDialog] = useState(false);
    const {
        club,
        events = [],  // Default to empty array if undefined
        members = [], // Default to empty array if undefined
        messages = [], // Default to empty array if undefined
        loading,
        error,
        refetch,
        sendMessage,
        leaveClub,
        createEvent
    } = useClubApi(user.user_id);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !club?.club_id) return;

        try {
            const sentMessage = await sendMessage(club.club_id, newMessage);
            setMessages(prev => [...prev, sentMessage]); // Use functional update
            setNewMessage('');
        } catch (error) {
            setNotification({
                open: true,
                message: error.message,
                severity: 'error'
            });
        }
    };

    const handleLeaveClub = async () => {
        try {
            await leaveClub(club.club_id);
            setNotification({
                open: true,
                message: 'You have left the club successfully',
                severity: 'success'
            });
            refetch();
        } catch (error) {
            setNotification({
                open: true,
                message: error.message,
                severity: 'error'
            });
        }
    };

    const handleCreateEvent = async (eventData) => {
        try {
            await createEvent(club.club_id, eventData);
            setNotification({
                open: true,
                message: 'Event organized successfully!',
                severity: 'success',
            });
            setOpenDialog(false);
            refetch(); // reload events to show the new one
        } catch (error) {
            setNotification({
                open: true,
                message: error.message || 'Failed to create event',
                severity: 'error',
            });
        }
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">Error loading club data: {error}</Typography>
                <Button variant="contained" onClick={refetch} sx={{ ml: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (!club) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">You are not currently a member of any club.</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Visit the Club Dashboard to join or create a club.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                    alt={club.name}
                    src={club.logo_url}
                    sx={{ width: 56, height: 56, mr: 2, bgcolor: '#FFC107' }}
                />
                <Typography variant="h4">{club.name}</Typography>
                <Chip
                    label={club.category}
                    color="primary"
                    sx={{ ml: 2 }}
                />
            </Box>

            <Tabs
                value={activeSubTab}
                onChange={(e, newValue) => setActiveSubTab(newValue)}
                sx={{ mb: 3 }}
            >
                <Tab label="Events" value="events" icon={<EventIcon />} />
                <Tab label="Chat" value="chat" icon={<ChatIcon />} />
                <Tab label="Members" value="members" icon={<PeopleIcon />} />
                <Tab label="Settings" value="settings" icon={<SettingsIcon />} />
            </Tabs>

            {activeSubTab === 'events' && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>Upcoming Club Events</Typography>

                    {/* Add Organize Event button here */}
                    <Button
                        variant="contained"
                        sx={{ mb: 2, backgroundColor: '#0D47A1', '&:hover': { backgroundColor: '#1A237E' } }}
                        onClick={() => setOpenDialog(true)}
                    >
                        Organize Event
                    </Button>

                    {events.length === 0 ? (
                        <Typography>No upcoming events scheduled.</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {events.map(event => (
                                <Grid item xs={12} sm={6} md={4} key={event.event_id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{event.title}</Typography>
                                            <Typography color="textSecondary" sx={{ mb: 1 }}>
                                                {new Date(event.event_date).toLocaleString()}
                                            </Typography>
                                            <Typography sx={{ mb: 1 }}>{event.venue}</Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{ color: '#0D47A1', borderColor: '#0D47A1' }}
                                            >
                                                View Details
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {activeSubTab === 'chat' && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>Club Chat</Typography>
                    <Card sx={{ mb: 2, height: '400px', overflowY: 'auto' }}>
                        <CardContent>
                            <List>
                                {messages.map(message => (
                                    <React.Fragment key={message.message_id}>
                                        <ListItem alignItems="flex-start">
                                            <Avatar
                                                alt={message.sender_name}
                                                src={message.sender_avatar}
                                                sx={{ mr: 2, bgcolor: '#FFC107' }}
                                            />
                                            <ListItemText
                                                primary={message.sender_name}
                                                secondary={
                                                    <>
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            color="text.primary"
                                                        >
                                                            {message.message_text}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            {new Date(message.sent_at).toLocaleString()}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button
                            variant="contained"
                            onClick={handleSendMessage}
                            sx={{ ml: 1, backgroundColor: '#0D47A1', '&:hover': { backgroundColor: '#1A237E' } }}
                        >
                            Send
                        </Button>
                    </Box>
                </Box>
            )}

            {activeSubTab === 'members' && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>Club Members</Typography>
                    <List>
                        {members.map(member => (
                            <ListItem key={member.user_id}>
                                <Avatar
                                    alt={member.full_name}
                                    src={member.profile_picture}
                                    sx={{ mr: 2, bgcolor: '#FFC107' }}
                                />
                                <ListItemText
                                    primary={member.full_name}
                                    secondary={member.role}
                                />
                                {member.role === 'officer' && (
                                    <Chip label="Officer" color="primary" size="small" />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {activeSubTab === 'settings' && (
                <Box>
                    <Typography variant="h5" sx={{ mb: 2 }}>Club Settings</Typography>
                    <Card>
                        <CardContent>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Description:</strong> {club.description}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                <strong>Established:</strong> {new Date(club.established_date).toLocaleDateString()}
                            </Typography>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleLeaveClub}
                                sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
                            >
                                Leave Club
                            </Button>
                        </CardContent>
                    </Card>
                </Box>
            )}
            <OrganizeEventDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onSubmit={handleCreateEvent}
            />
        </Box>
    );
};

export default MyClubTab;