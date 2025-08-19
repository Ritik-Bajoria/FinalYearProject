import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CardMedia,
  Container,
  Stack,
  Divider,
  IconButton,
  Skeleton,
  Fade,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Star as StarIcon,
  ExitToApp as LeaveIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import useClubDashboardApi from '../../hooks/useClubDashboardApi';

const ClubDashboard = ({ user }) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [newClub, setNewClub] = useState({
    name: '',
    description: '',
    category: 'Academic',
    logo_file: null,
    image_file: null,
    club_details: ''
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [previewLogo, setPreviewLogo] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const {
    clubs,
    filteredClubs,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    refetch,
    joinClub,
    createClub,
    leaveClub
  } = useClubDashboardApi(user?.user_id);

  const handleJoinClub = async (clubId) => {
    // Frontend validation - check if user is already a member of any club
    const isAlreadyMember = clubs.some(club => isClubMember(club));
    if (isAlreadyMember) {
      showErrorDialog("You are already a member of a club. Please leave your current club before joining another.");
      return;
    }

    try {
      await joinClub(clubId);
      showNotification('Join request sent successfully!', 'success');
      await refetch();
    } catch (err) {
      if (err.message.includes('already a member of another club')) {
        showErrorDialog(err.message);
      } else {
        showNotification(err.message || 'Failed to send join request', 'error');
      }
    }
  };

  const handleLeaveClub = async (clubId) => {
    // Find the club in the clubs array
    const clubToLeave = clubs.find(club => club.club_id === clubId);
    
    // Frontend validation - check if user is the leader
    if (clubToLeave && isClubLeader(clubToLeave)) {
      showErrorDialog("You cannot leave as club leader. Please transfer leadership to another member first.");
      return;
    }

    try {
      await leaveClub(clubId);
      showNotification('Successfully left the club', 'success');
      await refetch();
    } catch (err) {
      showNotification(err.message || 'Failed to leave club', 'error');
    }
  };

  const handleCreateClub = async () => {
    // Check if user is already a member of any club
    const isMember = clubs.some(club => isClubMember(club));
    if (isMember) {
      showErrorDialog("You are already a member of a club. Please leave your current club before creating a new one.");
      return;
    }

    try {
      await createClub(newClub);
      showNotification(`Club "${newClub.name}" created successfully!`, 'success');
      setOpenCreateDialog(false);
      resetForm();
      await refetch();
    } catch (err) {
      console.log(err.message);
      if (err.message.includes('already a member')) {
        showErrorDialog(err.message);
        setOpenCreateDialog(false);
      } else {
        showNotification(err.message || 'Failed to create club', 'error');
      }
    }
  };

  const showErrorDialog = (message) => {
    setErrorMessage(message);
    setOpenErrorDialog(true);
  };

  const handleCloseErrorDialog = () => {
    setOpenErrorDialog(false);
    setErrorMessage('');
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const resetForm = () => {
    setNewClub({
      name: '',
      description: '',
      category: 'Academic',
      logo_file: null,
      image_file: null,
      club_details: ''
    });
    setPreviewLogo(null);
    setPreviewImage(null);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setNewClub(prev => ({ ...prev, [field]: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'logo_file') {
          setPreviewLogo(reader.result);
        } else {
          setPreviewImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isClubMember = (club) => club.is_member;
  const isClubLeader = (club) => club.leader_id === user?.user_id;
  const hasPendingRequest = (club) => club.membership_status === 'PENDING';

  // Loading skeleton for cards
  const LoadingSkeleton = () => (
    <Grid container spacing={2}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: 320 }}>
            <Skeleton variant="rectangular" height={140} />
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
                  <Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>
              <Skeleton variant="text" sx={{ mb: 0.5 }} />
              <Skeleton variant="text" sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="60%" />
            </CardContent>
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1 }} />
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (loading && !clubs.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" sx={{ fontSize: '1.8rem', mb: 1, width: 200 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Skeleton variant="rectangular" height={48} sx={{ flex: 1, borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={140} height={48} sx={{ borderRadius: 2 }} />
          </Box>
        </Box>
        <LoadingSkeleton />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <Paper sx={{ p: 3, textAlign: 'center', maxWidth: 400 }}>
            <ErrorIcon color="error" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={refetch}
              size="small"
              sx={{ borderRadius: 2 }}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            fontSize: '0.85rem',
            '& .MuiAlert-icon': {
              fontSize: '1.25rem'
            }
          }}
          elevation={6}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Error Dialog */}
      <Dialog
        open={openErrorDialog}
        onClose={handleCloseErrorDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 4,
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
            overflow: 'visible',
            position: 'relative'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        {/* Animated error indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: -15,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 30,
            height: 30,
            background: 'linear-gradient(135deg, #ff4757, #ff3742)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(255, 71, 87, 0.4)' },
              '70%': { boxShadow: '0 0 0 8px rgba(255, 71, 87, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(255, 71, 87, 0)' }
            }
          }}
        >
          <ErrorIcon sx={{ color: 'white', fontSize: '1rem' }} />
        </Box>

        <DialogContent sx={{ 
          textAlign: 'center',
          p: 3,
          pt: 4
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{
              fontWeight: 500,
              color: '#2d3748',
              mb: 1.5,
              fontSize: '1rem'
            }}
          >
            Something went wrong
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{
              color: '#64748b',
              lineHeight: 1.4,
              fontSize: '0.85rem',
              mb: 2.5
            }}
          >
            {errorMessage}
          </Typography>

          <Button
            onClick={handleCloseErrorDialog}
            variant="text"
            size="small"
            sx={{ 
              borderRadius: 2,
              px: 2.5,
              py: 1,
              color: '#ff4757',
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'none',
              background: 'rgba(255, 71, 87, 0.08)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: 100,
              '&:hover': {
                background: 'rgba(255, 71, 87, 0.12)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          fontWeight="600"
          color="text.primary"
          sx={{ mb: 0.5 }}
        >
          Student Clubs
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Discover and join clubs that match your interests
        </Typography>

        {/* Search and Actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search clubs by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" sx={{ fontSize: '1.1rem' }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                backgroundColor: 'background.paper',
                fontSize: '0.85rem',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }
            }}
            sx={{ maxWidth: { sm: 350 } }}
          />

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: '1rem' }} />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              minWidth: 140,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            Create Club
          </Button>
        </Stack>
      </Box>

      {/* Clubs Section */}
      {filteredClubs.length === 0 && !loading ? (
        <Fade in>
          <Paper sx={{
            p: 5,
            textAlign: 'center',
            backgroundColor: 'grey.50',
            border: '2px dashed',
            borderColor: 'grey.200',
            borderRadius: 3
          }}>
            <Box sx={{ maxWidth: 350, mx: 'auto' }}>
              <PeopleIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" fontWeight="500" gutterBottom>
                {searchTerm ? 'No matching clubs found' : 'No clubs available yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm
                  ? 'Try adjusting your search terms or browse all clubs'
                  : 'Be the first to create a club and bring students together!'
                }
              </Typography>
              {searchTerm ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSearchTerm('')}
                  sx={{ borderRadius: 2 }}
                >
                  Show All Clubs
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCreateDialog(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Create First Club
                </Button>
              )}
            </Box>
          </Paper>
        </Fade>
      ) : (
        <Fade in>
          <Grid container spacing={2}>
            {filteredClubs.map((club) => (
              <Grid item xs={12} sm={6} lg={4} key={club.club_id}>
                <Card sx={{
                  height: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: 'none',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.015)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                    '& .club-image': {
                      transform: 'scale(1.05)',
                    },
                    '& .club-avatar': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    },
                    '& .hover-overlay': {
                      opacity: 1,
                    }
                  }
                }}>
                  {/* Status Indicator Strip */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: isClubMember(club)
                        ? 'linear-gradient(90deg, #4CAF50, #2E7D32)'
                        : hasPendingRequest(club)
                          ? 'linear-gradient(90deg, #FF9800, #F57C00)'
                          : 'linear-gradient(90deg, #2196F3, #1976D2)',
                    zIndex: 1,
                  }} />

                  {/* Club Image Container */}
                  <Box sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    height: 140,
                    backgroundColor: 'grey.50'
                  }}>
                    <CardMedia
                      component="img"
                      image={club.image_url
                        ? `http://127.0.0.1:7000/${club.image_url.replace(/\\/g, '/')}`
                        : 'http://127.0.0.1:7000/static/fallback/fallback.jpg'
                      }
                      alt={`${club.name} banner`}
                      className="club-image"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                    />

                    {/* Gradient Overlay */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '40%',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
                      opacity: 0.8,
                    }} />

                    {/* Hover Overlay */}
                    <Box
                      className="hover-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(156, 39, 176, 0.1))',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        backdropFilter: 'blur(1px)',
                      }}
                    />

                    {/* Member Count Badge */}
                    <Box sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                    }}>
                      <Chip
                        icon={<PeopleIcon sx={{ fontSize: '0.9rem' }} />}
                        label={club.member_count}
                        size="small"
                        sx={{
                          height: 24,
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 3px 16px rgba(0,0,0,0.1)',
                          '& .MuiChip-icon': {
                            fontSize: '0.9rem',
                            color: 'primary.main'
                          },
                          '& .MuiChip-label': {
                            px: 1,
                            color: 'text.primary'
                          }
                        }}
                      />
                    </Box>

                    {/* Membership Status Badge */}
                    {(isClubLeader(club) || isClubMember(club)) && (
                      <Box sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 2,
                      }}>
                        <Chip
                          icon={isClubLeader(club) ? <StarIcon sx={{ fontSize: '0.8rem' }} /> : <CheckIcon sx={{ fontSize: '0.8rem' }} />}
                          label={isClubLeader(club) ? "Leader" : "Member"}
                          size="small"
                          sx={{
                            height: 24,
                            backgroundColor: isClubLeader(club)
                              ? 'rgba(255, 193, 7, 0.95)'
                              : 'rgba(76, 175, 80, 0.95)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.65rem',
                            borderRadius: 2,
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 3px 16px rgba(0,0,0,0.15)',
                            '& .MuiChip-icon': {
                              fontSize: '0.8rem',
                              color: 'white'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{
                    p: 0,
                    pb: 0,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}>
                    {/* Club Header with Floating Avatar */}
                    <Box sx={{
                      position: 'relative',
                      px: 2,
                      pt: 2,
                      pb: 1.5,
                    }}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        {/* Floating Avatar */}
                        <Avatar
                          src={club.logo_url
                            ? `http://127.0.0.1:7000/${club.logo_url.replace(/\\/g, '/')}`
                            : '/default-logo.png'
                          }
                          className="club-avatar"
                          sx={{
                            width: 48,
                            height: 48,
                            border: '3px solid',
                            borderColor: 'background.paper',
                            boxShadow: '0 3px 16px rgba(0,0,0,0.15)',
                            transition: 'all 0.3s ease',
                            mt: -3, // Floating effect
                            backgroundColor: 'background.paper',
                          }}
                          alt={`${club.name} logo`}
                        />

                        <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="700"
                            sx={{
                              mb: 1,
                              fontSize: '1rem',
                              lineHeight: 1.2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              color: 'text.primary',
                            }}
                          >
                            {club.name}
                          </Typography>

                          {club.category && (
                            <Chip
                              label={club.category}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                borderRadius: 2,
                                backgroundColor: 'primary.50',
                                color: 'primary.700',
                                border: '1px solid',
                                borderColor: 'primary.100',
                                '&:hover': {
                                  backgroundColor: 'primary.100',
                                }
                              }}
                            />
                          )}
                        </Box>
                      </Stack>
                    </Box>

                    {/* Description */}
                    <Box sx={{ px: 2, pb: 1.5, flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          fontSize: '0.8rem',
                        }}
                      >
                        {club.description || 'No description available for this club.'}
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* Enhanced Actions Section */}
                  <Box sx={{
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'grey.50',
                  }}>
                    <CardActions sx={{
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: 56,
                    }}>
                      {/* Main Action Button */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        { isClubMember(club) ? (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'success.main',
                                boxShadow: '0 0 0 2px rgba(76, 175, 80, 0.2)',
                              }} />
                              <Typography variant="caption" fontWeight={600} color="success.main">
                                You're a member
                              </Typography>
                            </Box>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={<LeaveIcon sx={{ fontSize: '0.9rem' }} />}
                              onClick={() => handleLeaveClub(club.club_id)}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                px: 1.5,
                                py: 0.5,
                                borderWidth: 1.5,
                                '&:hover': {
                                  borderWidth: 1.5,
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 3px 10px rgba(244, 67, 54, 0.3)',
                                }
                              }}
                            >
                              Leave
                            </Button>
                          </>
                        ) : hasPendingRequest(club) ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'warning.main',
                              boxShadow: '0 0 0 2px rgba(255, 152, 0, 0.2)',
                            }} />
                            <Typography variant="caption" fontWeight={600} color="warning.main">
                              Request pending approval
                            </Typography>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleJoinClub(club.club_id)}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              px: 2,
                              py: 0.8,
                              background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                              boxShadow: '0 3px 16px rgba(33, 150, 243, 0.3)',
                              border: 'none',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #1976D2 0%, #0288D1 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 24px rgba(33, 150, 243, 0.4)',
                              },
                              '&:active': {
                                transform: 'translateY(0px)',
                              }
                            }}
                          >
                            Request to Join
                          </Button>
                        )}
                      </Box>

                      {/* Activity Status Indicator */}
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.8,
                        backgroundColor: 'success.50',
                        px: 1.5,
                        py: 0.8,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'success.100',
                      }}>
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: 'success.main',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': {
                              transform: 'scale(0.95)',
                              boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
                            },
                            '70%': {
                              transform: 'scale(1)',
                              boxShadow: '0 0 0 3px rgba(76, 175, 80, 0)',
                            },
                            '100%': {
                              transform: 'scale(0.95)',
                              boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
                            },
                          },
                        }} />
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="success.main"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          Active
                        </Typography>
                      </Box>
                    </CardActions>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      )}

      {/* Create Club Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => {
          setOpenCreateDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight="600">
                Create New Club
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Start building your community
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setOpenCreateDialog(false);
                resetForm();
              }}
              size="small"
              sx={{ color: 'grey.500' }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ py: 2.5 }}>
          <Grid container spacing={2.5} direction="column">
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Club Name"
                variant="outlined"
                value={newClub.name}
                onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Short Description"
                variant="outlined"
                multiline
                rows={3}
                value={newClub.description}
                onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newClub.category}
                      label="Category"
                      onChange={(e) => setNewClub({ ...newClub, category: e.target.value })}
                      sx={{ borderRadius: 2 }}
                    >
                      {['Academic', 'Cultural', 'Sports', 'Technical', 'Social'].map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Additional Details"
                    variant="outlined"
                    value={newClub.club_details}
                    onChange={(e) => setNewClub({ ...newClub, club_details: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* File Uploads */}
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                      Club Logo *
                    </Typography>
                    <input
                      accept="image/*"
                      id="logo-upload"
                      type="file"
                      onChange={(e) => handleFileChange(e, 'logo_file')}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        size="small"
                        startIcon={<UploadIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          mb: 1.5,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          py: 1,
                          width: '100%',
                          fontSize: '0.85rem'
                        }}
                      >
                        Upload Logo
                      </Button>
                    </label>
                    {previewLogo && (
                      <Paper sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}>
                        <Avatar
                          src={previewLogo}
                          sx={{
                            width: 60,
                            height: 60,
                            mx: 'auto',
                            border: '2px solid',
                            borderColor: 'divider'
                          }}
                        />
                      </Paper>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight={500} sx={{ fontSize: '0.85rem' }}>
                      Club Banner *
                    </Typography>
                    <input
                      accept="image/*"
                      id="banner-upload"
                      type="file"
                      onChange={(e) => handleFileChange(e, 'image_file')}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="banner-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        size="small"
                        startIcon={<UploadIcon />}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          mb: 1.5,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          py: 1,
                          width: '100%',
                          fontSize: '0.85rem'
                        }}
                      >
                        Upload Banner
                      </Button>
                    </label>
                    {previewImage && (
                      <Paper sx={{ p: 1, borderRadius: 2 }}>
                        <img
                          src={previewImage}
                          alt="Banner preview"
                          style={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 6
                          }}
                        />
                      </Paper>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => {
              setOpenCreateDialog(false);
              resetForm();
            }}
            variant="outlined"
            size="small"
            sx={{ borderRadius: 2, px: 2.5, fontSize: '0.85rem' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateClub}
            variant="contained"
            size="small"
            disabled={!newClub.name || !newClub.description || !newClub.logo_file || !newClub.image_file}
            sx={{ borderRadius: 2, px: 2.5, fontSize: '0.85rem' }}
          >
            Create Club
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

ClubDashboard.propTypes = {
  user: PropTypes.shape({
    user_id: PropTypes.string,
    student: PropTypes.bool
  })
};

export default ClubDashboard;