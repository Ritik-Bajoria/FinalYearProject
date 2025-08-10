import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import ErrorBoundary from '../student/UI/ErrorBoundary';
import StudentHeader from '../student/StudentLayout/StudentHeader';
import StudentSidebar from '../student/StudentLayout/StudentSidebar';
import SocialTab from '../student/StudentDashboard/SocialTab';
import ClubDashboardTab from '../student/StudentDashboard/ClubDashboardTab';
import MyClubTab from '../student/StudentDashboard/MyClubTab';
import MyEventsTab from '../student/StudentDashboard/MyEventsTab';
import useAuthUser from '../hooks/useAuthUser'; // ✅ import the hook

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('social');
  const [unreadNotifications] = useState(3);

  const { user, student } = useAuthUser(); // ✅ use the hook

  if (!user || !student) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-gray-700">
        Loading student data...
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'social':
        return <SocialTab />;
      case 'clubDashboard':
        return <ClubDashboardTab user={user} student={student} />;
      case 'myClub':
        return <MyClubTab user={user} student={student} />;
      case 'myEvents':
        return <MyEventsTab user={user} student={student} />;
      default:
        return <SocialTab />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <ErrorBoundary>
        <StudentHeader unreadNotifications={unreadNotifications} user={user} />
      </ErrorBoundary>
      <ErrorBoundary>
        <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </ErrorBoundary>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: '#ECEFF1',
          minHeight: '100vh',
          marginTop: '64px'
        }}
      >
        <ErrorBoundary>{renderActiveTab()}</ErrorBoundary>
      </Box>
    </Box>
  );
};

export default StudentDashboard;
