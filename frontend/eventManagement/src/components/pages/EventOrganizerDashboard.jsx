import React from 'react';
import { Box } from '@mui/material';
import EventRegistrations from '../event/EventRegistrations';
import EventAttendance from '../event/EventAttendance';
import EventBudget from '../event/EventBudget';
import VolunteerPostings from '../event/VolunteerPostings';

const EventOrganizerDashboard = ({ event, eventId, showNotification }) => {
  return (
    <Box>
      <EventRegistrations eventId={eventId} showNotification={showNotification} />
      <EventAttendance eventId={eventId} showNotification={showNotification} />
      <EventBudget eventId={eventId} showNotification={showNotification} />
      <VolunteerPostings eventId={eventId} showNotification={showNotification} />
    </Box>
  );
};

export default EventOrganizerDashboard;