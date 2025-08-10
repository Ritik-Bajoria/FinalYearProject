import React from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Toolbar,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import {
  Event as EventIcon,
  Groups as GroupsIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  BarChart as AnalyticsIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

const StudentSidebar = ({ activeTab, setActiveTab, user }) => {
  const menuItems = [
    { id: 'social', label: 'Social Events', icon: <HomeIcon /> },
    { id: 'clubDashboard', label: 'Club Dashboard', icon: <GroupsIcon /> },
    { id: 'myClub', label: 'My Club', icon: <SchoolIcon /> },
    { id: 'myEvents', label: 'My Events', icon: <EventIcon /> },
    { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: 280,
          boxSizing: 'border-box',
          backgroundColor: '#1A237E',
          color: 'white',
          borderRight: 'none'
        },
      }}
    >
      <Toolbar />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        justifyContent: 'space-between'
      }}>
        <Box>
          {/* User Profile Section */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <Avatar 
              sx={{ 
                width: 56, 
                height: 56, 
                mr: 2,
                bgcolor: '#FFC107',
                color: '#1A237E'
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user?.name || 'Student'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.email || 'student@university.edu'}
              </Typography>
            </Box>
          </Box>

          {/* Navigation Items */}
          <List sx={{ py: 2 }}>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                component="div" // Changed from button to div to prevent cursor change
                selected={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  cursor: 'default', // Ensures pointer stays as default arrow
                  '&.Mui-selected': {
                    backgroundColor: '#0D47A1',
                    '&:hover': {
                      backgroundColor: '#0D47A1'
                    }
                  },
                  '&:hover': {
                    backgroundColor: '#303F9F'
                  },
                  py: 1.5,
                  px: 3
                }}
              >
                <ListItemIcon sx={{ 
                  color: activeTab === item.id ? '#FFC107' : 'inherit',
                  minWidth: '40px'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{
                    fontWeight: activeTab === item.id ? 'bold' : 'normal',
                    sx: { cursor: 'default' } // Prevents I-beam cursor on text
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Footer Section */}
        <Box sx={{ p: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', mb: 2 }} />
          <ListItem
            component="div" // Changed from button to div
            sx={{
              cursor: 'default',
              '&:hover': {
                backgroundColor: '#303F9F'
              },
              borderRadius: 1,
              py: 1,
              px: 2
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: '40px' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Logout" 
              primaryTypographyProps={{ sx: { cursor: 'default' } }}
            />
          </ListItem>
          <Box sx={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: 1,
            p: 2,
            mt: 2,
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ opacity: 0.8, cursor: 'default' }}>
              Event Management System v1.0
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default StudentSidebar;