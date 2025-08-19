import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Avatar,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar
} from '@mui/material';
import {
    Event as EventIcon,
    LocationOn as LocationIcon,
    Schedule as ScheduleIcon,
    Description as DescriptionIcon,
    People as PeopleIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import IconButton from '@mui/material/IconButton';

const EventDetailsModal = ({ open, onClose, event, isLeader }) => {
    if (!event) return null;

    const formatDate = (dateString) => {
        return format(parseISO(dateString), 'PPPPp');
    };

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{event.title}</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box mt={1}>
                    <Chip
                        label={event.approval_status === 'approved' ? 'Approved' : 'Pending'}
                        color={event.approval_status === 'approved' ? 'success' : 'warning'}
                        size="small"
                    />
                    <Chip
                        label={event.event_status}
                        color={event.event_status === 'upcoming' ? 'primary' : 'default'}
                        size="small"
                        sx={{ ml: 1 }}
                    />
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
                    <Box flex={1}>
                        {event.image_url ? (
                            <img
                                src={event.image_url}
                                alt={event.title}
                                style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 4 }}
                            />
                        ) : (
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                bgcolor="grey.100"
                                height={200}
                                borderRadius={1}
                            >
                                <EventIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                            </Box>
                        )}
                    </Box>
                    <Box flex={1}>
                        <List>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <ScheduleIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Date & Time"
                                    secondary={`${formatDate(event.event_date)} (${formatDuration(event.duration_minutes)})`}
                                />
                            </ListItem>
                            <Divider variant="inset" component="li" />
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <LocationIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Venue"
                                    secondary={event.venue || 'Not specified'}
                                />
                            </ListItem>
                            <Divider variant="inset" component="li" />
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <PeopleIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Attendees"
                                    secondary={event.registration_count || 0}
                                />
                            </ListItem>
                        </List>
                    </Box>
                </Box>
                <Box mt={3}>
                    <Typography variant="h6" gutterBottom>
                        <DescriptionIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Description
                    </Typography>
                    <Typography paragraph>
                        {event.description || 'No description provided.'}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                {isLeader && (
                    <Button color="primary" variant="contained">
                        Edit Event
                    </Button>
                )}
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EventDetailsModal;