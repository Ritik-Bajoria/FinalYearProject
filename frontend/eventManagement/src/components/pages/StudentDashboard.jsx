import React, { useState } from 'react';
import { 
  Box, 
  CssBaseline, 
  Container, 
  Paper, 
  Fade, 
  Slide,
  alpha
} from '@mui/material';
import ErrorBoundary from '../student/UI/ErrorBoundary';
import StudentHeader from '../student/StudentLayout/StudentHeader';
import StudentSidebar from '../student/StudentLayout/StudentSidebar';
import SocialTab from '../student/StudentDashboard/SocialTab';
import ClubDashboardTab from '../student/StudentDashboard/ClubDashboardTab';
import MyClubTab from '../student/StudentDashboard/MyClubTab/MyClubTab';
import MyEventsTab from '../student/StudentDashboard/MyEventsTab';
import useAuthUser from '../hooks/useAuthUser';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('social');

  // Use the auth hook - this must be called unconditionally
  const { user, student, loading, error } = useAuthUser();

  // Show loading state while auth is loading
  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha('#1A237E', 0.1)} 0%, ${alpha('#3F51B5', 0.05)} 100%)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${alpha('#1A237E', 0.1)}, ${alpha('#3F51B5', 0.1)})`,
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${alpha('#FFC107', 0.1)}, ${alpha('#FF9800', 0.1)})`,
            animation: 'float 8s ease-in-out infinite reverse',
          }}
        />
        
        <Paper
          elevation={8}
          sx={{
            p: 6,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            minWidth: '300px',
            border: `1px solid ${alpha('#1A237E', 0.1)}`
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `linear-gradient(45deg, #1A237E, #3F51B5)`,
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' }
              }
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                border: '3px solid white',
                borderTop: '3px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />
          </Box>
          <Box
            sx={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1A237E',
              mb: 1
            }}
          >
            {error ? 'Authentication Error' : 'Loading Student Dashboard'}
          </Box>
          <Box
            sx={{
              fontSize: '1rem',
              color: '#666',
              opacity: 0.8
            }}
          >
            {error ? 'Please try refreshing the page' : 'Preparing your personalized experience...'}
          </Box>
        </Paper>
      </Box>
    );
  }

  // Show error state if user or student data is missing
  if (!user || !student) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha('#1A237E', 0.1)} 0%, ${alpha('#3F51B5', 0.05)} 100%)`,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 6,
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            minWidth: '300px',
            border: `1px solid ${alpha('#1A237E', 0.1)}`
          }}
        >
          <Box
            sx={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#d32f2f',
              mb: 2
            }}
          >
            Access Denied
          </Box>
          <Box
            sx={{
              fontSize: '1rem',
              color: '#666',
              mb: 3
            }}
          >
            You need to be logged in as a student to access this dashboard.
          </Box>
          <Box
            component="button"
            onClick={() => window.location.href = '/login'}
            sx={{
              px: 4,
              py: 2,
              bgcolor: '#1A237E',
              color: 'white',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#303F9F'
              }
            }}
          >
            Go to Login
          </Box>
        </Paper>
      </Box>
    );
  }

  const renderActiveTab = () => {
    const tabComponents = {
      social: <SocialTab />,
      clubDashboard: <ClubDashboardTab user={user} student={student} />,
      myClub: <MyClubTab user={user} student={student} />,
      myEvents: <MyEventsTab user={user} student={student} />
    };

    return (
      <Fade in={true} timeout={500}>
        <Box sx={{ height: '100%' }}>
          {tabComponents[activeTab] || <SocialTab />}
        </Box>
      </Fade>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      
      {/* Header - Fixed at top */}
      <ErrorBoundary>
        <Slide direction="down" in={true} timeout={800}>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1200,
              height: '64px'
            }}
          >
            <StudentHeader user={user} />
          </Box>
        </Slide>
      </ErrorBoundary>

      {/* Sidebar - Fixed height, full screen height */}
      <ErrorBoundary>
        <Slide direction="right" in={true} timeout={600}>
          <Box
            sx={{
              position: 'fixed',
              left: 0,
              top: '64px',
              bottom: 0,
              zIndex: 1100,
              width: '240px'
            }}
          >
            <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </Box>
        </Slide>
      </ErrorBoundary>

      {/* Main Content Area - Optimized for space */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          marginLeft: '240px',
          marginTop: '64px',
          height: 'calc(100vh - 64px)',
          background: `linear-gradient(135deg, 
            ${alpha('#ECEFF1', 1)} 0%, 
            ${alpha('#E8EAF6', 0.8)} 50%, 
            ${alpha('#F3E5F5', 0.6)} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Subtle background pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 25% 25%, ${alpha('#1A237E', 0.02)} 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, ${alpha('#3F51B5', 0.02)} 0%, transparent 50%)`,
            pointerEvents: 'none'
          }}
        />

        {/* Content Container - Full height optimization */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 0.5, sm: 1, md: 1.5 }
          }}
        >
          {/* Compact Welcome Section */}
          <Slide direction="up" in={true} timeout={1000}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1, sm: 1.5, md: 2 },
                mb: { xs: 0.5, sm: 1, md: 1.5 },
                borderRadius: 2,
                background: `linear-gradient(135deg, 
                  ${alpha('#1A237E', 0.95)} 0%, 
                  ${alpha('#3F51B5', 0.9)} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                border: `1px solid ${alpha('#FFC107', 0.2)}`,
                flexShrink: 0
              }}
            >
              {/* Smaller decorative elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -15,
                  right: -15,
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, ${alpha('#FFC107', 0.2)}, ${alpha('#FF9800', 0.1)})`,
                  animation: 'float 8s ease-in-out infinite'
                }}
              />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                    fontWeight: 700,
                    mb: 0.25,
                    background: `linear-gradient(45deg, #FFF, ${alpha('#FFC107', 0.9)})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2
                  }}
                >
                  Welcome back, {student.full_name}! 👋
                </Box>
                <Box
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
                    opacity: 0.9,
                    fontWeight: 400,
                    lineHeight: 1.3
                  }}
                >
                  Ready to explore events and connect with your community?
                </Box>
              </Box>
            </Paper>
          </Slide>

          {/* Main Content Container - Maximum space utilization */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha('#1A237E', 0.08)}`,
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            {/* Content area with optimized spacing */}
            <Box
              className="scrollable-content"
              sx={{
                background: `linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.9) 0%, 
                  rgba(255, 255, 255, 0.7) 100%)`,
                flex: 1,
                overflow: 'auto',
                position: 'relative',
                p: { xs: 1, sm: 1.5, md: 2 },
                height: '100%',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha('#1A237E', 0.1),
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: alpha('#1A237E', 0.3),
                  borderRadius: '3px',
                  '&:hover': {
                    background: alpha('#1A237E', 0.5),
                  }
                }
              }}
            >
              <ErrorBoundary>
                {renderActiveTab()}
              </ErrorBoundary>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default StudentDashboard;