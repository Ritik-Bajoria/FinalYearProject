import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Divider,
  CircularProgress,
  alpha,
  Slide,
  Fade,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Event as EventIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  MarkEmailRead as MarkEmailReadIcon,
  NotificationsNone as NotificationsNoneIcon
} from '@mui/icons-material';

const NotificationsPanel = ({ 
  isOpen, 
  notifications = [], 
  loading, 
  error, 
  onClose, 
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh 
}) => {
  const [localNotifications, setLocalNotifications] = useState(notifications);
  
  // Keep local state in sync with props
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await onMarkAsRead?.(notificationId);
      // Optimistic UI update
      setLocalNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await onMarkAllAsRead?.();
      // Optimistic UI update
      setLocalNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_created':
      case 'event_approved':
      case 'event_rejected':
      case 'event_updated':
      case 'event_reminder':
      case 'event_invitation':
        return <EventIcon sx={{ color: '#1A237E' }} />;
      case 'club_join_request':
      case 'club_join_approved':
      case 'club_join_rejected':
        return <GroupIcon sx={{ color: '#3F51B5' }} />;
      case 'system_alert':
        return <SchoolIcon sx={{ color: '#FFC107' }} />;
      default:
        return <NotificationsIcon sx={{ color: '#666' }} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'event_created':
      case 'event_approved':
      case 'event_rejected':
      case 'event_updated':
      case 'event_reminder':
      case 'event_invitation':
        return '#1A237E';
      case 'club_join_request':
      case 'club_join_approved':
      case 'club_join_rejected':
        return '#3F51B5';
      case 'system_alert':
        return '#FFC107';
      default:
        return '#666';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'event_created':
        return 'Event';
      case 'event_approved':
        return 'Approved';
      case 'event_rejected':
        return 'Rejected';
      case 'event_updated':
        return 'Updated';
      case 'event_reminder':
        return 'Reminder';
      case 'event_invitation':
        return 'Invitation';
      case 'club_join_request':
        return 'Request';
      case 'club_join_approved':
        return 'Approved';
      case 'club_join_rejected':
        return 'Rejected';
      case 'system_alert':
        return 'Alert';
      default:
        return 'General';
    }
  };

  const unreadCount = localNotifications.filter(n => !n.read).length;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 1,
        '& .MuiDrawer-paper': {
          width: { xs: '100vw', sm: 360 },
          background: `linear-gradient(135deg, 
            ${alpha('#ECEFF1', 0.95)} 0%, 
            ${alpha('#E8EAF6', 0.9)} 50%, 
            ${alpha('#F3E5F5', 0.85)} 100%)`,
          backdropFilter: 'blur(20px)',
          borderLeft: `1px solid ${alpha('#1A237E', 0.1)}`,
          zIndex: (theme) => theme.zIndex.modal + 1
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Enhanced Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, #1A237E 0%, #3F51B5 100%)`,
            color: 'white',
            p: 2,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#FFC107', 0.2)} 0%, transparent 70%)`,
              animation: 'float 6s ease-in-out infinite',
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' }
              }
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(45deg, ${alpha('#FFC107', 0.2)}, ${alpha('#FF9800', 0.1)})`,
                  mr: 2,
                  border: `1px solid ${alpha('#FFC107', 0.3)}`
                }}
              >
                <NotificationsIcon sx={{ color: '#FFC107', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Notifications
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  onClick={handleMarkAllAsRead}
                  sx={{
                    color: '#FFC107',
                    fontSize: '0.75rem',
                    minWidth: 'auto',
                    px: 2,
                    '&:hover': {
                      backgroundColor: alpha('#FFC107', 0.1)
                    }
                  }}
                  startIcon={<MarkEmailReadIcon sx={{ fontSize: 16 }} />}
                >
                  Mark all read
                </Button>
              )}
              <IconButton
                onClick={onClose}
                sx={{
                  color: 'white',
                  '&:hover': {
                    backgroundColor: alpha('#FFF', 0.1)
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flex: 1,
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress sx={{ color: '#1A237E' }} />
              <Typography variant="body2" color="text.secondary">
                Loading notifications...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
              <Button
                onClick={onRefresh}
                variant="outlined"
                startIcon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          ) : localNotifications.length === 0 ? (
            <Fade in={true} timeout={800}>
              <Box sx={{ 
                p: 6, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1
              }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${alpha('#1A237E', 0.1)} 0%, ${alpha('#3F51B5', 0.05)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.05)' }
                    }
                  }}
                >
                  <NotificationsNoneIcon sx={{ fontSize: 48, color: alpha('#1A237E', 0.5) }} />
                </Box>
                <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                  All Clear! 🎉
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 280 }}>
                  You don't have any notifications right now. We'll let you know when something important happens.
                </Typography>
                <Button
                  onClick={onRefresh}
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderColor: '#1A237E',
                    color: '#1A237E',
                    '&:hover': {
                      backgroundColor: alpha('#1A237E', 0.05),
                      borderColor: '#1A237E'
                    }
                  }}
                >
                  Refresh
                </Button>
              </Box>
            </Fade>
          ) : (
            <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
              {localNotifications.map((notification, index) => (
                <Slide
                  key={notification.id}
                  direction="left"
                  in={true}
                  timeout={300 + index * 100}
                >
                  <ListItem
                    sx={{
                      mb: 1,
                      mx: 2,
                      borderRadius: 3,
                      background: notification.read 
                        ? 'rgba(255, 255, 255, 0.7)'
                        : `linear-gradient(135deg, ${alpha('#1A237E', 0.08)} 0%, ${alpha('#3F51B5', 0.05)} 100%)`,
                      border: `1px solid ${notification.read ? alpha('#000', 0.08) : alpha('#1A237E', 0.15)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px ${alpha('#1A237E', 0.15)}`,
                        background: notification.read 
                          ? 'rgba(255, 255, 255, 0.9)'
                          : `linear-gradient(135deg, ${alpha('#1A237E', 0.12)} 0%, ${alpha('#3F51B5', 0.08)} 100%)`
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: alpha(getNotificationColor(notification.type), 0.1),
                          border: `2px solid ${alpha(getNotificationColor(notification.type), 0.2)}`
                        }}
                      >
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <Typography
                            variant="body2"
                            fontWeight={notification.read ? 400 : 600}
                            sx={{ 
                              color: notification.read ? 'text.secondary' : 'text.primary',
                              flex: 1,
                              mr: 1
                            }}
                          >
                            {notification.message}
                          </Typography>
                          {!notification.read && (
                            <Badge
                              variant="dot"
                              sx={{
                                '& .MuiBadge-badge': {
                                  backgroundColor: '#FFC107',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%'
                                }
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {notification.time}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {notification.type && (
                              <Chip
                                label={getNotificationTypeLabel(notification.type)}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  backgroundColor: alpha(getNotificationColor(notification.type), 0.1),
                                  color: getNotificationColor(notification.type),
                                  border: `1px solid ${alpha(getNotificationColor(notification.type), 0.2)}`
                                }}
                              />
                            )}
                            {!notification.read && (
                              <IconButton
                                size="small"
                                onClick={() => handleMarkAsRead(notification.id)}
                                sx={{
                                  color: '#4CAF50',
                                  '&:hover': {
                                    backgroundColor: alpha('#4CAF50', 0.1)
                                  }
                                }}
                              >
                                <CheckCircleIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </Slide>
              ))}
            </List>
          )}
        </Box>

        {/* Enhanced Footer */}
        <Box
          sx={{
            p: 3,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${alpha('#1A237E', 0.1)}`
          }}
        >
          <Button
            fullWidth
            onClick={onRefresh}
            startIcon={<RefreshIcon />}
            sx={{
              py: 1.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, #1A237E 0%, #3F51B5 100%)`,
              color: 'white',
              fontWeight: 600,
              '&:hover': {
                background: `linear-gradient(135deg, #0D47A1 0%, #283593 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 20px ${alpha('#1A237E', 0.3)}`
              },
              transition: 'all 0.3s ease'
            }}
          >
            Refresh Notifications
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationsPanel;