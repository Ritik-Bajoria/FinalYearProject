import React from 'react';
import { Box, Typography } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

const EventAdminDashboard = ({ event, eventId, showNotification }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        <AdminPanelSettings sx={{ mr: 1 }} />
        Admin Dashboard
      </Typography>
      {/* Admin-specific components */}
      {/* Approval controls, admin chat, etc. */}
    </Box>
  );
};

export default EventAdminDashboard;