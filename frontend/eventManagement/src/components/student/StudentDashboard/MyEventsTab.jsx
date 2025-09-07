import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Event as EventIcon, 
  LocationOn, 
  CalendarToday,
  Schedule,
  People,
  CheckCircle,
  VolunteerActivism,
  HowToReg as OrganizerIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyEventsTab = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000/api';
        const headers = {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        };
        
        // Fetch all events
        const response = await axios.get(`${API_BASE_URL}/events/my-events`, { headers });
        
        setEvents(Array.isArray(response?.data) ? response.data : []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const renderRoleChip = (role) => {
    switch(role) {
      case 'attendee':
        return <Chip icon={<CheckCircle />} label="Attendee" color="success" size="small" />;
      case 'volunteer':
        return <Chip icon={<VolunteerActivism />} label="Volunteer" color="info" size="small" />;
      case 'organizer':
        return <Chip icon={<OrganizerIcon />} label="Organizer" color="warning" size="small" />;
      default:
        return null;
    }
  };

  const getEventStatus = (eventDate) => {
    const now = new Date();
    const eventDateObj = new Date(eventDate);
    return eventDateObj > now ? 'upcoming' : 'past';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // Filter events based on selected filter and search term
  const filteredEvents = events.filter(event => {
    // Filter by event type
    if (filter !== 'all') {
      if (filter === 'upcoming' && getEventStatus(event.event_date) !== 'upcoming') return false;
      if (filter === 'past' && getEventStatus(event.event_date) !== 'past') return false;
      if (filter === 'organizer' && event.participation_role !== 'organizer') return false;
      if (filter === 'volunteer' && event.participation_role !== 'volunteer') return false;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.venue?.toLowerCase().includes(searchLower) ||
        event.participation_role?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

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
        <Typography color="error">Error loading events: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>My Events</Typography>
      
      {/* Filters and Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        {/* Filter Dropdown */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={filter}
            label="Filter"
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All Events</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="past">Past</MenuItem>
            <MenuItem value="organizer">As Organizer</MenuItem>
            <MenuItem value="volunteer">As Volunteer</MenuItem>
          </Select>
        </FormControl>

        {/* Search */}
        <TextField
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
          sx={{ flexGrow: 1, maxWidth: 300 }}
        />
      </Box>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm || filter !== 'all' 
              ? 'No matching events found' 
              : 'You have no events yet'
            }
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Join or organize events to see them here'
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
                  {/* Status and Role Chips */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Chip 
                      label={getEventStatus(event.event_date) === 'upcoming' ? 'Upcoming' : 'Past'} 
                      size="small" 
                      color={getEventStatus(event.event_date) === 'upcoming' ? 'primary' : 'default'}
                      variant="filled"
                    />
                    {renderRoleChip(event.participation_role)}
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

                    {event.registration_count !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <People sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {event.registration_count} registered
                          {event.capacity && ` / ${event.capacity}`}
                        </Typography>
                      </Box>
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
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}

                  {/* View Details Button */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      sx={{ 
                        color: '#0D47A1', 
                        borderColor: '#0D47A1',
                        fontSize: '0.75rem'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event.event_id);
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyEventsTab;