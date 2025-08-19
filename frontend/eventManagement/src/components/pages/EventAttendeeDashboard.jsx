import React from 'react';
import { Box } from '@mui/material';
import EventFeedback from '../event/EventFeedback';
import QRCodeGenerator from '../event/QRCodeGenerator';

const EventAttendeeDashboard = ({ event, eventId, showNotification }) => {
  return (
    <Box>
      <EventFeedback eventId={eventId} showNotification={showNotification} />
      {event.qr_check_in_enabled && (
        <QRCodeGenerator eventId={eventId} showNotification={showNotification} />
      )}
    </Box>
  );
};

export default EventAttendeeDashboard;