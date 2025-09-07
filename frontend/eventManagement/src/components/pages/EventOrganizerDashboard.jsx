import React from 'react';
import { Box } from '@mui/material';
import EventRegistrations from '../event/EventRegistrations';
import EventAttendance from '../event/EventAttendance';
import EventBudget from '../event/EventBudget';
import VolunteerPostings from '../event/VolunteerPostings';

const EventOrganizerDashboard = ({ event, eventId, activeTab, showNotification }) => {
  return (
    <Box>
      {activeTab === 'registrations' && <EventRegistrations eventId={eventId} showNotification={showNotification} />}
      {activeTab === 'attendance' && <EventAttendance eventId={eventId} showNotification={showNotification} />}
      {activeTab === 'budget' && <EventBudget eventId={eventId} showNotification={showNotification} />}
      {activeTab === 'volunteers' && <VolunteerPostings eventId={eventId} showNotification={showNotification} />}
    </Box>
  );
};

export default EventOrganizerDashboard;