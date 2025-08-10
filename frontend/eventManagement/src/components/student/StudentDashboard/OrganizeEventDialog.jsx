import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Typography
} from '@mui/material';

const OrganizeEventDialog = ({ open, onClose, onSubmit, clubId, currentUserId }) => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    venue: '',
    category: '',
    visibility: 'Public',
    capacity: 100,
    created_by: currentUserId,
    club_id: clubId
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!eventData.title) newErrors.title = 'Title is required';
    if (!eventData.event_date) newErrors.event_date = 'Start date is required';
    if (!eventData.venue) newErrors.venue = 'Venue is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const formattedData = {
        ...eventData,
        event_date: new Date(eventData.event_date).toISOString(),
        end_date: eventData.end_date ? new Date(eventData.end_date).toISOString() : null
      };

      await onSubmit(formattedData);
      
      // Reset form after successful submission
      setEventData({
        title: '',
        description: '',
        event_date: '',
        end_date: '',
        venue: '',
        category: '',
        visibility: 'Public',
        capacity: 100,
        created_by: currentUserId,
        club_id: clubId
      });
      
      onClose();
    } catch (error) {
      console.error('Event creation failed:', error);
      setSubmitError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['Academic', 'Social', 'Sports', 'Cultural', 'Workshop', 'Other'];
  const visibilityOptions = ['Public', 'Private', 'Members Only'];

  return (
    <Dialog open={open} onClose={!isSubmitting ? onClose : null} maxWidth="sm" fullWidth>
      <DialogTitle>Organize New Event</DialogTitle>
      <DialogContent>
        {submitError && (
          <Typography color="error" variant="body2" gutterBottom>
            {submitError}
          </Typography>
        )}

        <TextField
          fullWidth
          margin="dense"
          name="title"
          label="Event Title"
          value={eventData.title}
          onChange={handleChange}
          error={!!errors.title}
          helperText={errors.title}
          required
          disabled={isSubmitting}
        />

        <TextField
          fullWidth
          margin="dense"
          name="event_date"
          label="Start Date & Time"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={eventData.event_date}
          onChange={handleChange}
          error={!!errors.event_date}
          helperText={errors.event_date}
          required
          disabled={isSubmitting}
        />

        <TextField
          fullWidth
          margin="dense"
          name="end_date"
          label="End Date & Time (optional)"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          value={eventData.end_date}
          onChange={handleChange}
          disabled={isSubmitting}
        />

        <TextField
          fullWidth
          margin="dense"
          name="venue"
          label="Venue"
          value={eventData.venue}
          onChange={handleChange}
          error={!!errors.venue}
          helperText={errors.venue}
          required
          disabled={isSubmitting}
        />

        <FormControl fullWidth margin="dense" disabled={isSubmitting}>
          <InputLabel>Category</InputLabel>
          <Select
            name="category"
            value={eventData.category}
            onChange={handleChange}
            label="Category"
          >
            {categories.map(category => (
              <MenuItem key={category} value={category}>{category}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" disabled={isSubmitting}>
          <InputLabel>Visibility</InputLabel>
          <Select
            name="visibility"
            value={eventData.visibility}
            onChange={handleChange}
            label="Visibility"
          >
            {visibilityOptions.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          margin="dense"
          name="capacity"
          label="Capacity"
          type="number"
          value={eventData.capacity}
          onChange={handleChange}
          inputProps={{ min: 1 }}
          disabled={isSubmitting}
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          margin="dense"
          name="description"
          label="Description"
          value={eventData.description}
          onChange={handleChange}
          disabled={isSubmitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={24} /> : null}
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeEventDialog;