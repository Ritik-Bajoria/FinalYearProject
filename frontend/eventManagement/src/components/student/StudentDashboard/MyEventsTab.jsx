import React, { useState, useEffect } from 'react';
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
  Chip,
  Button,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  VolunteerActivism as VolunteerIcon,
  HowToReg as OrganizerIcon
} from '@mui/icons-material';
import axios from 'axios';
import OrganizeEventDialog from './OrganizeEventDialog';

const MyEventsTab = ({ user }) => {
  const [activeSubTab, setActiveSubTab] = useState('upcoming');
  const [events, setEvents] = useState({
    upcoming: [],
    past: [],
    asVolunteer: [],
    asOrganizer: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Fetch all event types in parallel
        const [upcomingResponse, pastResponse, volunteerResponse, organizerResponse] = await Promise.all([
          axios.get('/api/events/my-events/upcoming'),
          axios.get('/api/events/my-events/past'),
          axios.get('/api/events/my-events/volunteer'),
          axios.get('/api/events/my-events/organizer')
        ]);
        
        setEvents({
          upcoming: Array.isArray(upcomingResponse?.data) ? upcomingResponse.data : [],
          past: Array.isArray(pastResponse?.data) ? pastResponse.data : [],
          asVolunteer: Array.isArray(volunteerResponse?.data) ? volunteerResponse.data : [],
          asOrganizer: Array.isArray(organizerResponse?.data) ? organizerResponse.data : []
        });
        
        setError(null);
      } catch (err) {
        setError(err.message);
        setEvents({
          upcoming: [],
          past: [],
          asVolunteer: [],
          asOrganizer: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const renderRoleChip = (role) => {
    switch(role) {
      case 'attendee':
        return <Chip icon={<CheckCircleIcon />} label="Attendee" color="success" size="small" />;
      case 'volunteer':
        return <Chip icon={<VolunteerIcon />} label="Volunteer" color="info" size="small" />;
      case 'organizer':
        return <Chip icon={<OrganizerIcon />} label="Organizer" color="warning" size="small" />;
      default:
        return null;
    }
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
        <Typography color="error">Error loading events: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>My Events</Typography>
      
      <Tabs 
        value={activeSubTab} 
        onChange={(e, newValue) => setActiveSubTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Upcoming" value="upcoming" />
        <Tab label="Past" value="past" />
        <Tab label="As Volunteer" value="asVolunteer" />
        <Tab label="As Organizer" value="asOrganizer" />
      </Tabs>

      {activeSubTab === 'upcoming' && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Upcoming Events</Typography>
          {events.upcoming.length === 0 ? (
            <Typography>You have no upcoming events.</Typography>
          ) : (
            <List>
              {events.upcoming.map(event => (
                <Card key={event.event_id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">{event.title}</Typography>
                      {renderRoleChip(event.participation_role)}
                    </Box>
                    <Typography color="textSecondary" sx={{ mb: 1 }}>
                      {new Date(event.event_date).toLocaleString()} at {event.venue}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      {event.description?.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        sx={{ color: '#0D47A1', borderColor: '#0D47A1', mr: 1 }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small"
                        sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {activeSubTab === 'past' && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Past Events</Typography>
          {events.past.length === 0 ? (
            <Typography>You have no past events.</Typography>
          ) : (
            <List>
              {events.past.map(event => (
                <Card key={event.event_id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">{event.title}</Typography>
                      {renderRoleChip(event.participation_role)}
                    </Box>
                    <Typography color="textSecondary" sx={{ mb: 1 }}>
                      {new Date(event.event_date).toLocaleString()} at {event.venue}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      {event.description?.substring(0, 100)}...
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        sx={{ color: '#0D47A1', borderColor: '#0D47A1', mr: 1 }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small"
                        sx={{ backgroundColor: '#0D47A1', '&:hover': { backgroundColor: '#1A237E' } }}
                      >
                        Give Feedback
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {activeSubTab === 'asVolunteer' && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Events as Volunteer</Typography>
          {events.asVolunteer.length === 0 ? (
            <Typography>You are not volunteering for any events.</Typography>
          ) : (
            <List>
              {events.asVolunteer.map(event => (
                <Card key={event.event_id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">{event.title}</Typography>
                      <Chip icon={<VolunteerIcon />} label={event.volunteer_role} color="info" size="small" />
                    </Box>
                    <Typography color="textSecondary" sx={{ mb: 1 }}>
                      {new Date(event.event_date).toLocaleString()} at {event.venue}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>{event.volunteer_description}</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Your responsibilities:</strong> {event.responsibilities}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        sx={{ color: '#0D47A1', borderColor: '#0D47A1', mr: 1 }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {activeSubTab === 'asOrganizer' && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>Events as Organizer</Typography>
          {events.asOrganizer.length === 0 ? (
            <Typography>You are not organizing any events.</Typography>
          ) : (
            <List>
              {events.asOrganizer.map(event => (
                <Card key={event.event_id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">{event.title}</Typography>
                      <Chip icon={<OrganizerIcon />} label="Organizer" color="warning" size="small" />
                    </Box>
                    <Typography color="textSecondary" sx={{ mb: 1 }}>
                      {new Date(event.event_date).toLocaleString()} at {event.venue}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>{event.description?.substring(0, 100)}...</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Status:</strong> {event.status} | <strong>Attendees:</strong> {event.attendee_count}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="outlined" 
                        size="small"
                        sx={{ color: '#0D47A1', borderColor: '#0D47A1', mr: 1 }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small"
                        sx={{ backgroundColor: '#0D47A1', '&:hover': { backgroundColor: '#1A237E' } }}
                      >
                        Manage Event
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MyEventsTab;