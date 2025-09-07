import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import { 
  Search as SearchIcon, 
  CalendarToday, 
  LocationOn, 
  Close as CloseIcon,
  VolunteerActivism,
  Event as EventIcon,
  Info as InfoIcon,
  People,
  CheckCircle,
  Cancel as XCircle,
  AccessTime as Clock
} from '@mui/icons-material';

const SocialTab = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000';

  // Centralized API call handler
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    try {
      const headers = {
        ...(options.body instanceof FormData
          ? {} // don't set content-type for FormData
          : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorData?.message || errorMsg;
        } catch {
          // ignore non-JSON error body
        }

        // Handle expired/invalid token
        if (response.status === 401 || response.status === 422) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      throw err;
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await apiCall('/auth/me');
        setCurrentUser(response.user);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    
    fetchCurrentUser();
  }, [apiCall]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/social/posts');
        
        console.log('API Response:', response); // Debug log
        
        let postsData = [];
        
        if (Array.isArray(response)) {
          postsData = response;
        } else if (response && Array.isArray(response.posts)) {
          postsData = response.posts;
        } else if (response && Array.isArray(response.data)) {
          postsData = response.data;
        } else {
          const possibleArrays = Object.values(response || {}).filter(item => Array.isArray(item));
          postsData = possibleArrays.length > 0 ? possibleArrays[0] : [];
        }
        
        setPosts(postsData);
        setFilteredPosts(postsData);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError(err.message || 'Failed to load posts');
        setPosts([]);
        setFilteredPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [apiCall]);

  useEffect(() => {
    const postsArray = Array.isArray(posts) ? posts : [];
    
    const results = postsArray.filter(post => 
      post && (
        post?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post?.event_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredPosts(results);
  }, [searchTerm, posts]);

  const handleAction = async (post) => {
    setActionLoading(true);
    try {
      let response;
      
      if (post.type === 'event') {
        response = await apiCall(`/events/${post.id}/register`, {
          method: 'POST'
        });
        // Update local state
        setPosts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => 
            p.id === post.id && p.type === 'event' 
              ? { ...p, registration_status: 'pending' }
              : p
          );
        });
        setSuccess('Registration request sent successfully!');
      } else if (post.type === 'volunteer') {
        response = await apiCall(`/volunteer/${post.id}/apply`, {
          method: 'POST'
        });
        // Update local state
        setPosts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => 
            p.id === post.id && p.type === 'volunteer' 
              ? { ...p, application_status: 'pending' }
              : p
          );
        });
        setSuccess('Volunteer application submitted successfully!');
      }
      
      setDialogOpen(false);
    } catch (err) {
      const errorMsg = err.message;
      setError(errorMsg);
      
      // If user is already organizer/volunteer, update local state
      if (errorMsg.includes('organizer') || errorMsg.includes('volunteer')) {
        setPosts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(p => 
            p.id === selectedPost.id && p.type === selectedPost.type 
              ? { 
                  ...p, 
                  registration_status: 'organizer' || 'volunteer' || p.registration_status,
                  application_status: 'organizer' || 'volunteer' || p.application_status 
                }
              : p
          );
        });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusChip = (post) => {
    if (!post) return null;
    
    const status = post.registration_status || post.application_status;
    
    switch (status) {
      case 'organizer':
        return <Chip icon={<CheckCircle />} label="Organizer" color="primary" size="small" variant="filled" />;
      case 'volunteer':
        return <Chip icon={<CheckCircle />} label="Volunteer" color="success" size="small" variant="filled" />;
      case 'pending':
        return <Chip icon={<Clock />} label="Pending" color="warning" size="small" variant="filled" />;
      case 'approved':
        return <Chip icon={<CheckCircle />} label="Registered" color="success" size="small" variant="filled" />;
      case 'rejected':
        return <Chip icon={<XCircle />} label="Rejected" color="error" size="small" variant="filled" />;
      default:
        return null;
    }
  };

  const getActionButton = (post) => {
    if (!post) return null;
    
    const status = post.registration_status || post.application_status;
    
    if (post.type === 'event') {
      if (status === 'organizer') {
        return (
          <Button variant="outlined" fullWidth disabled size="small" startIcon={<EventIcon />}>
            Organizer
          </Button>
        );
      } else if (status === 'volunteer') {
        return (
          <Button variant="outlined" fullWidth disabled size="small" startIcon={<VolunteerActivism />}>
            Volunteer
          </Button>
        );
      } else if (status === 'pending') {
        return (
          <Button variant="outlined" fullWidth disabled size="small" startIcon={<Clock />}>
            Pending
          </Button>
        );
      } else if (status === 'approved') {
        return (
          <Button variant="contained" fullWidth disabled size="small" startIcon={<CheckCircle />}>
            Registered
          </Button>
        );
      } else if (status === 'rejected') {
        return (
          <Button variant="outlined" fullWidth disabled color="error" size="small" startIcon={<XCircle />}>
            Rejected
          </Button>
        );
      } else {
        return (
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<EventIcon />}
            onClick={() => {
              setSelectedPost(post);
              setDialogOpen(true);
            }}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            Register
          </Button>
        );
      }
    } else if (post.type === 'volunteer') {
      if (status === 'organizer') {
        return (
          <Button variant="outlined" fullWidth disabled size="small" startIcon={<EventIcon />}>
            Organizer
          </Button>
        );
      } else if (status === 'volunteer') {
        return (
          <Button variant="contained" fullWidth disabled size="small" startIcon={<CheckCircle />}>
            Volunteer
          </Button>
        );
      } else if (status === 'pending') {
        return (
          <Button variant="outlined" fullWidth disabled size="small" startIcon={<Clock />}>
            Applied
          </Button>
        );
      } else if (status === 'approved') {
        return (
          <Button variant="contained" fullWidth disabled size="small" startIcon={<CheckCircle />}>
            Volunteer
          </Button>
        );
      } else if (status === 'rejected') {
        return (
          <Button variant="outlined" fullWidth disabled color="error" size="small" startIcon={<XCircle />}>
            Rejected
          </Button>
        );
      } else {
        return (
          <Button
            variant="contained"
            fullWidth
            size="small"
            startIcon={<VolunteerActivism />}
            onClick={() => {
              setSelectedPost(post);
              setDialogOpen(true);
            }}
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' }
            }}
          >
            Apply
          </Button>
        );
      }
    } else if (post.type === 'admin') {
      return null; // No action for admin posts
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const postsToRender = Array.isArray(filteredPosts) ? filteredPosts : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" flexDirection="column">
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading posts...
        </Typography>
      </Box>
    );
  }

  if (error && !posts.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" flexDirection="column">
        <Typography color="error" gutterBottom>
          Error: {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
          size="small"
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          component="h1" 
          gutterBottom 
          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.5rem' }}
        >
          Community Hub
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
          Discover events, volunteer opportunities, and announcements
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search events, volunteer opportunities..."
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
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem'
            }
          }}
        />
      </Box>

      {/* Alert Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, fontSize: '0.8rem' }}>
          {success}
        </Alert>
      )}

      {/* Posts Grid */}
      {postsToRender.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, fontSize: '1rem' }}>
            {searchTerm ? 'No matching posts found' : 'No posts available'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem' }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new events and opportunities'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {postsToRender.map((post) => (
            <Grid item xs={12} sm={6} md={4} key={`${post.type}-${post.id}`}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'all 0.2s ease-in-out',
                border: '1px solid',
                borderColor: 'grey.200',
                borderRadius: 2,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  borderColor: 'primary.light'
                }
              }}>
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  {/* Header with Type and Status */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Chip 
                      icon={
                        post.type === 'event' ? <EventIcon sx={{ fontSize: '16px !important' }} /> : 
                        post.type === 'volunteer' ? <VolunteerActivism sx={{ fontSize: '16px !important' }} /> : 
                        <InfoIcon sx={{ fontSize: '16px !important' }} />
                      }
                      label={
                        post.type === 'event' ? 'Event' : 
                        post.type === 'volunteer' ? 'Volunteer' : 
                        'Announcement'
                      }
                      color={
                        post.type === 'event' ? 'primary' : 
                        post.type === 'volunteer' ? 'success' : 
                        'default'
                      }
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: '22px',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                    {getStatusChip(post)}
                  </Box>
                  
                  {/* Title */}
                  <Typography 
                    variant="subtitle1" 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      fontSize: '0.95rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '2.6em'
                    }}
                  >
                    {post.title || post.role || post.event_title}
                  </Typography>
                  
                  {/* Event/Volunteer Details */}
                  {post.type !== 'admin' && (
                    <>
                      <Box sx={{ mb: 1.5 }}>
                        {post.event_date && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {formatDate(post.event_date)}
                              {post.time && ` at ${formatTime(post.time)}`}
                            </Typography>
                          </Box>
                        )}
                        
                        {post.venue && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
                              {post.venue}
                            </Typography>
                          </Box>
                        )}
                        
                        {(post.capacity || post.slots_available) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <People sx={{ fontSize: 14, mr: 0.75, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {post.type === 'event' 
                                ? `${post.current_registrations || 0}/${post.capacity || '∞'} registered`
                                : `${post.slots_available} slots available`
                              }
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      <Divider sx={{ mb: 1.5 }} />
                    </>
                  )}
                  
                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 1.5,
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '3.6em'
                    }}
                  >
                    {post.description || post.content || 'No description available.'}
                  </Typography>
                  
                  {/* Organizer/Club Info */}
                  {post.type === 'event' && post.club?.name && (
                    <Box sx={{ 
                      backgroundColor: 'grey.50', 
                      borderRadius: 1, 
                      p: 1, 
                      mb: 1.5,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Organized by: <strong>{post.club.name}</strong>
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                {/* Action Button */}
                {post.type !== 'admin' && (
                  <Box sx={{ p: 2, pt: 0 }}>
                    {getActionButton(post)}
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1.1rem', pb: 1 }}>
          Confirm {selectedPost?.type === 'event' ? 'Registration' : 'Application'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', mb: 2 }}>
            Are you sure you want to {selectedPost?.type === 'event' ? 'register for' : 'apply to volunteer for'} 
            <strong> "{selectedPost?.title || selectedPost?.role || selectedPost?.event_title}"</strong>?
          </Typography>
          
          {selectedPost?.type === 'event' && (
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Your registration request will be sent to the organizers for approval.
            </Alert>
          )}
          
          {selectedPost?.type === 'volunteer' && (
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Your volunteer application will be reviewed by the event organizers.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDialogOpen(false)} 
            disabled={actionLoading}
            size="small"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleAction(selectedPost)} 
            variant="contained"
            disabled={actionLoading}
            size="small"
            startIcon={actionLoading ? <CircularProgress size={16} /> : null}
          >
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialTab;