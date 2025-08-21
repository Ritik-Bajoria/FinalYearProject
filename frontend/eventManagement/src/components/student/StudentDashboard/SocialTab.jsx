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
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon, 
  CalendarToday, 
  LocationOn, 
  Close as CloseIcon,
  VolunteerActivism,
  Event as EventIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

const SocialTab = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  useEffect(() => {
    // Fetch current user data from backend using your existing /me endpoint
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`);
        setCurrentUser(response.data.user);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
        // Continue without user data - the backend will handle authentication
      }
    };
    
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/social/posts`);
        
        // Handle different response structures
        let postsData = [];
        
        if (Array.isArray(response.data)) {
          // If response.data is already an array
          postsData = response.data;
        } else if (response.data && Array.isArray(response.data.posts)) {
          // If response.data has a posts array
          postsData = response.data.posts;
        } else if (response.data && Array.isArray(response.data.data)) {
          // If response.data has a data array
          postsData = response.data.data;
        } else {
          // Fallback: try to extract any array from the response
          const possibleArrays = Object.values(response.data || {}).filter(item => Array.isArray(item));
          postsData = possibleArrays.length > 0 ? possibleArrays[0] : [];
        }
        
        setPosts(postsData);
        setFilteredPosts(postsData);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setPosts([]);
        setFilteredPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    // Ensure posts is always treated as an array
    const postsArray = Array.isArray(posts) ? posts : [];
    
    const results = postsArray.filter(post => 
      post && (
        post?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredPosts(results);
  }, [searchTerm, posts]);

  const handleAction = async (post) => {
    setActionLoading(true);
    try {
      let response;
      
      if (post.type === 'event') {
        response = await axios.post(`${API_BASE_URL}/api/events/${post.id}/register`);
        // Update local state
        setPosts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => 
            p.id === post.id && p.type === 'event' 
              ? { ...p, registration_status: 'pending' }
              : p
          );
        });
      } else if (post.type === 'volunteer') {
        response = await axios.post(`${API_BASE_URL}/api/volunteer/${post.id}/apply`);
        // Update local state
        setPosts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => 
            p.id === post.id && p.type === 'volunteer' 
              ? { ...p, application_status: 'pending' }
              : p
          );
        });
      }
      
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (post) => {
    if (!post) return null;
    
    if (post.type === 'event') {
      switch (post.registration_status) {
        case 'pending':
          return <Chip label="Requested" color="warning" size="small" />;
        case 'approved':
          return <Chip label="Registered" color="success" size="small" />;
        case 'rejected':
          return <Chip label="Rejected" color="error" size="small" />;
        default:
          return null;
      }
    } else if (post.type === 'volunteer') {
      switch (post.application_status) {
        case 'pending':
          return <Chip label="Applied" color="warning" size="small" />;
        case 'approved':
          return <Chip label="Volunteer" color="success" size="small" />;
        case 'rejected':
          return <Chip label="Rejected" color="error" size="small" />;
        default:
          return null;
      }
    }
    return null;
  };

  const getActionButton = (post) => {
    if (!post) return null;
    
    if (post.type === 'event') {
      switch (post.registration_status) {
        case 'not_registered':
          return (
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setSelectedPost(post);
                setDialogOpen(true);
              }}
              sx={{
                backgroundColor: '#0D47A1',
                '&:hover': { backgroundColor: '#1A237E' }
              }}
            >
              Register
            </Button>
          );
        case 'pending':
          return (
            <Button variant="outlined" fullWidth disabled>
              Requested
            </Button>
          );
        case 'approved':
          return (
            <Button variant="contained" fullWidth disabled>
              Registered
            </Button>
          );
        case 'rejected':
          return (
            <Button variant="outlined" fullWidth disabled color="error">
              Rejected
            </Button>
          );
        default:
          return null;
      }
    } else if (post.type === 'volunteer') {
      switch (post.application_status) {
        case 'not_applied':
          return (
            <Button
              variant="contained"
              fullWidth
              startIcon={<VolunteerActivism />}
              onClick={() => {
                setSelectedPost(post);
                setDialogOpen(true);
              }}
              sx={{
                backgroundColor: '#2E7D32',
                '&:hover': { backgroundColor: '#1B5E20' }
              }}
            >
              Volunteer
            </Button>
          );
        case 'pending':
          return (
            <Button variant="outlined" fullWidth startIcon={<VolunteerActivism />} disabled>
              Applied
            </Button>
          );
        case 'approved':
          return (
            <Button variant="contained" fullWidth startIcon={<VolunteerActivism />} disabled>
              Volunteer
            </Button>
          );
        case 'rejected':
          return (
            <Button variant="outlined" fullWidth startIcon={<VolunteerActivism />} disabled color="error">
              Rejected
            </Button>
          );
        default:
          return null;
      }
    } else if (post.type === 'admin') {
      return (
        <IconButton size="small" disabled>
          <CloseIcon />
        </IconButton>
      );
    }
    return null;
  };

  // Ensure filteredPosts is always an array for rendering
  const postsToRender = Array.isArray(filteredPosts) ? filteredPosts : [];

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
        <Typography color="error">Error loading posts: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px' }}>
      <TextField
        fullWidth
        placeholder="Search events, volunteer opportunities, or announcements..."
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
      
      {postsToRender.length === 0 ? (
        <Typography variant="body1" align="center">
          {searchTerm ? 'No matching posts found' : 'No posts available'}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {postsToRender.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={`${post.type}-${post.id}`}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Chip 
                      icon={post.type === 'event' ? <EventIcon /> : 
                            post.type === 'volunteer' ? <VolunteerActivism /> : 
                            <InfoIcon />}
                      label={post.type === 'event' ? 'Event' : 
                             post.type === 'volunteer' ? 'Volunteer' : 
                             'Announcement'}
                      color={post.type === 'event' ? 'primary' : 
                             post.type === 'volunteer' ? 'success' : 
                             'secondary'}
                      size="small"
                    />
                    {getStatusChip(post)}
                  </Box>
                  
                  <Typography gutterBottom variant="h6" component="h2">
                    {post.title || post.role || post.event_title}
                  </Typography>
                  
                  {post.event_date && (
                    <Typography color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                      {new Date(post.event_date).toLocaleString()}
                    </Typography>
                  )}
                  
                  {post.venue && (
                    <Typography color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                      {post.venue}
                    </Typography>
                  )}
                  
                  <Typography sx={{ mb: 2 }}>
                    {post.description || post.content || ''}
                  </Typography>
                  
                  {post.slots_available && (
                    <Typography variant="body2" color="textSecondary">
                      Slots available: {post.slots_available}
                    </Typography>
                  )}
                </CardContent>
                
                <Box sx={{ p: 1 }}>
                  {getActionButton(post)}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          Confirm {selectedPost?.type === 'event' ? 'Registration' : 'Application'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {selectedPost?.type === 'event' ? 'register for' : 'apply to volunteer for'} 
            "{selectedPost?.title || selectedPost?.role}"?
          </Typography>
          {selectedPost?.type === 'event' && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Your registration request will be sent to the organizers for approval.
            </Typography>
          )}
          {selectedPost?.type === 'volunteer' && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Your volunteer application will be reviewed by the event organizers.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleAction(selectedPost)} 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialTab;