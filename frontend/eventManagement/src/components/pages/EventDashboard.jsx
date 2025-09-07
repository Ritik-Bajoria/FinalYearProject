import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Grid, 
  Chip, Divider, Stack, Tabs, Tab, Paper, List, 
  ListItem, ListItemText, Avatar, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Snackbar, 
  Alert, Container, CircularProgress
} from '@mui/material';
import { 
  ArrowBack, LocationOn, CalendarToday, Schedule,
  People, Edit, Delete, Chat, AttachFile,
  CheckCircle, Close, Person, EventAvailable,
  Group, Category, AdminPanelSettings, Feedback,
  QrCode, VolunteerActivism, Receipt
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useEventApi from '../hooks/useEventApi';
import LoadingSpinner from '../admin/shared/LoadingSpinner';
import EventChat from '../event/EventChat';
// import EventDocuments from '../event/EventDocuments';
import EventAdminDashboard from './EventAdminDashboard';
import EventOrganizerDashboard from './EventOrganizerDashboard';
import EventAttendeeDashboard from './EventAttendeeDashboard';
import EventEditModal from '../event/EventEditModal';
import useAuthUser from '../hooks/useAuthUser';

// University Blue Theme Colors
const theme = {
  primary: '#1A237E',
  secondary: '#0D47A1', 
  background: '#ECEFF1',
  surface: '#FFFFFF',
  accent: '#FFC107',
  text: '#212121',
  mutedText: '#607D8B'
};

const EventDashboard = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [updating, setUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [canDelete, setCanDelete] = useState(false);
    const [notification, setNotification] = useState({ 
        open: false, 
        message: '', 
        severity: 'info' 
    });
    const { user, student } = useAuthUser();
    
    const {
        event,
        loading,
        error,
        getEventDetails,
        updateEvent,
        deleteEvent
    } = useEventApi();

    useEffect(() => {
        if (eventId) {
            getEventDetails(eventId).then(eventData => {
                const isLeaderOrAdmin = eventData.user_role === 'admin' || 
                                      (eventData.club_ref && eventData.club_ref.leader_id === eventData.user_id);
                setCanDelete(isLeaderOrAdmin);
            }).catch((err) => {
                setNotification({
                    open: true,
                    message: err.message || 'Failed to load event details',
                    severity: 'error'
                });
            });
        }
    }, [eventId, getEventDetails]);

    const handleEditSubmit = async (formData) => {
        setUpdating(true);
        try {
            await updateEvent(eventId, formData);
            setEditModalOpen(false);
            showNotification('Event updated successfully', 'success');
            await getEventDetails(eventId);
        } catch (err) {
            showNotification('Failed to update event', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (deleteConfirmationText.toLowerCase() !== 'delete') {
            showNotification('Please type "delete" to confirm', 'error');
            return;
        }
        try {
            await deleteEvent(eventId);
            navigate(-1);
            showNotification('Event deleted successfully', 'success');
        } catch (err) {
            showNotification('Failed to delete event', 'error');
        }
    };

    const showNotification = (message, severity = 'info') => {
        setNotification({ open: true, message, severity });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRoleSpecificContent = () => {
        switch(activeTab) {
            case 'admin-chat':
            case 'approval':
                return <EventAdminDashboard eventId={eventId} activeTab={activeTab} />;
            case 'registrations':
            case 'attendance':
            case 'budget':
            case 'volunteers':
                return <EventOrganizerDashboard eventId={eventId} activeTab={activeTab} />;
            case 'feedback':
            case 'qr':
                return <EventAttendeeDashboard eventId={eventId} activeTab={activeTab} />;
            default:
                return null;
        }
    };

    const getTabsForRole = () => {
        const commonTabs = [
            { value: 'details', label: 'Details' },
            { value: 'chat', label: 'Chat', icon: <Chat /> }
            // { value: 'documents', label: 'Documents', icon: <AttachFile /> }
        ];

        const roleTabs = {
            admin: [
                { value: 'admin-chat', label: 'Admin Chat', icon: <AdminPanelSettings /> },
                { value: 'approval', label: 'Approval', icon: <CheckCircle /> }
            ],
            organizer: [
                { value: 'registrations', label: 'Registrations', icon: <People /> },
                { value: 'attendance', label: 'Attendance', icon: <CheckCircle /> },
                { value: 'budget', label: 'Budget', icon: <Receipt /> },
                { value: 'volunteers', label: 'Volunteers', icon: <VolunteerActivism /> }
            ],
            attendee: [
                { value: 'feedback', label: 'Feedback', icon: <Feedback /> }
                // ,
                // ...(event?.qr_check_in_enabled ? 
                //     [{ value: 'qr', label: 'QR Code', icon: <QrCode /> }] : [])
            ]
        };

        return [
            ...commonTabs,
            ...(roleTabs[event?.user_role] || [])
        ];
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'upcoming': return theme.secondary;
            case 'ongoing': return theme.accent;
            case 'completed': return theme.mutedText;
            default: return theme.mutedText;
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography color="error" variant="h6" textAlign="center">
                {error}
            </Typography>
        </Container>
    );
    if (!event) return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h6" textAlign="center" color={theme.mutedText}>
                Event not found
            </Typography>
        </Container>
    );

    return (
        <Box sx={{ 
            minHeight: '100vh',
            backgroundColor: theme.background,
            pb: 4
        }}>
            {/* Header Section */}
            <Box sx={{ 
                backgroundColor: theme.surface,
                borderBottom: `1px solid ${theme.background}`,
                py: 1.5,
                mb: 2,
                boxShadow: '0 2px 8px rgba(26, 35, 126, 0.08)'
            }}>
                <Container maxWidth="lg">
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate(-1)}
                        sx={{ 
                            color: theme.primary,
                            fontSize: '0.875rem',
                            '&:hover': {
                                backgroundColor: 'rgba(26, 35, 126, 0.04)'
                            }
                        }}
                    >
                        Back to Club
                    </Button>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* Event Title and Status Bar */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2,
                    p: 2,
                    backgroundColor: theme.surface,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(26, 35, 126, 0.08)'
                }}>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            color: theme.text,
                            fontWeight: 600,
                        }}
                    >
                        {event.title}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip 
                            label={event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)} 
                            size="small"
                            sx={{
                                backgroundColor: getStatusColor(event.event_status),
                                color: theme.surface,
                                fontWeight: 500
                            }}
                        />
                        {event.is_certified && (
                            <Chip 
                                label="Certified" 
                                size="small"
                                sx={{
                                    backgroundColor: '#4CAF50',
                                    color: theme.surface
                                }}
                            />
                        )}
                        {event.qr_check_in_enabled && (
                            <Chip 
                                label="QR Check-in" 
                                size="small"
                                sx={{
                                    backgroundColor: theme.secondary,
                                    color: theme.surface
                                }}
                            />
                        )}
                    </Stack>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        {/* Tabs Section */}
                        <Paper sx={{ 
                            boxShadow: '0 4px 12px rgba(26, 35, 126, 0.08)',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <Tabs 
                                value={activeTab} 
                                onChange={(_, newValue) => setActiveTab(newValue)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    borderBottom: `1px solid ${theme.background}`,
                                    minHeight: '48px',
                                    '& .MuiTab-root': {
                                        color: theme.mutedText,
                                        fontWeight: 500,
                                        minHeight: 48,
                                        fontSize: '0.8rem',
                                        '&.Mui-selected': {
                                            color: theme.primary,
                                        }
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: theme.primary,
                                        height: 2
                                    }
                                }}
                            >
                                {getTabsForRole().map(tab => (
                                    <Tab
                                        key={tab.value}
                                        label={tab.label}
                                        value={tab.value}
                                        icon={tab.icon}
                                        iconPosition="start"
                                    />
                                ))}
                            </Tabs>

                            <Box sx={{ p: 2 }}>
                                {activeTab === 'details' && (
                                    <Box>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mb: 2
                                        }}>
                                            <Typography 
                                                variant="h6" 
                                                gutterBottom
                                                sx={{ color: theme.primary, fontWeight: 600 }}
                                            >
                                                Event Details
                                            </Typography>
                                            {(event.user_role === 'organizer' || event.user_role === 'admin') && (
                                                <Box>
                                                    <Button 
                                                        variant="outlined" 
                                                        size="small"
                                                        startIcon={<Edit />}
                                                        onClick={() => setEditModalOpen(true)}
                                                        sx={{ mr: 1 }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    {canDelete && (
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            startIcon={<Delete />}
                                                            onClick={() => setConfirmDelete(true)}
                                                            color="error"
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>

                                        <Box>
                                            <Typography 
                                                paragraph 
                                                sx={{ 
                                                    color: theme.text,
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.6,
                                                    mb: 3
                                                }}
                                            >
                                                {event.description}
                                            </Typography>
                                            
                                            <Divider sx={{ 
                                                my: 2, 
                                                borderColor: theme.background,
                                                borderWidth: 1
                                            }} />
                                            
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ 
                                                        p: 2, 
                                                        height:'100%',
                                                        backgroundColor: theme.background,
                                                        borderRadius: 2
                                                    }}>
                                                        <Typography 
                                                            variant="subtitle1" 
                                                            sx={{ 
                                                                color: theme.primary,
                                                                fontWeight: 600,
                                                                mb: 1
                                                            }}
                                                        >
                                                            Event Details
                                                        </Typography>
                                                        <Stack spacing={1.5}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <CalendarToday sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    {formatDate(event.event_date)}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Schedule sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    {formatTime(event.event_date)}
                                                                    {event.duration_minutes && ` (${event.duration_minutes} mins)`}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <LocationOn sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    {event.venue || 'Venue not specified'}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <People sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    {event.target_audience || 'All audiences'} • Capacity: {event.capacity || 'Unlimited'}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Category sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    {event.category || 'No category'}
                                                                </Typography>
                                                            </Box>
                                                            {/* {event.estimated_budget && ( */}
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Receipt sx={{ 
                                                                        color: theme.secondary, 
                                                                        mr: 1,
                                                                        fontSize: '1rem'
                                                                    }} />
                                                                    <Typography variant="body2" sx={{ color: theme.text }}>
                                                                        Budget: {event.estimated_budget ? `$${event.estimated_budget}` : 'Not Defined'}
                                                                    </Typography>
                                                                </Box>
                                                            {/* )} */}
                                                        </Stack>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ 
                                                        p: 2, 
                                                        height:'100%',
                                                        backgroundColor: theme.background,
                                                        borderRadius: 2
                                                    }}>
                                                        <Typography 
                                                            variant="subtitle1" 
                                                            sx={{ 
                                                                color: theme.primary,
                                                                fontWeight: 600,
                                                                mb: 1
                                                            }}
                                                        >
                                                            Registration
                                                        </Typography>
                                                        <Stack spacing={1.5}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <EventAvailable sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    {event.registration_count || 0} registered
                                                                </Typography>
                                                            </Box>
                                                            {event.registration_end_date && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Close sx={{ 
                                                                        color: theme.secondary, 
                                                                        mr: 1,
                                                                        fontSize: '1rem'
                                                                    }} />
                                                                    <Typography variant="body2" sx={{ color: theme.text }}>
                                                                        Registration closes: {formatDate(event.registration_end_date)}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <Group sx={{ 
                                                                    color: theme.secondary, 
                                                                    mr: 1,
                                                                    fontSize: '1rem'
                                                                }} />
                                                                <Typography variant="body2" sx={{ color: theme.text }}>
                                                                    Organized by: {event.club_name || 'Unknown'}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                </Grid>
                                                
                                                {/* Organizers and Tags in Details Tab */}
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ 
                                                        p: 2,
                                                        height:'100%', 
                                                        backgroundColor: theme.background,
                                                        borderRadius: 2
                                                    }}>
                                                        <Typography 
                                                            variant="subtitle1" 
                                                            sx={{ 
                                                                color: theme.primary,
                                                                fontWeight: 600,
                                                                mb: 1
                                                            }}
                                                        >
                                                            Event Organizers
                                                        </Typography>
                                                        <List sx={{ p: 0 }}>
                                                            {event.user_associations?.filter(u => u.role === 'organizer').slice(0, 3).map(user => (
                                                                <ListItem key={user.user_id} sx={{ px: 0, py: 0.5 }}>
                                                                    <Avatar 
                                                                        sx={{ 
                                                                            mr: 1,
                                                                            width: 28,
                                                                            height: 28,
                                                                            backgroundColor: theme.secondary,
                                                                            color: theme.surface,
                                                                            fontSize: '0.8rem'
                                                                        }}
                                                                    >
                                                                        {user.user.full_name?.charAt(0) || 'U'}
                                                                    </Avatar>
                                                                    <ListItemText 
                                                                        primary={
                                                                            <Typography variant="body2" sx={{ color: theme.text, fontWeight: 500 }}>
                                                                                {user.user.full_name}
                                                                            </Typography>
                                                                        }
                                                                        secondary={
                                                                            <Typography variant="caption" sx={{ color: theme.mutedText, textTransform: 'capitalize' }}>
                                                                                {user.role}
                                                                            </Typography>
                                                                        }
                                                                    />
                                                                </ListItem>
                                                            ))}
                                                            {event.user_associations?.filter(u => u.role === 'organizer').length > 3 && (
                                                                <Typography variant="caption" sx={{ color: theme.mutedText, ml: 1 }}>
                                                                    +{event.user_associations.filter(u => u.role === 'organizer').length - 3} more
                                                                </Typography>
                                                            )}
                                                        </List>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ 
                                                        p: 2, 
                                                        height:'100%',
                                                        backgroundColor: theme.background,
                                                        borderRadius: 2
                                                    }}>
                                                        <Typography 
                                                            variant="subtitle1" 
                                                            sx={{ 
                                                                color: theme.primary,
                                                                fontWeight: 600,
                                                                mb: 1
                                                            }}
                                                        >
                                                            Event Tags
                                                        </Typography>
                                                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                                                            {event.event_tags?.length > 0 ? (
                                                                event.event_tags.slice(0, 6).map(tag => (
                                                                    <Chip 
                                                                        key={tag.tag_id} 
                                                                        label={tag.tag_name}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{
                                                                            borderColor: theme.secondary,
                                                                            color: theme.secondary,
                                                                            fontSize: '0.7rem',
                                                                            '&:hover': {
                                                                                backgroundColor: 'rgba(13, 71, 161, 0.04)'
                                                                            }
                                                                        }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <Typography 
                                                                    variant="caption" 
                                                                    sx={{ color: theme.mutedText }}
                                                                >
                                                                    No tags added
                                                                </Typography>
                                                            )}
                                                            {event.event_tags?.length > 6 && (
                                                                <Typography variant="caption" sx={{ color: theme.mutedText }}>
                                                                    +{event.event_tags.length - 6} more
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    </Box>
                                )}

                                {activeTab === 'chat' && (
                                    <EventChat 
                                        eventId={eventId} 
                                        userRole={event.user_role}
                                        eventStatus={event.event_status}
                                        showNotification={showNotification}
                                        currentUser={user}
                                    />
                                )}

                                {['admin-chat', 'approval', 'registrations', 'attendance', 'budget', 'volunteers', 'feedback', 'qr'].includes(activeTab) && renderRoleSpecificContent()}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        {/* Club Info Card */}
                        {event.club_ref && (
                            <Card sx={{ 
                                mb: 2,
                                boxShadow: '0 4px 12px rgba(26, 35, 126, 0.08)',
                                borderRadius: 2
                            }}>
                                <CardContent sx={{ p: 2 }}>
                                    <Typography 
                                        variant="subtitle1" 
                                        gutterBottom
                                        sx={{ color: theme.primary, fontWeight: 600 }}
                                    >
                                        Club Information
                                    </Typography>
                                    <Typography 
                                        variant="body2" 
                                        paragraph
                                        sx={{ 
                                            color: theme.text,
                                            lineHeight: 1.5,
                                            mb: 2,
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        {event.club_ref.description}
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        size="small"
                                        onClick={() => navigate(`/clubs/${event.club_id}`)}
                                        fullWidth
                                        sx={{
                                            borderColor: theme.secondary,
                                            color: theme.secondary,
                                            fontSize: '0.8rem',
                                            '&:hover': {
                                                borderColor: theme.primary,
                                                backgroundColor: 'rgba(26, 35, 126, 0.04)'
                                            }
                                        }}
                                    >
                                        View Club
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* Event Edit Modal */}
            <EventEditModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                event={event}
                onSave={handleEditSubmit}
                loading={updating}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={confirmDelete} 
                onClose={() => {
                    setConfirmDelete(false);
                    setDeleteConfirmationText('');
                }}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(26, 35, 126, 0.12)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    color: theme.primary,
                    fontWeight: 600,
                    borderBottom: `1px solid ${theme.background}`,
                    p: 2,
                    fontSize: '1rem'
                }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent sx={{ pt: 2, pb: 1 }}>
                    <Typography variant="body2" sx={{ color: theme.text, mb: 1 }}>
                        Are you sure you want to delete this event? This action cannot be undone.
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.text, mb: 1 }}>
                        Type "delete" to confirm:
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: theme.primary,
                                }
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button 
                        onClick={() => {
                            setConfirmDelete(false);
                            setDeleteConfirmationText('');
                        }}
                        size="small"
                        sx={{
                            color: theme.mutedText,
                            '&:hover': {
                                backgroundColor: 'rgba(96, 125, 139, 0.04)'
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteEvent} 
                        variant="contained"
                        size="small"
                        disabled={deleteConfirmationText.toLowerCase() !== 'delete'}
                        sx={{
                            backgroundColor: '#f44336',
                            '&:hover': {
                                backgroundColor: '#d32f2f'
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                color: 'rgba(244, 67, 54, 0.5)'
                            }
                        }}
                    >
                        Delete Event
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert 
                    onClose={() => setNotification({ ...notification, open: false })} 
                    severity={notification.severity}
                    sx={{ 
                        width: '100%',
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                            color: theme.primary
                        }
                    }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EventDashboard;