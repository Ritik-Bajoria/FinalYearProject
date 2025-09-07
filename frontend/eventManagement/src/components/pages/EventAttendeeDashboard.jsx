import React from 'react';
import { Box } from '@mui/material';
import EventFeedback from '../event/EventFeedback';
import QRCodeGenerator from '../event/QRCodeGenerator';

const EventAttendeeDashboard = ({ event, eventId, activeTab, showNotification }) => {
  return (
    <Box>
      {activeTab === 'feedback' && <EventFeedback eventId={eventId} showNotification={showNotification} />}
      {activeTab === 'qr' && event?.qr_check_in_enabled && (
        <QRCodeGenerator eventId={eventId} showNotification={showNotification} />
      )}
    </Box>
  );
};

export default EventAttendeeDashboard;