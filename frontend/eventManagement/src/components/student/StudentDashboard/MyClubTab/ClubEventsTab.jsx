import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  Chip, 
  Stack,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Event as EventIcon, 
  LocationOn, 
  CalendarToday,
  Schedule,
  People,
  CheckCircle,
  Pending,
  Cancel as CancelIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import OrganizeEventDialog from '../OrganizeEventDialog';
import { formatDate, formatTime } from '../../../../utils/dateUtils';
import useClubApi from '../../../hooks/useClubApi';

const ClubEventsTab = ({ club, events, pastEvents, isLeader, showNotification, refetch }) => {
    const [openEventDialog, setOpenEventDialog] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const { createEvent } = useClubApi();

    // Combine all events
    const allEvents = useMemo(() => {
        return [...(events || []), ...(pastEvents || [])];
    }, [events, pastEvents]);

    // Filter events based on selected filters and search term
    const filteredEvents = useMemo(() => {
        let filtered = allEvents;

        // Filter by time (upcoming/past)
        if (timeFilter === 'upcoming') {
            filtered = events || [];
        } else if (timeFilter === 'past') {
            filtered = pastEvents || [];
        }

        // Filter by approval status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(event => 
                event.approval_status?.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.event_type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [allEvents, events, pastEvents, statusFilter, timeFilter, searchTerm]);

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

    const getApprovalStatusChip = (status) => {
        const statusLower = status?.toLowerCase();
        
        switch (statusLower) {
            case 'approved':
                return (
                    <Chip 
                        icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                        label="Approved" 
                        size="small" 
                        color="success"
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height: '22px' }}
                    />
                );
            case 'pending':
                return (
                    <Chip 
                        icon={<Pending sx={{ fontSize: '14px !important' }} />}
                        label="Pending" 
                        size="small" 
                        color="warning"
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height: '22px' }}
                    />
                );
            case 'rejected':
                return (
                    <Chip 
                        icon={<CancelIcon sx={{ fontSize: '14px !important' }} />}
                        label="Rejected" 
                        size="small" 
                        color="error"
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height: '22px' }}
                    />
                );
            default:
                return null;
        }
    };

    const getEventStatusChip = (event) => {
        const now = new Date();
        const eventDate = new Date(event.event_date);
        const isUpcoming = eventDate > now;
        
        return (
            <Chip 
                label={isUpcoming ? 'Upcoming' : 'Past'} 
                size="small" 
                color={isUpcoming ? 'primary' : 'default'}
                variant="filled"
                sx={{ fontSize: '0.7rem', height: '22px' }}
            />
        );
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Header with Filters, Search and Organize Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                {/* Filters */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ fontSize: '0.8rem' }}>Time Period</InputLabel>
                        <Select
                            value={timeFilter}
                            label="Time Period"
                            onChange={(e) => setTimeFilter(e.target.value)}
                            sx={{ fontSize: '0.8rem' }}
                        >
                            <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Events</MenuItem>
                            <MenuItem value="upcoming" sx={{ fontSize: '0.8rem' }}>Upcoming</MenuItem>
                            <MenuItem value="past" sx={{ fontSize: '0.8rem' }}>Past Events</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            sx={{ fontSize: '0.8rem' }}
                        >
                            <MenuItem value="all" sx={{ fontSize: '0.8rem' }}>All Status</MenuItem>
                            <MenuItem value="approved" sx={{ fontSize: '0.8rem' }}>Approved</MenuItem>
                            <MenuItem value="pending" sx={{ fontSize: '0.8rem' }}>Pending</MenuItem>
                            <MenuItem value="rejected" sx={{ fontSize: '0.8rem' }}>Rejected</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Search */}
                <Box sx={{ flexGrow: 1, maxWidth: 300, mx: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Search events..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                fontSize: '0.8rem'
                            }
                        }}
                    />
                </Box>

                {/* Organize Button */}
                {isLeader && (
                    <Button
                        variant="contained"
                        startIcon={<EventIcon />}
                        onClick={() => setOpenEventDialog(true)}
                        size="small"
                        sx={{ 
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#1565c0' },
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Organize Event
                    </Button>
                )}
            </Box>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
                <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
                        No events found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
                        {timeFilter !== 'all' || statusFilter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'Create your first event to get started'
                        }
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {filteredEvents.map(event => (
                        <Grid item xs={12} sm={6} md={4} key={event.event_id}>
                            <Card 
                                sx={{ 
                                    height: '100%', 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out',
                                    border: '1px solid',
                                    borderColor: 'grey.200',
                                    borderRadius: 2,
                                    '&:hover': { 
                                        transform: 'translateY(-2px)',
                                        boxShadow: 3,
                                        borderColor: 'primary.light'
                                    }
                                }}
                                onClick={() => handleEventClick(event.event_id)}
                            >
                                <CardContent sx={{ p: 2 }}>
                                    {/* Status Chips */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        {getEventStatusChip(event)}
                                        {getApprovalStatusChip(event.approval_status)}
                                    </Box>

                                    {/* Event Title */}
                                    <Typography 
                                        variant="subtitle1" 
                                        component="h3"
                                        sx={{ 
                                            fontWeight: 600,
                                            mb: 1.5,
                                            fontSize: '0.95rem',
                                            lineHeight: 1.3,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            minHeight: '2.6em'
                                        }}
                                    >
                                        {event.title}
                                    </Typography>

                                    {/* Event Details */}
                                    <Stack spacing={0.8} sx={{ mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CalendarToday sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                {formatDate(event.event_date)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Schedule sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                {formatTime(event.event_date)}
                                                {event.duration_minutes && ` (${event.duration_minutes}m)`}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <LocationOn sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                            <Typography 
                                                variant="caption" 
                                                color="text.secondary" 
                                                sx={{ 
                                                    fontSize: '0.75rem',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {event.venue || 'Venue TBD'}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <People sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                                {event.registration_count || 0} registered
                                                {event.capacity && ` / ${event.capacity}`}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Additional Event Info */}
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        {event.is_certified && (
                                            <Chip 
                                                label="Certified" 
                                                size="small" 
                                                color="info"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: '20px' }}
                                            />
                                        )}
                                        {event.event_type && (
                                            <Chip 
                                                label={event.event_type} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: '20px' }}
                                            />
                                        )}
                                    </Stack>

                                    {/* Description Preview */}
                                    {event.description && (
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                mt: 1.5,
                                                fontSize: '0.75rem',
                                                lineHeight: 1.4,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {event.description}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Organize Event Dialog */}
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