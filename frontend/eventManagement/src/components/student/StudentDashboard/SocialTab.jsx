import React, { useState, useEffect } from 'react';
import { 
  Box,
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip, 
  TextField,
  InputAdornment,
  SvgIcon,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon, CalendarToday, LocationOn } from '@mui/icons-material';
import axios from 'axios';

const SocialTab = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/events/public');
        const data = Array.isArray(response?.data) ? response.data : [];
        setEvents(data);
        setFilteredEvents(data);
      } catch (err) {
        setError(err.message);
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const results = events.filter(event => 
      event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(results);
  }, [searchTerm, events]);

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
    <Box sx={{ padding: '20px' }}>
      <TextField
        fullWidth
        placeholder="Search events..."
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SvgIcon color="action">
                <SearchIcon />
              </SvgIcon>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />
      
      {filteredEvents.length === 0 ? (
        <Typography variant="body1" align="center">
          {searchTerm ? 'No matching events found' : 'No events available'}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.event_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {event.title}
                  </Typography>
                  <Typography color="textSecondary" sx={{ mb: 1 }}>
                    <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                    {new Date(event.event_date).toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary" sx={{ mb: 1 }}>
                    <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                    {event.venue}
                  </Typography>
                  <Typography sx={{ mb: 2 }}>
                    {event.description?.substring(0, 100)}...
                  </Typography>
                </CardContent>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#0D47A1',
                    '&:hover': { backgroundColor: '#1A237E' }
                  }}
                >
                  Register
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default SocialTab;