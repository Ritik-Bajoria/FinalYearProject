import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Avatar } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const StudentHeader = ({ unreadNotifications, user }) => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1A237E',
        boxShadow: 'none'
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          University Event Hub
        </Typography>
        <IconButton color="inherit" sx={{ mr: 2 }}>
          <Badge badgeContent={unreadNotifications} color="warning">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Avatar 
          alt={user.full_name} 
          src={user.profile_picture} 
          sx={{ bgcolor: '#FFC107', color: '#212121' }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default StudentHeader;