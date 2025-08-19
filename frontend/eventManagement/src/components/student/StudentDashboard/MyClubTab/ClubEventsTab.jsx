import React, { useState } from 'react';
import { 
  Box, Typography, Tabs, Tab, Card, CardContent, Grid, Button, 
  CardMedia, Chip, Stack, Divider, IconButton 
} from '@mui/material';
import { 
  Event as EventIcon, 
  ArrowBack, 
  LocationOn, 
  CalendarToday,
  Schedule,
  People,
  Edit,
  Delete
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import OrganizeEventDialog from '../OrganizeEventDialog';
import { formatDate, formatTime } from '../../../../utils/dateUtils';
import useClubApi from '../../../hooks/useClubApi';

const ClubEventsTab = ({ club, events, pastEvents, isLeader, showNotification, refetch }) => {
    const [eventType, setEventType] = useState('upcoming');
    const [openEventDialog, setOpenEventDialog] = useState(false);
    const navigate = useNavigate();

    const displayedEvents = eventType === 'upcoming' ? events : pastEvents;
    const {createEvent} = useClubApi();
    const handleCreateEvent = async (eventData) => {
        try {
            await createEvent(club.club_id, eventData);
            showNotification('Event created successfully!', 'success');
            setOpenEventDialog(false);
            await refetch();
        } catch (error) {
            showNotification(error.message || 'Failed to create event', 'error');
        }
    };

    const handleEventClick = (eventId) => {
        navigate(`/events/${eventId}`);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Club Events</Typography>
                {isLeader && (
                    <Button
                        variant="contained"
                        startIcon={<EventIcon />}
                        onClick={() => setOpenEventDialog(true)}
                        sx={{ backgroundColor: '#0D47A1', '&:hover': { backgroundColor: '#1A237E' } }}
                    >
                        Organize Event
                    </Button>
                )}
            </Box>

            <Tabs value={eventType} onChange={(_, newValue) => setEventType(newValue)} sx={{ mb: 2 }}>
                <Tab label="Upcoming" value="upcoming" />
                <Tab label="Past Events" value="past" />
            </Tabs>

            {displayedEvents.length === 0 ? (
                <Typography>No {eventType} events scheduled yet.</Typography>
            ) : (
                <Grid container spacing={3}>
                    {displayedEvents.map(event => (
                        <Grid item xs={12} sm={6} md={4} key={event.event_id}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': { 
                                        transform: 'scale(1.02)',
                                        boxShadow: 3 
                                    }
                                }}
                                onClick={() => handleEventClick(event.event_id)}
                            >
                                {event.image_url && (
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={event.image_url}
                                        alt={event.title}
                                    />
                                )}
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography gutterBottom variant="h6" component="div">
                                        {event.title}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                        <Chip 
                                            label={event.event_status} 
                                            size="small" 
                                            color={
                                                event.event_status === 'upcoming' ? 'primary' : 
                                                event.event_status === 'ongoing' ? 'secondary' : 'default'
                                            }
                                        />
                                        {event.is_certified && (
                                            <Chip label="Certified" size="small" color="success" />
                                        )}
                                    </Stack>
                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                            {formatDate(event.event_date)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <Schedule fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                            {formatTime(event.event_date)}
                                            {event.duration_minutes && ` (${event.duration_minutes} mins)`}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                            {event.venue || 'TBD'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            <People fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                            {event.registration_count || 0} registered
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <OrganizeEventDialog
                open={openEventDialog}
                onClose={() => setOpenEventDialog(false)}
                onSubmit={handleCreateEvent}
                clubId={club.club_id}
            />
        </Box>
    );
};

export default ClubEventsTab;