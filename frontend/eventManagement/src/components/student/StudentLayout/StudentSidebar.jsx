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
  Avatar,
  alpha
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
    {
      id: 'social',
      label: 'Social Events',
      icon: <HomeIcon />,
      description: 'Discover events'
    },
    {
      id: 'clubDashboard',
      label: 'Club Dashboard',
      icon: <GroupsIcon />,
      description: 'Manage your club'
    },
    {
      id: 'myClub',
      label: 'My Club',
      icon: <SchoolIcon />,
      description: 'Club activities'
    },
    {
      id: 'myEvents',
      label: 'My Events',
      icon: <EventIcon />,
      description: 'Your events'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      description: 'View insights'
    }
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        height:'100vh',
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: 'border-box',
          background: `linear-gradient(180deg, #1A237E 0%, #283593 50%, #3F51B5 100%)`,
          color: 'white',
          borderRight: 'none',
          boxShadow: `4px 0 20px ${alpha('#1A237E', 0.3)}`,
          position: 'relative',
          overflow: 'hidden'
        },
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#FFC107', 0.1)} 0%, transparent 70%)`,
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(180deg)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#FF9800', 0.08)} 0%, transparent 70%)`,
          animation: 'float 6s ease-in-out infinite reverse'
        }}
      />

      {/* <Toolbar /> */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 1
      }}>
        <Box>
          {/* Compact User Profile Section */}
          <Box sx={{
            p: 2,
            background: `linear-gradient(135deg, ${alpha('#000', 0.2)} 0%, ${alpha('#000', 0.1)} 100%)`,
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${alpha('#FFC107', 0.2)}`,
            position: 'relative'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={`http://127.0.0.1:7000/${user?.profile_picture.replace(/\\/g, '/')}`}
                  sx={{
                    width: 48,
                    height: 48,
                    mr: 1.5,
                    bgcolor: '#FFC107',
                    color: '#1A237E',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                    border: `2px solid ${alpha('#FFC107', 0.3)}`,
                    boxShadow: `0 0 15px ${alpha('#FFC107', 0.3)}`
                  }}
                >
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                {/* Online status indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 2,
                    right: 6,
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
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, fontSize: '0.9rem' }} noWrap>
                  {user?.full_name || 'Student'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.7rem' }} noWrap>
                  {user?.email || 'student@university.edu'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Compact Navigation Items */}
          <List sx={{ py: 2, px: 1.5 }}>
            {menuItems.map((item, index) => (
              <ListItem
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                sx={{
                  cursor: 'pointer',
                  mb: 0.5,
                  borderRadius: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: activeTab === item.id
                    ? `linear-gradient(135deg, ${alpha('#FFC107', 0.2)} 0%, ${alpha('#FF9800', 0.1)} 100%)`
                    : 'transparent',
                  border: activeTab === item.id
                    ? `1px solid ${alpha('#FFC107', 0.3)}`
                    : '1px solid transparent',
                  '&:hover': {
                    background: activeTab === item.id
                      ? `linear-gradient(135deg, ${alpha('#FFC107', 0.25)} 0%, ${alpha('#FF9800', 0.15)} 100%)`
                      : `linear-gradient(135deg, ${alpha('#FFF', 0.1)} 0%, ${alpha('#FFF', 0.05)} 100%)`,
                    transform: 'translateX(4px)',
                    boxShadow: `0 2px 10px ${alpha('#000', 0.1)}`
                  },
                  py: 1.5,
                  px: 2
                }}
              >
                {/* Active indicator */}
                {activeTab === item.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: `linear-gradient(180deg, #FFC107 0%, #FF9800 100%)`,
                      borderRadius: '0 3px 3px 0'
                    }}
                  />
                )}

                <ListItemIcon sx={{
                  color: activeTab === item.id ? '#FFC107' : alpha('#FFF', 0.8),
                  minWidth: '36px',
                  transition: 'all 0.3s ease',
                  transform: activeTab === item.id ? 'scale(1.05)' : 'scale(1)'
                }}>
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={activeTab === item.id ? 600 : 500}
                      sx={{
                        color: activeTab === item.id ? '#FFF' : alpha('#FFF', 0.9),
                        fontSize: '0.85rem'
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Compact Footer Section */}
        <Box sx={{ p: 2 }}>
          <Divider sx={{
            borderColor: alpha('#FFC107', 0.2),
            mb: 2,
            '&::before, &::after': {
              borderColor: alpha('#FFC107', 0.2)
            }
          }} />

          {/* Logout Button */}
          <ListItem
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              background: `linear-gradient(135deg, ${alpha('#f44336', 0.1)} 0%, ${alpha('#d32f2f', 0.05)} 100%)`,
              border: `1px solid ${alpha('#f44336', 0.2)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha('#f44336', 0.2)} 0%, ${alpha('#d32f2f', 0.1)} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 2px 10px ${alpha('#f44336', 0.2)}`
              },
              py: 1,
              px: 1.5,
              mb: 1
            }}
          >
            <ListItemIcon sx={{ color: '#f44336', minWidth: '32px' }}>
              <LogoutIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontWeight: 600,
                color: '#f44336',
                fontSize: '0.85rem'
              }}
            />
          </ListItem>

          {/* Version Info */}
          <Box sx={{
            backgroundColor: alpha('#FFF', 0.05),
            borderRadius: 1.5,
            p: 1.5,
            textAlign: 'center',
            border: `1px solid ${alpha('#FFF', 0.1)}`
          }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontWeight: 500, fontSize: '0.7rem' }}>
              Event Management v2.0
            </Typography>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default StudentSidebar;