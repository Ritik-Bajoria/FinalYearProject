import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Box,
  alpha,
  Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsPanel from '../../Notifications/NotificationsPanel';
import useNotifications from '../../hooks/useNotifications';

const StudentHeader = ({ user }) => {
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  // Fetch notifications when panel opens
  useEffect(() => {
    if (notificationsPanelOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [notificationsPanelOpen, notifications.length, fetchNotifications]);

  const handleNotificationClick = () => {
    setNotificationsPanelOpen(true);
  };

  const handleCloseNotifications = () => {
    setNotificationsPanelOpen(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleRefreshNotifications = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, #1A237E 0%, #3F51B5 100%)`,
          boxShadow: `0 4px 20px ${alpha('#1A237E', 0.3)}`,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${alpha('#FFC107', 0.2)}`
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(45deg, ${alpha('#FFC107', 0.2)}, ${alpha('#FF9800', 0.1)})`,
                mr: 2,
                border: `1px solid ${alpha('#FFC107', 0.3)}`
              }}
            >
              <SchoolIcon sx={{ color: '#FFC107', fontSize: 24 }} />
            </Box>

            <Box>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, #FFF, ${alpha('#FFC107', 0.9)})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                University Event Hub
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#FFF', 0.7),
                  fontSize: '0.75rem',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Student Portal
              </Typography>
            </Box>
          </Box>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Status indicator */}
            <Chip
              label="Online"
              size="small"
              sx={{
                backgroundColor: alpha('#4CAF50', 0.2),
                color: '#4CAF50',
                border: `1px solid ${alpha('#4CAF50', 0.3)}`,
                fontSize: '0.7rem',
                height: 24,
                display: { xs: 'none', md: 'flex' }
              }}
            />

            {/* Enhanced Notifications */}
            <IconButton
              color="inherit"
              onClick={handleNotificationClick}
              sx={{
                mr: 1,
                position: 'relative',
                '&:hover': {
                  backgroundColor: alpha('#FFF', 0.1),
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="warning"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#FFC107',
                    color: '#1A237E',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    minWidth: 18,
                    height: 18,
                    animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.1)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }
                }}
              >
                <NotificationsIcon sx={{ fontSize: 22 }} />
              </Badge>
            </IconButton>

            {/* User Avatar */}
            <Box
              sx={{
                position: 'relative',
                '&:hover .avatar': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 20px ${alpha('#FFC107', 0.4)}`
                }
              }}
            >
              <Avatar
                alt={user.full_name}
                src={`http://127.0.0.1:7000/${user.profile_picture}`}
                className="avatar"
                sx={{
                  bgcolor: '#FFC107',
                  color: '#1A237E',
                  width: 40,
                  height: 40,
                  fontWeight: 600,
                  border: `2px solid ${alpha('#FFC107', 0.3)}`,
                  transition: 'all 0.3s ease-in-out',
                  cursor: 'pointer'
                }}
              >
                {user.full_name?.charAt(0)?.toUpperCase()}
              </Avatar>

              {/* Online status dot */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                  border: '2px solid white',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsPanelOpen}
        notifications={notifications}
        loading={loading}
        error={error}
        onClose={handleCloseNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onRefresh={handleRefreshNotifications}
      />
    </>
  );
};

export default StudentHeader;